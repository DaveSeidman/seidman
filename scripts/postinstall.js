#!/usr/bin/env node

const { spawnSync } = require('child_process');
const path = require('path');

const isInteractive = Boolean(process.stdin.isTTY && process.stdout.isTTY);
const isCi = Boolean(process.env.CI);

if (!isInteractive || isCi) {
  console.log('seidman installed. Run `npx seidman` or `npm exec seidman` to start.');
  process.exit(0);
}

const cli = path.join(__dirname, '..', 'bin', 'seidman.js');

spawnSync(process.execPath, [cli], {
  stdio: 'inherit',
  env: Object.assign({}, process.env, {
    SEIDMAN_POSTINSTALL: '1',
  }),
});
