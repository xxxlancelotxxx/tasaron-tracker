-- ============================================================
-- TAŞERON TAKİP + EVM SİSTEMİ — FAZ 0: PUANTAJ & ONAY WORKFLOW
-- Temel: Adam-saat (MH) + SPI/CPI verimlilik + teknik ofis onayı
-- ============================================================

-- 1) GÜNLÜK PUANTAJ (taşeron adam-saat girişi + belge + onay)
CREATE TABLE IF NOT EXISTS public.timesheets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    subcontractor_id UUID NOT NULL REFERENCES public.subcontractors(id) ON DELETE RESTRICT,
    work_item_id UUID REFERENCES public.work_items(id) ON DELETE SET NULL,
    tarih DATE NOT NULL,
    isci_sayisi INTEGER NOT NULL DEFAULT 0,
    adam_saat NUMERIC(12,2) NOT NULL DEFAULT 0,
    kategori TEXT NOT NULL DEFAULT 'Türk' CHECK (kategori IN ('Türk','Expat','Yerel')),
    direk_indirek TEXT NOT NULL DEFAULT 'Direkt' CHECK (direk_indirek IN ('Direkt','Endirekt')),
    notlar TEXT,
    durum TEXT NOT NULL DEFAULT 'taslak' CHECK (durum IN ('taslak','onay_bekliyor','onaylandi','reddedildi')),
    onaylayan UUID REFERENCES auth.users(id),
    onay_tarihi TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (project_id, subcontractor_id, work_item_id, tarih)
);
CREATE INDEX IF NOT EXISTS idx_timesheets_sub ON public.timesheets (subcontractor_id, tarih);
CREATE INDEX IF NOT EXISTS idx_timesheets_proj ON public.timesheets (project_id, tarih);
CREATE INDEX IF NOT EXISTS idx_timesheets_durum ON public.timesheets (organization_id, durum);

-- 2) HAFTALIK FİZİKİ İLERLEME (taşeron "bu hafta şu kadar iş yaptım")
CREATE TABLE IF NOT EXISTS public.weekly_physical_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    work_item_id UUID NOT NULL REFERENCES public.work_items(id) ON DELETE CASCADE,
    subcontractor_id UUID REFERENCES public.subcontractors(id) ON DELETE RESTRICT,
    week_start DATE NOT NULL,
    haftalik_yuzde NUMERIC(6,3) NOT NULL DEFAULT 0,
    tamamlanan_miktar NUMERIC(18,4) DEFAULT 0,
    notlar TEXT,
    durum TEXT NOT NULL DEFAULT 'onay_bekliyor' CHECK (durum IN ('onay_bekliyor','onaylandi','reddedildi')),
    onaylayan UUID REFERENCES auth.users(id),
    onay_tarihi TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (project_id, work_item_id, subcontractor_id, week_start)
);
CREATE INDEX IF NOT EXISTS idx_wpp_proj ON public.weekly_physical_progress (project_id, week_start);

-- 3) work_items'a bütçe + planlanan MH alanları
ALTER TABLE public.work_items
    ADD COLUMN IF NOT EXISTS birim_fiyat NUMERIC(18,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS toplam_butce NUMERIC(20,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS planlanan_mh NUMERIC(12,2) NOT NULL DEFAULT 0;

-- 4) UPDATED_AT trigger (yeni tablolar için)
CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_timesheets_updated ON public.timesheets;
CREATE TRIGGER trg_timesheets_updated BEFORE UPDATE ON public.timesheets
FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_wpp_updated ON public.weekly_physical_progress;
CREATE TRIGGER trg_wpp_updated BEFORE UPDATE ON public.weekly_physical_progress
FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- 5) RLS: anon + authenticated'a erişim (demo modu)
ALTER TABLE public.timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_physical_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pol_timesheets_all ON public.timesheets;
CREATE POLICY pol_timesheets_all ON public.timesheets
    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS pol_wpp_all ON public.weekly_physical_progress;
CREATE POLICY pol_wpp_all ON public.weekly_physical_progress
    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.timesheets TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.weekly_physical_progress TO anon, authenticated;

-- ============================================================
-- 6) EVM ÖZET VIEW'i (Excel'deki "Budget Code Detailed" online karşılığı)
--    planned = work_items.planlanan_mh
--    earned  = Σ(approved weekly_physical_progress.tamamlanan_miktar) -> MH
--    spent   = Σ(onaylandi timesheets.adam_saat)
-- ============================================================
CREATE OR REPLACE VIEW public.evm_summary AS
SELECT
    wi.organization_id,
    wi.project_id,
    wi.id AS work_item_id,
    wi.item_code,
    wi.description,
    wi.unit,
    wi.quantity AS total_quantity,
    wi.planlanan_mh AS planned_mh,
    COALESCE(earned.earned_mh, 0) AS earned_mh,
    COALESCE(spent.spent_mh, 0) AS spent_mh,
    CASE WHEN COALESCE(spent.spent_mh, 0) > 0
         THEN ROUND(COALESCE(earned.earned_mh, 0) / spent.spent_mh, 3)
         ELSE NULL END AS cpi,
    CASE WHEN wi.planlanan_mh > 0
         THEN ROUND(COALESCE(earned.earned_mh, 0) / wi.planlanan_mh, 3)
         ELSE NULL END AS spi
FROM public.work_items wi
LEFT JOIN (
    SELECT work_item_id, SUM(tamamlanan_miktar) AS earned_mh
    FROM public.weekly_physical_progress
    WHERE durum = 'onaylandi'
    GROUP BY work_item_id
) earned ON earned.work_item_id = wi.id
LEFT JOIN (
    SELECT work_item_id, SUM(adam_saat) AS spent_mh
    FROM public.timesheets
    WHERE durum = 'onaylandi'
    GROUP BY work_item_id
) spent ON spent.work_item_id = wi.id;

GRANT SELECT ON public.evm_summary TO anon, authenticated;
