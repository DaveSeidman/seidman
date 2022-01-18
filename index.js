const inquirer = require('inquirer');
const open = require('open');
const { NlpManager, ConversationContext } = require('node-nlp');
// const colors = require('colors');
// const blessed = require('blessed');
const { terminal } = require('terminal-kit');
const { projects } = require('./projects.json');
const { typeSentence, eraseSentence } = require('./modules/typewriter');

class App {
  constructor() {
    this.continueChat = this.continueChat.bind(this);
    this.openProjects = this.openProjects.bind(this);
    this.welcome = this.welcome.bind(this);

    this.manager = new NlpManager({ languages: ['en'] });
    this.manager.load();
    this.context = new ConversationContext();

    this.welcome2();
    // this.startChat();
  }

  welcome2() {
    const sentence = 'Follow the white rabbit...';
    typeSentence(sentence, { speed: 25, variation: 100 }).then(() => {
      // this.eraseSentence();
      eraseSentence(sentence);
    });
  }


  welcome() {
    return new Promise((resolve) => {
      console.clear();
      // console.log('Follow the white rabbit...');


      setTimeout(() => {
        console.clear();
        setTimeout(() => {
          inquirer.prompt([
            {
              name: 'welcome',
              message: 'Hi! Welcome to the command line version of my portfolio. \n What would you like to do? (to exit hit cntl+c, to restart type `npm start`)',
              type: 'list',
              choices: [
                { name: 'Talk with me', value: 'startChat' },
                { name: 'Open Portfolio', value: 'openPortfolio' },
                { name: 'Open Resume', value: 'openResume' },
                { name: 'View Projects', value: 'openProjects' },
              ],
            },
          ]).then((answers) => {
            this[answers.welcome]();
            return resolve();
          });
        }, 1000);
      }, 1000);
    });
  }

  openResume() {
    console.log('Sure, let me pull that up for you in a browser');
    setTimeout(() => {
      open('https://daveseidman.com/resume');
    }, 1000);
  }

  openPortfolio() {
    console.log("Sounds good, I'm going ot try and open my portfolio in your default browser!");
    setTimeout(() => {
      open('https://daveseidman.com');
    }, 1000);
  }

  openProjects() {
    return new Promise((resolve) => {
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
      });
    });
  }

  contactMe() {
    console.log('contact me');
  }

  startChat() {
    console.log('start chat');
    inquirer.prompt([{ name: 'start', message: 'cool, ask me anything' }]).then((answers) => {
      this.manager.process('en', answers.start, this.context).then(this.continueChat);
    }).catch((error) => {
      console.log('caught the err 1');
    });
  }

  continueChat(res) {
    this.routes = {
      // 'None': { call: this.fallback },
      'greetings.bye': { call: this.endChat },
      'fallback.reset': { call: this.reset },
      'work.kind': { call: this.openProjects },
    };
    // if (res.intent === 'greetings.bye') return this.endChat();
    if (this.routes[res.intent]) return this.routes[res.intent].call();
    const name = 'continue';
    const message = res.intent === 'None' ? 'Sorry, I did\'nt understand.' : res.answer;
    inquirer.prompt([{ name, message }]).then((answers) => {
      this.manager.process('en', answers.continue, this.context).then(this.continueChat);
    }).catch((error) => {
      console.log('caught the err 2');
    });
  }

  endChat() {
    console.log('okay, see ya soon. You can type `npm start` to talk to me again.');
  }

  reset() {
    console.log('resetting');
  }
  //
  // fallback() {
  //
  // }
}

const app = new App();

process.on('SIGINT', () => {
  console.log('Caught interrupt signal');

  process.exit();
});
