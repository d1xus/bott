"use strict";

const FORWARDED_TYPES = new Set(["announcement", "chat", "system", "translation"]);

function formatMessage(packet) {
  if (!FORWARDED_TYPES.has(packet?.type) || packet.message == null) {
    return null;
  }

  const message = String(packet.message).trim();
  if (!message) {
    return null;
  }

  const parameters = Array.isArray(packet.parameters)
    ? packet.parameters.map(String).filter(Boolean)
    : [];
  const body = parameters.length ? `${message}: ${parameters.join(", ")}` : message;
  const source = String(packet.source_name || "").trim();
  return source ? `${source}: ${body}` : body;
}

module.exports = { formatMessage };
