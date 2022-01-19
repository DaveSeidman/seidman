const open = require('open');
const { NlpManager, ConversationContext } = require('node-nlp');
const readline = require('readline');
const { projects } = require('./projects.json');
const { Typewriter } = require('./modules/typewriter');

class App {
  constructor() {
    this.continueChat = this.continueChat.bind(this);
    this.openProjects = this.openProjects.bind(this);
    this.welcome = this.welcome.bind(this);

    this.manager = new NlpManager({ languages: ['en'] });
    this.manager.load('./modules/nlp/model.nlp');
    this.context = new ConversationContext();

    this.rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    this.state = {
      boyTyping: false,
      userTyping: false,
      skipTyping: false,
    };

    this.routes = {
      // 'None': { call: this.fallback },
      'greetings.bye': { call: this.endChat },
      'fallback.reset': { call: this.reset },
      'work.kind': { call: this.openProjects },
    };

    this.typewriter = new Typewriter(this.state);


    process.stdin.on('keypress', (char, key) => {
      if (key.name === 'return' && this.typewriter.typing) this.typewriter.skipTyping();
    });


    this.welcome2();
    // this.startChat();
  }

  welcome2() {
    this.typewriter.typeSentence('Follow the white rabbit...', { speed: 20, variation: 20 }).then(() => {
      setTimeout(() => {
        console.clear();
        setTimeout(() => {
          this.typewriter.typeSentence('Welcome to the command line version of my online portfolio: daveseidman.com', { skipTyping: this.skipTyping }).then(() => {
            // eraseAmount(20).then(() => {
            // eraseSentence('daveseidman.com').then(() => {
            this.typewriter.typeSentence('https://daveseidman.com').then(() => {
              process.stdout.write('\n');
              this.startChat();
            });
            // });
          });
        });
      }, 1000);
    }, 100);
  }


  welcome() {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.rl.question('what would you like to do? ', (answer) => {
          console.log('user said:', answer);
          this.manager.process('en', answer, this.context).then((res) => {
            console.log('i heard:', res);
          });
        });
      }, 1000);
    });
  }

  startChat() {
    const startSentence = 'Okay, ask me anything: ';
    this.typewriter.typeSentence(startSentence).then(() => {
      process.stdout.clearLine();
      process.stdout.cursorTo(0);
      this.rl.question(startSentence, (answer) => {
        this.manager.process('en', answer, this.context).then(this.continueChat);
      });
    });
  }

  continueChat(res) {
    if (this.routes[res.intent]) {
      this.context.intent = res.intent;
    }

    // console.log(this.context);
    const message = res.intent === 'None' ? 'Sorry, I did\'nt understand.' : `${res.answer} `;

    this.typewriter.typeSentence(message).then(() => {
      process.stdout.clearLine();
      process.stdout.cursorTo(0);
      this.rl.question(message, (answer) => {
        this.manager.process('en', answer, this.context).then(this.continueChat);
      });
    });
  }

  endChat() {
    console.log('okay, see ya soon. You can type `npm start` to talk to me again.');
  }

  reset() {
    console.log('resetting');
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

  openProjects() {
    return new Promise((resolve) => {
      this.typewriter.typeSentence('What kinds of projects would you like to see?').then(() => {
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        this.rl.question('What kinds of projects would you like to see?', (answer) => {
          console.log(answer);
        });
        /*
          inquirer.prompt([
            {
              name: 'projectType',
              message: 'What kinds of projects would you like to see?',
              type: 'list',
              choices: [
                { name: 'Frontend', value: 'FED' },
                { name: 'Backend', value: 'BED' },
                { name: 'App', value: 'APP' },
                { name: 'AR', value: 'AR' },
                { name: 'VR', value: 'VR' },
                { name: 'Holograms', value: 'HOL' },
                { name: 'Computer Vision', value: 'CV' },
                { name: 'Physical Computing', value: 'PC' },
                { name: 'Experimental', value: 'EXP' },
                { name: 'Live Events', value: 'LIV' },
                { name: 'Go Back ⤴', value: 'back' },
              ],
            },
          ]).then((answers) => {
            const filteredProjects = projects.filter(project => project.type.indexOf(answers.projectType) >= 0);
            filteredProjects.push({ name: 'Go Back ⤴', value: 'back' });
            if (filteredProjects.length > 1) {
              inquirer.prompt([
                {
                  message: `Here are some of my ${answers.projectType} projects:`,
                  name: 'projectLink',
                  type: 'list',
                  choices: filteredProjects,
                },
              ]).then(({ projectLink }) => {
                if (projectLink === 'back') return this.welcome();
                console.log('okay, I\'ll open that one for you');
                setTimeout(() => {
                  open(`https://daveseidman.com/${projectLink}`);
                }, 1000);
              });
            } else {
              console.log('sorry, no matches');
            }

            return resolve();
          }).catch((error) => {
            console.log('error', error);
          }); */
      });
    });
  }

  contactMe() {
    console.log('contact me');
  }
}

const app = new App();

process.on('SIGINT', () => {
  console.log('Caught interrupt signal');

  process.exit();
});
