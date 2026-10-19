import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);

function readHidden(prompt) {
  if (!process.stdin.isTTY || !process.stdin.setRawMode) {
    const password = process.env.ADMIN_PASSWORD_INPUT;
    if (!password) throw new Error("Use an interactive terminal or ADMIN_PASSWORD_INPUT.");
    return Promise.resolve(password);
  }

  return new Promise((resolve, reject) => {
    let value = "";
    process.stdout.write(prompt);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding("utf8");
    const onData = (key) => {
      if (key === "\u0003") {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        reject(new Error("Cancelled"));
        return;
      }
      if (key === "\r" || key === "\n") {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdin.removeListener("data", onData);
        process.stdout.write("\n");
        resolve(value);
        return;
      }
      if (key === "\u007f" || key === "\b") {
        value = value.slice(0, -1);
        return;
      }
      value += key;
    };
    process.stdin.on("data", onData);
  });
}

const password = await readHidden("Admin password: ");
if (password.length < 14) throw new Error("Use at least 14 characters.");
const confirmation = await readHidden("Confirm password: ");
if (password !== confirmation) throw new Error("Passwords do not match.");

const salt = randomBytes(16);
const hash = await scrypt(password, salt, 64);
// Use colons because Next.js expands unescaped "$..." sequences in .env files.
process.stdout.write(`\nADMIN_PASSWORD_HASH=scrypt:${salt.toString("base64url")}:${hash.toString("base64url")}\n`);
