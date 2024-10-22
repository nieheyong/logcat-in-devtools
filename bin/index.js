#!/usr/bin/env node
const { execSync } = require("child_process");
const path = require("path");

try {
  const main = path.join(__dirname, "../dist/index.js");
  const argv = process.argv.slice(2).join(' ');
  execSync(`node --inspect ${main} ${argv}`, {
    stdio: "inherit",
  });
} catch (error) {
  process.exit(1);
}
