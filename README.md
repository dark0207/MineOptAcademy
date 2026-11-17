# MineOpt Academy

A tutorial website for MineOpt: one page per feature with a description, step-by-step guide and a video.
Learners browse and track progress; administrators manage everything from an admin console.

Built with **Next.js 16 (App Router) + TypeScript**, Prisma + SQLite, and a hand-written CSS design system
(dark and light themes, responsive). No external services or CDNs are needed.

## Quick start

```bash
npm install
cp .env.example .env     # then edit it: set AUTH_SECRET, ADMIN_EMAIL and ADMIN_PASSWORD
npm run setup            # generates the Prisma client, creates the database, seeds the admin + starter content
npm run dev              # http://localhost:3000
```

Sign in with the `ADMIN_EMAIL` / `ADMIN_PASSWORD` from your `.env`, then invite your team (self sign-up is on by
default, or create accounts under **Admin → Users**). Generate a secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

> **Important:** keep this project in a folder path that does not contain `#` (for example not `C:\Projects\C#\...`).
> Next.js builds asset URLs from file paths and everything after a `#` is treated as a URL fragment, which breaks the build.

## What is in it

**Learners**

- Home page with modules, featured tutorials and live stats
- Tutorial library with search, module and level filters
- Tutorial page: video player (uploaded file, YouTube, Vimeo or direct link), description, numbered steps,
  module playlist, previous / next, "mark as complete"
- "My learning" page with overall progress, progress per module and what to watch next
- Dark / light theme, keyboard accessible, works on phones

**Administrators** (`/admin`)

- Dashboard: tutorial and learner counts, views, most viewed, tutorials that still need a video
- Tutorials: create / edit / delete, publish or keep as draft, feature on the home page, order, level, duration
- Markdown editor for the description and steps with a live preview
- Video: drag-and-drop upload with a progress bar and cancel, or paste a YouTube / Vimeo / `.mp4` link; thumbnails
- Modules: name, tagline, icon, colour, order
- Users: create accounts, promote to administrator, disable or re-enable accounts (you can not change your own
  account, and the last administrator can not be removed)

## Configuration (`.env`)

| Variable | Meaning |
| --- | --- |
| `DATABASE_URL` | SQLite file, relative to `prisma/` (default `file:./academy.db`) |
| `AUTH_SECRET` | Signs session cookies. **Required**, at least 32 characters |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | First administrator, created by `npm run db:seed` if missing |
| `STORAGE_DIR` | Where uploaded videos and thumbnails are stored (default `./storage`) |
| `PUBLIC_LIBRARY` | `true` lets anyone watch without signing in; default `false` (sign-in required) |
| `ALLOW_REGISTRATION` | `false` closes self sign-up, so only administrators can create accounts (Admin → Users) |
| `MAX_VIDEO_MB` | Largest accepted video upload (default 2048) |

## Adding content

1. Sign in as an administrator and open **Admin → Tutorials → New tutorial**.
2. Fill in the title, summary, description and steps, choose the module, and save.
3. Add the video: upload a file (`.mp4`, `.webm`, `.m4v`, `.ogv`) or paste a link, and add a thumbnail.
4. Tick **Published** when it is ready.

The starter content (6 modules, 35 tutorials) follows MineOpt's menus and pages. It is a first draft written from the
application's structure, so review and edit the wording against the real behaviour of each feature.

Use H.264 (`.mp4`) for the widest browser support. Uploaded videos are streamed with HTTP range support, so seeking works.

## Production

```bash
npm run build
npm run start            # set PORT to change the port
```

- Put it behind HTTPS (Nginx, IIS / ARR, Caddy ...). Session cookies are marked `Secure` in production.
- For large uploads raise the proxy limits, for example Nginx `client_max_body_size 2g;` and a long `proxy_read_timeout`.
- **Back up** `prisma/academy.db` and the `STORAGE_DIR` folder. They hold all users, progress and videos.
- Run a single instance. Sign-in throttling is kept in memory per process, and SQLite is a single-writer database.
  To scale out, switch Prisma to Postgres and move uploads to shared storage.
- The schema is applied with `prisma db push`. For a long-lived production database, switch to `prisma migrate`.

## Security notes

- Passwords are hashed with bcrypt; sessions are signed, `httpOnly`, `SameSite=Lax` cookies.
- Role and disabled state are re-read from the database on every request, so demoting or disabling a user is immediate.
- Every admin action and API route re-checks the administrator role; upload requests also check the `Origin` header.
- Markdown is rendered without raw HTML, so content can not inject script.
- Uploaded files get generated names, are type- and size-checked, and are only served through authenticated routes.
  Draft videos are visible to administrators only.

## Project layout

```
app/                 pages, server actions (app/actions) and API routes (app/api)
  admin/             admin console
  library/           browse + watch pages
  learning/          learner progress
components/          UI building blocks (admin/ holds the editors)
lib/                 auth, database, storage, validation, queries, helpers
prisma/              schema and seed script
```
## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm run start` | Production build / server |
| `npm run setup` | Generate client, create database, seed |
| `npm run db:seed` | Add the admin and starter content that is missing (never overwrites edits) |
| `npm run typecheck`, `npm run lint` | Static checks |

