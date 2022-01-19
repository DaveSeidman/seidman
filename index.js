const open = require('open');
const { NlpManager, ConversationContext } = require('node-nlp');
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { projects } = require('./projects.json');
const { Typewriter } = require('./modules/typewriter');

const fontDefault = '\x1b[0m';
const fontBot = '\x1b[36m';
const fallbackCountThreshold = 3;

class App {
  constructor() {
    this.continueChat = this.continueChat.bind(this);
    this.showProject = this.showProject.bind(this);
    this.showProjectTypes = this.showProjectTypes.bind(this);
    this.start = this.start.bind(this);
    this.intro = this.intro.bind(this);
    this.startChat = this.startChat.bind(this);
    this.continueChat = this.continueChat.bind(this);

    this.manager = new NlpManager({ languages: ['en'] });
    this.manager.load('./modules/nlp/model.nlp');
    this.context = new ConversationContext();

    this.rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    this.state = {
      boyTyping: false,
      userTyping: false,
      skipTyping: false,
      fallbackCount: 0,
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
      this.projectList = files.filter(file => file.split('.')[0] === 'projects').map(file => file.split('.')[1].replace('-', ' '));
      // this.intro();
      this.start();
    });
  }

  start() {
    this.typewriter.typeSentence('Follow the white rabbit...', { speed: 20, variation: 40 }).then(() => {
      // setTimeout(() => {
      setTimeout(this.intro, 1000);
      // }, 1000);
    });
  }

  intro() {
    console.clear();
    process.stdout.write(fontBot);
    this.typewriter.typeSentence('Welcome to the command line version of http://daveseidman.com').then(() => {
      process.stdout.write('\n');
      this.startChat();
    });
  }

  startChat() {
    const startSentence = 'Ask me anything and I\'ll do my best to answer: ';
    this.typewriter.typeSentence(startSentence).then(() => {
      this.clear();

      this.rl.question(startSentence, (answer) => {
        this.manager.process('en', answer, this.context).then(this.continueChat);
      });
      process.stdout.write(fontDefault);
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
        message = `${res.answer} ${this.getContinueMessage()} `;
      } else {
        this.state.fallbackCount += 1;
        if (this.state.fallbackCount >= fallbackCountThreshold) {
          return this.endChat();
        }
        message = `${this.getFallbackMessage()} `;
      }
    }

    process.stdout.write(fontBot);
    this.typewriter.typeSentence(message).then(() => {
      this.clear();
      this.rl.question(message, (answer) => {
        this.manager.process('en', answer, this.context).then(this.continueChat);
      });
      process.stdout.write(fontDefault);
    });
  }

  endChat() {
    console.log('Goodbye for now. You can type `npm start` to talk to me again.');
    this.rl.close();
  }

  reset() {
    this.intro();
  }

  getContinueMessage() {
    const continueTextOptions = [
      'What else do you want to know?',
      'Ask me another question',
      'What else can I try to answer for you?',
      'Ask me something else',
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


  openResume() {
    console.log('Sure, let me grab that for you');
    setTimeout(() => {
      open('https://daveseidman.com/resume');
    }, 1000);
  }

  openPortfolio() {
    console.log('Sure, i\'ll open it in your default browser.');
    setTimeout(() => {
      open('https://daveseidman.com');
    }, 1000);
  }

  showProjectTypes() {
    const message = `What kinds of projects would you like to see? ${this.projectList.join(', ')}: `;
    this.typewriter.typeSentence(message).then(() => {
      this.clear();
      this.rl.question(message, (answer) => {
        this.manager.process('en', answer, this.context).then((res) => {
          if (res.intent.split('.')[0] === 'projects') {
            this.showProject(res.intent.split('.')[1]);
          } else {
            this.showProjectTypes();
          }
        });
      });
    });
  }

  showProject(type) {
    const filteredProjects = projects.filter(project => project.type.indexOf(type) >= 0);
    if (filteredProjects.length === 0) {
      this.typewriter.typeSentence(`sorry, I don't have any ${type} to share at the moment`).then(this.showProjectTypes);
    }
    if (filteredProjects.length === 1) {
      open(`https://daveseidman.com/${filteredProjects[0].value}`);
      this.typewriter.typeSentence(`Okay, let me show you a ${type} project.`).then(this.continueChat);
    }
    if (filteredProjects.length > 1) {
      let message = '';
      filteredProjects.forEach((project, index) => {
        message += `${index + 1}) ${project.name}: ${project.desc}, `;
      });
      this.typewriter.typeSentence(`Okay, here are some of my ${type} projects: ${message}`);
    }
    // console.log(`okay, I'll show you my ${type} Projects`);
    // console.log(filteredProjects);
  }

  contact() {
    // console.log('contact me');
    this.typewriter.typeSentence('You can email me at daveseidman@gmail.com').then(this.continueChat);
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

const app = new App(); // eslint-disable-line

process.on('SIGINT', () => {
  console.log('Caught interrupt signal');

  process.exit();
});
