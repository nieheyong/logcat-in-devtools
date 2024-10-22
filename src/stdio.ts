import readline from "readline";

const originalStdoutWrite = process.stdout.write;
const originalStderrWrite = process.stderr.write;

export function muteStdio() {
  process.stdout.write = () => true;
  process.stderr.write = () => true;
}

function restoreStdio() {
  process.stdout.write = originalStdoutWrite;
  process.stderr.write = originalStderrWrite;
}

export function appLog(...args: any[]) {
  restoreStdio();
  console.log(...args);
  muteStdio();
}

export function appLogError(...args: any[]) {
  restoreStdio();
  console.error(...args);
  muteStdio();
}

export function vmLog(type: any, ...args: any[]) {
  // @ts-ignore
  console[type](...args);
}
eval(vmLog.toString());

export function listenForKeypress(shortcuts: any) {
  readline.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);

  process.stdin.on("keypress", (str, key) => {
    shortcuts.forEach((shortcut: any) => {
      const { ctrl, shift, name, action } = shortcut;

      if (
        (ctrl === undefined || key.ctrl === ctrl) &&
        (shift === undefined || key.shift === shift) &&
        key.name === name
      ) {
        action();
      }
    });

    if (key.ctrl && key.name === "c") {
      exitProcess();
    }
  });
}

export function exitProcess(code?: number) {
  process.stdin.setRawMode(false);
  process.exit(code);
}
