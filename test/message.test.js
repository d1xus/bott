"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { formatMessage } = require("../lib/message");

test("formats chat messages with a source", () => {
  assert.equal(
    formatMessage({ type: "chat", source_name: "Alex", message: "Hello" }),
    "Alex: Hello",
  );
});

test("forwards server messages without an empty source", () => {
  assert.equal(
    formatMessage({ type: "announcement", source_name: "", message: "Restarting" }),
    "Restarting",
  );
});

test("includes translation parameters", () => {
  assert.equal(
    formatMessage({
      type: "translation",
      message: "death.attack.generic",
      parameters: ["Alex"],
    }),
    "death.attack.generic: Alex",
  );
});

test("ignores unsupported and empty messages", () => {
  assert.equal(formatMessage({ type: "popup", message: "Hidden" }), null);
  assert.equal(formatMessage({ type: "chat", message: "  " }), null);
});
