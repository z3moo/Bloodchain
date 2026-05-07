# BloodChain

BloodChain is a Vue + Cloudflare Worker + Cloudflare D1 blood donation management demo.

## Cloudflare deployment

The deployed Worker now serves both parts of the app:

- `frontend/` builds to static assets served by Cloudflare Workers Static Assets.
- `worker/src/index.js` implements the `/api/*` routes directly in the Worker.
- `migrations/0001_initial.sql` creates and seeds the Cloudflare D1 database.

### 1. Create the D1 database

```bash
npx wrangler login
npm run db:create
```

Copy the `database_id` printed by Wrangler into `wrangler.jsonc`, replacing:

```json
"database_id": "00000000-0000-0000-0000-000000000000"
```

### 2. Apply migrations

```bash
npm run db:migrate:remote
```

For local Worker testing, use:

```bash
npm run db:migrate:local
npm run dev:worker
```

### 3. Deploy

```bash
npm run build
npx wrangler deploy
```

For Cloudflare's GitHub integration, keep:

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Worker config: `wrangler.jsonc`

The frontend defaults to same-origin `/api`, so no frontend API URL is needed.

## Login accounts after seeding

- Admin: `admin` / `Admin@123`
- Staff: `nhanvien01` / `Nhanvien@123`
- Hospital: `benhvien01` / `Benhvien@123`
- Donor: `nguoihien01` / `Nguoihien@123`

## Legacy local Express backend

`backend/` is kept for local SQL Server demos, but Cloudflare deployment no longer needs a separate backend host. D1 is the production database for the Worker deployment.

## Project layout

- `frontend/` - Vue/Vite app
- `worker/` - Cloudflare Worker API + static asset entry point
- `migrations/` - Cloudflare D1 schema and seed data
- `backend/` - legacy Express + SQL Server backend for local demos
- `database/` - original SQL Server schema scripts