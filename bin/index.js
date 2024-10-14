#!/usr/bin/env node
const { execSync } = require("child_process");
const path = require("path");

try {
  execSync(`node --inspect ${path.join(__dirname, "../src/index.js")}`, {
    stdio: "inherit",
  });
} catch (error) { 
  process.exit(1);
}
