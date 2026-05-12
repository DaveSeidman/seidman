#!/usr/bin/env node

const { spawnSync } = require('child_process');
const path = require('path');

const isInteractive = Boolean(process.stdin.isTTY && process.stdout.isTTY);
const isCi = Boolean(process.env.CI);

if (!isInteractive || isCi) {
  console.log('whoisdave installed. Run `npx whoisdave` or `npm exec whoisdave` to start.');
  process.exit(0);
}

const cli = path.join(__dirname, '..', 'bin', 'whoisdave.js');

spawnSync(process.execPath, [cli], {
  stdio: 'inherit',
  env: Object.assign({}, process.env, {
    WHOISDAVE_POSTINSTALL: '1',
  }),
});
