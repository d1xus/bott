"use strict";

const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const { once } = require("node:events");
const path = require("node:path");
const test = require("node:test");

test("supervisor survives an initial worker connection failure", { timeout: 15000 }, async () => {
  const child = spawn(process.execPath, [path.join(__dirname, "..", "index.js")], {
    env: {
      ...process.env,
      MC_HOST: "127.0.0.1",
      MC_PORT: "1",
      MC_USERNAME: "bridge-smoke-test",
      MC_OFFLINE: "true",
      MC_VERSION: "1.26.40",
      MC_CONNECT_TIMEOUT_MS: "200",
      TELEGRAM_BOT_TOKEN: "123456:test_token",
      TELEGRAM_CHAT_ID: "123456",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  let stderr = "";
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
  });

  try {
    for (let attempt = 0; attempt < 100 && !stderr.includes("Restarting"); attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    assert.equal(child.exitCode, null, stderr);
    assert.match(stderr, /Restarting in 5 seconds/);
  } finally {
    child.kill();
    await once(child, "exit");
  }
});
