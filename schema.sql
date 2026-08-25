-- ODELEYE RESEARCH — SUPABASE SCHEMA
-- Run this entire file in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(), title text not null, slug text unique not null,
  subtitle text, excerpt text, content_html text not null default '',
  category text not null default 'Research' check (category in ('Research','Health','Technology','Opinion','Field Notes','Data')),
  cover_image_url text, author_name text not null default 'Emmanuel Odeleye',
  status text not null default 'draft' check (status in ('draft','published')),
  published_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(), article_id uuid not null references public.articles(id) on delete cascade,
  name text not null, email text, body text not null, image_url text,
  approved boolean not null default false, created_at timestamptz not null default now()
);

alter table public.comments add column if not exists image_url text;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade, created_at timestamptz not null default now()
);

create index if not exists articles_status_published_idx on public.articles(status, published_at desc);
create index if not exists comments_article_idx on public.comments(article_id, created_at desc);

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;
drop trigger if exists articles_updated_at on public.articles;
create trigger articles_updated_at before update on public.articles for each row execute function public.set_updated_at();

alter table public.articles enable row level security;
alter table public.comments enable row level security;
alter table public.admin_users enable row level security;

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.admin_users where user_id = auth.uid());
$$;

drop policy if exists "published articles are public" on public.articles;
create policy "published articles are public" on public.articles for select using (status = 'published');
drop policy if exists "admins manage articles" on public.articles;
create policy "admins manage articles" on public.articles for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "read approved comments" on public.comments;
create policy "read approved comments" on public.comments for select using (approved = true or public.is_admin());
drop policy if exists "anyone can submit comments" on public.comments;
create policy "anyone can submit comments" on public.comments for insert with check (approved = false);
drop policy if exists "admins moderate comments" on public.comments;
create policy "admins moderate comments" on public.comments for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins delete comments" on public.comments;
create policy "admins delete comments" on public.comments for delete using (public.is_admin());

-- Create the public bucket used only for reader comment pictures.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('comment-images','comment-images',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=true, file_size_limit=5242880, allowed_mime_types=array['image/jpeg','image/png','image/webp'];

drop policy if exists "comment images are publicly readable" on storage.objects;
create policy "comment images are publicly readable" on storage.objects for select using (bucket_id = 'comment-images');
drop policy if exists "anyone can upload comment images" on storage.objects;
create policy "anyone can upload comment images" on storage.objects for insert with check (bucket_id = 'comment-images');
drop policy if exists "admins can delete comment images" on storage.objects;
create policy "admins can delete comment images" on storage.objects for delete using (bucket_id = 'comment-images' and public.is_admin());

-- After creating your Supabase Auth editor account:
-- insert into public.admin_users(user_id) values ('YOUR-AUTH-USER-UUID');
