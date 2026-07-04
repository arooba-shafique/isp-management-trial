# NetLink ISP Management Portal

A full-stack ISP management web application for NetLink ISP (Sahiwal, Pakistan) serving 200+ customers. Separate admin and customer portals with phone-based OTP authentication.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages (run `pnpm run typecheck:libs` first if DB schema changed)
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — JWT signing key

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM (lib/db)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec at `lib/api-spec/openapi.yaml`)
- Frontend: React + Vite + Tailwind CSS + shadcn/ui + wouter router
- Charts: Recharts
- Auth: JWT (Bearer tokens in localStorage `isp_token`), phone + OTP flow

## Where things live

- `artifacts/api-server/src/routes/` — all API route handlers
- `artifacts/api-server/src/lib/auth.ts` — JWT sign/verify + bcrypt helpers
- `artifacts/api-server/src/lib/notifications.ts` — mock SMS/WhatsApp sender
- `artifacts/api-server/src/middlewares/auth.ts` — requireAuth + requireAdmin middleware
- `artifacts/isp-portal/src/pages/` — frontend pages (customer/ and admin/ subdirs)
- `artifacts/isp-portal/src/components/layouts/` — AdminLayout + CustomerLayout sidebars
- `artifacts/isp-portal/src/contexts/AuthContext.tsx` — auth state management
- `artifacts/isp-portal/src/lib/auth.ts` — localStorage token helper + sets up customFetch bearer
- `lib/db/src/schema/` — Drizzle ORM table definitions (users, otp_codes, packages, subscriptions, payments, complaints, announcements)
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for types)
- `lib/api-client-react/src/generated/api.ts` — auto-generated React Query hooks

## Architecture decisions

- Phone-only auth via OTP (no passwords required for login). Passwords only used for "claim account" flow (admin-created customers who set their password on first login).
- Admin user: phone `03000000000`. Role is stored in DB and JWT payload. Both admin and customers use same OTP login flow; role in JWT determines which portal to show.
- Notifications are mock (console logs). Replace `artifacts/api-server/src/lib/notifications.ts` with real Twilio/etc. to go live.
- The `subscriptions.endDate` column drives expiry logic — dashboard and notification scheduler use it.
- All monetary amounts stored as `numeric` (string in DB, converted to `Number()` in route responses).

## Product

- **Admin Portal**: Dashboard with charts (package distribution, expiring soon, overdue), customer management with bulk CSV import, package CRUD, subscription management, payment verification (approve/reject with admin notes), complaint triage, bulk announcements with zone filtering.
- **Customer Portal**: View subscription status, browse & subscribe to packages, submit payment proofs, file complaints/support tickets.
- **Auth Flow**: Send OTP → enter code → auto-register (new users) or login (existing) → admin-imported users go through "claim account" flow to set password.

## Seeded test data

- Admin: phone `03000000000`, OTP login (any OTP returned by the send-otp endpoint)
- 5 packages: Basic 3Mbps (Rs.1200), Standard 10Mbps (Rs.2000), Pro 20Mbps (Rs.3000), Business 50Mbps (Rs.7500), Economy 2Mbps Quarterly (Rs.3000)
- 3 sample customers (pending-claim status): 03001111111, 03002222222, 03003333333

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After changing DB schema, run `pnpm run typecheck:libs` before checking the api-server — otherwise TS sees stale declarations and reports phantom "no exported member" errors.
- The `setAuthTokenGetter` import must come from `@workspace/api-client-react` (re-exported), not the deep path.
- `useListSubscriptions`, `useListPayments`, `useListComplaints` hooks take params as **first arg** and `{ query: ... }` options as **second arg** — not combined into one object.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
