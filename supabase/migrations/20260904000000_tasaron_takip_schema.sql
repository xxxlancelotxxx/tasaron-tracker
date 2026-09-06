-- ============================================================
-- TAŞERON TAKİP SİSTEMİ — SQL MIGRATION
-- Tarih: 2026-09-04
-- Şema: public
-- ============================================================

-- UUID üretimi için uzantı (Supabase'de zaten vardır, güvenli olması için)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1) ENUMLAR (Türkçe sabit değerler)
-- ============================================================
DO $$ BEGIN
    CREATE TYPE project_status AS ENUM ('planlama', 'aktif', 'duraklatildi', 'tamamlandi', 'iptal');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE member_role AS ENUM ('sahip', 'yonetici', 'teknik_ofis', 'tasaron');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE bid_status AS ENUM ('taslak', 'gonderildi', 'incelemede', 'kabul', 'red', 'geri_cekildi');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE doc_type AS ENUM ('teklif', 'sozlesme', 'fatura', 'hakedis', 'rapor', 'diger');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- 2) TABLOLAR
-- ============================================================

-- Kuruluşlar (çoklu firmaya izin verir; başlangıçta tek firma olacak)
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Kullanıcı rolleri (auth.users ile bağlantılı)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    full_name TEXT,
    role member_role NOT NULL DEFAULT 'tasaron',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Projeler (şantiyeler)
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT,
    address TEXT,
    client_name TEXT,
    start_date DATE,
    end_date DATE,
    status project_status NOT NULL DEFAULT 'planlama',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (organization_id, code)
);

-- Taşeronlar
CREATE TABLE IF NOT EXISTS public.subcontractors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    tax_number TEXT,
    contact_name TEXT,
    phone TEXT,
    email TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- İş kalemleri (tasarón/BOQ kalemleri)
CREATE TABLE IF NOT EXISTS public.work_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    item_code TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    unit TEXT NOT NULL,
    quantity NUMERIC(18, 4) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (project_id, item_code)
);

-- Taşeron teklifleri (işçilik + malzeme + birim + tarih)
CREATE TABLE IF NOT EXISTS public.contract_bids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    work_item_id UUID NOT NULL REFERENCES public.work_items(id) ON DELETE CASCADE,
    subcontractor_id UUID NOT NULL REFERENCES public.subcontractors(id) ON DELETE RESTRICT,
    iscilik_fiyat NUMERIC(18, 2) NOT NULL DEFAULT 0,
    malzeme_fiyat NUMERIC(18, 2) NOT NULL DEFAULT 0,
    birim TEXT NOT NULL,
    miktar NUMERIC(18, 4) NOT NULL DEFAULT 1,
    toplam NUMERIC(20, 2) GENERATED ALWAYS AS (round((iscilik_fiyat + malzeme_fiyat) * miktar, 2)) STORED,
    teklif_tarihi DATE NOT NULL DEFAULT CURRENT_DATE,
    durum bid_status NOT NULL DEFAULT 'taslak',
    notlar TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Haftalık ilerleme (EVM: PV, EV, AC)
CREATE TABLE IF NOT EXISTS public.weekly_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    week_number SMALLINT NOT NULL,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    planlanan_maliyet_pv NUMERIC(20, 2) NOT NULL DEFAULT 0,
    kazanilan_deger_ev NUMERIC(20, 2) NOT NULL DEFAULT 0,
    fiili_maliyet_ac NUMERIC(20, 2) NOT NULL DEFAULT 0,
    notlar TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (project_id, week_start)
);

-- Taşeron verimliliği (planlı vs gerçek birim üretim)
CREATE TABLE IF NOT EXISTS public.subcontractor_efficiency (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    work_item_id UUID NOT NULL REFERENCES public.work_items(id) ON DELETE CASCADE,
    subcontractor_id UUID NOT NULL REFERENCES public.subcontractors(id) ON DELETE RESTRICT,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    planlanan_miktar NUMERIC(18, 4) NOT NULL DEFAULT 0,
    gerceklesen_miktar NUMERIC(18, 4) NOT NULL DEFAULT 0,
    birim TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Belgeler (dosyalar Supabase Storage'da, bu tablo metadata tutar)
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    work_item_id UUID REFERENCES public.work_items(id) ON DELETE CASCADE,
    bid_id UUID REFERENCES public.contract_bids(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    doc_type doc_type NOT NULL DEFAULT 'diger',
    mime_type TEXT,
    size_bytes BIGINT,
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 3) İNDEKSLER
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_projects_org ON public.projects (organization_id);
CREATE INDEX IF NOT EXISTS idx_subcontractors_org ON public.subcontractors (organization_id);
CREATE INDEX IF NOT EXISTS idx_work_items_project ON public.work_items (project_id);
CREATE INDEX IF NOT EXISTS idx_bids_project ON public.contract_bids (project_id);
CREATE INDEX IF NOT EXISTS idx_bids_work_item ON public.contract_bids (work_item_id);
CREATE INDEX IF NOT EXISTS idx_bids_sub ON public.contract_bids (subcontractor_id);
CREATE INDEX IF NOT EXISTS idx_bids_diff ON public.contract_bids (organization_id, durum, work_item_id, teklif_tarihi DESC);
CREATE INDEX IF NOT EXISTS idx_bids_birim ON public.contract_bids (organization_id, durum, project_id, (lower(trim(birim))));
CREATE INDEX IF NOT EXISTS idx_progress_project ON public.weekly_progress (project_id);
CREATE INDEX IF NOT EXISTS idx_progress_date ON public.weekly_progress (organization_id, week_start);
CREATE INDEX IF NOT EXISTS idx_eff_sub ON public.subcontractor_efficiency (subcontractor_id, period_start);
CREATE INDEX IF NOT EXISTS idx_docs_bid ON public.documents (bid_id);
CREATE INDEX IF NOT EXISTS idx_docs_org ON public.documents (organization_id);

-- ============================================================
-- 4) UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ DECLARE t TEXT;
BEGIN
    FOR t IN SELECT unnest(ARRAY[
        'organizations','profiles','projects','subcontractors',
        'work_items','contract_bids','weekly_progress',
        'subcontractor_efficiency']) LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_updated ON public.%I', t, t);
        EXECUTE format('CREATE TRIGGER trg_%I_updated BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at()', t, t);
    END LOOP;
END $$;

-- ============================================================
-- 5) ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Yardımcı fonksiyon: kullanıcının organizasyon üyesi olup olmadığı
CREATE OR REPLACE FUNCTION public.is_org_member(target_org UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.organization_id = target_org
    );
$$;

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcontractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcontractor_efficiency ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- organizations: üyeler okuyabilir, sahip/yönetici yazabilir
CREATE POLICY org_select ON public.organizations FOR SELECT TO authenticated USING (public.is_org_member(id));
CREATE POLICY org_insert ON public.organizations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY org_update ON public.organizations FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.organization_id = id AND p.role IN ('sahip','yonetici')));

-- profiles: kendi kaydı + aynı org
CREATE POLICY profiles_select ON public.profiles FOR SELECT TO authenticated
    USING (id = auth.uid() OR public.is_org_member(organization_id));
CREATE POLICY profiles_insert ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY profiles_update ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());

-- projects + subcontractors + work_items + contract_bids + weekly_progress + efficiency + documents:
-- aynı organizasyon izolasyonu
DO $$ DECLARE t TEXT;
BEGIN
    FOR t IN SELECT unnest(ARRAY[
        'projects','subcontractors','work_items','contract_bids',
        'weekly_progress','subcontractor_efficiency','documents']) LOOP
        EXECUTE format('CREATE POLICY pol_%I_iso ON public.%I FOR ALL TO authenticated USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id))', t, t);
    END LOOP;
END $$;

-- ============================================================
-- 6) GRANT (Supabase authenticated rolü)
-- ============================================================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- ============================================================
-- 7) FİYAT KARŞILAŞTIRMA FONKSİYONU (RPC)
--    Yeni teklif, aynı iş kaleminin diğer projelerdeki kabul edilmiş
--    birim fiyatlarıyla karşılaştırılır; eşik aşılırsa uyarı döner.
-- ============================================================
CREATE OR REPLACE FUNCTION public.compare_subcontractor_bid(
    p_organization_id UUID,
    p_project_id UUID,
    p_work_item_id UUID,
    p_iscilik_fiyat NUMERIC,
    p_malzeme_fiyat NUMERIC,
    p_birim TEXT,
    p_threshold_percent NUMERIC DEFAULT 10
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
    v_item_code TEXT;
    v_expected_unit TEXT;
    v_new_price NUMERIC;
    v_min NUMERIC; v_max NUMERIC; v_avg NUMERIC; v_median NUMERIC;
    v_count INTEGER;
    v_projects JSONB;
    v_pct NUMERIC;
    v_warning BOOLEAN;
    v_message TEXT;
BEGIN
    IF p_iscilik_fiyat < 0 OR p_malzeme_fiyat < 0 THEN
        RAISE EXCEPTION 'Fiyatlar negatif olamaz' USING ERRCODE = '22023';
    END IF;
    IF btrim(coalesce(p_birim,'')) = '' THEN
        RAISE EXCEPTION 'Birim boş olamaz' USING ERRCODE = '22023';
    END IF;
    IF p_threshold_percent < 0 THEN
        RAISE EXCEPTION 'Eşik negatif olamaz' USING ERRCODE = '22023';
    END IF;

    SELECT wi.item_code, wi.unit INTO v_item_code, v_expected_unit
    FROM public.work_items wi
    WHERE wi.organization_id = p_organization_id
      AND wi.project_id = p_project_id
      AND wi.id = p_work_item_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'İş kalemi bulunamadı' USING ERRCODE = '22023';
    END IF;

    v_new_price := p_iscilik_fiyat + p_malzeme_fiyat;

    WITH hist AS (
        SELECT cb.project_id, p.name AS project_name,
               round(cb.iscilik_fiyat + cb.malzeme_fiyat, 2) AS unit_price,
               s.company_name AS subcontractor_name
        FROM public.contract_bids cb
        JOIN public.work_items wi ON wi.organization_id = cb.organization_id
            AND wi.id = cb.work_item_id AND wi.project_id = cb.project_id
        JOIN public.projects p ON p.organization_id = cb.organization_id AND p.id = cb.project_id
        JOIN public.subcontractors s ON s.organization_id = cb.organization_id AND s.id = cb.subcontractor_id
        WHERE cb.organization_id = p_organization_id
          AND cb.project_id <> p_project_id
          AND cb.durum IN ('kabul')
          AND lower(btrim(cb.birim)) = lower(btrim(p_birim))
          AND (cb.work_item_id = p_work_item_id OR wi.item_code = v_item_code)
        ORDER BY cb.teklif_tarihi DESC, cb.created_at DESC
        LIMIT 1000
    ), stats AS (
        SELECT min(unit_price) mn, max(unit_price) mx, avg(unit_price) av,
               percentile_cont(0.5) WITHIN GROUP (ORDER BY unit_price) md,
               count(*)::int ct
        FROM hist
    )
    SELECT mn, mx, av, md, ct INTO v_min, v_max, v_avg, v_median, v_count FROM stats;

    SELECT coalesce(jsonb_agg(to_jsonb(h) ORDER BY h.unit_price ASC), '[]'::jsonb)
    INTO v_projects
    FROM (
        SELECT cb.project_id, p.name AS project_name,
               round(cb.iscilik_fiyat + cb.malzeme_fiyat, 2) AS unit_price,
               s.company_name AS subcontractor_name
        FROM public.contract_bids cb
        JOIN public.work_items wi ON wi.organization_id = cb.organization_id
            AND wi.id = cb.work_item_id AND wi.project_id = cb.project_id
        JOIN public.projects p ON p.organization_id = cb.organization_id AND p.id = cb.project_id
        JOIN public.subcontractors s ON s.organization_id = cb.organization_id AND s.id = cb.subcontractor_id
        WHERE cb.organization_id = p_organization_id
          AND cb.project_id <> p_project_id
          AND cb.durum IN ('kabul')
          AND lower(btrim(cb.birim)) = lower(btrim(p_birim))
          AND (cb.work_item_id = p_work_item_id OR wi.item_code = v_item_code)
        ORDER BY cb.teklif_tarihi DESC, cb.created_at DESC
        LIMIT 1000
    ) h;

    IF lower(btrim(p_birim)) <> lower(btrim(v_expected_unit)) THEN
        v_message := format('Birim uyuşmazlığı: teklif %s, iş kalemi %s', p_birim, v_expected_unit);
        v_warning := true;
    ELSIF v_count = 0 THEN
        v_message := 'Yeterli geçmiş veri yok';
        v_warning := false;
    ELSE
        v_pct := CASE WHEN v_min = 0 THEN NULL ELSE round(((v_new_price - v_min) / v_min) * 100, 2) END;
        v_warning := v_new_price > v_min * (1 + p_threshold_percent / 100);
        v_message := CASE
            WHEN v_warning AND v_min = 0 THEN 'Yeni teklif, sıfır tutarlı en düşük geçmiş tekliften pahalı.'
            WHEN v_warning THEN format('Yeni teklif en düşük geçmiş fiyattan %s%% pahalı.', v_pct)
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
            'percent_above_min', coalesce(v_pct, 0)
        )
    );
END;
$$;

-- ============================================================
-- 8) DEMO VERİLER (varsayılan organizasyon + örnek projeler)
-- ============================================================
DO $$ 
DECLARE
    org UUID;
BEGIN
    -- Organizasyon yoksa oluştur
    IF NOT EXISTS (SELECT 1 FROM public.organizations LIMIT 1) THEN
        INSERT INTO public.organizations (name) VALUES ('Demo İnşaat A.Ş.') RETURNING id INTO org;
    ELSE
        SELECT id INTO org FROM public.organizations ORDER BY created_at LIMIT 1;
    END IF;
END $$;
