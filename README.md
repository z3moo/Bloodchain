# BloodChain

BloodChain is a Vue + Express + SQL Server blood donation management demo.

## Local development

Backend:

```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## Cloudflare Worker deployment

This repository includes a Cloudflare Worker wrapper that serves the built Vue app from Worker static assets and proxies `/api/*` to the existing Express backend.

> Important: the current Express backend uses `mssql`/`msnodesqlv8` and a SQL Server database. That backend cannot run directly inside a Cloudflare Worker. Host the backend somewhere that can reach SQL Server, then set the Worker variable `BACKEND_ORIGIN` to that backend origin.

Build and deploy with Wrangler:

```bash
npm run build
npx wrangler secret put BACKEND_ORIGIN
npx wrangler deploy
```

For Cloudflare's GitHub integration, use:

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Worker config: `wrangler.jsonc`

The frontend defaults to same-origin `/api`, so no extra frontend environment variable is required when served by the Worker.

## Project layout

- `frontend/` - Vue/Vite app
- `backend/` - Express API connected to SQL Server
- `database/` - SQL Server schema and auth scripts
- `worker/` - Cloudflare Worker entry point for static assets + API proxy
