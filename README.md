# site24

Marketing- und App-Oberfläche für [site24](https://site24.com) — [Next.js](https://nextjs.org) (App Router), `next-intl`, Auth.js, Drizzle/Postgres.

## Lokal starten

```bash
npm install
cp .env.example .env.local   # Werte eintragen
npm run dev
```

Öffnen: [http://localhost:3000](http://localhost:3000)

## Build

```bash
npm run build
npm start
```

## Deploy (Vercel + GitHub)

- Repository: **Alpify/site24**, Branch **`main`**
- **Root Directory in Vercel:** leer oder `.` — **nicht** `apps/app` (Ordner existiert im Repo nicht)
- Nach `git push` deployt Vercel automatisch, wenn das Projekt mit GitHub verbunden ist

Optional: `npm run vercel:status` / `vercel:trigger` (siehe `scripts/vercel-deploy.sh`, Env: `VERCEL_TOKEN`, `VERCEL_PROJECT_ID`).

Umgebungsvariablen: `.env.example`
