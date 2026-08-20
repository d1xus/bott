"use strict";

require("dotenv").config({ quiet: true });

const { fork } = require("node:child_process");
const path = require("node:path");
const { loadConfig } = require("./lib/config");

const CONFIGURATION_ERROR_EXIT_CODE = 78;
const RESTART_DELAY_MS = 5000;

try {
  loadConfig();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

let child;
let restartTimer;
let stopping = false;

function startWorker() {
  child = fork(path.join(__dirname, "worker.js"), [], { stdio: "inherit" });

  child.once("exit", (code, signal) => {
    child = undefined;
    if (stopping) {
      return;
    }
    if (code === CONFIGURATION_ERROR_EXIT_CODE) {
      console.error("Bridge worker rejected the Minecraft configuration.");
      process.exitCode = 1;
      return;
    }

    const reason = signal ? `signal ${signal}` : `code ${code}`;
    console.error(
      `Bridge worker exited with ${reason}. Restarting in ${RESTART_DELAY_MS / 1000} seconds.`,
    );
    restartTimer = setTimeout(startWorker, RESTART_DELAY_MS);
  });

  child.once("error", (error) => {
    console.error(`Could not start bridge worker: ${error.message}`);
  });
}

function stop() {
  stopping = true;
  clearTimeout(restartTimer);
  child?.kill();
}

process.once("SIGINT", stop);
process.once("SIGTERM", stop);

startWorker();
