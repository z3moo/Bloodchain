# BloodChain

BloodChain is a Vue + Cloudflare Worker + Cloudflare D1 blood donation management demo.

## Cloudflare deployment

The deployed Worker now serves both parts of the app:

- `frontend/` builds to static assets served by Cloudflare Workers Static Assets.
- `worker/src/index.js` implements the `/api/*` routes directly in the Worker.
- `migrations/0001_initial.sql` creates and seeds the Cloudflare D1 database.

### 1. D1 database

This repo is configured for the Cloudflare D1 database:

```txt
name: bloodchain_db
id: ffef7db8-85e4-45f9-b447-dac580b0edce
```

If you need to recreate it later:

```bash
npx wrangler login
npm run db:create
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
npm run deploy:worker
```

For Cloudflare's GitHub integration, use:

- Build command: `npm run build`
- Deploy command: `npm run deploy:cloudflare`
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