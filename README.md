# WriteGuard AI

Premium AI writing assistant SaaS — grammar checking, rewrites, tone control, brand voice, Amazon listing optimization, and team collaboration.

## Tech Stack

- **Next.js 16** (App Router) + TypeScript
- **MySQL** (Hostinger or any MySQL 8+) via **mysql2** — no Prisma
- **Auth.js** (NextAuth v5) — email + Google OAuth
- **Stripe** — subscriptions
- **OpenAI** — AI writing tasks
- **Upstash Redis** — rate limiting (optional)
- **TipTap** — rich-text editor
- **Tailwind CSS** + shadcn/ui-style components

---

## Database Setup (MySQL on Hostinger)

### Step 1: Create MySQL database

1. Hostinger → **Databases** → **MySQL Databases**
2. Create a database and user; note host, username, password, database name

### Step 2: Import schema

1. Open **phpMyAdmin** for your database
2. Import or paste and run: `mysql/writeguard-full-setup.sql`
3. This creates all tables and seeds subscription plans

### Step 3: Configure env vars

```bash
cp .env.example .env
```

**On Hostinger**, set environment variables:

```env
DATABASE_URL=mysql://USER:PASSWORD@localhost:3306/DATABASE_NAME
# or:
MYSQL_HOST=localhost
MYSQL_USER=your_user
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=your_database

AUTH_SECRET=          # openssl rand -base64 32
AUTH_URL=https://writeguard-ai.amzdudes.io
NEXTAUTH_URL=https://writeguard-ai.amzdudes.io
NEXT_PUBLIC_APP_URL=https://writeguard-ai.amzdudes.io
AUTH_TRUST_HOST=true
OPENAI_API_KEY=
```

### Step 4: Install & run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Health checks

- App: `/api/health`
- Database: `/api/health/db`

---

## Deploy to Hostinger

| Setting | Value |
|---------|--------|
| Build command | `npm run build` |
| Start command | `npm run start` |

Add all env vars from `.env.example` in the Hostinger panel, then redeploy.

---

## Making yourself Admin

After signing up, run in phpMyAdmin:

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'your@email.com';
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run db:setup` | Reminder to import SQL schema |
