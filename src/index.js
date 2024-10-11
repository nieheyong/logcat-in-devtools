#!/usr/bin/env node --inspect
const inspector = require("inspector");
const chalk = require("chalk");
const { program } = require('commander');

const packageJson = require("../package.json");
const { checkAdbDevice, listenAdbLogCat, styleLogcatLine } = require('./adb');
const { muteStdio, vmLog, appLog, appLogError, listenForKeypress } = require("./stdio");
const { openInChrome } = require('./utils');

let logPattern = null;

function processAdbLogLine(log) {
  if (logPattern && !logPattern.test(log)) return
  const [level, content] = styleLogcatLine(log);
  vmLog(level, content);
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

function run(cliOptions) {
  muteStdio()
  appLog(`\n${chalk.yellow(packageJson.name)}@${packageJson.version}\n `);
  checkAdbDevice(cliOptions.serial);

  if (cliOptions.match) {
    logPattern = new RegExp(cliOptions.match);
    appLog(`Detect match: ${chalk.yellow(cliOptions.match)}\nJavascript RegExp:`, logPattern);
  }

  if (!process.features.inspector) {
    appLogError('Please run with --inspect flag');
    exitProcess(1);
  }

  showInspectTips();

  listenAdbLogCat({
    serial: cliOptions.serial,
    onLog: processAdbLogLine
  });
}


console.log('')
program
  .name(packageJson.name)
  .description(packageJson.description)
  .version(packageJson.version);

program
  .option('-m, --match <RegExp>', 'only print messages that match RegExp')
  .option('-s, --serial <SERIAL>', 'use device with given serial (overrides $ANDROID_SERIAL)')
  .action((options) => {
    run(options);
  }).parse();
