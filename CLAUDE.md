# CLAUDE.md

## Project Overview

Personal Telegram bot running on Deno Deploy (serverless/edge). Handles personal inquiries, financial exchange rate calculations, and AI integration via Replicate.

## Tech Stack

- **Runtime**: Deno (not Node.js)
- **Language**: TypeScript
- **Bot Framework**: grammy@1.40.0
- **Hosting**: Deno Deploy (serverless webhooks)
- **Database**: Deno KV
- **AI**: Replicate API

## Commands

```bash
deno task dev        # Development with live reload (--watch)
deno task start      # Start locally
deno task test       # Run tests
deno task lint       # Lint code
deno task predeploy  # Set up webhook before deploy
```

## Project Structure

```
src/
  bot.ts              # Main bot with middleware composition
  config.ts           # Config interface + Proxy-based lazy loading
  config.local.ts     # Local dev config
  config.prod.ts      # Production config
  finance/            # Exchange rate types, math, formatting
  formatters/         # Currency formatters (RUB, USDT, LKR)
  middleware/         # Grammy middleware (auth, store, log, exchange, replicate, demo)
  replicate/          # Replicate AI API integration
  server/             # Server response utilities
  store/              # Deno KV wrapper
  util/               # Markdown formatting helpers
main.ts               # Local dev entry point (long polling)
server.ts             # Production entry point
server.deno.ts        # Webhook handler
webhook.ts            # Pre-deploy webhook registration script
```

## Key Conventions

### Code Style
- Tabs (4-width), 80-char line width
- Single quotes, no semicolons
- TypeScript strict mode
- Tests colocated with source (`*.test.ts`)

### Architecture
- **Middleware order**: log → store → auth → replicate → exchange → demo
- **Config**: Proxy pattern for lazy environment loading
- **Auth**: Whitelist-based; unauthorized users trigger root user notification
- **Webhook path**: POST to `/{{bot.token}}`

### Environment Variables (see `.env.example`)
- `BOT_TOKEN` — Telegram bot token (required)
- `ADMIN_USER_IDS` — Comma-separated Telegram user IDs
- `REPLICATE_API_TOKEN` — Replicate AI API token
- `DENO_KV_URL` / `DENO_KV_ACCESS_TOKEN` — Deno KV database
- `REPLICATE_WEBHOOK_SIGNING_SECRET` — Optional secret for verifying Replicate webhook signatures

### Deployment
- Deno Deploy org: `zeckson` / app: `zecknet`
- Frozen lock file (`deno.lock`), vendored dependencies
- Run `deno task predeploy` before deploying to update webhook URL
