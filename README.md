# Personal blog

Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · Supabase (Postgres, Storage, Auth) · Vercel.

Uzbek-language writer's blog with an English admin panel at `/admin`.

---

## 1. Set up Supabase (once)

1. **Run the migration.** Supabase dashboard → **SQL Editor** → New query → paste the contents of
   [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) → **Run**.
   This creates the tables, Row Level Security policies, the view-counter function, the public
   `images` storage bucket, and the starting categories (Copywriting, Meta Ads). It is safe to run again.

2. **Allow your email in the database.** In the SQL Editor run (with your email, lowercase):

   ```sql
   insert into public.admins (email) values ('you@example.com');
   ```

   The app checks `ADMIN_EMAIL`; the database checks this table. Both must match, so even a leaked
   anon key can't write anything.

3. **Turn off public sign-ups.** Authentication → **Sign In / Providers** → turn off
   **Allow new users to sign up**.

4. **Create your admin user.** Authentication → **Users** → **Add user** → **Create new user** →
   enter the same email and a strong password, and tick **Auto Confirm User**.

5. **Environment variables** (already in Vercel; copy them to `.env.local` for local work):

   | Name | Where to find it |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Project Settings → API → Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings → API → `anon` public key |
   | `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API → `service_role` key (server only, never `NEXT_PUBLIC_`) |
   | `ADMIN_EMAIL` | Your email (comma-separate to allow more than one) |
   | `NEXT_PUBLIC_SITE_URL` | *Optional.* Set it once you have a custom domain. On Vercel the production URL is detected automatically. |

Then log in at **`/admin`**.

## 2. Run locally

```bash
npm install
```

```bash
cp .env.example .env.local
```

Fill in `.env.local` with the values above, then:

```bash
npm run dev
```

Open http://localhost:3000. Other scripts: `npm run build`, `npm run lint`, `npm run typecheck`.

## 3. Deploy

Push to the branch connected to the Vercel project. No extra configuration is needed.

---

## Make it yours

- **Name, role, intro, description:** `src/lib/site.ts`
- **About page text:** `src/app/(site)/about/page.tsx`
- **Colours and fonts:** `src/app/globals.css` (CSS variables for light and dark) and `src/app/layout.tsx`
- **Header links:** `src/components/site/header.tsx`

## How things work

**Writing**
- **+ New post** creates a draft and opens the editor. Drafts **autosave** 2 s after you stop typing.
  `Ctrl/Cmd+S` saves straight away.
- Published posts **don't autosave**, so half-finished edits never go live. Press **Update**
  to publish your changes.
- **Preview** shows the draft in the real post layout. Only you can open it.
- A publish date in the future schedules the post. It goes live within about 10 minutes of that time.
- Images (cover and inline: toolbar button, paste or drag-and-drop) are resized to max 2000 px and
  converted to WebP in the browser before upload.
- The slug follows the title until you edit it, or until the post is published.
  After that it stays fixed, so links never break.

**Views**
- Counted once per visitor per post per 24 h. A cookie scoped to `/api/views` handles this.
- Bots, link previews and your own visits while logged in are skipped.
- The browser calls `/api/views`. That route calls the `increment_post_view()` Postgres function with
  the service role. The function can't be called with the public key, and nobody can update
  `view_count` through the API.
- Pages are cached, so displayed counts can lag by up to about 10 minutes.

**Caching and SEO**
- Public pages are server-rendered and cached. Publishing, editing or deleting refreshes them right away.
- Per-post title and description fall back to the post title and excerpt.
- The Open Graph image is the cover, or a generated text card at `/og`.
- Also included: JSON-LD, `sitemap.xml`, `robots.txt`, and an RSS feed at `/rss.xml`.

**Security**
- Post HTML is sanitized on save and again on render.
- RLS: the public can read only published posts (with a publish date that has passed) and categories.
  Only the admin can write.
- Storage: public read, admin-only upload and delete.

## Project structure

```
supabase/migrations/0001_init.sql   database schema, RLS, storage
src/
  app/
    (site)/            public pages: /, /blog, /blog/[slug], /about
    admin/             login + protected admin panel (posts, editor, preview, categories)
    api/views/         view counter endpoint
    og/                generated Open Graph images
    rss.xml/ sitemap.ts robots.ts
  components/site/     public UI
  components/admin/    editor, uploads, admin UI
  lib/                 Supabase clients, data access, auth, sanitizer, helpers
  middleware.ts        guards /admin/*
```

**Adding a section later** (e.g. `/products`): create `src/app/(site)/products/page.tsx`. It
automatically gets the site header, footer and theme. Then add a link in `header.tsx` and a new
migration such as `supabase/migrations/0002_products.sql`.
