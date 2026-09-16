-- Remove the second category representation only when it is demonstrably an
-- exact copy of the canonical columns. Abort instead of losing divergent data.

do $$
begin
  if exists (
    select 1
    from public.categories
    where data is not null
      and (
        coalesce(data->>'id', '') <> coalesce(id::text, '')
        or coalesce(data->>'slug', '') <> coalesce(slug, '')
        or coalesce(data->>'name', '') <> coalesce(name, '')
        or coalesce(data->>'tagline', '') <> coalesce(tagline, '')
        or coalesce(data->>'description', '') <> coalesce(description, '')
        or coalesce(data->>'image', '') <> coalesce(image, '')
        or coalesce(data->'subcategories', '[]'::jsonb) <> coalesce(subcategories, '[]'::jsonb)
        or coalesce((data->>'productCount')::numeric, 0) <> coalesce(product_count, 0)
        or coalesce((data->>'order')::numeric, 0) <> coalesce("order", 0)
        or coalesce((data->>'active')::boolean, true) <> coalesce(active, true)
      )
  ) then
    raise exception 'CATEGORY_LEGACY_DATA_DIVERGED: migration aborted';
  end if;
end
$$;

update public.categories
set data = null
where data is not null;

alter table public.categories
  drop constraint if exists categories_legacy_data_must_be_null;

alter table public.categories
  add constraint categories_legacy_data_must_be_null
  check (data is null);
