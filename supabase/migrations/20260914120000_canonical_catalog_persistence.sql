begin;

-- The application reads/writes canonical columns only. These guards prevent a
-- second product representation from being reintroduced accidentally.
alter table public.products alter column data drop default;
alter table public.products drop constraint if exists products_data_must_be_null;
alter table public.products add constraint products_data_must_be_null check (data is null) not valid;
alter table public.products validate constraint products_data_must_be_null;

alter table public.products drop constraint if exists products_price_nonnegative;
alter table public.products add constraint products_price_nonnegative check (price >= 0) not valid;
alter table public.products validate constraint products_price_nonnegative;

alter table public.products drop constraint if exists products_promo_price_nonnegative;
alter table public.products add constraint products_promo_price_nonnegative check (promo_price is null or promo_price >= 0) not valid;
alter table public.products validate constraint products_promo_price_nonnegative;

alter table public.products drop constraint if exists products_stock_nonnegative;
alter table public.products add constraint products_stock_nonnegative check (stock_count >= 0) not valid;
alter table public.products validate constraint products_stock_nonnegative;

alter table public.products drop constraint if exists products_slug_nonempty;
alter table public.products add constraint products_slug_nonempty check (btrim(slug) <> '') not valid;
alter table public.products validate constraint products_slug_nonempty;

alter table public.products drop constraint if exists products_title_nonempty;
alter table public.products add constraint products_title_nonempty check (btrim(title) <> '') not valid;
alter table public.products validate constraint products_title_nonempty;

create or replace function public.set_catalog_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at before update on public.products
for each row execute function public.set_catalog_updated_at();

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at before update on public.categories
for each row execute function public.set_catalog_updated_at();

commit;
