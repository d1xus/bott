"use strict";

require("dotenv").config({ quiet: true });

const bedrock = require("bedrock-protocol");
const { loadConfig } = require("./lib/config");
const { formatMessage } = require("./lib/message");

const CONFIGURATION_ERROR_EXIT_CODE = 78;
const MAX_PENDING_MESSAGES = 100;
const MIN_SEND_INTERVAL_MS = 1000;

let config;
try {
  config = loadConfig();
} catch (error) {
  console.error(error.message);
  process.exit(CONFIGURATION_ERROR_EXIT_CODE);
}

let pendingMessages = 0;
let telegramQueue = Promise.resolve();

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function sendToTelegram(text, attempt = 0) {
  let response;
  try {
    response = await fetch(
      `https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: config.telegramChatId,
          text: text.slice(0, 4096),
        }),
        signal: AbortSignal.timeout(10000),
      },
    );
  } catch (error) {
    if (attempt < 2) {
      await sleep(1000 * (attempt + 1));
      return sendToTelegram(text, attempt + 1);
    }
    throw error;
  }

  const result = await response.json().catch(() => ({}));
  if (response.ok && result.ok) {
    return;
  }

  if (response.status === 429 && attempt < 2) {
    const retryAfter = Number(result.parameters?.retry_after) || 1;
    await sleep(Math.min(retryAfter, 60) * 1000);
    return sendToTelegram(text, attempt + 1);
  }

  if (response.status >= 500 && attempt < 2) {
    await sleep(1000 * (attempt + 1));
    return sendToTelegram(text, attempt + 1);
  }

  throw new Error(result.description || `Telegram returned ${response.status}`);
}

async function deliverTelegramMessage(message) {
  try {
    await sendToTelegram(message);
  } catch (error) {
    console.error(`Telegram delivery failed: ${error.message}`);
  } finally {
    pendingMessages -= 1;
    await sleep(MIN_SEND_INTERVAL_MS);
  }
}

function enqueueTelegramMessage(message) {
  if (pendingMessages >= MAX_PENDING_MESSAGES) {
    console.error("Telegram queue is full; dropping a Minecraft message.");
    return;
  }

  pendingMessages += 1;
  telegramQueue = telegramQueue.then(() => deliverTelegramMessage(message));
}

process.once("uncaughtException", (error) => {
  console.error(`Bridge worker failed: ${error.message}`);
  process.exit(1);
});

process.once("unhandledRejection", (error) => {
  console.error(`Bridge worker failed: ${error?.message || error}`);
  process.exit(1);
});

process.once("SIGINT", () => process.exit(0));
process.once("SIGTERM", () => process.exit(0));

let client;
try {
  client = bedrock.createClient({
    host: config.minecraftHost,
    port: config.minecraftPort,
    username: config.minecraftUsername,
    offline: config.minecraftOffline,
    version: config.minecraftVersion,
    raknetBackend: "jsp-raknet",
    useRaknetWorkers: false,
    skipPing: true,
    connectTimeout: config.minecraftConnectTimeoutMs,
  });
} catch (error) {
  console.error(`Invalid Minecraft configuration: ${error.message}.`);
  process.exit(CONFIGURATION_ERROR_EXIT_CODE);
}

client.once("join", () => {
  console.log("Connected to the Minecraft server.");
});

client.on("text", (packet) => {
  const message = formatMessage(packet);
  if (message) {
    enqueueTelegramMessage(message);
  }
});

client.once("error", (error) => {
  console.error(`Minecraft connection error: ${error.message}.`);
  process.exit(1);
});

client.once("close", () => {
  console.error("Minecraft connection closed.");
  process.exit(1);
});
