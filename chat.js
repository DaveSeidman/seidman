const { NlpManager, ConversationContext } = require('node-nlp');
const readline = require('readline');

const manager = new NlpManager({ languages: ['en'] });
const context = new ConversationContext();
manager.load();

const rl = readline.createInterface(process.stdin, process.stdout);
rl.setPrompt('> ');
rl.prompt();
rl.on('line', async (line) => {
  const response = await manager.process('en', line, context);
  console.log(response);
  console.log('------');
  console.log(context);
  rl.prompt();
}).on('close', () => {
  process.exit(0);
});
