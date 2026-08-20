"use strict";

function required(env, name) {
  const value = env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function parseBoolean(value) {
  const normalized = value.toLowerCase();
  if (["1", "true", "yes"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no"].includes(normalized)) {
    return false;
  }
  throw new Error("MC_OFFLINE must be true or false");
}

function loadConfig(env = process.env) {
  const minecraftPort = Number(required(env, "MC_PORT"));
  if (!Number.isInteger(minecraftPort) || minecraftPort < 1 || minecraftPort > 65535) {
    throw new Error("MC_PORT must be an integer between 1 and 65535");
  }

  const telegramBotToken = required(env, "TELEGRAM_BOT_TOKEN");
  if (!/^\d+:[A-Za-z0-9_-]+$/.test(telegramBotToken)) {
    throw new Error("TELEGRAM_BOT_TOKEN has an invalid format");
  }

  const telegramChatId = required(env, "TELEGRAM_CHAT_ID");
  if (!/^-?\d+$/.test(telegramChatId)) {
    throw new Error("TELEGRAM_CHAT_ID must be numeric");
  }

  return Object.freeze({
    minecraftHost: required(env, "MC_HOST"),
    minecraftPort,
    minecraftUsername: required(env, "MC_USERNAME"),
    minecraftOffline: parseBoolean(env.MC_OFFLINE || "false"),
    minecraftVersion: required(env, "MC_VERSION"),
    minecraftConnectTimeoutMs: (() => {
      const value = Number(env.MC_CONNECT_TIMEOUT_MS || "10000");
      if (!Number.isInteger(value) || value < 100 || value > 60000) {
        throw new Error("MC_CONNECT_TIMEOUT_MS must be between 100 and 60000");
      }
      return value;
    })(),
    telegramBotToken,
    telegramChatId,
  });
}

module.exports = { loadConfig };
