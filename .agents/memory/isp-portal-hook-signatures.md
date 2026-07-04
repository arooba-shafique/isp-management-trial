---
name: ISP Portal generated hook signatures
description: Orval-generated query hooks with optional params take params first, query options second — not merged into one object
---

For hooks generated from endpoints that accept query params (e.g. `listSubscriptions`, `listPayments`, `listComplaints`):

```ts
// CORRECT
useListSubscriptions(undefined, { query: { queryKey: [...] } });
useListSubscriptions({ status: "active" }, { query: { queryKey: [...] } });

// WRONG — causes TS2353 "query does not exist in type ListSubscriptionsParams"
useListSubscriptions({ query: { queryKey: [...] } });
```

**Why:** Orval generates `(params?: Params, options?: { query?: ... })` — the first arg is always the API params object, never the React Query options.

**How to apply:** Whenever using a list hook that has filter params in the OpenAPI spec.
