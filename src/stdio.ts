import readline from "readline";

export const stdWrite = process.stdout.write.bind(process.stdout);
export const stderrWrite = process.stderr.write.bind(process.stderr);

export function muteJsConsole() {
  process.stdout.write = () => true;
  process.stderr.write = () => true;
}

function restoreStdio() {
  process.stdout.write = stdWrite;
  process.stderr.write = stderrWrite;
}

export function appLog(...args: any) {
  restoreStdio();
  console.log(...args);
  muteJsConsole();
}

// @ts-ignore
const _vmLog = (type: any, ...args: any[]) => console[type](...args);

export const vmLog = eval(`(${_vmLog.toString()})`);

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
