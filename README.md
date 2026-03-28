# Orbit Drop

Next.js file-sharing rooms backed by [Convex](https://convex.dev). Anyone with the repo can run it locally after Node is installed and Convex is linked.

## Prerequisites

- **Node.js 20+** (LTS recommended)
- **npm** (ships with Node; pnpm/yarn work if you prefer)
- A **Convex** account (sign up at [convex.dev](https://convex.dev))

## Clone and install

```bash
git clone <repository-url>
cd <folder-you-cloned-into>
npm install
```

## Environment variables

1. Copy the example env file and fill in the URL:

   ```bash
   cp .env.example .env.local
   ```

2. Set **`NEXT_PUBLIC_CONVEX_URL`** to your Convex deployment URL (must start with `https://`). You get this URL after running Convex (next section) or from the Convex dashboard: **Project → Settings → Deployment URL**.

## Run the app (two terminals)

Convex must be running while you develop so functions and the database stay in sync.

**Terminal 1 — Convex**

```bash
npx convex dev
```

The first time, this will open a browser to log in and will create or link a Convex project for this repo. Leave this process running.

**Terminal 2 — Next.js**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Useful scripts

| Command | Purpose |
|--------|---------|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Run production build locally |
| `npm run lint` | ESLint |
| `npx convex dev` | Convex dev sync (push functions, run queries) |
| `npm run convex:codegen` | Regenerate Convex `convex/_generated` types |

## Deploying

You deploy **two pieces**: the Convex backend (functions + database + file storage) and the Next.js frontend (UI + `/api/storage-download` for in-app file downloads).

### 1. Deploy Convex (production)

From the project root, with the same Convex project you use for dev (or a dedicated prod project):

```bash
npx convex deploy
```

- Targets your **production** deployment (Convex CLI will prompt if you have both dev and prod).
- Pushes everything under `convex/` (schema, queries, mutations, storage).

In the [Convex dashboard](https://dashboard.convex.dev), open the project → **Settings** (or **Deployments**) and copy the **production deployment URL** — it looks like `https://YOUR_DEPLOYMENT.convex.cloud`. You will use this as `NEXT_PUBLIC_CONVEX_URL` for the hosted Next.js app.

### 2. Deploy Next.js (recommended: Vercel)

1. Push your code to GitHub (or GitLab / Bitbucket).
2. In [Vercel](https://vercel.com), **Add New Project** → import that repository.
3. Framework preset: **Next.js** (default). Build command: `npm run build`, output: default.
4. Under **Environment Variables**, add:
   - **`NEXT_PUBLIC_CONVEX_URL`** = your **production** Convex URL from step 1 (must match that deployment so queries and the download proxy stay allowed).
5. Deploy. Vercel will run `npm install` and `next build` on each push to the connected branch.

Other hosts (Netlify, Railway, a VPS with Node) work too: run `npm run build` then `npm run start`, and set the same env var in their UI.

### 3. After deploy

- Open your Vercel URL and smoke-test: create/join a room, upload a file, download it.
- If downloads fail with errors, confirm **`NEXT_PUBLIC_CONVEX_URL`** on the host exactly matches the Convex deployment that serves those file URLs (same hostname as in the signed links).

### 4. Ongoing changes

- **Backend changes:** `npx convex deploy` whenever you change `convex/`.
- **Frontend changes:** push to Git; Vercel (or your CI) rebuilds automatically if connected to the repo.

## Troubleshooting

- **`NEXT_PUBLIC_CONVEX_URL is not set`:** Add it to `.env.local` and restart `npm run dev`.
- **Convex errors on first run:** Run `npx convex dev` once and complete login / project linking before relying on the UI.
