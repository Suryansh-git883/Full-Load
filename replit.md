# Bro Code PW

Bro Code PW is a study platform for browsing courses, lectures, notes, topics, and live classes.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/edutoppers` — the Bro Code PW React/Vite study experience
- `artifacts/api-server` — upstream Physics Wallah data proxy and HLS helper
- `vercel.json` and `api/[[...path]].ts` — Vercel static hosting and serverless API entrypoint

## Architecture decisions

- The frontend calls `/api/pw/*`, so the same relative API paths work in Replit preview and Vercel.
- Vercel serves the Vite output statically and runs the existing Express API as a serverless function.

## Product

Browse available batches, explore subjects and topics, watch lectures, read notes, view schedules, and access live classes.

## User preferences

The public website name is Bro Code PW.

## Gotchas

- Vite requires `BASE_PATH` and `PORT` during builds; the Vercel build command supplies both.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
