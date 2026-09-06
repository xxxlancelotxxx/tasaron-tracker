create extension if not exists pgcrypto;
create schema if not exists private;

create table public.organizations (
    id uuid primary key default gen_random_uuid(),
    name text not null check (btrim(name) <> ''),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.organization_members (
    organization_id uuid not null references public.organizations(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    role text not null default 'member' check (role in ('owner', 'admin', 'member')),
    created_at timestamptz not null default now(),
    primary key (organization_id, user_id)
);

create index organization_members_user_id_idx
    on public.organization_members (user_id, organization_id);

create or replace function private.is_organization_member(target_organization_id uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
    select exists (
        select 1
        from public.organization_members om
        where om.organization_id = target_organization_id
          and om.user_id = (select auth.uid())
    );
$$;

revoke all on function private.is_organization_member(uuid) from public;
grant execute on function private.is_organization_member(uuid) to authenticated;

create table public.projects (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references public.organizations(id) on delete cascade,
    name text not null check (btrim(name) <> ''),
    project_code text,
    site_address text,
    client_name text,
    start_date date,
    end_date date,
    status text not null default 'active' check (status in ('planned', 'active', 'completed', 'on_hold', 'cancelled')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (organization_id, id),
    unique (organization_id, project_code),
    check (end_date is null or start_date is null or end_date >= start_date)
);

create index projects_organization_id_idx on public.projects (organization_id);
create index projects_status_idx on public.projects (organization_id, status);

create table public.subcontractors (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references public.organizations(id) on delete cascade,
    company_name text not null check (btrim(company_name) <> ''),
    tax_number text,
    contact_name text,
    phone text,
    email text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (organization_id, id)
);

create index subcontractors_organization_id_idx on public.subcontractors (organization_id);

create table public.work_items (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references public.organizations(id) on delete cascade,
    project_id uuid not null,
    item_code text not null,
    description text not null check (btrim(description) <> ''),
    category text not null check (btrim(category) <> ''),
    unit text not null check (btrim(unit) <> ''),
    quantity numeric(18, 4) not null default 0 check (quantity >= 0),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (organization_id, id),
    unique (organization_id, id, project_id),
    unique (project_id, item_code),
    foreign key (organization_id, project_id)
        references public.projects (organization_id, id) on delete cascade
);

create index work_items_organization_id_idx on public.work_items (organization_id);
create index work_items_project_id_idx on public.work_items (project_id);
create index work_items_category_idx on public.work_items (organization_id, category);

create table public.contract_bids (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references public.organizations(id) on delete cascade,
    project_id uuid not null,
    work_item_id uuid not null,
    subcontractor_id uuid not null,
    iscilik_fiyat numeric(18, 2) not null default 0 check (iscilik_fiyat >= 0),
    malzeme_fiyat numeric(18, 2) not null default 0 check (malzeme_fiyat >= 0),
    birim text not null check (btrim(birim) <> ''),
    miktar numeric(18, 4) not null default 1 check (miktar > 0),
    toplam numeric(20, 2) generated always as
        (round((iscilik_fiyat + malzeme_fiyat) * miktar, 2)) stored,
    teklif_tarihi date not null default current_date check (teklif_tarihi <= current_date),
    durum text not null default 'submitted'
        check (durum in ('draft', 'submitted', 'under_review', 'accepted', 'rejected', 'withdrawn')),
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    foreign key (organization_id, project_id)
        references public.projects (organization_id, id) on delete cascade,
    foreign key (organization_id, work_item_id, project_id)
        references public.work_items (organization_id, id, project_id) on delete cascade,
    foreign key (organization_id, subcontractor_id)
        references public.subcontractors (organization_id, id) on delete restrict
);

create index contract_bids_organization_id_idx on public.contract_bids (organization_id);
create index contract_bids_project_id_idx on public.contract_bids (project_id);
create index contract_bids_work_item_id_idx on public.contract_bids (work_item_id);
create index contract_bids_subcontractor_id_idx on public.contract_bids (subcontractor_id);
create index contract_bids_date_idx on public.contract_bids (organization_id, teklif_tarihi);
create index contract_bids_status_idx on public.contract_bids (organization_id, durum);

create table public.weekly_progress (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references public.organizations(id) on delete cascade,
    project_id uuid not null,
    week_number smallint not null check (week_number between 1 and 53),
    week_start date not null,
    week_end date not null,
    planlanan_maliyet_pv numeric(20, 2) not null default 0 check (planlanan_maliyet_pv >= 0),
    kazanilan_deger_ev numeric(20, 2) not null default 0 check (kazanilan_deger_ev >= 0),
    fiili_maliyet_ac numeric(20, 2) not null default 0 check (fiili_maliyet_ac >= 0),
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (project_id, week_start),
    foreign key (organization_id, project_id)
        references public.projects (organization_id, id) on delete cascade,
    check (week_end >= week_start)
);

create index weekly_progress_organization_id_idx on public.weekly_progress (organization_id);
create index weekly_progress_project_id_idx on public.weekly_progress (project_id);
create index weekly_progress_date_idx on public.weekly_progress (organization_id, week_start, week_end);

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

create trigger organizations_set_updated_at
before update on public.organizations
for each row execute function public.set_updated_at();

create trigger projects_set_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

create trigger subcontractors_set_updated_at
before update on public.subcontractors
for each row execute function public.set_updated_at();

create trigger work_items_set_updated_at
before update on public.work_items
for each row execute function public.set_updated_at();

create trigger contract_bids_set_updated_at
before update on public.contract_bids
for each row execute function public.set_updated_at();

create trigger weekly_progress_set_updated_at
before update on public.weekly_progress
for each row execute function public.set_updated_at();

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.projects enable row level security;
alter table public.subcontractors enable row level security;
alter table public.work_items enable row level security;
alter table public.contract_bids enable row level security;
alter table public.weekly_progress enable row level security;

create policy organizations_select on public.organizations
    for select to authenticated
    using ((select private.is_organization_member(id)));

create policy organizations_insert on public.organizations
    for insert to authenticated
    with check (true);

create policy organizations_update on public.organizations
    for update to authenticated
    using ((select private.is_organization_member(id)))
    with check ((select private.is_organization_member(id)));

create policy organizations_delete on public.organizations
    for delete to authenticated
    using ((select private.is_organization_member(id)));

create policy organization_members_select on public.organization_members
    for select to authenticated
    using ((select private.is_organization_member(organization_id)));

create policy organization_members_insert on public.organization_members
    for insert to authenticated
    with check (
        user_id = (select auth.uid())
        or (select private.is_organization_member(organization_id))
    );

create policy organization_members_delete on public.organization_members
    for delete to authenticated
    using (user_id = (select auth.uid()) or (select private.is_organization_member(organization_id)));

create policy projects_isolation on public.projects
    for all to authenticated
    using ((select private.is_organization_member(organization_id)))
    with check ((select private.is_organization_member(organization_id)));

create policy subcontractors_isolation on public.subcontractors
    for all to authenticated
    using ((select private.is_organization_member(organization_id)))
    with check ((select private.is_organization_member(organization_id)));

create policy work_items_isolation on public.work_items
    for all to authenticated
    using ((select private.is_organization_member(organization_id)))
    with check ((select private.is_organization_member(organization_id)));

create policy contract_bids_isolation on public.contract_bids
    for all to authenticated
    using ((select private.is_organization_member(organization_id)))
    with check ((select private.is_organization_member(organization_id)));

create policy weekly_progress_isolation on public.weekly_progress
    for all to authenticated
    using ((select private.is_organization_member(organization_id)))
    with check ((select private.is_organization_member(organization_id)));

grant usage on schema public to authenticated;
grant select, insert, update, delete on
    public.organizations,
    public.organization_members,
    public.projects,
    public.subcontractors,
    public.work_items,
    public.contract_bids,
    public.weekly_progress
to authenticated;

create index if not exists contract_bids_comparison_idx
    on public.contract_bids (organization_id, durum, project_id, work_item_id, teklif_tarihi desc)
    include (iscilik_fiyat, malzeme_fiyat, birim, subcontractor_id);

create index if not exists contract_bids_birim_normalized_idx
    on public.contract_bids (organization_id, durum, project_id, (lower(btrim(birim))));

create or replace function public.compare_subcontractor_bid(
    new_organization_id uuid,
    new_project_id uuid,
    new_work_item_id uuid,
    new_subcontractor_id uuid,
    new_iscilik_fiyat numeric,
    new_malzeme_fiyat numeric,
    new_birim text,
    threshold_percent numeric default 10
)
returns jsonb
language plpgsql
security definer
stable
set search_path = ''
as $$
declare
    v_item_code text;
    v_expected_unit text;
    v_new_price numeric;
    v_min numeric;
    v_max numeric;
    v_avg numeric;
    v_median numeric;
    v_count integer;
    v_projects jsonb;
    v_percent_above_min numeric;
    v_warning boolean;
    v_message text;
begin
    if (select auth.uid()) is null
       or not public.is_organization_member(new_organization_id) then
        raise exception using errcode = '42501', message = 'Organizasyon erişimi reddedildi';
    end if;

    if new_iscilik_fiyat < 0 or new_malzeme_fiyat < 0 then
        raise exception using errcode = '22023', message = 'Fiyatlar negatif olamaz';
    end if;
    if btrim(coalesce(new_birim, '')) = '' then
        raise exception using errcode = '22023', message = 'Birim boş olamaz';
    end if;
    if threshold_percent < 0 then
        raise exception using errcode = '22023', message = 'Eşik yüzdesi negatif olamaz';
    end if;

    if not exists (
        select 1
          from public.subcontractors s
         where s.organization_id = new_organization_id
           and s.id = new_subcontractor_id
    ) then
        raise exception using errcode = '22023', message = 'Taşeron organizasyonda bulunamadı';
    end if;

    select wi.item_code, wi.unit
      into v_item_code, v_expected_unit
      from public.work_items wi
     where wi.organization_id = new_organization_id
       and wi.project_id = new_project_id
       and wi.id = new_work_item_id;

    if not found then
        raise exception using errcode = '22023', message = 'İş kalemi belirtilen projede bulunamadı';
    end if;

    v_new_price := new_iscilik_fiyat + new_malzeme_fiyat;

    with historical as (
        select
            cb.project_id,
            p.name as project_name,
            round(cb.iscilik_fiyat + cb.malzeme_fiyat, 2) as unit_price,
            s.company_name as subcontractor_name
          from public.contract_bids cb
          join public.work_items wi
            on wi.organization_id = cb.organization_id
           and wi.id = cb.work_item_id
           and wi.project_id = cb.project_id
          join public.projects p
            on p.organization_id = cb.organization_id
           and p.id = cb.project_id
          join public.subcontractors s
            on s.organization_id = cb.organization_id
           and s.id = cb.subcontractor_id
         where cb.organization_id = new_organization_id
           and cb.project_id <> new_project_id
           and cb.durum = 'accepted'
           and lower(btrim(cb.birim)) = lower(btrim(new_birim))
           and (cb.work_item_id = new_work_item_id or wi.item_code = v_item_code)
         order by cb.teklif_tarihi desc, cb.created_at desc
         limit 1000
    ), stats as (
        select
            min(unit_price) as min_price,
            max(unit_price) as max_price,
            avg(unit_price) as avg_price,
            percentile_cont(0.5) within group (order by unit_price) as median_price,
            count(*)::integer as row_count
          from historical
    )
    select min_price, max_price, avg_price, median_price, row_count
      into v_min, v_max, v_avg, v_median, v_count
      from stats;

    select coalesce(jsonb_agg(to_jsonb(historical) order by historical.unit_price asc), '[]'::jsonb)
      into v_projects
      from (
        select
            cb.project_id,
            p.name as project_name,
            round(cb.iscilik_fiyat + cb.malzeme_fiyat, 2) as unit_price,
            s.company_name as subcontractor_name
          from public.contract_bids cb
          join public.work_items wi
            on wi.organization_id = cb.organization_id and wi.id = cb.work_item_id
           and wi.project_id = cb.project_id
          join public.projects p
            on p.organization_id = cb.organization_id and p.id = cb.project_id
          join public.subcontractors s
            on s.organization_id = cb.organization_id and s.id = cb.subcontractor_id
         where cb.organization_id = new_organization_id and cb.project_id <> new_project_id
           and cb.durum = 'accepted'
           and lower(btrim(cb.birim)) = lower(btrim(new_birim))
           and (cb.work_item_id = new_work_item_id or wi.item_code = v_item_code)
         order by cb.teklif_tarihi desc, cb.created_at desc
         limit 1000
      ) historical;

    if lower(btrim(new_birim)) <> lower(btrim(v_expected_unit)) then
        v_message := format('Birim uyuşmazlığı: yeni teklif %s, iş kalemi %s', new_birim, v_expected_unit);
        v_warning := true;
    elsif v_count = 0 then
        v_message := 'Yeterli veri yok';
        v_warning := false;
    else
        v_percent_above_min := case when v_min = 0
            then null
            else round(((v_new_price - v_min) / v_min) * 100, 2) end;
        v_warning := v_new_price > v_min * (1 + threshold_percent / 100);
        v_message := case
            when v_warning and v_min = 0 then 'Yeni teklif, sıfır tutarlı en düşük geçmiş tekliften pahalı.'
            when v_warning then format('Yeni teklif en düşük geçmiş tekliften %s%% daha pahalı.', v_percent_above_min)
            else 'Yeni teklif eşik dahilinde.' end;
    end if;

    return jsonb_build_object(
        'warning', coalesce(v_warning, false),
        'message', v_message,
        'comparison', jsonb_build_object(
            'new_unit_price', round(v_new_price, 2),
            'min_unit_price', v_min,
            'max_unit_price', v_max,
            'avg_unit_price', round(v_avg, 2),
            'median_unit_price', round(v_median, 2),
            'sample_count', v_count,
            'projects_compared', v_projects,
            'percent_above_min', coalesce(v_percent_above_min, 0)
        )
    );
end;
$$;

revoke all on function public.compare_subcontractor_bid(uuid, uuid, uuid, uuid, numeric, numeric, text, numeric) from public;
grant execute on function public.compare_subcontractor_bid(uuid, uuid, uuid, uuid, numeric, numeric, text, numeric) to authenticated;
