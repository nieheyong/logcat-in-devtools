import { exec } from "child_process";
import { stdWrite } from "./stdio";

export function openInChrome(url: string) {
  let command;
  if (process.platform === "win32") {
    command = `start chrome "${url}"`;
  } else if (process.platform === "darwin") {
    command = `open -a "Google Chrome" "${url}"`;
  } else if (process.platform === "linux") {
    command = `google-chrome "${url}"`;
  }

  exec(command!, (err) => {
    if (err) {
      stdWrite("Failed to open URL in Chrome\n");
    }
  });
}
