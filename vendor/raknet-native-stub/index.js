"use strict";

class DisabledNativeBackend {
  constructor() {
    throw new Error("Native RakNet is disabled; use jsp-raknet");
  }
}

module.exports = {
  Client: DisabledNativeBackend,
  Server: DisabledNativeBackend,
  PacketPriority: {},
  PacketReliability: {},
};
