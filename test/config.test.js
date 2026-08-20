"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { loadConfig } = require("../lib/config");

const VALID_ENV = {
  MC_HOST: "example.test",
  MC_PORT: "19132",
  MC_USERNAME: "bridge-bot",
  MC_OFFLINE: "true",
  MC_VERSION: "1.26.40",
  TELEGRAM_BOT_TOKEN: "123456:example_token",
  TELEGRAM_CHAT_ID: "-1001234567890",
};

test("loads and normalizes valid configuration", () => {
  const config = loadConfig(VALID_ENV);

  assert.equal(config.minecraftPort, 19132);
  assert.equal(config.minecraftOffline, true);
  assert.equal(config.minecraftVersion, "1.26.40");
  assert.equal(config.minecraftConnectTimeoutMs, 10000);
});

test("rejects missing secrets", () => {
  const env = { ...VALID_ENV };
  delete env.TELEGRAM_BOT_TOKEN;

  assert.throws(
    () => loadConfig(env),
    /Missing required environment variable: TELEGRAM_BOT_TOKEN/,
  );
});

test("rejects invalid ports and chat identifiers", () => {
  assert.throws(
    () => loadConfig({ ...VALID_ENV, MC_PORT: "70000" }),
    /MC_PORT must be an integer/,
  );
  assert.throws(
    () => loadConfig({ ...VALID_ENV, TELEGRAM_CHAT_ID: "channel" }),
    /TELEGRAM_CHAT_ID must be numeric/,
  );
});

test("rejects invalid boolean values", () => {
  assert.throws(
    () => loadConfig({ ...VALID_ENV, MC_OFFLINE: "treu" }),
    /MC_OFFLINE must be true or false/,
  );
});

test("rejects invalid connection timeouts", () => {
  assert.throws(
    () => loadConfig({ ...VALID_ENV, MC_CONNECT_TIMEOUT_MS: "10" }),
    /MC_CONNECT_TIMEOUT_MS must be between 100 and 60000/,
  );
});
