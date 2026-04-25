# bot.zeckson.com
My personal bot to handle personal inquiries.

# Working with the project
1. To install dependencies use:
```shell
deno add jsr:@luca/cases@1.0.0
```
2. To reload all dependencies locally:
```shell
deno install --reload --lock
```
3. Run application:
```shell
deno task start
```
4. Test application:
```shell
deno task test
```
5. Lint application:
```shell
deno task lint
```

# Bot Features
- **Topics Support**: Bot can now handle Telegram Forum Topics, responding specifically within threads and providing a `/topic` command.
