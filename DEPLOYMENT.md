# 🚀 Taşeron Takip Sistemi — Canlıya Alma Rehberi

Bu rehber, **hiç kod bilmeyen biri** için hazırlanmıştır. Adım adım takip edin, 30-45 dakikada sisteminiz internette canlıya çıkar.

**Ne elde edeceksiniz?**
- Herkesin `https://sizin-siteniz.com` adresinden ulaşabildiği profesyonel bir web uygulaması
- Kullanıcı girişi (email + şifre)
- Taşeron teklif takibi, fiyat karşılaştırma, SPI/CPI raporları
- Otomatik yedekleme, SSL sertifikası, global hız

**Kullanılan altyapı (hepsi ücretsiz tier ile başlar):**
| Servis | Ne yapar | Maliyet |
|--------|----------|---------|
| **Supabase** | Veritabanı + kullanıcı girişi + dosya depolama | Ücretsiz (500 MB DB) |
| **Vercel** | Web sitesi barındırma + domain + SSL | Ücretsiz (Hobby plan) |
| **GitHub** | Kod depolama + otomatik deploy | Ücretsiz |

---

## 📋 Başlamadan Önce Gerekenler

Sadece 3 hesap açmanız gerekiyor (hepsi ücretsiz):

1. **GitHub hesabı** → https://github.com/signup
2. **Vercel hesabı** → https://vercel.com/signup (GitHub ile giriş yapın)
3. **Supabase hesabı** → https://supabase.com/dashboard (GitHub ile giriş yapın)

---

## ADIM 1: GitHub'a Kodu Yükleyin (10 dk)

1. GitHub'da yeni repo oluşturun: **"New repository"** → isim: `tasaron-takip` → **"Create repository"**
2. Bu klasördeki tüm dosyaları GitHub'a yükleyin.

**Kolay yol (sürükle-bırak):**
- GitHub'da repo sayfasında **"uploading an existing file"** linkine tıklayın
- Bu klasördeki tüm dosya ve klasörleri sürükleyip bırakın (`.github`, `app`, `components`, `lib`, `scripts`, `supabase` klasörleri + diğer tüm dosyalar)
- **"Commit changes"** butonuna basın

**VEYA komut satırı ile (bilenler için):**
```bash
git init
git add .
git commit -m "Taşeron takip sistemi ilk sürüm"
git branch -M main
git remote add origin https://github.com/SIZIN-KULLANICI-ADINIZ/tasaron-takip.git
git push -u origin main
```

---

## ADIM 2: Supabase Veritabanı Kurun (15 dk)

1. https://supabase.com/dashboard → **"New project"**
2. Bilgileri doldurun:
   - **Name**: `tasaron-takip`
   - **Database Password**: Güçlü bir şifre belirleyin (BUNU BİR YERE NOT EDİN!)
   - **Region**: `Frankfurt (eu-central-1)` — Avrupa için en hızlısı
3. **"Create new project"** → 2-3 dakika bekleyin

4. Şimdi veritabanı tablolarını oluşturalım:
   - Sol menüden **"SQL Editor"** → **"New query"**
   - `supabase/migrations/20240115000000_initial_schema.sql` dosyasının İÇERİĞİNİ kopyalayın
   - SQL Editor'a yapıştırın → **"Run"** butonuna basın
   - Tekrar **"New query"** → `20240115000001_seed_data.sql` içeriğini yapıştırın → **"Run"**

5. API anahtarlarınızı alın:
   - Sol menüden **"Project Settings"** (dişli ikonu) → **"API"**
   - **Project URL** ve **anon public key** değerlerini not edin (Adım 4'te kullanılacak)

---

## ADIM 3: Vercel'e Bağlayın (10 dk)

1. https://vercel.com → **"Add New"** → **"Project"**
2. GitHub repo'nuzu seçin: `tasaron-takip` → **"Import"**
3. Vercel otomatik olarak Next.js olduğunu algılar — hiçbir ayar değiştirmeyin
4. **"Environment Variables"** bölümünde şunları ekleyin (Adım 2'den aldığınız değerler):

| İsim | Değer |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase'den kopyaladığınız Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase'den kopyaladığınız anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase'den service_role key (gizli) |
| `NEXT_PUBLIC_APP_URL` | `https://tasaron-takip.vercel.app` (deploy sonrası gerçek URL ile değişirin) |

5. **"Deploy"** butonuna basın → 2-3 dakika bekleyin
6. Deploy bittiğinde size bir URL verilecek: `https://tasaron-takip-xxxxx.vercel.app`

**🎉 Tebrikler! Sisteminiz artık canlı!**

---

## ADIM 4: Domain Bağlayın (İsteğe Bağlı — 5 dk)

Kendi domain'iniz varsa (örn. `sirketiniz.com`):

1. Vercel Dashboard → Projeniz → **"Settings"** → **"Domains"**
2. **"Add Domain"** → domain adınızı yazın → **"Add"**
3. Vercel size DNS kayıtları verecek (A record veya CNAME)
4. Domain sağlayıcınızda (GoDaddy, Namecheap, İsimtescil vb.) bu kayıtları ekleyin
5. 10-15 dakika içinde domain aktif olur, SSL otomatik kurulur

Domain satın almak için: https://www.namecheap.com veya https://www.isimtescil.net (Türkçe)

---

## ADIM 5: İlk Kullanıcıyı Oluşturun (2 dk)

1. Canlı sitenize gidin
2. **"Sign Up"** ile ilk kullanıcıyı oluşturun (kendi email + şifreniz)
3. Bu kullanıcı otomatik olarak "Demo İnşaat A.Ş." organizasyonuna bağlanır
4. Dashboard'da örnek verileri göreceksiniz (3 proje, 4 taşeron, haftalık ilerleme verileri)

---

## 🔄 Sonraki Güncellemeler (Kod Değişiklikleri)

Kodda değişiklik yaptığınızda:
1. Değişiklikleri GitHub'a push edin
2. Vercel otomatik olarak yeniden deploy eder (30 saniye)
3. Hiçbir şey yapmanıza gerek yok — tam otomatik

---

## ❓ Sık Sorulan Sorular

**Verilerim güvende mi?**
Evet. Supabase günlük otomatik yedekleme yapar, SSL şifreleme kullanır.

**Ne kadar büyüyebilirim?**
Ücretsiz tier: 500 MB veritabanı, 100.000 kullanıcı, 2 GB dosya depolama. Yetmezse ayda $25'a çıkarsınız.

**Telefonumdan da kullanabilir miyim?**
Evet. Site tamamen responsive, mobil tarayıcıdan da çalışır.

**Başka şantiyelerdeki kullanıcılar nasıl girecek?**
Onlara site URL'ini verin, kendi hesaplarını oluştursunlar. Siz onları "member" olarak ekleyebilirsiniz.

---

## 🆘 Sorun mu yaşıyorsunuz?

Yukarıdaki adımlarda takıldıysanız, bana hangi adımda olduğunuzu ve gördüğünüz hata mesajını söyleyin — size yardımcı olayım.
