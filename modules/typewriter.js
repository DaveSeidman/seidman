// let _string;
// let _index;
// let _speed;
// let _variation;

const defaultTypeSpeed = 60;
const defaultTypeVariation = 100;
const defaultEraseSpeed = 40;
const defaultEraseVariation = 20;
const defaultBlinkDuration = 2000;

class Typewriter {
  constructor(state) {
    this.state = state;
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
      process.stdout.write(this.string.charAt(this.index));
      const delay = this.speed + ((this.variation * Math.random()) - (this.variation / 2));
      setTimeout(() => {
        this.index += 1;
        if (this.index < this.string.length) this.typeCharacter().then(resolve);
        else return resolve();
      }, delay);
    });
  }

  skipTyping() {
    console.log('skipping to end');
    this.index = this.string.length - 1;
  }
}

module.exports.Typewriter = Typewriter;

/*
const typeCharacter = () => new Promise((resolve) => {
  process.stdout.write(_string.charAt(_index));
  setTimeout(() => {
    _index += 1;
    if (_index < _string.length) typeCharacter().then(resolve);
    else return resolve();
  }, _speed + ((_variation * Math.random()) - (_variation / 2)));
});

const typeSentence = (string, options, state) => {
  const defaults = {
    speed: defaultTypeSpeed,
    variation: defaultTypeVariation,
  };
  options = Object.assign(defaults, options);
  _string = string;
  _index = 0;
  _speed = options.speed;
  _variation = options.variation;

  // state.typing = true;
  return new Promise((resolve) => {
    typeCharacter().then(resolve);
    // state.typing = false;
  });
};

const eraseCharacter = () => new Promise((resolve) => {
  process.stdout.write(_string.charAt(_index));
  setTimeout(() => {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(_string.substr(0, _index));
    _index -= 1;
    if (_index >= 0) eraseCharacter().then(resolve);
    else return resolve();
  }, _speed + ((_variation * Math.random()) - (_variation / 2)));
});

const eraseSentence = (string, options) => {
  const defaults = {
    speed: defaultEraseSpeed,
    variation: defaultEraseVariation,
  };
  options = Object.assign(defaults, options);

  _string = string;
  _index = string.length - 1;
  _speed = options.speed;
  _variation = options.variation;

  return new Promise((resolve) => {
    eraseCharacter().then(resolve);
  });
};

const eraseAmount = amount => new Promise((resolve) => {
  process.stdout.cursorTo(-amount);
  process.stdout.write('test');
  return resolve();
});

// const blinkCursor = duration => new Promise((resolve) => {
//   const _duration = duration || defaultBlinkDuration;
//   const blinkOn = setInterval(() => {
//     process.stdout.write('|');
//   }, 1000);
//   const blinkOff = setInterval(() => {
//     process.stdout.cursorTo;
//   });
//
//   setTimeout(() => resolve(), _duration);
// });


module.exports = { typeSentence, eraseSentence, eraseAmount };
*/
