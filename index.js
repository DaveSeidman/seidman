const prompt = require('prompt');
const figlet = require('figlet');
const colors = require('colors/safe');


  prompt.message = colors.blue('Thanks for installing my package');
  prompt.delimiter = colors.green("><");

  prompt.start();

  prompt.get({
    properties: {
      name: {
        description: colors.magenta("What is your name?")
      }
    }
  }, function (err, result) {
    console.log(colors.cyan("You said your name is: " + result.name));
  });
