const inquirer = require('inquirer');
const open = require('open');
const { NlpManager, ConversationContext } = require('node-nlp');
const colors = require('colors');
const { projects } = require('./projects.json');

class App {
  constructor() {
    this.continueChat = this.continueChat.bind(this);
    this.manager = new NlpManager({ languages: ['en'] });
    this.manager.load();
    this.context = new ConversationContext();

    // this.welcome();
    this.startChat();
  }

  welcome() {
    return new Promise((resolve) => {
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
      }).catch((error) => {
        console.log('error', error);
      });
    });
  }

  openResume() {
    console.log('Sure, let me pull that up for you in a browser');
    setTimeout(() => {
      open('https://daveseidman.com/resume');
    }, 2000);
  }

  openPortfolio() {
    console.log("Sounds good, I'm going ot try and open my portfolio in your default browser!");
    setTimeout(() => {
      open('https://daveseidman.com');
    }, 2000);
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
          ],
        },
      ]).then((answers) => {
        const filteredProjects = projects.filter(project => project.type.indexOf(answers.projectType) >= 0);
        filteredProjects.push({ name: 'Go Back ⤴', value: 'back' });
        if (filteredProjects.length) {
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
            }, 2000);
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
    });
  }

  continueChat(res) {
    if (res.intent === 'greetings.bye') return this.endChat();
    inquirer.prompt([{ name: 'continue', message: res.answer }]).then((answers) => {
      this.manager.process('en', answers.continue, this.context).then(this.continueChat);
    });
  }

  endChat() {
    console.log('okay, see ya soon. You can type `npm start` to talk to me again.');
  }
}

const app = new App();
