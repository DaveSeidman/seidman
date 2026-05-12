#!/usr/bin/env node

const { start } = require('../index');

const args = process.argv.slice(2);
const mode = args.includes('--dev') || process.env.WHOISDAVE_DEV === '1' || process.env.SEIDMAN_DEV === '1'
  ? 'dev'
  : 'production';

if (!process.env.WHOISDAVE_ALLOW_NON_TTY && !process.env.SEIDMAN_ALLOW_NON_TTY && (!process.stdin.isTTY || !process.stdout.isTTY)) {
  const command = mode === 'dev' ? 'npm run dev' : 'npx whoisdave';
  console.log(`whoisdave needs an interactive terminal. Run \`${command}\` from a terminal to start.`);
  process.exit(0);
}

start({ mode });
