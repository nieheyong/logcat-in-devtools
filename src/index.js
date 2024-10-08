#!/usr/bin/env node --inspect
const { spawn } = require("child_process");
const inspector = require("inspector");
const chalk = require("chalk");
const packageJson = require("../package.json");
const { checkAdbDevice } = require('./utils');
const { muteStdio, vmLog, appLog, appLogError } = require("./stdio");

let logPattern = null;

function listenLogCat() {
  const adbProcess = spawn("adb", ["logcat"]);

  let leftover = "";
  adbProcess.stdout.on("data", (data) => {
    const chunk = data.toString();
    const fullChunk = leftover + chunk;
    const lines = fullChunk.split("\n");
    leftover = lines.pop();

    lines.forEach((log) => {
      if (logPattern) {
        if (logPattern.test(log)) {
          vmLog("log", log);
        }
      } else {
        vmLog("log", log);
      }
    });
  });

  adbProcess.stderr.on("data", (data) => {
    appLogError(`stderr: ${data}`);
  });

  adbProcess.on("close", (code) => {
    const errorMsg = chalk.red(`\nadb process exited with code ${code}`);
    appLogError(errorMsg);
    process.exit(1);
  });
}

function run() {
  muteStdio();
  appLog(`\n${chalk.yellow(packageJson.name)}@${packageJson.version}\n `);

  checkAdbDevice();

  if (process.env.LOG_PATTERN) {
    logPattern = new RegExp(process.env.LOG_PATTERN);
    appLog(`Detect LOG_PATTERN: ${chalk.yellow(process.env.LOG_PATTERN)}\nJavascript RegExp:`, logPattern);
  }

  if (process.features.inspector) {
    const tips = `🎉🎉🎉 ${chalk.green('Success!')}\n\nThere are 2 methods to see log: 
    1. ${chalk.green('[Recommended]')} Visit ${chalk.blue("chrome://inspect")} page in Chrome and inspect Target ${chalk.yellow(packageJson.name)} to view logs
    2. Open ${chalk.blue(`devtools://devtools/bundled/js_app.html?ws=${encodeURIComponent(inspector.url().replace('ws://', ''))}`)} in chrome view logs
    `;
    appLog(tips);
  }

  listenLogCat();
}
run();
