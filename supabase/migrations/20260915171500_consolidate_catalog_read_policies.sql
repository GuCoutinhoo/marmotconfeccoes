-- Catalog writes are backend-only (see 20260914121000). Keep one explicit
-- public read policy per table and remove the conflicting legacy policies.

alter table public.products enable row level security;
alter table public.categories enable row level security;

drop policy if exists "Admin write products" on public.products;
drop policy if exists "Products admin manage" on public.products;
drop policy if exists "Products write restricted to admin" on public.products;
drop policy if exists "Products are publicly readable" on public.products;
drop policy if exists "Public read products" on public.products;

create policy "Catalog products are publicly readable"
on public.products
for select
to anon, authenticated
using (true);

drop policy if exists "Admin write categories" on public.categories;
drop policy if exists "Categories write restricted to admin" on public.categories;
drop policy if exists "Categories are publicly readable" on public.categories;
drop policy if exists "Public read categories" on public.categories;

create policy "Catalog categories are publicly readable"
on public.categories
for select
to anon, authenticated
using (true);
