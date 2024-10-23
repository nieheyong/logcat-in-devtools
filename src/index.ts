import inspector from "inspector";
import chalk from "chalk";
import { program } from "commander";

import { checkAdbDevice, listenAdbLogCat, styleLogcatLine } from "./adb";
import {
  muteJsConsole,
  vmLog,
  appLog,
  listenForKeypress,
  exitProcess,
  stdWrite,
  stderrWrite,
} from "./stdio";
import { openInChrome } from "./utils";

const packageJson = require("../package.json");

let logPattern: RegExp | null = null;
let printDisable = false;

function processAdbLogLine(log: string) {
  if (printDisable) return;

  if (logPattern && !logPattern.test(log)) return;
  const [level, content] = styleLogcatLine(log);
  vmLog(level, content);
}

function togglePrint() {
  printDisable = !printDisable;
  const statusText = `${printDisable ? "Stopped 🔴" : "Running 🟢"}`;
  stdWrite(
    `${statusText} Press ${chalk.yellow("s")} to ${
      printDisable ? "start" : "stop"
    }\n`
  );

  // log in devtools console
  console.log(
    `[${chalk.yellow(packageJson.name)}] ${statusText} run ${chalk.blueBright(
      "togglePrint()"
    )} in console to ${printDisable ? "start" : "stop"}`
  );
}
// @ts-ignore
globalThis.togglePrint = togglePrint;

function showInspectTips() {
  const shortcutOpen = process.platform !== "win32";

  const ws = encodeURIComponent(inspector.url()?.replace("ws://", "") || "");
  const inspectUrl = `devtools://devtools/bundled/js_app.html?ws=${ws}`;

  const tips =
    `\n🎉🎉🎉 ${chalk.green("Success!")}\n\n` +
    `There are 2 methods to view log: \n` +
    `  A.${
      shortcutOpen ? ` [${chalk.yellow("Ctrl+a")}]` : ""
    } Visit ${chalk.blueBright(
      "chrome://inspect"
    )} page in Chrome and inspect Target ${chalk.yellow(
      packageJson.name
    )} to view logs\n` +
    `  B.${
      shortcutOpen ? ` [${chalk.yellow("Ctrl+b")}]` : ""
    } Open ${chalk.blueBright(
      inspectUrl
    )} in chrome view logs\n\nRunning 🟢 Press ` +
    chalk.yellow("s") +
    ` to stop print log\n\n`;

  stdWrite(tips);

  if (shortcutOpen) {
    listenForKeypress([
      {
        ctrl: true,
        name: "a",
        action: () => {
          openInChrome("chrome://inspect");
        },
      },
      {
        ctrl: true,
        name: "b",
        action: () => {
          openInChrome(inspectUrl);
        },
      },
      {
        name: "s",
        action: togglePrint,
      },
    ]);
  }
}

function run(cliOptions: CliOptions) {
  muteJsConsole();
  appLog(`${chalk.yellow(packageJson.name)}@${packageJson.version}\n `);
  checkAdbDevice(cliOptions.serial);

  if (cliOptions.match) {
    logPattern = new RegExp(cliOptions.match);
    appLog(
      `Detect match: ${chalk.yellow(cliOptions.match)}\nJavascript RegExp:`,
      logPattern
    );
  }

  if (!inspector.url()) {
    stderrWrite("Please run with --inspect flag");
    exitProcess(1);
  }

  showInspectTips();

  listenAdbLogCat({
    cleanBuffer: cliOptions.clean,
    serial: cliOptions.serial,
    onLog: processAdbLogLine,
  });
}

stdWrite("\n");
program
  .name(packageJson.name)
  .description(packageJson.description)
  .version(packageJson.version);

interface CliOptions {
  clean: boolean;
  match: string;
  serial: string;
}

program
  .option("-c, --clean", "clean logcat buffer before start")
  .option("-m, --match <RegExp>", "only print messages that match RegExp")
  .option(
    "-s, --serial <SERIAL>",
    "use device with given serial (overrides $ANDROID_SERIAL)"
  )
  .action((options: CliOptions) => {
    run(options);
  })
  .parse();
