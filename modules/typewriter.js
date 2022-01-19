const defaultTypeSpeed = 60;
const defaultTypeVariation = 100;
// const defaultEraseSpeed = 40;
// const defaultEraseVariation = 20;
// const defaultBlinkDuration = 2000;

class Typewriter {
  constructor(state) {
    this.state = state;

    this.typeSentence = this.typeSentence.bind(this);
    this.typeCharacter = this.typeCharacter.bind(this);
    this.skipTyping = this.skipTyping.bind(this);
  }

  typeSentence(string, options) {
    const defaults = {
      speed: defaultTypeSpeed,
      variation: defaultTypeVariation,
    };
    options = Object.assign(defaults, options);
    this.string = string;
    this.index = 0;
    this.speed = options.speed;
    this.variation = options.variation;

    this.typing = true;
    return new Promise((resolve) => {
      this.typeCharacter().then(resolve);
      this.typing = false;
    });
  }

  typeCharacter() {
    return new Promise((resolve) => {
      const char = this.string.charAt(this.index);
      process.stdout.write(char);
      // process.stdout.write(`\x1b[34m${char}\x1b[89m`);
      const delay = this.speed + ((this.variation * Math.random()) - (this.variation / 2));
      this.charTimeout = setTimeout(() => {
        this.index += 1;
        if (this.index < this.string.length) this.typeCharacter().then(resolve);
        else return resolve();
      }, delay);
    });
  }

  skipTyping() {
    // this.charComplete.resolve();
    // this.sentenceComplete.resolve();
    clearTimeout(this.charTimeout);

    console.log('skipping to end');
    this.index = this.string.length - 1;
    console.log(this.sentenceComplete);
  }
}

module.exports.Typewriter = Typewriter;
