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

<!-- jbcontext-instructions-start -->
# Tools

## Semantic Code Search (jbcontext)

You have access to `jbcontext search` for searching the codebase semantically.
Use the `/context-search` skill or run `jbcontext search "<query>"` to find code by meaning, not just keywords.

### Query Tips

- Be descriptive: "Where is a function that validates user email addresses" > "email"
- Include context: "Find error handling middleware for HTTP requests with logging"
- Specify what you're looking for: "React component that renders a modal dialog"

### When to use

`jbcontext search` is a **code-discovery** tool. Reach for it only when a task requires finding or understanding code whose location you don't already know.

Skip it — go straight to the right tool — when:
- the task names the exact file, class, or symbol (keyword grep is faster);
- the relevant file is already open or identified;
- the task doesn't involve locating code at all — git operations (rebase, merge, commit), running tests or builds, shell/statusline/config setup, or reviewing a diff you already have.

### How to use it
- Start with `jbcontext search` before planning, editing, or exact search in unfamiliar code when you do not yet know the right file, subsystem, implementation, or related test.
- Use one focused natural-language query per search.
- Do not start with grep, ripgrep, or find when the search problem is still semantic or exploratory.
- Inspect the first relevant file or directory before issuing another broad semantic search.
- Use another broad `jbcontext search` only if the local path stops being productive.
- Once you know the relevant file, symbol, or directory, switch to direct file reads or exact search for local inspection.
- If you search again after finding a relevant area, narrow with `-p <path>`.

<!-- jbcontext-instructions-end -->