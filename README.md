# WriteGuard AI

Premium AI writing assistant SaaS — grammar checking, rewrites, tone control, brand voice, Amazon listing optimization, and team collaboration.

## Tech Stack

- **Next.js 16** (App Router) + TypeScript
- **Supabase PostgreSQL** (database via Prisma ORM)
- **Auth.js** (NextAuth v5) — email + Google OAuth
- **Stripe** — subscriptions
- **OpenAI** — AI writing tasks
- **Upstash Redis** — rate limiting (optional)
- **TipTap** — rich-text editor
- **Tailwind CSS** + shadcn/ui-style components

---

## Supabase Setup (Database)

WriteGuard AI uses **Supabase purely as the PostgreSQL database**. Prisma connects directly to Supabase Postgres — no Supabase Auth required.

### Step 1: Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the database to provision (~2 minutes)
3. Note your project password

### Step 2: Get connection strings

In **Supabase Dashboard → Project Settings → Database → Connection string**:

| Variable | Mode | Port | Use for |
|----------|------|------|---------|
| `DATABASE_URL` | **Transaction** (pooler) | 6543 | App runtime (Vercel/serverless) |

Example `.env`:

```env
DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
```

Also add (optional, for future Supabase features):

```env
NEXT_PUBLIC_SUPABASE_URL="https://[REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
```

### Step 3: Run SQL in Supabase (recommended — no Prisma migrate needed)

Open **Supabase Dashboard → SQL Editor → New query**, paste and run:

```
supabase/writeguard-ai-full-setup.sql
```

This single file:
- Creates all 23 tables, 8 enums, indexes, and foreign keys
- Adds auto-update triggers for `updatedAt` columns
- Seeds 4 subscription plans + 15 content templates

You do **not** need `npm run db:push` if you use this SQL file.

### Step 4: Configure remaining env vars

```bash
cp .env.example .env
```

Required:

```env
AUTH_SECRET=          # openssl rand -base64 32
AUTH_URL=http://localhost:3000
OPENAI_API_KEY=       # sk-...
```

Optional: Google OAuth, Stripe, Upstash Redis, Resend email

### Step 5: Install, generate Prisma client & run

```bash
npm install
npx prisma generate   # Connects Prisma to your Supabase tables
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Features

| Module | Route | Status |
|--------|-------|--------|
| Marketing site | `/`, `/features`, `/pricing` | ✅ |
| Auth | `/login`, `/signup`, `/forgot-password` | ✅ |
| Dashboard | `/dashboard` | ✅ |
| Document editor | `/dashboard/editor/[id]` | ✅ |
| Documents library | `/dashboard/documents` | ✅ |
| Content templates | `/dashboard/templates` | ✅ |
| Brand voice | `/dashboard/brand-voice` | ✅ |
| Style guide | `/dashboard/style-guide` | ✅ |
| Amazon optimizer | `/dashboard/amazon` | ✅ |
| Naturalizer | `/dashboard/humanizer` | ✅ |
| Plagiarism check | `/dashboard/plagiarism` | ✅ |
| AI detector | `/dashboard/ai-detector` | ✅ |
| Team workspace | `/dashboard/team` | ✅ |
| Billing | `/dashboard/billing` | ✅ |
| Settings | `/dashboard/settings` | ✅ |
| Admin panel | `/admin` | ✅ |

---

## Making yourself Admin

After signing up, run in Supabase SQL Editor:

```sql
UPDATE "User" SET "role" = 'ADMIN' WHERE "email" = 'your@email.com';
```

---

## Deploy to Vercel

1. Push repo to GitHub
2. Import in Vercel
3. Add all env vars from `.env.example`
4. Use Supabase **Transaction pooler** URL for `DATABASE_URL`
5. Use Supabase **Direct** URL for `DIRECT_URL`
6. Deploy — `postinstall` runs `prisma generate` automatically

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run db:push` | Push schema via Prisma (optional — use SQL file instead) |
| `npm run db:seed` | Seed via Prisma (optional — SQL file already seeds) |
| `npm run db:studio` | Open Prisma Studio |
