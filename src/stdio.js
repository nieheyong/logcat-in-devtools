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

module.exports = {
  vmLog,
  appLogError,
  muteStdio,
  appLog,
}