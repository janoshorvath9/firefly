# Firefly

Nightlife discovery platform for Bucharest — backend-first Next.js + Supabase architecture.

## Setup

1. `npm run dev` — works immediately with **mock data** (Supabase disabled)
2. When your database is ready:
   - Set `SUPABASE_ENABLED = true` in [`lib/supabase/config.ts`](lib/supabase/config.ts)
   - Uncomment Supabase env vars in `.env.local` (see `.env.example`)
   - Uncomment auth block in [`middleware.ts`](middleware.ts)
   - Run migrations: `supabase db push`
   - Run seed: `supabase db seed` (optional)

## Architecture

- **UI** — you implement all screens in `components/` and page shells in `app/[locale]/`
- **Backend** — Server Actions in `lib/actions/`, queries in `lib/queries/`
- **Types** — shared contracts in `types/`

## Key integrations

- Supabase (Auth, Postgres, Storage, RLS)
- Stripe (B2B promotions)
- Resend (email notifications)
- Mapbox (client-side — use `getEventsGeoJSON()` data)

## Routes

| Route | Access |
|-------|--------|
| `/[locale]/map` | Public |
| `/[locale]/feed` | Public |
| `/[locale]/saved` | Auth |
| `/[locale]/business/*` | Business |
| `/[locale]/admin/*` | Admin |
