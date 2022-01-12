const CliGui = require('cligui2');
const open = require('open');

const iface = new CliGui();

const respond = (type) => {
  iface.log(`lets talk about ${type}`);
};

iface.list('what kinds of projects are you interested in?', {
  AR: () => { respond('ar'); },
  VR: () => { respond('vr'); },
});

const disciplines = ['Full Stack Dev', 'XR Design / Dev', 'Game Engine Dev', 'Robotics', 'Machine Learning', 'Physical Computing', 'Holograms / Lenticular', 'Product Design', 'UI / UX Design', '3D Printing', '3D Scanning / Lidar', 'App Development', 'Data Visualization', 'WebSockets', 'CI / CD', 'AWS / GCP', 'Analytics', 'Model View Controller', 'Object-Oriented', 'Accesibility WCAG', 'PCB Design', 'Volumetric Video', 'Render Farming', 'Code Linting', 'Unit Testing', 'Crossbrowser Testing'];
const languages = ['JavaScript', 'TypeScript', 'Node', 'Python', 'HTML5 / Canvas', 'WebGL', 'CSS', 'C#', 'SQL', 'PHP', 'Sketch', 'SASS / SCSS'];
const projects = ['DaveSeidman', 'NFL AR by Verizon', 'ReFurbished', 'Wedding Website', 'CatDive', 'VR Coding', 'The Claw', 'HoloChat', 'Living Distance', 'Pride Parade', 'Cam Repeater', 'Fakebook', 'Stranger Tees'];

// iface.search('lets run a search', disciplines, () => {
//   iface.log('okays');
// });

// iface.log('Hey there and welcome to my command line portfolio');


const work = () => {
  iface.log('Sure, here\'s my portfolio');
  open('https://daveseidman.com');
};

const about = () => {
  iface.log('let me tell you about myself!');
};

const resume = () => {
  iface.log('okay');
  open('https://daveseidman.com/resume');
};

const quit = () => {
  iface.stop();
};

iface.list('What woulud you like to do?', {
  'Show me your work': work,
  'Tell me about yourself': about,
  'View your resume': resume,
  Quit: quit,
});
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
