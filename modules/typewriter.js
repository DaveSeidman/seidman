let _string;
let _index;
let _speed;
let _variation;

const typeCharacter = () => new Promise((resolve) => {
  process.stdout.write(_string.charAt(_index));
  setTimeout(() => {
    _index += 1;
    if (_index < _string.length) typeCharacter().then(resolve);
    else return resolve();
  }, _speed + (_variation * Math.random()));
});

const typeSentence = (string, options) => {
  const defaults = {
    speed: 100,
    variation: 0,
  };
  options = Object.assign(defaults, options);
  _string = string;
  _index = 0;
  _speed = options.speed;
  _variation = options.variation;
  return new Promise((resolve) => {
    typeCharacter().then(resolve);
  });
};

const eraseCharacter = () => new Promise((resolve) => {
  process.stdout.write(_string.charAt(_index));
  setTimeout(() => {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(_string.substr(0, _index));
    _index -= 1;
    if (_index > 0) eraseCharacter().then(resolve);
    else return resolve();
  }, _speed + (_variation * Math.random()));
});

const eraseSentence = (string, options) => {
  const defaults = {
    speed: 100,
    variation: 0,
  };
  options = Object.assign(defaults, options);

  _string = string;
  _index = string.length;
  _speed = options.speed;
  _variation = options.variation;

  return new Promise((resolve) => {
    eraseCharacter().then(resolve);
  });
};


module.exports = { typeSentence, eraseSentence };
