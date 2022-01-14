const inquirer = require('inquirer');
const open = require('open');
const { NlpManager, ConversationContext } = require('node-nlp');
const { projects } = require('./projects.json');

class App {
  constructor() {
    this.manager = new NlpManager({ languages: ['en'] });
    this.manager.load();
    this.context = new ConversationContext();

    this.welcome();
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
        // console.log('here', answers.welcome);
        // console.log(answers.projectType);
        const filteredProjects = projects.filter(project => project.type.indexOf(answers.projectType) >= 0);
        if (filteredProjects.length) {
          inquirer.prompt([
            {
              name: 'projectLink',
              type: 'list',
              choices: filteredProjects,
            },
          ]).then((answers) => {
            console.log('okay, I\'ll open that one for you');
            setTimeout(() => {
              open(`https://daveseidman.com/${answers.projectLink}`);
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
    inquirer.prompt([{ name: 'opening', message: 'cool, ask me anything' }]).then((answers) => {
      // console.log(answers.opening);
      this.manager.process('en', answers.opening, this.context).then((res) => {
        console.log(res.answer);
        // console.log(this.context);
        this.continueChat(res);
      });
    });
  }

  continueChat(res) {
    // console.log(res);
    // inquirer.prompt
    // this should keep calling continue and eventually endChat
  }

  endChat() {

  }
}

const app = new App();


// const CliGui = require('cligui2');
// const open = require('open');
//
// const iface = new CliGui();
//
// const respond = (type) => {
//   iface.log(`lets talk about ${type}`);
// };
//
// iface.list('what kinds of projects are you interested in?', {
//   AR: () => { respond('ar'); },
//   VR: () => { respond('vr'); },
// });
//
// const disciplines = ['Full Stack Dev', 'XR Design / Dev', 'Game Engine Dev', 'Robotics', 'Machine Learning', 'Physical Computing', 'Holograms / Lenticular', 'Product Design', 'UI / UX Design', '3D Printing', '3D Scanning / Lidar', 'App Development', 'Data Visualization', 'WebSockets', 'CI / CD', 'AWS / GCP', 'Analytics', 'Model View Controller', 'Object-Oriented', 'Accesibility WCAG', 'PCB Design', 'Volumetric Video', 'Render Farming', 'Code Linting', 'Unit Testing', 'Crossbrowser Testing'];
// const languages = ['JavaScript', 'TypeScript', 'Node', 'Python', 'HTML5 / Canvas', 'WebGL', 'CSS', 'C#', 'SQL', 'PHP', 'Sketch', 'SASS / SCSS'];
// const projects = ['DaveSeidman', 'NFL AR by Verizon', 'ReFurbished', 'Wedding Website', 'CatDive', 'VR Coding', 'The Claw', 'HoloChat', 'Living Distance', 'Pride Parade', 'Cam Repeater', 'Fakebook', 'Stranger Tees'];
//
// const openingLine = 'Follow the white rabbit';
//
// // iface.log('Hey there and welcome to my command line portfolio');
//
//
// const work = () => {
//   iface.log('Sure, have a look at my portfolio');
//   open('https://daveseidman.com');
// };
//
// const about = () => {
//   iface.log('let me tell you about myself!');
// };
//
// const question = () => {
//   // iface.prompt();
//   iface.stop();
// };
//
// const resume = () => {
//   iface.log('okay');
//   open('https://daveseidman.com/resume');
// };
//
// const search = () => {
//   iface.search('lets run a search', disciplines, () => {
//     iface.log('okay');
//   });
// };
//
// const quit = () => {
//   iface.stop();
// };
//
// iface.list('What would you like to do?', {
//   'Show me your work': work,
//   'Ask me a question': question,
//   'Tell me about yourself': about,
//   'View your resume': resume,
//   'Search your skillset': search,
//   Quit: quit,
// });
// interface.gprompt("this is a guided prompt","type something",options,function(main,output) {
//   interface.log(output);
// })

// const main = (e) => {
//   interface.log('here', e);
// }
//
// interface.list("This is a list",["a","b","c","d"],function(main,chosen) {
//
// })
//
// interface.list("Another way",["a","b","c"],[
//   function(main) {},
//   function(main) {},
//   function(main) {}
// ])
//
// interface.list("Again Another way",[
//   {
//     name: "a",
//     call: function(main) {}
//   },
//   {
//     name: "b",
//     call: function(main) {}
//   }
// ])
//
// interface.list("The fourth way",{
//   a: function(main) {},
//   b: function(main) {},
//   c: function(main) {}
// })


/*
const prompt = require('prompt');
const figlet = require('figlet');
const colors = require('colors/safe');


prompt.message = colors.blue('\nThanks for installing my module: CLI-Mate!\n\n');
prompt.delimiter = '\n';

prompt.start();

prompt.get({
  properties: {
    name: {
      description: colors.blue('Tell me your name and I\'ll do something cool:'),
      hidden: true,
    },
  },
}, (promptError, promptResult) => {
  if (!promptError) {
    figlet(promptResult.name, (figletError, figletResult) => {
      if (!figletError) {
        console.log(figletResult);
        prompt.stop();
      }
    });
  }
});
*/
