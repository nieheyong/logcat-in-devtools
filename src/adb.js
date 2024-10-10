const { spawn, execSync } = require("child_process");
const { appLog, appLogError, exitProcess } = require('./stdio');
const chalk = require("chalk");

function checkAdbDevice() {
  const outputText = execSync("adb devices", { encoding: "utf8" });
  const outputLines = outputText.trim().split("\n");
  appLog(`\n$ adb devices\n${outputText.trim()}\n `);

  const devices = outputLines
    .slice(1)
    .map((line) => line.trim())
    .filter(Boolean);

  const validDevices = devices.filter((device) => !device.includes("offline"));

  if (validDevices.length === 0) {
    appLog(chalk.red("No adb device connected"));
    exitProcess(1);
  }

  if (process.env.ANDROID_SERIAL) {
    appLog(`Environment Variable ${chalk.yellow('ANDROID_SERIAL')}: ${process.env.ANDROID_SERIAL}`);
    const exist = validDevices.find((device) => process.env.ANDROID_SERIAL === device.split('\t')[0]);
    if (!exist) {
      appLog(chalk.red
        (`The device with serial ${process.env.ANDROID_SERIAL} is not connected.
Please check the device serial or unset the ${chalk.yellow("ANDROID_SERIAL")} env`)
      );
      exitProcess(1);
    }
  } else if (devices.length > 1) {
    appLog(
      `Multiple adb devices detected, will use the first device.\n` +
      `You can also set the ${chalk.yellow("ANDROID_SERIAL")} env to specify device`
    );
    const [firstDevice] = validDevices[0].split("\t");
    appLog(chalk.green(`Using adb device: ${firstDevice}`));
    process.env.ANDROID_SERIAL = firstDevice;
  }
}

function listenAdbLogCat(onLogCallback) {
  // clear logcat buffer
  execSync("adb logcat -c");

  const adbProcess = spawn("adb", ["logcat"]);

  let leftover = "";
  adbProcess.stdout.on("data", (data) => {
    const chunk = data.toString();
    const fullChunk = leftover + chunk;
    const lines = fullChunk.split("\n");
    leftover = lines.pop();

    lines.forEach(onLogCallback);
  });

  adbProcess.stderr.on("data", (data) => {
    appLogError(`stderr: ${data}`);
  });

  adbProcess.on("close", (code) => {
    const errorMsg = `\n${chalk.red(`adb process exited with code ${code}`)}\n`;
    appLogError(errorMsg);
    exitProcess(1);
  });
}


module.exports = {
  checkAdbDevice,
  listenAdbLogCat
}