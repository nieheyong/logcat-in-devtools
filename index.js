#!/usr/bin/env node --inspect
const { spawn, execSync } = require("child_process");
const chalk = require("chalk");
const packageJson = require("./package.json");

function checkAdbDevice() {
  const outputText = execSync("adb devices", { encoding: "utf8" });
  const outputLines = outputText.trim().split("\n");
  console.log(`\n$ adb devices\n${outputText.trim()}\n `);

  const devices = outputLines
    .slice(1)
    .map((line) => line.trim())
    .filter(Boolean);

  const validDevices = devices.filter((device) => !device.includes("offline"));

  if (validDevices.length === 0) {
    console.log(chalk.red("No adb device connected"));
    process.exit(1);
  }

  if (process.env.ANDROID_SERIAL) {
    console.log(`Environment Variable ${chalk.yellow('ANDROID_SERIAL')}: ${process.env.ANDROID_SERIAL}`);
    const exist = validDevices.find((device) => process.env.ANDROID_SERIAL === device.split('\t')[0]);
    if (!exist) {
      console.log(chalk.red
        (`The device with serial ${process.env.ANDROID_SERIAL} is not connected.
Please check the device serial or unset the ${chalk.yellow("ANDROID_SERIAL")} env`)
      );
      process.exit(1);
    }
  } else if (devices.length > 1) {
    console.log(
      `Multiple adb devices detected, will use the first device.\n` +
      `You can also set the ${chalk.yellow("ANDROID_SERIAL")} env to specify device`
    );
    const [firstDevice] = validDevices[0].split("\t");
    console.log(chalk.green(`Using adb device: ${firstDevice}`));
    process.env.ANDROID_SERIAL = firstDevice;
  }
}

function vmLog(type, ...args) {
  console[type](...args);
}
eval(vmLog.toString());

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
    console.error(`stderr: ${data}`);
  });

  adbProcess.on("close", (code) => {
    console.log("");
    const errorMsg = chalk.red(`adb process exited with code ${code}`);
    console.error(errorMsg);
    process.exit(1);
  });
}

function run() {
  console.log(`\n${chalk.yellow(packageJson.name)}@${packageJson.version}\n `);

  checkAdbDevice();

  if (process.env.LOG_PATTERN) {
    logPattern = new RegExp(process.env.LOG_PATTERN);
    console.log(`Detect LOG_PATTERN: ${chalk.yellow(process.env.LOG_PATTERN)}\nJavascript RegExp:`, logPattern);
  }

  if (process.features.inspector) {
    const tips = `\nTips:
    1. Visit ${chalk.blue("chrome://inspect")} page in Chrome or Edge browser
    2. Inspect ${chalk.yellow(packageJson.name)} node process to view logs
    `;
    console.log(tips);
  }

  console.log(chalk.green(" \n🚚 Waiting logs...\n "));

  listenLogCat();
}
run();
