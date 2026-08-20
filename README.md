# Minecraft Telegram Bridge

[![Tests](https://github.com/d1xus/bott/actions/workflows/tests.yml/badge.svg)](https://github.com/d1xus/bott/actions/workflows/tests.yml)

A small one-way bridge that forwards selected Minecraft Bedrock text events to
a private Telegram chat. Server addresses, usernames, chat identifiers, and bot
tokens are loaded from environment variables and are never stored in source.

## Requirements

- Node.js 20.17 or newer, or Node.js 22.9 or newer
- A reachable Minecraft Bedrock server
- A Telegram bot token from [@BotFather](https://t.me/BotFather)
- The numeric identifier of the destination Telegram chat

## Setup

```bash
git clone https://github.com/d1xus/bott.git
cd bott
npm install
cp .env.example .env
```

Edit `.env`:

```dotenv
MC_HOST=bedrock.example.com
MC_PORT=19132
MC_USERNAME=telegram-bridge
MC_OFFLINE=false
MC_VERSION=1.26.40
MC_CONNECT_TIMEOUT_MS=10000
TELEGRAM_BOT_TOKEN=replace_with_your_token
TELEGRAM_CHAT_ID=-1001234567890
```

Set `MC_VERSION` to the exact Bedrock version used by the server. Set
`MC_OFFLINE=true` only for a server configured to accept offline clients.
`MC_CONNECT_TIMEOUT_MS` controls how long the bridge waits before reconnecting.

The bridge uses the pure JavaScript RakNet backend. A local compatibility stub
prevents an upstream eager import from loading the unused native backend.
Package lifecycle scripts are disabled in `.npmrc`, so installation does not
compile or execute native code.

Start the bridge:

```bash
npm start
```

The bridge forwards `chat`, `system`, `announcement`, and `translation` text
events. Translation keys and their parameters are forwarded as plain text.
Minecraft messages are not interpreted as Telegram Markdown or HTML.

Telegram delivery is serialized, rate-limited, retried after temporary API or
network errors, and capped at 100 queued messages. Minecraft connections
run in an isolated worker process. If the protocol library exits or encounters
a low-level socket failure, the supervisor starts a fresh worker after five
seconds instead of reusing a partially closed socket.

## Security

- Never commit `.env` or paste a bot token into source code.
- Restrict the Telegram bot to the intended private chat.
- If a token is exposed, revoke it immediately with `@BotFather` and issue a
  replacement.
- Use a dedicated Minecraft account with the minimum access required.

## Development

```bash
npm test
npm run check
```

## License

MIT. See [LICENSE](LICENSE).
