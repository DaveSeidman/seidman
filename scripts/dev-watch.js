#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const root = path.join(__dirname, '..');
const watchTargets = ['index.js', 'bin', 'modules', 'data'];
const watchExtensions = new Set(['.js', '.json']);
const pollInterval = 500;

let child;
let restartTimer;
const watchedFiles = new Set();

function getWatchFiles(target) {
  const absoluteTarget = path.join(root, target);
  if (!fs.existsSync(absoluteTarget)) return [];

  const stats = fs.statSync(absoluteTarget);
  if (stats.isFile()) {
    return watchExtensions.has(path.extname(absoluteTarget)) ? [absoluteTarget] : [];
  }

  const files = [];
  for (const entry of fs.readdirSync(absoluteTarget)) {
    files.push(...getWatchFiles(path.join(target, entry)));
  }
  return files;
}

function start() {
  child = spawn(process.execPath, ['bin/seidman.js', '--dev'], {
    cwd: root,
    stdio: 'inherit',
    env: Object.assign({}, process.env, {
      SEIDMAN_ALLOW_NON_TTY: '1',
    }),
  });

  child.on('exit', () => {
    child = null;
    console.log('\n[dev:watch] CLI exited. Waiting for changes...');
  });
}

function restart(file) {
  clearTimeout(restartTimer);
  restartTimer = setTimeout(() => {
    console.log(`\n[dev:watch] ${path.relative(root, file)} changed. Restarting...`);
    if (child) {
      child.once('exit', start);
      child.kill();
      return;
    }

    start();
  }, 100);
}

function watchFile(file) {
  if (watchedFiles.has(file)) return;
  watchedFiles.add(file);
  fs.watchFile(file, { interval: pollInterval }, (current, previous) => {
    if (current.mtimeMs !== previous.mtimeMs) restart(file);
  });
}

function refreshWatchList() {
  for (const target of watchTargets) {
    for (const file of getWatchFiles(target)) {
      watchFile(file);
    }
  }
}

process.on('SIGINT', () => {
  for (const file of watchedFiles) {
    fs.unwatchFile(file);
  }

  if (child) {
    child.kill('SIGINT');
  }

  process.exit(0);
});

console.log('[dev:watch] Watching index.js, bin, modules, and data.');
refreshWatchList();
setInterval(refreshWatchList, 2000);
start();
