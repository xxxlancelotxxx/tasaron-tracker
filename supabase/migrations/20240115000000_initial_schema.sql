-- 20240115000000_initial_schema.sql
-- Supabase migration: Initial schema for Taşeron Takip Sistemi
-- Run: supabase db push (after linking project)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- CORE TABLES
-- ============================================================

-- Organizations (multi-tenant root)
CREATE TABLE public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL CHECK (btrim(name) <> ''),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Organization members (links auth.users to organizations)
CREATE TABLE public.organization_members (
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (organization_id, user_id)
);

CREATE INDEX idx_org_members_user_id ON public.organization_members (user_id, organization_id);

-- Projects (şantiyeler)
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (btrim(name) <> ''),
    project_code TEXT,
    site_address TEXT,
    client_name TEXT,
    start_date DATE,
    end_date DATE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('planned', 'active', 'completed', 'on_hold', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (organization_id, project_code),
    CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);

CREATE INDEX idx_projects_org ON public.projects (organization_id);
CREATE INDEX idx_projects_status ON public.projects (organization_id, status);

-- Subcontractors (taşeron firmaları)
CREATE TABLE public.subcontractors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL CHECK (btrim(company_name) <> ''),
    tax_number TEXT,
    contact_name TEXT,
    phone TEXT,
    email TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_subcontractors_org ON public.subcontractors (organization_id);

-- Work Items (tasarón/BOQ kalemleri)
CREATE TABLE public.work_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    item_code TEXT NOT NULL,
    description TEXT NOT NULL CHECK (btrim(description) <> ''),
    category TEXT NOT NULL CHECK (btrim(category) <> ''),
    unit TEXT NOT NULL CHECK (btrim(unit) <> ''),
    quantity NUMERIC(18, 4) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (project_id, item_code)
);

CREATE INDEX idx_work_items_project ON public.work_items (project_id);
CREATE INDEX idx_work_items_category ON public.work_items (organization_id, category);

-- Contract Bids (taşeron teklifleri)
CREATE TABLE public.contract_bids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    work_item_id UUID NOT NULL REFERENCES public.work_items(id) ON DELETE CASCADE,
    subcontractor_id UUID NOT NULL REFERENCES public.subcontractors(id) ON DELETE RESTRICT,
    iscilik_fiyat NUMERIC(18, 2) NOT NULL DEFAULT 0 CHECK (iscilik_fiyat >= 0),
    malzeme_fiyat NUMERIC(18, 2) NOT NULL DEFAULT 0 CHECK (malzeme_fiyat >= 0),
    birim TEXT NOT NULL CHECK (btrim(birim) <> ''),
    miktar NUMERIC(18, 4) NOT NULL DEFAULT 1 CHECK (miktar > 0),
    toplam NUMERIC(20, 2) GENERATED ALWAYS AS (round((iscilik_fiyat + malzeme_fiyat) * miktar, 2)) STORED,
    teklif_tarihi DATE NOT NULL DEFAULT CURRENT_DATE CHECK (teklif_tarihi <= CURRENT_DATE),
    durum TEXT NOT NULL DEFAULT 'submitted' CHECK (durum IN ('draft', 'submitted', 'under_review', 'accepted', 'rejected', 'withdrawn')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_contract_bids_project ON public.contract_bids (project_id);
CREATE INDEX idx_contract_bids_work_item ON public.contract_bids (work_item_id);
CREATE INDEX idx_contract_bids_subcontractor ON public.contract_bids (subcontractor_id);
CREATE INDEX idx_contract_bids_date ON public.contract_bids (organization_id, teklif_tarihi);
CREATE INDEX idx_contract_bids_status ON public.contract_bids (organization_id, durum);
-- Composite index for price comparison queries
CREATE INDEX idx_contract_bids_comparison ON public.contract_bids (organization_id, durum, project_id, work_item_id, teklif_tarihi DESC) INCLUDE (iscilik_fiyat, malzeme_fiyat, birim, subcontractor_id);
CREATE INDEX idx_contract_bids_birim_normalized ON public.contract_bids (organization_id, durum, project_id, (lower(btrim(birim))));

-- Weekly Progress (haftalık ilerleme - EVM verileri)
CREATE TABLE public.weekly_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    week_number SMALLINT NOT NULL CHECK (week_number BETWEEN 1 AND 53),
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    planlanan_maliyet_pv NUMERIC(20, 2) NOT NULL DEFAULT 0 CHECK (planlanan_maliyet_pv >= 0),
    kazanilan_deger_ev NUMERIC(20, 2) NOT NULL DEFAULT 0 CHECK (kazanilan_deger_ev >= 0),
    fiili_maliyet_ac NUMERIC(20, 2) NOT NULL DEFAULT 0 CHECK (fiili_maliyet_ac >= 0),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (project_id, week_start),
    CHECK (week_end >= week_start)
);

CREATE INDEX idx_weekly_progress_project ON public.weekly_progress (project_id);
CREATE INDEX idx_weekly_progress_date ON public.weekly_progress (organization_id, week_start, week_end);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trigger_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trigger_subcontractors_updated_at BEFORE UPDATE ON public.subcontractors FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trigger_work_items_updated_at BEFORE UPDATE ON public.work_items FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trigger_contract_bids_updated_at BEFORE UPDATE ON public.contract_bids FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trigger_weekly_progress_updated_at BEFORE UPDATE ON public.weekly_progress FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Helper function to check organization membership
CREATE OR REPLACE FUNCTION public.is_org_member(target_org_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.organization_members om
        WHERE om.organization_id = target_org_id
          AND om.user_id = auth.uid()
    );
$$;

-- Enable RLS on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcontractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_progress ENABLE ROW LEVEL SECURITY;

-- Policies: organizations
CREATE POLICY "org_select" ON public.organizations FOR SELECT TO authenticated USING (public.is_org_member(id));
CREATE POLICY "org_insert" ON public.organizations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "org_update" ON public.organizations FOR UPDATE TO authenticated USING (public.is_org_member(id)) WITH CHECK (public.is_org_member(id));
CREATE POLICY "org_delete" ON public.organizations FOR DELETE TO authenticated USING (public.is_org_member(id));

-- Policies: organization_members
CREATE POLICY "om_select" ON public.organization_members FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
CREATE POLICY "om_insert" ON public.organization_members FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR public.is_org_member(organization_id));
CREATE POLICY "om_delete" ON public.organization_members FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.is_org_member(organization_id));

-- Policies: projects (org isolation)
CREATE POLICY "projects_isolation" ON public.projects FOR ALL TO authenticated USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));

-- Policies: subcontractors
CREATE POLICY "subcontractors_isolation" ON public.subcontractors FOR ALL TO authenticated USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));

-- Policies: work_items
CREATE POLICY "work_items_isolation" ON public.work_items FOR ALL TO authenticated USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));

-- Policies: contract_bids
CREATE POLICY "contract_bids_isolation" ON public.contract_bids FOR ALL TO authenticated USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));

-- Policies: weekly_progress
CREATE POLICY "weekly_progress_isolation" ON public.weekly_progress FOR ALL TO authenticated USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));

-- ============================================================
-- GRANTS
-- ============================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON
    public.organizations,
    public.organization_members,
    public.projects,
    public.subcontractors,
    public.work_items,
    public.contract_bids,
    public.weekly_progress
TO authenticated;

-- ============================================================
-- PRICE COMPARISON FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION public.compare_subcontractor_bid(
    p_organization_id UUID,
    p_project_id UUID,
    p_work_item_id UUID,
    p_subcontractor_id UUID,
    p_iscilik_fiyat NUMERIC,
    p_malzeme_fiyat NUMERIC,
    p_birim TEXT,
    p_threshold_percent NUMERIC DEFAULT 10
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
DECLARE
    v_item_code TEXT;
    v_expected_unit TEXT;
    v_new_price NUMERIC;
    v_min NUMERIC;
    v_max NUMERIC;
    v_avg NUMERIC;
    v_median NUMERIC;
    v_count INTEGER;
    v_projects JSONB;
    v_percent_above_min NUMERIC;
    v_warning BOOLEAN;
    v_message TEXT;
BEGIN
    -- Validation
    IF p_iscilik_fiyat < 0 OR p_malzeme_fiyat < 0 THEN
        RAISE EXCEPTION 'Fiyatlar negatif olamaz' USING ERRCODE = '22023';
    END IF;
    IF btrim(coalesce(p_birim, '')) = '' THEN
        RAISE EXCEPTION 'Birim boş olamaz' USING ERRCODE = '22023';
    END IF;
    IF p_threshold_percent < 0 THEN
        RAISE EXCEPTION 'Eşik yüzdesi negatif olamaz' USING ERRCODE = '22023';
    END IF;

    -- Verify subcontractor belongs to organization
    IF NOT EXISTS (
        SELECT 1 FROM public.subcontractors s
        WHERE s.organization_id = p_organization_id AND s.id = p_subcontractor_id
    ) THEN
        RAISE EXCEPTION 'Taşeron organizasyonda bulunamadı' USING ERRCODE = '22023';
    END IF;

    -- Get work item info
    SELECT item_code, unit INTO v_item_code, v_expected_unit
    FROM public.work_items
    WHERE organization_id = p_organization_id AND project_id = p_project_id AND id = p_work_item_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'İş kalemi belirtilen projede bulunamadı' USING ERRCODE = '22023';
    END IF;

    v_new_price := p_iscilik_fiyat + p_malzeme_fiyat;

    -- Historical comparison: same org, other projects, accepted bids, same unit, same work item (by ID or code)
    WITH historical AS (
        SELECT
            cb.project_id,
            p.name as project_name,
            round(cb.iscilik_fiyat + cb.malzeme_fiyat, 2) as unit_price,
            s.company_name as subcontractor_name
        FROM public.contract_bids cb
        JOIN public.work_items wi ON wi.organization_id = cb.organization_id AND wi.id = cb.work_item_id AND wi.project_id = cb.project_id
        JOIN public.projects p ON p.organization_id = cb.organization_id AND p.id = cb.project_id
        JOIN public.subcontractors s ON s.organization_id = cb.organization_id AND s.id = cb.subcontractor_id
        WHERE cb.organization_id = p_organization_id
          AND cb.project_id <> p_project_id
          AND cb.durum = 'accepted'
          AND lower(btrim(cb.birim)) = lower(btrim(p_birim))
          AND (cb.work_item_id = p_work_item_id OR wi.item_code = v_item_code)
        ORDER BY cb.teklif_tarihi DESC, cb.created_at DESC
        LIMIT 1000
    ), stats AS (
        SELECT
            min(unit_price) as min_price,
            max(unit_price) as max_price,
            avg(unit_price) as avg_price,
            percentile_cont(0.5) WITHIN GROUP (ORDER BY unit_price) as median_price,
            count(*)::integer as row_count
        FROM historical
    )
    SELECT min_price, max_price, avg_price, median_price, row_count
    INTO v_min, v_max, v_avg, v_median, v_count
    FROM stats;

    SELECT coalesce(jsonb_agg(to_jsonb(h) ORDER BY h.unit_price ASC), '[]'::jsonb)
    INTO v_projects
    FROM (
        SELECT
            cb.project_id,
            p.name as project_name,
            round(cb.iscilik_fiyat + cb.malzeme_fiyat, 2) as unit_price,
            s.company_name as subcontractor_name
        FROM public.contract_bids cb
        JOIN public.work_items wi ON wi.organization_id = cb.organization_id AND wi.id = cb.work_item_id AND wi.project_id = cb.project_id
        JOIN public.projects p ON p.organization_id = cb.organization_id AND p.id = cb.project_id
        JOIN public.subcontractors s ON s.organization_id = cb.organization_id AND s.id = cb.subcontractor_id
        WHERE cb.organization_id = p_organization_id AND cb.project_id <> p_project_id
          AND cb.durum = 'accepted'
          AND lower(btrim(cb.birim)) = lower(btrim(p_birim))
          AND (cb.work_item_id = p_work_item_id OR wi.item_code = v_item_code)
        ORDER BY cb.teklif_tarihi DESC, cb.created_at DESC
        LIMIT 1000
    ) h;

    IF lower(btrim(p_birim)) <> lower(btrim(v_expected_unit)) THEN
        v_message := format('Birim uyuşmazlığı: yeni teklif %s, iş kalemi %s', p_birim, v_expected_unit);
        v_warning := true;
    ELSIF v_count = 0 THEN
        v_message := 'Yeterli veri yok';
        v_warning := false;
    ELSE
        v_percent_above_min := CASE WHEN v_min = 0 THEN null ELSE round(((v_new_price - v_min) / v_min) * 100, 2) END;
        v_warning := v_new_price > v_min * (1 + p_threshold_percent / 100);
        v_message := CASE
            WHEN v_warning AND v_min = 0 THEN 'Yeni teklif, sıfır tutarlı en düşük geçmiş tekliften pahalı.'
            WHEN v_warning THEN format('Yeni teklif en düşük geçmiş tekliften %s%% daha pahalı.', v_percent_above_min)
            ELSE 'Yeni teklif eşik dahilinde.' END;
    END IF;

    RETURN jsonb_build_object(
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
END;
$$;

GRANT EXECUTE ON FUNCTION public.compare_subcontractor_bid(UUID, UUID, UUID, UUID, NUMERIC, NUMERIC, TEXT, NUMERIC) TO authenticated;