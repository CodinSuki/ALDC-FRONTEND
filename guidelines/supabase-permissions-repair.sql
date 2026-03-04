-- Supabase permission repair for ALDC
-- Run in Supabase SQL Editor as project owner.
--
-- IMPORTANT:
-- 1) Always run the shared baseline first.
-- 2) Then run exactly ONE mode:
--    - MODE A: server-only secure default (recommended)
--    - MODE B: browser-access enabled (only for tables needed by client-side Supabase calls)

-- ============================================================
-- SHARED BASELINE (run first)
-- ============================================================
begin;

grant usage on schema public to anon, authenticated, service_role;

-- service_role must retain full access for server-side API routes.
grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
grant all privileges on all routines in schema public to service_role;

alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
alter default privileges in schema public grant all on routines to service_role;

commit;

-- ============================================================
-- MODE A: SERVER-ONLY SECURE DEFAULT (recommended)
-- ============================================================
-- Use this if browser/app should NOT access tables directly via anon/authenticated.
-- Keep all reads/writes behind your Vercel API routes that use service_role.

begin;

revoke all on table
  public.client,
  public.sellerprofile,
  public.consultationrequest,
  public.propertyinquiry,
  public.property,
  public.propertytype,
  public.propertylistingstatus,
  public.staff
from anon, authenticated;

commit;

do $$
begin
  if exists (
    select 1
    from pg_policies
    where schemaname = 'public' and tablename = 'property' and policyname = 'public_can_read_available_properties'
  ) then
    drop policy public_can_read_available_properties on public.property;
  end if;

  if exists (
    select 1
    from pg_policies
    where schemaname = 'public' and tablename = 'propertytype' and policyname = 'public_can_read_property_types'
  ) then
    drop policy public_can_read_property_types on public.propertytype;
  end if;

  if exists (
    select 1
    from pg_policies
    where schemaname = 'public' and tablename = 'propertylistingstatus' and policyname = 'public_can_read_listing_statuses'
  ) then
    drop policy public_can_read_listing_statuses on public.propertylistingstatus;
  end if;
end $$;

-- ============================================================
-- MODE B: BROWSER-ACCESS ENABLED (minimal exposure)
-- ============================================================
-- Use this only if frontend code calls Supabase directly from the browser.
-- This grants only what current UI flows require.

begin;

grant select on table public.property, public.propertytype, public.propertylistingstatus to anon, authenticated;
grant insert on table public.client, public.propertyinquiry, public.consultationrequest to anon, authenticated;

commit;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public' and tablename = 'property' and policyname = 'public_can_read_available_properties'
  ) then
    create policy public_can_read_available_properties
      on public.property
      for select
      to anon, authenticated
      using (coalesce(is_archived, false) = false);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public' and tablename = 'propertytype' and policyname = 'public_can_read_property_types'
  ) then
    create policy public_can_read_property_types
      on public.propertytype
      for select
      to anon, authenticated
      using (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public' and tablename = 'propertylistingstatus' and policyname = 'public_can_read_listing_statuses'
  ) then
    create policy public_can_read_listing_statuses
      on public.propertylistingstatus
      for select
      to anon, authenticated
      using (true);
  end if;
end $$;