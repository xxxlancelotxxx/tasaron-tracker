-- ============================================================
-- FAZ 0 DEMO VERİ — Excel'deki Nagatino-2 yapısına benzer
-- Adam-saat temelli, gerçek disiplinler + taşeronlar
-- ============================================================

-- Mevcut organizasyonu bul (yoksa ilk organizasyon)
DO $$
DECLARE
    org uuid;
    proj uuid;
    altes uuid; alka uuid; alum uuid; ipk uuid; stro uuid;
    wi_beton uuid; wi_siva uuid; wi_duvar uuid; wi_kazi uuid; wi_seramik uuid;
BEGIN
    SELECT id INTO org FROM public.organizations ORDER BY created_at LIMIT 1;
    IF org IS NULL THEN
        INSERT INTO public.organizations (name) VALUES ('GES İnşaat Moskova') RETURNING id INTO org;
    END IF;

    -- Proje: Nagatino-2 Hotel (yoksa oluştur, varsa ilk projeyi kullan)
    SELECT id INTO proj FROM public.projects WHERE organization_id = org ORDER BY created_at LIMIT 1;

    -- Taşeronlar (gerçek firmalardan esinlenen)
    INSERT INTO public.subcontractors (organization_id, company_name, tax_number, contact_name, phone, email) VALUES
        (org, 'ALTES Montaj', '111', 'ALTES Şef', '0532', 'altes@g.com'),
        (org, 'ALKA-STROY', '222', 'ALKA Şef', '0533', 'alka@g.com'),
        (org, 'ALÜMİNART', '333', 'ALÜMİNART Şef', '0534', 'alum@g.com'),
        (org, 'İP KHOLMURATOV', '444', 'KHOL Şef', '0535', 'khol@g.com'),
        (org, 'STROYSPECSISTEM', '555', 'STROY Şef', '0536', 'stroy@g.com')
    ON CONFLICT DO NOTHING;
    SELECT id INTO altes FROM public.subcontractors WHERE organization_id = org AND company_name = 'ALTES Montaj';
    SELECT id INTO alka  FROM public.subcontractors WHERE organization_id = org AND company_name = 'ALKA-STROY';
    SELECT id INTO alum  FROM public.subcontractors WHERE organization_id = org AND company_name = 'ALÜMİNART';
    SELECT id INTO ipk   FROM public.subcontractors WHERE organization_id = org AND company_name = 'İP KHOLMURATOV';
    SELECT id INTO stro  FROM public.subcontractors WHERE organization_id = org AND company_name = 'STROYSPECSISTEM';

    -- İş kalemleri (adam-saat + bütçe planlı) — "Do not Follow-up Track" mantığıyla
    INSERT INTO public.work_items (organization_id, project_id, item_code, description, category, unit, quantity, birim_fiyat, toplam_butce, planlanan_mh) VALUES
        (org, proj, '033113.55', 'Concrete, mat foundation', 'Structural Concrete', 'm3', 4704, 0, 0, 42336),
        (org, proj, '033113.85', 'Concrete, walls', 'Structural Concrete', 'm3', 2752, 0, 0, 64096),
        (org, proj, '042220', 'AAC Masonry Units', 'Masonry Works', 'm2', 25440, 0, 0, 60795),
        (org, proj, '092320.10', 'Gypsum plaster', 'Finishing Works', 'm2', 142203, 0, 0, 152725),
        (org, proj, '099123', 'Interior Painting', 'Finishing Works', 'm2', 26274, 0, 0, 18392)
    ON CONFLICT (project_id, item_code) DO NOTHING;
    SELECT id INTO wi_beton   FROM public.work_items WHERE project_id = proj AND item_code = '033113.55';
    SELECT id INTO wi_duvar   FROM public.work_items WHERE project_id = proj AND item_code = '042220';
    SELECT id INTO wi_siva    FROM public.work_items WHERE project_id = proj AND item_code = '092320.10';
    SELECT id INTO wi_kazi    FROM public.work_items WHERE project_id = proj AND item_code = '033113.85';
    SELECT id INTO wi_seramik FROM public.work_items WHERE project_id = proj AND item_code = '099123';

    -- GÜNLÜK PUANTAJ (onaylandi) — taşeronlar farklı günlerde adam-saat girdi
    INSERT INTO public.timesheets (organization_id, project_id, subcontractor_id, work_item_id, tarih, isci_sayisi, adam_saat, kategori, direk_indirek, durum) VALUES
        (org, proj, altes, wi_beton, '2026-06-22', 18, 540, 'Türk', 'Direkt', 'onaylandi'),
        (org, proj, altes, wi_beton, '2026-06-23', 20, 600, 'Türk', 'Direkt', 'onaylandi'),
        (org, proj, alka,  wi_duvar, '2026-06-22', 15, 450, 'Türk', 'Direkt', 'onaylandi'),
        (org, proj, alka,  wi_duvar, '2026-06-23', 16, 480, 'Türk', 'Direkt', 'onaylandi'),
        (org, proj, alum,  wi_siva,  '2026-06-22', 12, 360, 'Türk', 'Direkt', 'onaylandi'),
        (org, proj, ipk,   wi_kazi,  '2026-06-23', 22, 660, 'Yerel', 'Direkt', 'onaylandi'),
        (org, proj, stro,  wi_seramik, '2026-06-23', 10, 300, 'Expat', 'Direkt', 'onaylandi'),
        -- Taslak/onay bekleyen (devam eden)
        (org, proj, altes, wi_beton, '2026-06-24', 20, 600, 'Türk', 'Direkt', 'onay_bekliyor'),
        (org, proj, alka,  wi_duvar, '2026-06-24', 16, 480, 'Türk', 'Direkt', 'taslak')
    ON CONFLICT DO NOTHING;

    -- HAFTALIK FİZİKİ İLERLEME (onaylandi) — "bu hafta % ilerledim"
    INSERT INTO public.weekly_physical_progress (organization_id, project_id, work_item_id, subcontractor_id, week_start, haftalik_yuzde, tamamlanan_miktar, durum) VALUES
        (org, proj, wi_beton, altes, '2026-06-22', 0.02, 94, 'onaylandi'),
        (org, proj, wi_duvar, alka,  '2026-06-22', 0.03, 610, 'onaylandi'),
        (org, proj, wi_siva,  alum,  '2026-06-22', 0.02, 2844, 'onaylandi'),
        (org, proj, wi_kazi,  ipk,   '2026-06-22', 0.04, 110, 'onaylandi'),
        (org, proj, wi_seramik, stro, '2026-06-22', 0.03, 788, 'onay_bekliyor')
    ON CONFLICT DO NOTHING;
END $$;
