# Taşeron Takip + EVM Sistemi — Excel Analizine Dayalı Yol Haritası

> **Kaynak:** `Desktop\teknikofis\` klasöründeki 2 Excel dosyası (Hotel + Residential "Follow-up Report")
> **Analiz:** Bu dosyalar senin şirketinin mevcut EVM (Earned Value Management) sistemidir. Aşağıdaki plan, bu sistemin **online, taşeronu-veriyi-kendi-giren** versiyonunu inşa eder.
> **Durum:** ONAY İÇİNDİR. Kod yazılmadan onay beklenir.

---

## 1. Excel Dosyasında Ne Gördüm (Analiz)

### 1.1 Dosyaların İçeriği (Hotel: 21 sayfa, Residential: 21 sayfa)
| Sayfa | İçerik | Satır/Önem |
|-------|--------|-----------|
| **Spent MH** | Bütçe kodu + taşeron bazlı adam-saat sarfiyatı | 113 satır — ana veri |
| **Budget Code Detailed** | Kalem bazlı: Qty, Installed, Remaining, MH, CPI, SPI | 157 satır — EVM çekirdeği |
| **Weekly Personnel** | Günlük adam-saat puantajı (işçi isim, firma, tarih) | **14.445–22.244 satır** — en büyük veri |
| **3.Progress Summary** | Kümülatif CPI=0,85 / SPI=0,84, fiziki ilerleme % | Özet KPI |
| **4.Evaluation** | Disiplin bazında Planned/Earned/Spent MH + SPI/CPI | 62–66 satır |
| **6.Claims** | Claim / Change Order takibi (hak talepleri) | 13 satır |
| **Ad-Sa** (Residential) | Adam-Saat özeti | 269 satır |

### 1.2 Kritik Tespitler
1. **CPI hesabı formülü:** `CPI = Earned MH ÷ Spent MH` (Bütçe kodunda açıkça görülüyor: "CPI w/ Opening Unit MH" = 0,85 gibi değerler).
2. **SPI hesabı:** `SPI = Earned MH ÷ Planned MH`.
3. **Puantaj yapısı:** Her işçi için `Firma, Kategori (Expat/Yerel), Pozisyon, Tarih, Direkt/Endirekt, Türk/Yerel` — yani adam-saat = işçi sayısı × gün.
4. **Taşeronlar gerçek firmalar:** GES, ALTES, ALKA-STROY, ALÜMİNART, İP KHOLMURATOV, STROYSPECSISTEM...
5. **Zaten hesaplanıyor:** Excel'de CPI/SPI/Progress otomatik formülle geliyor — **operatör sadece ham veriyi (adam-saat + miktar) giriyor, gerisini Excel yapıyor.**
6. **En büyük yük:** `Weekly Personnel` (14–22 bin satır puantaj) — bu tamamen **manuel** giriliyor. Sistemin otomatikleştirmesi gereken asıl şey bu.

---

## 2. "Operatör İşini Minimize" Ne Demek?

| Bugünkü (Excel) | Yeni Sistem |
|-----------------|-------------|
| Operatör her işçinin günlük süresini Excel'e elle yazar | Taşeron **kendi ekranından** günlük işçi sayısını girer (2 tık) |
| CPI/SPI formülleri Excel'de kırılgan | Sistem **otomatik** hesaplar, her hafta güncel |
| Farklı şantiyede aynı kalem farklı fiyat → kimse fark etmez | Sistem **otomatik uyarır** ("A şantiyesi 1180₺'ye yaptı, seninki 1450₺") |
| Haftalık rapor elle birleştirilir | **1 tık** ile PDF/Excel rapor |

---

## 3. Hedef Veri Modeli (Supabase)

Mevcut 9 tabloya ek olarak **puantaj (adam-saat)** katmanı şart:

### 3.1 Yeni Tablolar
```sql
-- Günlük puantaj: taşeron kendi işçisini buradan girer
CREATE TABLE public.timesheets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  project_id uuid not null references projects(id),
  subcontractor_id uuid not null references subcontractors(id),
  work_item_id uuid references work_items(id),
  tarih date not null,
  isci_sayisi integer not null default 0,
  adam_saat numeric(12,2) not null default 0,
  kategori text default 'Türk',
  direk_indirek text default 'Direkt',
  notlar text,
  created_by uuid,
  created_at timestamptz default now(),
  unique (project_id, subcontractor_id, tarih)
);

-- Haftalık fiziki ilerleme girişi: taşeron "bu hafta %X ilerledim" der
CREATE TABLE public.weekly_physical_progress (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  project_id uuid not null references projects(id),
  work_item_id uuid not null references work_items(id),
  subcontractor_id uuid references subcontractors(id),
  week_start date not null,
  haftalik_yuzde numeric(6,3) not null default 0,
  tamamlanan_miktar numeric(18,4) default 0,
  notlar text,
  created_at timestamptz default now(),
  unique (project_id, work_item_id, subcontractor_id, week_start)
);
```

### 3.2 Mevcut Tabloya Ek
```sql
ALTER TABLE public.work_items
  ADD COLUMN birim_fiyat numeric(18,2) default 0,
  ADD COLUMN toplam_butce numeric(20,2) default 0,
  ADD COLUMN planlanan_mh numeric(12,2) default 0;
```

### 3.3 EVM View'ı (otomatik CPI/SPI)
SQL view: her kalem için Planned/Earned/Spent MH → SPI/CPI. Bu, Excel'deki "Budget Code Detailed" sayfasının birebir online karşılığı olacak.

---

## 4. Ekran Yerleşimi (Kurumsal)

```
┌──────────────┬──────────────────────────────────────────────┐
│ SIDEBAR      │ TOPBAR: Proje seçici ▾ + bildirim + avatar    │
│ (koyu)       ├──────────────────────────────────────────────┤
│              │ KPI KARTLARI                                  │
│ ▸ Özet       │ [CPI 0.85] [SPI 0.84] [Fiziki %41.8] [MH]    │
│ ▸ Puantaj    ├──────────────────────────────────────────────┤
│ ▸ İş Kalml.  │ GRAFİK: SPI/CPI trend + Manhour (Recharts)  │
│ ▸ Taşeron    ├──────────────────────────────────────────────┤
│ ▸ Bütçe      │ TABLO: kalem bazlı EVM + taşeron + uyarılar  │
│ ▸ Rapor      │                                              │
└──────────────┴──────────────────────────────────────────────┘
```

### Modül listesi (Sidebar)
1. **Özet** — KPI + SPI/CPI grafik + son uyarılar
2. **Günlük Puantaj** — taşeron kendi işçisini girer
3. **İş Kalemleri & İlerleme** — kalem bazlı EVM tablosu
4. **Taşeron Karşılaştırma** — farklı şantiyede fiyat uyarısı
5. **Bütçe Takibi** — bütçe vs harcanan (CPI renklendirmeli)
6. **Rapor & Dışa Aktarma** — 1 tık Excel/PDF

---

## 5. Uygulama Fazları

### FAZ 0 — Veri Katmanı (önce bu)
- [ ] `timesheets` + `weekly_physical_progress` tabloları + `work_items` ek alanları
- [ ] Supabase'e uygula (ben)
- [ ] `evm_summary` view'ı
- [ ] Demo veri (Excel'den örnek: 5 taşeron, 10 kalem, 4 hafta puantaj)

### FAZ 1 — Tasarım İskeleti
- [ ] Shadcn UI tema + Sidebar + Topbar + layout
- [ ] KPI kartları (CPI, SPI, Fiziki %, Toplam MH)

### FAZ 2 — Modüller (tek tek, her biri onaylı)
- [ ] Özet dashboard
- [ ] Puantaj girişi (taşeron rolü için basit form)
- [ ] EVM tablosu (kalem bazlı)
- [ ] Taşeron fiyat karşılaştırma (uyarı banner'ı)
- [ ] Rapor dışa aktarma

### FAZ 3 — Cila
- [ ] Responsive (mobil — saha)
- [ ] Deploy (Vercel)

---

## 6. Senden Onay Gereken 4 Karar

1. **En kritik modül hangisi?** "Puantaj (adam-saat) girişi" mi, "Taşeron fiyat karşılaştırma" mı?
2. **Taşeron hangi cihazdan girecek?** Telefon (mobil) mu, masaüstü mü?
3. **Rapor çıktısı:** Senin Excel formatının birebir kopyası mı gerekli, web ekran yeter mi?
4. **Ölçü birimi:** Adam-saat (MH) temelli mi, parasal (₺) da paralel mi?

---

**Bu planı onaylarsan FAZ 0'dan başlarım.** Her faz bitince gösteririm.
