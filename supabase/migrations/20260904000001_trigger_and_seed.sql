-- ============================================================
-- TAŞERON TAKİP — EK MIGRATION: AUTO-PROFILE TRIGGER + DEMO VERİ
-- ============================================================

-- Kullanıcı kayıt olduğunda otomatik profiles satırı oluştur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    org_id uuid;
BEGIN
    -- Varsayılan organizasyonu bul (yoksa oluştur)
    SELECT id INTO org_id FROM public.organizations ORDER BY created_at LIMIT 1;
    IF org_id IS NULL THEN
        INSERT INTO public.organizations (name) VALUES ('Demo İnşaat A.Ş.') RETURNING id INTO org_id;
    END IF;

    INSERT INTO public.profiles (id, organization_id, full_name, role)
    VALUES (new.id, org_id, COALESCE(new.raw_user_meta_data->>'full_name', new.email), 'tasaron')
    ON CONFLICT (id) DO NOTHING;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- DEMO VERİ (örnek proje, taşeron, iş kalemi, teklif, ilerleme)
-- ============================================================
DO $$ 
DECLARE
    org uuid;
    proj1 uuid; proj2 uuid; proj3 uuid;
    sub1 uuid; sub2 uuid; sub3 uuid;
    wi1 uuid; wi2 uuid; wi3 uuid;
BEGIN
    SELECT id INTO org FROM public.organizations ORDER BY created_at LIMIT 1;

    -- Projeler (yoksa)
    INSERT INTO public.projects (organization_id, name, code, client_name, start_date, end_date, status)
    VALUES
        (org, 'Ankara Ofis Binası', 'ANK-001', 'TCMB', '2024-01-15', '2024-12-31', 'aktif'),
        (org, 'İstanbul AVM Projesi', 'IST-002', 'Emaar', '2024-03-01', '2025-06-30', 'aktif'),
        (org, 'İzmir Konut Kompleksi', 'IZM-003', 'Torunlar', '2024-02-01', '2024-10-31', 'aktif')
    ON CONFLICT (organization_id, code) DO NOTHING;
    SELECT id INTO proj1 FROM public.projects WHERE organization_id = org AND code = 'ANK-001';
    SELECT id INTO proj2 FROM public.projects WHERE organization_id = org AND code = 'IST-002';
    SELECT id INTO proj3 FROM public.projects WHERE organization_id = org AND code = 'IZM-003';

    -- Taşeronlar (yoksa)
    INSERT INTO public.subcontractors (organization_id, company_name, tax_number, contact_name, phone, email)
    VALUES
        (org, 'Yıldız İnşaat Ltd. Şti.', '1234567890', 'Ahmet Yıldız', '0532 111 22 33', 'ahmet@yildizinsaat.com'),
        (org, 'Demir Çelik Yapı A.Ş.', '2345678901', 'Mehmet Demir', '0533 222 33 44', 'mehmet@demircelik.com'),
        (org, 'Beton Master Tic. Ltd. Şti.', '3456789012', 'Ali Beton', '0534 333 44 55', 'ali@betonmaster.com')
    ON CONFLICT DO NOTHING;
    SELECT id INTO sub1 FROM public.subcontractors WHERE organization_id = org AND company_name LIKE 'Yıldız%';
    SELECT id INTO sub2 FROM public.subcontractors WHERE organization_id = org AND company_name LIKE 'Demir%';
    SELECT id INTO sub3 FROM public.subcontractors WHERE organization_id = org AND company_name LIKE 'Beton%';

    -- İş kalemleri (yoksa)
    INSERT INTO public.work_items (organization_id, project_id, item_code, description, category, unit, quantity)
    VALUES
        (org, proj1, '02.01', 'C30/37 Hazır Beton', 'Beton', 'm³', 2500),
        (org, proj2, '02.01', 'C35/45 Hazır Beton', 'Beton', 'm³', 4000),
        (org, proj3, '02.01', 'C25/30 Hazır Beton', 'Beton', 'm³', 1800)
    ON CONFLICT (project_id, item_code) DO NOTHING;
    SELECT id INTO wi1 FROM public.work_items WHERE project_id = proj1 AND item_code = '02.01';
    SELECT id INTO wi2 FROM public.work_items WHERE project_id = proj2 AND item_code = '02.01';
    SELECT id INTO wi3 FROM public.work_items WHERE project_id = proj3 AND item_code = '02.01';

    -- Teklifler (kabul edilmiş, farklı fiyat)
    INSERT INTO public.contract_bids (organization_id, project_id, work_item_id, subcontractor_id, iscilik_fiyat, malzeme_fiyat, birim, miktar, teklif_tarihi, durum)
    VALUES
        (org, proj1, wi1, sub2, 180, 1170, 'm³', 2500, '2024-01-20', 'kabul'),
        (org, proj2, wi2, sub3, 200, 1250, 'm³', 4000, '2024-03-06', 'kabul'),
        (org, proj3, wi3, sub1, 195, 985,  'm³', 1800, '2024-02-12', 'kabul')
    ON CONFLICT DO NOTHING;

    -- Haftalık ilerleme (proje 1 için 8 hafta)
    INSERT INTO public.weekly_progress (organization_id, project_id, week_number, week_start, week_end, planlanan_maliyet_pv, kazanilan_deger_ev, fiili_maliyet_ac)
    VALUES
        (org, proj1, 1, '2024-01-15', '2024-01-21', 500000, 480000, 520000),
        (org, proj1, 2, '2024-01-22', '2024-01-28', 800000, 790000, 810000),
        (org, proj1, 3, '2024-01-29', '2024-02-04', 1200000, 1250000, 1180000),
        (org, proj1, 4, '2024-02-05', '2024-02-11', 1800000, 1750000, 1820000),
        (org, proj1, 5, '2024-02-12', '2024-02-18', 2500000, 2600000, 2450000),
        (org, proj1, 6, '2024-02-19', '2024-02-25', 3200000, 3100000, 3300000),
        (org, proj1, 7, '2024-02-26', '2024-03-03', 4000000, 4100000, 3950000),
        (org, proj1, 8, '2024-03-04', '2024-03-10', 4800000, 4700000, 4900000)
    ON CONFLICT DO NOTHING;
END $$;
