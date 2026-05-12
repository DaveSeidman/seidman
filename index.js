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
      answerQueues: {},
      lastAnswerByIntent: {},
      instantOutput: process.env.SEIDMAN_INSTANT_OUTPUT === '1'
        || (!process.env.SEIDMAN_ALLOW_NON_TTY && (!process.stdin.isTTY || !process.stdout.isTTY)),
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
      this.projectList = files.filter(file => file.split('.')[0] === 'projects').map(file => file.split('.')[1].replace('-', ' '));
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

  start() {
    const leadIn = this.options.mode === 'dev'
      ? 'Starting local Seidman dev session...'
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
    this.typewriter.typeSentence('Welcome to the command line version of Dave Seidman!\nYou can ask anything about Dave and this bot will do its best to answer').then(() => {
      process.stdout.write('\n\n');
      this.startChat();
    });
  }

  startChat() {
    const startSentence = 'Ask me anything about Dave';
    this.ask(startSentence, (answer) => {
      this.manager.process('en', answer, this.context).then(this.continueChat);
    });
  }

  continueChat(res) {
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

          this.manager.process('en', userAnswer, this.context).then(this.continueChat);
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
      this.manager.process('en', answer, this.context).then(this.continueChat);
    });
  }

  endChat() {
    console.log('Goodbye for now. To talk to this bot again, just type `npx seidman`.');
    this.rl.close();
  }

  reset() {
    this.intro();
  }

  time() {
    const time = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/New_York',
      timeZoneName: 'short',
    }).format(new Date());

    this.ask(`The current time in Dave's timezone is ${time}. `, (answer) => {
      this.manager.process('en', answer, this.context).then(this.continueChat);
    });
  }

  getContinueMessage() {
    const continueTextOptions = [
      "What else do you want to know?",
      "Ask me another question",
      "What else?",
      "What else should this bot try to answer?",
      "Ask me something else",
      "What else would you like to know about Dave?",
      "What else can I help with?",
      "Is there something else you'd like to know?"
    ];

    return (continueTextOptions[Math.floor(Math.random() * continueTextOptions.length)]);
  }

  getFallbackMessage() {
    const fallbackOptions = [
      "Sorry, I didn't understand",
      'Sorry, I missed that, try again?',
      "What's that?",
      'Can you try rephrasing that?',
    ];

    return (fallbackOptions[Math.floor(Math.random() * fallbackOptions.length)]);
  }

  shouldAskForName() {
    return !this.state.userName && this.state.successfulInteractions > 0 && this.state.successfulInteractions % 4 === 0;
  }

  getNamePrompt() {
    const prompts = [
      'By the way, who does this bot have the pleasure of speaking with?',
      'Sorry this bot forgot to ask sooner, but who are you?',
      "This bot would love to address you by your name. What is it?",
    ];

    return prompts[Math.floor(Math.random() * prompts.length)];
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
    const name = this.parseName(answer);

    if (!name) {
      this.sayAndContinue('No worries. This bot can keep calling you you.');
      return;
    }

    this.state.userName = name;
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


  resume() {
    this.promptToOpen("Dave's resume", 'https://daveseidman.com/resume');
  }

  openResume() {
    this.resume();
  }

  openPortfolio() {
    this.promptToOpen("Dave's portfolio", 'https://daveseidman.com');
  }

  promptToOpen(label, url) {
    const message = `Would you like me to open ${label} in your browser? `;

    this.ask(`${message}(y/n) `, (answer) => {
      if (/^(y|yes|sure|ok|okay)$/i.test(answer.trim())) {
        open(url);
        this.sayAndContinue(`Opening ${label}.`);
      } else {
        this.sayAndContinue('No problem.');
      }
    });
  }

  showProjectTypes() {
    const message = `What kinds of projects would you like to see? ${this.projectList.join(', ')}`;
    this.ask(message, (answer) => {
      this.manager.process('en', answer, this.context).then((res) => {
        if (res.intent.split('.')[0] === 'projects') {
          this.showProject(res.intent.split('.')[1]);
        } else {
          this.showProjectTypes();
        }
      });
    });
  }

  showProject(type) {
    const filteredProjects = projects.filter(project => project.type.indexOf(type) >= 0);
    if (filteredProjects.length === 0) {
      this.typewriter.typeSentence(`Sorry, there are not any ${type} projects to share at the moment`).then(this.showProjectTypes);
    }
    if (filteredProjects.length === 1) {
      this.typewriter.typeSentence(`Okay, there is a ${type} project this bot can show you. `).then(() => {
        this.promptToOpen(filteredProjects[0].name, `https://daveseidman.com/${filteredProjects[0].value}`);
      });
    }
    if (filteredProjects.length > 1) {
      let message = '';
      filteredProjects.forEach((project, index) => {
        message += `${index + 1}) ${project.name}: ${project.desc}, `;
      });
      this.typewriter.typeSentence(`Okay, here are some of Dave's ${type} projects: ${message}`);
    }
    // console.log(`okay, show Dave's ${type} Projects`);
    // console.log(filteredProjects);
  }

  contact() {
    // console.log('contact me');
    this.sayAndContinue(this.getAnswerForIntent('action.contact', 'You can email Dave at daveseidman@gmail.com.'));
  }

  sayAndContinue(message) {
    this.typewriter.typeSentence(`${message.trim()}\n\n`).then(this.continueChat);
  }

  ask(message, callback) {
    process.stdout.write(fontBot);
    this.typewriter.typeSentence(message).then(() => {
      process.stdout.write(`\n${fontUser}> `);
      this.rl.resume();
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
