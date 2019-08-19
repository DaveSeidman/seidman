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
