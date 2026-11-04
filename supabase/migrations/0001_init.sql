-- =====================================================================
-- Blog schema: categories, posts, admin allowlist, view counter,
-- row level security and the "images" storage bucket.
-- Run once in Supabase → SQL Editor (or `supabase db push`).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Admin allowlist (database side).
-- The app checks ADMIN_EMAIL; the database checks this table.
-- Add your email after running this file:
--   insert into public.admins (email) values ('you@example.com');
-- ---------------------------------------------------------------------
create table if not exists public.admins (
  email text primary key check (email = lower(email))
);

alter table public.admins enable row level security;
-- No policies on purpose: nobody can read or change this table through the API.
revoke all on public.admins from anon, authenticated;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admins a
    where a.email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 60),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Posts
-- ---------------------------------------------------------------------
create table if not exists public.posts (
  id                uuid primary key default gen_random_uuid(),
  title             text not null default '' check (char_length(title) <= 200),
  slug              text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  excerpt           text not null default '' check (char_length(excerpt) <= 500),
  content_html      text not null default '',
  content_json      jsonb,
  cover_url         text,
  cover_alt         text not null default '',
  category_id       uuid references public.categories (id) on delete set null,
  meta_title        text check (char_length(meta_title) <= 200),
  meta_description  text check (char_length(meta_description) <= 300),
  status            text not null default 'draft' check (status in ('draft', 'published')),
  published_at      timestamptz,
  reading_minutes   integer not null default 1 check (reading_minutes >= 1),
  view_count        integer not null default 0 check (view_count >= 0),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint published_needs_date check (status = 'draft' or published_at is not null)
);

create index if not exists posts_published_idx
  on public.posts (published_at desc) where status = 'published';
create index if not exists posts_category_idx on public.posts (category_id);
create index if not exists posts_views_idx
  on public.posts (view_count desc) where status = 'published';

drop trigger if exists posts_set_updated_at on public.posts;
create trigger posts_set_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------
alter table public.categories enable row level security;
alter table public.posts enable row level security;

grant select on public.categories, public.posts to anon, authenticated;
grant insert, update, delete on public.categories, public.posts to authenticated;

drop policy if exists "categories are public" on public.categories;
create policy "categories are public"
  on public.categories for select
  to anon, authenticated
  using (true);

drop policy if exists "admin manages categories" on public.categories;
create policy "admin manages categories"
  on public.categories for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "published posts are public" on public.posts;
create policy "published posts are public"
  on public.posts for select
  to anon, authenticated
  using (status = 'published' and published_at <= now());

drop policy if exists "admin reads all posts" on public.posts;
create policy "admin reads all posts"
  on public.posts for select
  to authenticated
  using (public.is_admin());

drop policy if exists "admin inserts posts" on public.posts;
create policy "admin inserts posts"
  on public.posts for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "admin updates posts" on public.posts;
create policy "admin updates posts"
  on public.posts for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admin deletes posts" on public.posts;
create policy "admin deletes posts"
  on public.posts for delete
  to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------
-- View counter.
-- Only the server (service role) may call this. The browser cannot call it
-- directly, and no role can update view_count through the table API
-- except the admin.
-- ---------------------------------------------------------------------
create or replace function public.increment_post_view(p_post_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.posts
     set view_count = view_count + 1
   where id = p_post_id
     and status = 'published'
     and published_at <= now();
$$;

revoke all on function public.increment_post_view(uuid) from public, anon, authenticated;
grant execute on function public.increment_post_view(uuid) to service_role;

-- ---------------------------------------------------------------------
-- Storage: public-read "images" bucket, admin-only writes.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'images', 'images', true, 5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "admin uploads images" on storage.objects;
create policy "admin uploads images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'images' and public.is_admin());

drop policy if exists "admin updates images" on storage.objects;
create policy "admin updates images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'images' and public.is_admin())
  with check (bucket_id = 'images' and public.is_admin());

drop policy if exists "admin deletes images" on storage.objects;
create policy "admin deletes images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'images' and public.is_admin());

drop policy if exists "admin lists images" on storage.objects;
create policy "admin lists images"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'images' and public.is_admin());

-- ---------------------------------------------------------------------
-- Starting categories
-- ---------------------------------------------------------------------
insert into public.categories (name, slug) values
  ('Copywriting', 'copywriting'),
  ('Meta Ads', 'meta-ads')
on conflict (slug) do nothing;
