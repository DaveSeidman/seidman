const defaultTypeSpeed = 18;
const defaultTypeVariation = 20;
// const defaultEraseSpeed = 40;
// const defaultEraseVariation = 20;
// const defaultBlinkDuration = 2000;

class Typewriter {
  constructor(state) {
    this.state = state;

    this.typeSentence = this.typeSentence.bind(this);
    this.typeNextChunk = this.typeNextChunk.bind(this);
    this.skipTyping = this.skipTyping.bind(this);
  }

  typeSentence(string, options) {
    if (this.state.instantOutput) {
      process.stdout.write(string);
      return Promise.resolve();
    }

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
      this.typeNextChunk().then(() => {
        this.typing = false;
        resolve();
      });
    });
  }

  getChunkSize() {
    const roll = Math.random();
    if (roll > 0.88) return 4;
    if (roll > 0.68) return 3;
    if (roll > 0.38) return 2;
    return 1;
  }

  getDelay(chunk) {
    const lastChar = chunk.charAt(chunk.length - 1);
    const jitter = (this.variation * Math.random()) - (this.variation / 2);
    let delay = this.speed + jitter;

    if (/[,.!?;:]$/.test(lastChar)) delay += 80 + (Math.random() * 120);
    else if (/\s$/.test(lastChar)) delay += Math.random() * 45;

    if (Math.random() > 0.92) delay += 80 + (Math.random() * 140);

    return Math.max(6, delay);
  }

  typeNextChunk() {
    return new Promise((resolve) => {
      const chunkSize = this.getChunkSize();
      const chunk = this.string.slice(this.index, this.index + chunkSize);
      process.stdout.write(chunk);

      const delay = this.getDelay(chunk);
      this.charTimeout = setTimeout(() => {
        this.index += chunk.length;
        if (this.index < this.string.length) this.typeNextChunk().then(resolve);
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
