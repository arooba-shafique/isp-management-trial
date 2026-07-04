---
name: ISP Portal DB lib rebuild
description: After changing the @workspace/db schema, stale declarations cause api-server typecheck to report false "no exported member" errors
---

After any change to `lib/db/src/schema/` or `lib/db/src/index.ts`, run:

```
pnpm run typecheck:libs
```

before running `pnpm --filter @workspace/api-server run typecheck`.

**Why:** `@workspace/db` is a composite lib that emits declarations. If the `.d.ts` files are stale, the api-server sees the old shape and reports phantom errors like `Module '@workspace/db' has no exported member 'usersTable'` even though the export exists in the source.

**How to apply:** Any session that touches the DB schema should start with `pnpm run typecheck:libs`.
