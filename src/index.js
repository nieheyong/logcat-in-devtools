#!/usr/bin/env node --inspect
const inspector = require("inspector");
const chalk = require("chalk");
const packageJson = require("../package.json");
const { checkAdbDevice, listenAdbLogCat } = require('./adb');
const { muteStdio, vmLog, appLog, appLogError, listenForKeypress } = require("./stdio");
const { openInChrome } = require('./utils');

let logPattern = null;

function processAdbLogLine(log) {
  if (logPattern) {
    if (logPattern.test(log)) {
      vmLog("log", log);
    }
  } else {
    vmLog("log", log);
  }
}

function showInspectTips() {
  const inspectUrl = `devtools://devtools/bundled/js_app.html?ws=${encodeURIComponent(inspector.url().replace('ws://', ''))}`

  const tips = `🎉🎉🎉 ${chalk.green('Success!')}\n\nThere are 2 methods to view log: 
  A. [${chalk.yellow('Ctrl+a')}] Visit ${chalk.blue("chrome://inspect")} page in Chrome and inspect Target ${chalk.yellow(packageJson.name)} to view logs
  B. [${chalk.yellow('Ctrl+b')}] Open ${chalk.blue(inspectUrl)} in chrome view logs\n`;

  appLog(tips);

  listenForKeypress([
    {
      ctrl: true,
      name: 'a',
      action: () => {
        openInChrome('chrome://inspect');
      }
    },
    {
      ctrl: true,
      name: 'b',
      action: () => {
        openInChrome(inspectUrl);
      },
    }
  ]);
}

function run() {
  muteStdio()
  appLog(`\n${chalk.yellow(packageJson.name)}@${packageJson.version}\n `);
  checkAdbDevice();

  if (process.env.LOG_PATTERN) {
    logPattern = new RegExp(process.env.LOG_PATTERN);
    appLog(`Detect LOG_PATTERN: ${chalk.yellow(process.env.LOG_PATTERN)}\nJavascript RegExp:`, logPattern);
  }

  if (!process.features.inspector) {
    appLogError('Please run with --inspect flag');
    exitProcess(1);
  }

  showInspectTips();

  listenAdbLogCat(processAdbLogLine);
}
run();
