const readline = require('readline');

const originalStdoutWrite = process.stdout.write;
const originalStderrWrite = process.stderr.write;

function muteStdio() {
  process.stdout.write = () => { };
  process.stderr.write = () => { };
}

function restoreStdio() {
  process.stdout.write = originalStdoutWrite;
  process.stderr.write = originalStderrWrite;
}

function appLog(...args) {
  restoreStdio();
  console.log(...args);
  muteStdio();
}

function appLogError(...args) {
  restoreStdio();
  console.error(...args);
  muteStdio();
}

function vmLog(type, ...args) {
  console[type](...args);
}
eval(vmLog.toString());

function listenForKeypress(shortcuts) {
  readline.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);

  process.stdin.on('keypress', (str, key) => {
    shortcuts.forEach(shortcut => {
      const { ctrl, shift, name, action } = shortcut;

      if (
        (ctrl === undefined || key.ctrl === ctrl) &&
        (shift === undefined || key.shift === shift) &&
        key.name === name
      ) {
        action();
      }
    });

    if (key.ctrl && key.name === 'c') {
      exitProcess()
    }
  });
}

function exitProcess(code) {
  process.stdin.setRawMode(false);
  process.exit(code);
}

module.exports = {
  vmLog,
  appLogError,
  muteStdio,
  appLog,
  listenForKeypress,
  exitProcess
}