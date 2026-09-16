begin;

-- Catalog reads remain public. All mutations are routed through the authenticated
-- application API and executed by its server-side service-role client.
revoke insert, update, delete, truncate on public.products from anon, authenticated;
revoke insert, update, delete, truncate on public.categories from anon, authenticated;
grant select on public.products, public.categories to anon, authenticated;

commit;
