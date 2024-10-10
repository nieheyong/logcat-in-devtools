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

// match adb logcat output
// 10-07 20:47:49.742 25891 26835 D logMessage
const ADB_LOG_REGEX = /^([0-9-]+\s[0-9:.]+\s+\d+\s+\d+)\s+([A-Z])\s+(.*)$/;

const LogcatStyle = {
  V: {
    consoleType: "debug",
    textColor: "#BBBBBB",
    indicator: {
      textColor: "#000000",
      bgColor: "#D6D6D6",
    },
  },
  D: {
    consoleType: "debug",
    textColor: "#299999",
    indicator: {
      textColor: "#BBBBBB",
      bgColor: "#305D78",
    },
  },
  I: {
    consoleType: "info",
    textColor: "#ABC023",
    indicator: {
      textColor: "#E9F5E6",
      bgColor: "#6A8759",
    },
  },
  W: {
    consoleType: "warn",
    textColor: "#BBB529",
    indicator: {
      textColor: "#000000",
      bgColor: "#BBB529",
    },
  },
  E: {
    consoleType: "error",
    textColor: "#FF6B68",
    indicator: {
      textColor: "#000000",
      bgColor: "#CF5B56",
    },
  },
  A: {
    consoleType: "error",
    textColor: "#FF6B68",
    indicator: {
      textColor: "#FFFFFF",
      bgColor: "#8B3C3C",
    },
  },
}

const LogcatChalkStyle = new Map()
Object.entries(LogcatStyle).forEach(([level, style]) => {
  LogcatChalkStyle.set(level, {
    consoleType: style.consoleType,
    indicatorStyle: chalk.bgHex(style.indicator.bgColor).hex(style.indicator.textColor),
    textStyle: chalk.hex(style.textColor),
  })
})

const grayTime = chalk.gray;

function styleLogcatLine(logLine) {
  const match = logLine.match(ADB_LOG_REGEX);
  if (match && match.length > 3) {
    const [, info, level, message] = match;
    const style = LogcatChalkStyle.get(level);
    if (style) {
      const content = `${grayTime(info)} ${style.indicatorStyle(` ${level} `)} ${style.textStyle(message)}`;
      return [style.consoleType, content];
    }
    return ['log', logLine]
  }
  return ['log', logLine]
}


module.exports = {
  checkAdbDevice,
  styleLogcatLine,
  listenAdbLogCat
}