const open = require('open');
const { NlpManager, ConversationContext } = require('node-nlp');
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { projects } = require('./projects.json');
const { Typewriter } = require('./modules/typewriter');

const fontDefault = '\x1b[0m';
const fontBot = '\x1b[37m';
const fontUser = '\x1b[36m';
const fallbackCountThreshold = 3;

class App {
  constructor(options = {}) {
    this.options = options;
    this.continueChat = this.continueChat.bind(this);
    this.showProject = this.showProject.bind(this);
    this.showProjectTypes = this.showProjectTypes.bind(this);
    this.start = this.start.bind(this);
    this.intro = this.intro.bind(this);
    this.startChat = this.startChat.bind(this);
    this.continueChat = this.continueChat.bind(this);
    this.promptToOpen = this.promptToOpen.bind(this);
    this.ask = this.ask.bind(this);
    this.handleNameAnswer = this.handleNameAnswer.bind(this);
    this.handleUserAnswer = this.handleUserAnswer.bind(this);

    this.manager = new NlpManager({ languages: ['en'] });
    this.manager.load(path.join(__dirname, 'modules/nlp/model.nlp'));
    this.context = new ConversationContext();

    this.rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    this.state = {
      boyTyping: false,
      userTyping: false,
      skipTyping: false,
      fallbackCount: 0,
      successfulInteractions: 0,
      userName: null,
      justLearnedName: false,
      lastNamePromptAt: 0,
      answerQueues: {},
      lastAnswerByIntent: {},
      lastProjectResults: [],
      lastOpenTarget: null,
      openTargetHistory: [],
      awaitingProjectType: false,
      instantOutput: process.env.WHOISDAVE_INSTANT_OUTPUT === '1'
        || process.env.SEIDMAN_INSTANT_OUTPUT === '1'
        || (!process.env.WHOISDAVE_ALLOW_NON_TTY && !process.env.SEIDMAN_ALLOW_NON_TTY && (!process.stdin.isTTY || !process.stdout.isTTY)),
    };

    this.routes = {
      // 'None': { call: this.fallback },
      'greetings.bye': { call: this.endChat },
      'fallback.reset': { call: this.reset },
      'work.kind': { call: this.openProjects },
    };

    this.typewriter = new Typewriter(this.state);


    // process.stdin.on('keypress', (char, key) => {
    // TODO: on enter pressed, skip typing
    // if (key.name === 'return' && this.typewriter.typing) this.typewriter.skipTyping();
    // });

    fs.readdir(path.join(__dirname, 'modules/nlp/intents'), (err, files) => {
      this.answerBank = this.loadAnswerBank(files);
      this.controlInputs = this.loadControlInputs(files);
      this.projectTypeAliases = this.loadProjectTypeAliases(files);
      this.projectLookup = this.loadProjectLookup();
      this.projectList = this.projectTypeAliases.map(projectType => this.formatProjectType(projectType.type));
      // this.intro();
      this.start();
    });
  }

  loadAnswerBank(files) {
    return files.reduce((answersByIntent, file) => {
      const intent = file.replace('.json', '');
      const intentPath = path.join(__dirname, 'modules/nlp/intents', file);
      const data = JSON.parse(fs.readFileSync(intentPath, 'utf8'));

      if (data.answers && data.answers.length) {
        answersByIntent[intent] = data.answers;
      }

      return answersByIntent;
    }, {});
  }

  loadControlInputs(files) {
    return files.reduce((inputsByIntent, file) => {
      const intent = file.replace('.json', '');
      const intentPath = path.join(__dirname, 'modules/nlp/intents', file);
      const data = JSON.parse(fs.readFileSync(intentPath, 'utf8'));

      if (data.exactInputs && data.exactInputs.length) {
        inputsByIntent[intent] = new Set(data.exactInputs.map(input => this.normalizeInput(input)));
      }

      return inputsByIntent;
    }, {});
  }

  normalizeInput(input) {
    return input.trim().toLowerCase().replace(/[^\w\s']/g, '').replace(/\s+/g, ' ');
  }

  formatProjectType(type) {
    return type.replace(/-/g, ' ');
  }

  formatSingularProjectType(type) {
    const singularTypes = {
      apps: 'app',
      holograms: 'hologram',
      'live-events': 'live event',
    };

    return singularTypes[type] || this.formatProjectType(type);
  }

  formatProjectTypeWithArticle(type) {
    const label = this.formatSingularProjectType(type);
    const article = /^[aeiou]/i.test(label) ? 'an' : 'a';
    return article + ' ' + label;
  }

  hasControlInput(intent, normalized) {
    return this.controlInputs && this.controlInputs[intent] && this.controlInputs[intent].has(normalized);
  }

  loadProjectTypeAliases(files) {
    return files
      .filter(file => file.startsWith('projects.'))
      .map((file) => {
        const intentType = file.replace('projects.', '').replace('.json', '');
        const intentPath = path.join(__dirname, 'modules/nlp/intents', file);
        const data = JSON.parse(fs.readFileSync(intentPath, 'utf8'));
        const canonicalType = this.getCanonicalProjectType(intentType, data);
        const aliases = [
          intentType,
          intentType.replace(/-/g, ' '),
          canonicalType,
          canonicalType.replace(/-/g, ' '),
          ...(data.questions || []),
          ...(data.answers || []),
        ];

        return {
          type: canonicalType,
          aliases: new Set(aliases.map(alias => this.normalizeInput(alias)).filter(Boolean)),
        };
      });
  }

  getCanonicalProjectType(intentType, data) {
    const knownTypes = new Set(projects.flatMap(project => project.type));
    if (knownTypes.has(intentType)) return intentType;

    const answerType = (data.answers || []).find(answer => knownTypes.has(answer));
    if (answerType) return answerType;

    return intentType;
  }

  loadProjectLookup() {
    return projects.map((project) => {
      const aliases = [
        project.name,
        project.title,
        project.value,
        project.slug,
        project.value && project.value.replace(/-/g, ' '),
        project.slug && project.slug.replace(/-/g, ' '),
        ...(project.aliases || []),
      ].filter(Boolean);
      const normalizedName = this.normalizeInput(project.name);
      if (normalizedName.startsWith('the ')) aliases.push(normalizedName.replace(/^the /, ''));

      return {
        project,
        aliases: new Set(aliases.map(alias => this.normalizeInput(alias)).filter(Boolean)),
      };
    });
  }

  findProjectType(normalized) {
    const projectish = this.state.awaitingProjectType || /\b(project|projects|portfolio|work|show|see)\b/.test(normalized);

    if (projectish && /\bckend\b/.test(normalized)) return 'backend';

    for (const projectType of this.projectTypeAliases || []) {
      for (const alias of projectType.aliases) {
        if (normalized === alias) return projectType.type;
        if (projectish && alias.length > 2 && normalized.includes(alias)) return projectType.type;
        if (projectish && alias.length <= 2 && new RegExp(`\\b${alias}\\b`).test(normalized)) return projectType.type;
      }
    }

    return null;
  }

  findProjectSelection(normalized) {
    const match = normalized.match(/^(?:show me |open |see )?(\d+)$/);
    if (!match || !this.state.lastProjectResults.length) return null;

    const index = Number(match[1]) - 1;
    if (index < 0 || index >= this.state.lastProjectResults.length) return null;
    return this.state.lastProjectResults[index];
  }

  findProjectByName(normalized) {
    const projectish = this.state.awaitingProjectType || /\b(project|projects|show|see|open|tell me about)\b/.test(normalized);

    for (const item of this.projectLookup || []) {
      for (const alias of item.aliases) {
        if (normalized === alias) return item.project;
        if ((projectish || alias.split(' ').length > 1) && alias.length > 2 && normalized.includes(alias)) return item.project;
      }
    }

    return null;
  }

  openProject(project) {
    this.showProjectInfo(project);
  }

  getProjectUrl(project) {
    return `https://daveseidman.com/${project.slug || project.value}`;
  }

  formatProjectDetails(project) {
    const title = project.title || project.desc;
    const details = project.details || project.desc || '';
    const tags = project.tags || project.type || [];
    const tagLine = tags.length ? `\nTags: ${tags.join(', ')}` : '';

    return `${project.name}: ${title}\n${details}${tagLine}`;
  }

  showProjectInfo(project) {
    this.state.awaitingProjectType = false;
    this.state.lastProjectResults = [project];
    this.rememberOpenTarget(project.name, this.getProjectUrl(project));

    const message = `${this.formatProjectDetails(project)}\n\nWant me to open it in your browser? (y/n) `;
    this.ask(message, (answer) => {
      if (this.isAffirmativeOpenAnswer(answer)) {
        this.openUrl(this.getProjectUrl(project));
        this.sayAndContinue(`Opening ${project.name}.`);
      } else {
        this.sayAndContinue('No problem. You can say "open it" if you change your mind.');
      }
    });
  }

  start() {
    const leadIn = this.options.mode === 'dev'
      ? 'Starting local Who Is Dave dev session...'
      : 'Follow the white rabbit...';

    const leadInOptions = this.options.mode === 'dev'
      ? { speed: 20, variation: 40 }
      : { speed: 2, variation: 4 };
    const introDelay = this.options.mode === 'dev' ? 1000 : 180;

    this.typewriter.typeSentence(leadIn, leadInOptions).then(() => {
      // setTimeout(() => {
      setTimeout(this.intro, introDelay);
      // }, 1000);
    });
  }

  intro() {
    console.clear();
    process.stdout.write(fontBot);
    this.typewriter.typeSentence('Welcome to the command line version of Dave Seidman!\nYou can ask anything about Dave and I will do my best to answer').then(() => {
      process.stdout.write('\n\n');
      this.startChat();
    });
  }

  startChat() {
    const startSentence = 'Ask me anything about Dave';
    this.ask(startSentence, this.handleUserAnswer);
  }

  handleUserAnswer(answer) {
    const normalized = this.normalizeInput(answer);

    if (this.hasControlInput('action.endChat', normalized)) {
      this.endChat();
      return;
    }

    if (this.hasControlInput('action.noop', normalized)) {
      this.noop();
      return;
    }

    if (this.isOpenReferenceInput(normalized)) {
      this.openRememberedTarget();
      return;
    }

    if (/\bmiddle\s*name\b/.test(normalized)) {
      this.sayAndContinue(this.getAnswerForIntent('personal.middle-name-unknown', "I don't know Dave's middle name. It is not in the dataset yet."));
      return;
    }

    if (/\boutside (?:of )?work\b/.test(normalized)) {
      this.sayAndContinue(this.getAnswerForIntent('personal.hobbies', 'Outside of work, Dave likes fishing, beach volleyball, reading, the New York Times crossword, and Code and Bourbon.'));
      return;
    }

    if (/\b(museum|museums|installation|installations)\b/.test(normalized) && /\b(proud|projects|worked on|work)\b/.test(normalized)) {
      this.sayAndContinue(this.getAnswerForIntent('work.proud-projects', 'Some museum installation projects Dave is proud of include The Waterways of Change in Buffalo, The Shockoe Institute in Virginia, and the National Urban League in Harlem.'));
      return;
    }

    if (/\b(what|who|tell me about)\b/.test(normalized) && /\blocal projects\b/.test(normalized)) {
      this.sayAndContinue(this.getAnswerForIntent('term.local-projects', "Local Projects is Dave's current full-time employer in Manhattan."));
      return;
    }

    if (/\b(local projects|museum|museums|installation|installations|manhattan)\b/.test(normalized)) {
      this.sayAndContinue(this.getAnswerForIntent('work.profession', 'Dave works full-time at Local Projects in Manhattan, mostly on museum installation design and real-world interactive projects.'));
      return;
    }

    const selectedProject = this.findProjectSelection(normalized);
    if (selectedProject) {
      this.openProject(selectedProject);
      return;
    }

    const namedProject = this.findProjectByName(normalized);
    if (namedProject) {
      this.openProject(namedProject);
      return;
    }

    const projectType = this.findProjectType(normalized);
    if (projectType) {
      this.showProject(projectType);
      return;
    }

    if (this.isProjectOverviewInput(normalized)) {
      this.showProjectTypes();
      return;
    }

    this.manager.process('en', answer, this.context).then(this.continueChat);
  }

  isProjectOverviewInput(normalized) {
    if (/\bwhere\b.*\bwork\b/.test(normalized)) return false;
    return /\b(project|projects|portfolio|working on|workin on|works on|worked on)\b/.test(normalized);
  }

  isOpenReferenceInput(normalized) {
    const openVerb = '(?:open|show|launch|pull up|bring up|display)';
    const openTarget = '(?:it|that|this|that one|this one|the last one)';
    const optionalReference = `(?: ${openTarget})?`;

    return new RegExp(`^${openVerb}${optionalReference}$`).test(normalized)
      || new RegExp(`^(?:yes|yeah|yep|sure|ok|okay|fine|actually|please|go ahead) ${openVerb}${optionalReference}$`).test(normalized)
      || new RegExp(`^(?:no |actually )?(?:you can|can you|could you|please|go ahead and|go ahead) ${openVerb}(?: ${openTarget})?$`).test(normalized);
  }

  rememberOpenTarget(label, url) {
    const target = { label, url };
    this.state.lastOpenTarget = target;
    this.state.openTargetHistory = [
      target,
      ...this.state.openTargetHistory.filter(item => item.url !== url),
    ].slice(0, 5);
  }

  openRememberedTarget() {
    const target = this.state.lastOpenTarget || this.state.openTargetHistory[0];

    if (target) {
      this.openUrl(target.url);
      this.sayAndContinue(`Opening ${target.label}.`);
      return;
    }

    if (this.state.lastProjectResults.length === 1) {
      this.openProject(this.state.lastProjectResults[0]);
      return;
    }

    if (this.state.lastProjectResults.length > 1) {
      this.ask('Which one should I open? Reply with a number from the list. ', this.handleUserAnswer);
      return;
    }

    this.sayAndContinue('I do not have anything queued up to open yet. Ask for a project, resume, or portfolio first.');
  }

  continueChat(res) {
    if (res && res.intent.split('.')[0] === 'projects') {
      const projectType = this.findProjectType(res.intent.split('.')[1]) || res.intent.split('.')[1];
      return this.showProject(projectType);
    }

    // check for action intent:
    if (res && res.intent.split('.')[0] === 'action') {
      return this[res.intent.split('.')[1]]();
    }


    let message;
    if (!res) {
      message = `${this.getContinueMessage()} `;
    } else {
      if (res.answer) {
        this.state.fallbackCount = 0;
        this.state.successfulInteractions += 1;
        const answer = this.getAnswerForIntent(res.intent, res.answer);
        const shouldAskName = this.shouldAskForName();
        if (shouldAskName) this.state.lastNamePromptAt = this.state.successfulInteractions;

        message = shouldAskName
          ? `${answer.trim()}\n\n${this.getNamePrompt()} `
          : res.intent === 'general.what-questions'
            ? `${answer} `
            : this.withFollowUp(answer);

        this.ask(message, (userAnswer) => {
          if (shouldAskName) {
            this.handleNameAnswer(userAnswer);
            return;
          }

          this.handleUserAnswer(userAnswer);
        });
        return;
      } else {
        this.state.fallbackCount += 1;
        if (this.state.fallbackCount >= fallbackCountThreshold) {
          return this.endChat();
        }
        message = `${this.getFallbackMessage()} `;
      }
    }

    this.ask(message, (answer) => {
      this.handleUserAnswer(answer);
    });
  }

  endChat(message = 'Goodbye for now. To talk again, just type `npx whoisdave`.') {
    console.log(message);
    this.rl.close();
  }

  reset() {
    this.intro();
  }

  noop() {
    this.endChat(this.getAnswerForIntent('action.noop', 'No problem. To talk later, just type `npx whoisdave`.'));
  }

  time() {
    const time = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/New_York',
      timeZoneName: 'short',
    }).format(new Date());

    this.ask(`The current time in Dave's timezone is ${time}. `, (answer) => {
      this.handleUserAnswer(answer);
    });
  }

  getContinueMessage() {
    if (this.state.justLearnedName && this.state.userName) {
      this.state.justLearnedName = false;
      return `What else can I help with, ${this.state.userName}?`;
    }

    const continueTextOptions = [
      "What else do you want to know?",
      "Ask me another question",
      "What else?",
      "What else can I try to answer?",
      "Ask me something else",
      "What else would you like to know about Dave?",
      "What else can I help with?",
      "Is there something else you'd like to know?"
    ];

    const namedOptions = this.state.userName ? [
      `What else do you want to know, ${this.state.userName}?`,
      `What else can I help with, ${this.state.userName}?`,
      `Anything else about Dave, ${this.state.userName}?`,
    ] : [];
    const options = namedOptions.length && Math.random() > 0.55
      ? namedOptions
      : continueTextOptions;

    return (options[Math.floor(Math.random() * options.length)]);
  }

  getFallbackMessage() {
    const fallbackOptions = [
      "Sorry, I didn't understand",
      'Sorry, I missed that, try again?',
      "What's that?",
      'Can you try rephrasing that?',
    ];

    if (this.state.userName && Math.random() > 0.6) {
      fallbackOptions.push(`Sorry, ${this.state.userName}, I missed that. Can you try rephrasing?`);
    }

    return (fallbackOptions[Math.floor(Math.random() * fallbackOptions.length)]);
  }

  shouldAskForName() {
    return !this.state.userName
      && this.state.successfulInteractions > 0
      && this.state.successfulInteractions % 4 === 0
      && this.state.lastNamePromptAt !== this.state.successfulInteractions;
  }

  getNamePrompt() {
    const prompts = [
      'By the way, who do I have the pleasure of speaking with?',
      'Sorry I forgot to ask sooner, but who are you?',
      "I'd love to address you by your name. What is it?",
    ];

    return prompts[Math.floor(Math.random() * prompts.length)];
  }

  isLikelyQuestion(answer) {
    const normalized = this.normalizeInput(answer);
    return answer.includes('?') || /^(what|whats|where|when|why|how|who|does|do|is|are|can|could|would|should|tell|show|list)\b/.test(normalized);
  }

  parseName(answer) {
    const cleaned = answer
      .trim()
      .replace(/[.!?]+$/g, '')
      .replace(/^(my name is|i am|i'm|im|this is|it's|its)\s+/i, '')
      .trim();

    if (!cleaned || cleaned.length > 40) return null;
    return cleaned;
  }

  handleNameAnswer(answer) {
    const normalized = this.normalizeInput(answer);

    if (this.hasControlInput('action.endChat', normalized)) {
      this.endChat();
      return;
    }

    if (this.hasControlInput('action.noop', normalized)) {
      this.sayAndContinue('No worries. I can keep calling you you.');
      return;
    }

    if (this.isLikelyQuestion(answer)) {
      this.handleUserAnswer(answer);
      return;
    }

    const name = this.parseName(answer);

    if (!name) {
      this.sayAndContinue('No worries. I can keep calling you you.');
      return;
    }

    this.state.userName = name;
    this.state.justLearnedName = true;
    this.sayAndContinue(`Nice to meet you, ${name}.`);
  }

  withFollowUp(answer) {
    return `${answer.trim()}\n\n${this.getContinueMessage()} `;
  }

  getAnswerForIntent(intent, fallbackAnswer) {
    const answers = this.answerBank[intent];
    if (!answers || answers.length < 2) return fallbackAnswer;

    if (!this.state.answerQueues[intent] || this.state.answerQueues[intent].length === 0) {
      this.state.answerQueues[intent] = this.shuffleAnswers(intent, answers);
    }

    const answer = this.state.answerQueues[intent].shift();
    this.state.lastAnswerByIntent[intent] = answer;
    return answer;
  }

  shuffleAnswers(intent, answers) {
    const shuffled = answers.slice();

    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const nextIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[nextIndex]] = [shuffled[nextIndex], shuffled[index]];
    }

    const lastAnswer = this.state.lastAnswerByIntent[intent];
    if (shuffled.length > 1 && shuffled[0] === lastAnswer) {
      shuffled.push(shuffled.shift());
    }

    return shuffled;
  }


  openUrl(url) {
    if (process.env.WHOISDAVE_SKIP_OPEN === '1') return;
    open(url);
  }

  resume() {
    this.promptToOpen("Dave's resume", 'https://daveseidman.com/resume.pdf');
  }

  openResume() {
    this.resume();
  }

  openPortfolio() {
    this.promptToOpen("Dave's portfolio", 'https://daveseidman.com');
  }

  github() {
    this.sayAndContinue(this.getAnswerForIntent('action.github', "This dataset does not include a public GitHub profile link yet. Dave's portfolio is at daveseidman.com, and this package lives at github.com/DaveSeidman/whoisdave."));
  }

  promptToOpen(label, url) {
    this.rememberOpenTarget(label, url);

    const message = this.state.userName && Math.random() > 0.55
      ? `Would you like me to open ${label} in your browser, ${this.state.userName}? `
      : `Would you like me to open ${label} in your browser? `;

    this.ask(`${message}(y/n) `, (answer) => {
      if (this.isAffirmativeOpenAnswer(answer)) {
        this.openUrl(url);
        this.sayAndContinue(`Opening ${label}.`);
      } else {
        this.sayAndContinue('No problem. You can say "open it" if you change your mind.');
      }
    });
  }

  isAffirmativeOpenAnswer(answer) {
    const normalized = this.normalizeInput(answer);
    if (/^(n|no|nope|nah|not now|no thanks)$/.test(normalized)) return false;
    if (/\b(dont|don't|do not|never|cancel|stop)\b/.test(normalized)) return false;

    return /^(y|yes|yeah|yep|sure|ok|okay|fine|please|do it)\b/.test(normalized)
      || this.isOpenReferenceInput(normalized);
  }

  showProjectTypes() {
    this.state.awaitingProjectType = true;
    const prefix = this.state.userName && Math.random() > 0.55
      ? `What kinds of projects would you like to see, ${this.state.userName}?`
      : 'What kinds of projects would you like to see?';
    const message = `${prefix} ${this.projectList.join(', ')}`;
    this.ask(message, this.handleUserAnswer);
  }

  showProject(type) {
    const filteredProjects = projects.filter(project => project.type.indexOf(type) >= 0);
    this.state.awaitingProjectType = false;
    this.state.lastProjectResults = filteredProjects;

    if (filteredProjects.length === 0) {
      this.typewriter.typeSentence(`Sorry, there are not any ${this.formatProjectType(type)} projects to share at the moment`).then(this.showProjectTypes);
      return;
    }

    if (filteredProjects.length === 1) {
      this.typewriter.typeSentence(`Okay, there is ${this.formatProjectTypeWithArticle(type)} project I can show you. `).then(() => {
        this.showProjectInfo(filteredProjects[0]);
      });
      return;
    }

    const projectList = filteredProjects
      .map((project, index) => `${index + 1}) ${project.name}: ${project.desc}`)
      .join('\n');
    this.ask(`Okay, here are some of Dave's ${this.formatProjectType(type)} projects:\n${projectList}\n\nWhich one do you want to see? Reply with a number. `, this.handleUserAnswer);
  }

  contact() {
    // console.log('contact me');
    this.sayAndContinue(this.getAnswerForIntent('action.contact', 'You can email Dave at daveseidman@gmail.com.'));
  }

  sayAndContinue(message) {
    this.typewriter.typeSentence(`${message.trim()}\n\n`).then(this.continueChat);
  }

  ask(message, callback, options = {}) {
    process.stdout.write(fontBot);
    const writeMessage = options.instant
      ? Promise.resolve(process.stdout.write(message))
      : this.typewriter.typeSentence(message);

    writeMessage.then(() => {
      if (this.rl.closed) return;
      process.stdout.write(`\n${fontUser}> `);
      if (!this.rl.closed) this.rl.resume();
      this.rl.once('line', (answer) => {
        process.stdout.write(fontDefault);
        callback(answer);
      });
    });
  }

  clear() {
    if (process.stdout.clearLine) {
      process.stdout.clearLine();
      process.stdout.cursorTo(0);
    } else {
      this.rl.clearLine();
    }
  }
}

function start(options) {
  return new App(options);
}

if (require.main === module) {
  start();
}

process.on('SIGINT', () => {
  console.log('Caught interrupt signal');

  process.exit();
});

module.exports = {
  App,
  start,
};
