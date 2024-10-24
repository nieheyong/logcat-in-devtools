import { spawn, execSync } from "child_process";
import { exitProcess, stdWrite } from "./stdio";
import os from "os";
import chalk from "chalk";

export function checkAdbDevice(serial: string) {
  const outputText = execSync("adb devices", { encoding: "utf8" });
  const outputLines = outputText.trim().split("\n");
  stdWrite(`$ adb devices\n${outputText.trim()}\n `);

  const devices = outputLines
    .slice(1)
    .map((line) => line.trim())
    .filter(Boolean);

  const validDevices = devices.filter((device) => !device.includes("offline"));

  if (validDevices.length === 0) {
    stdWrite(chalk.red("No adb device connected\n"));
    exitProcess(1);
  }

  if (serial) {
    const exist = validDevices.find(
      (device) => serial === device.split("\t")[0]
    );
    if (!exist) {
      stdWrite(chalk.red(`The device with serial ${serial} not connected.\n`));
      exitProcess(1);
    }
  } else if (process.env.ANDROID_SERIAL) {
    stdWrite(
      `Environment Variable ${chalk.yellow("ANDROID_SERIAL")}: ${
        process.env.ANDROID_SERIAL
      }\n`
    );
    const exist = validDevices.find(
      (device) => process.env.ANDROID_SERIAL === device.split("\t")[0]
    );
    if (!exist) {
      stdWrite(
        chalk.red(`The device with serial ${
          process.env.ANDROID_SERIAL
        } is not connected.
Please check the device serial or unset the ${chalk.yellow(
          "ANDROID_SERIAL"
        )} env\n`)
      );
      exitProcess(1);
    }
  } else if (devices.length > 1) {
    stdWrite(
      `Multiple adb devices detected, will use the first device.\n` +
        `You can also use --serial <SERIAL> to specify device\n`
    );
    const [firstDevice] = validDevices[0].split("\t");
    stdWrite(chalk.green(`Using adb device: ${firstDevice}\n`));
    process.env.ANDROID_SERIAL = firstDevice;
  }
}

export function listenAdbLogCat(params: {
  onLog: (line: string) => void;
  serial: string;
  cleanBuffer: boolean;
}) {
  const { onLog, serial, cleanBuffer } = params;

  if (cleanBuffer) {
    execSync(`adb${serial ? ` -s ${serial}` : ""} logcat -c`);
  }

  const extraArgs = serial ? ["-s", serial] : [];
  const adbProcess = spawn("adb", [...extraArgs, "logcat"]);

  let leftover = "";
  adbProcess.stdout.on("data", (data) => {
    const chunk = data.toString();
    const fullChunk = leftover + chunk;
    const lines = fullChunk.split(os.EOL);
    leftover = lines.pop()!;

    lines.forEach(onLog);
  });

  adbProcess.stderr.on("data", (data) => {
    stdWrite(`stderr: ${data}`);
  });

  adbProcess.on("close", (code) => {
    const errorMsg = `\n${chalk.red(`adb process exited with code ${code}`)}\n`;
    stdWrite(errorMsg);
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
};

const LogcatChalkStyle = new Map();
Object.entries(LogcatStyle).forEach(([level, style]) => {
  LogcatChalkStyle.set(level, {
    consoleType: style.consoleType,
    indicatorStyle: chalk
      .bgHex(style.indicator.bgColor)
      .hex(style.indicator.textColor),
    textStyle: chalk.hex(style.textColor),
  });
});

const grayTime = chalk.gray;

export function styleLogcatLine(logLine: string) {
  const match = logLine.match(ADB_LOG_REGEX);
  if (match && match.length > 3) {
    const [, info, level, message] = match;
    const style = LogcatChalkStyle.get(level);
    if (style) {
      const content = `${grayTime(info)} ${style.indicatorStyle(
        ` ${level} `
      )} ${style.textStyle(message)}`;
      return [style.consoleType, content];
    }
    return ["log", logLine];
  }
  return ["log", logLine];
}
