# ============================================================
# TAŞERON TAKİP SİSTEMİ — BAŞLATMA SCRIPTLERİ
# Çift tıkla çalıştır: sol taraf Python servis, sağ taraf Next.js
# ============================================================
Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  TAŞERON TAKİP SİSTEMİ — KURULUM & BAŞLATMA" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

# --- 1) Python servis bağımlılıklarını kur ---
Write-Host "[1/4] Python servis paketleri kuruluyor..." -ForegroundColor Yellow
pip install -r "$root\python_service\requirements.txt" --quiet 2>&1 | Out-Null
Write-Host "      Python paketleri hazır." -ForegroundColor Green

# --- 2) Next.js bağımlılıklarını kur ---
Write-Host "[2/4] Next.js paketleri kuruluyor (npm install)..." -ForegroundColor Yellow
Push-Location $root
npm install 2>&1 | Out-Null
Pop-Location
Write-Host "      npm paketleri hazır." -ForegroundColor Green

# --- 3) .env.local kontrolü ---
Write-Host "[3/4] Ortam ayarları kontrol ediliyor..." -ForegroundColor Yellow
if (-not (Test-Path "$root\.env.local")) {
    Write-Host "      UYARI: .env.local bulunamadı!" -ForegroundColor Red
} else {
    $envContent = Get-Content "$root\.env.local" -Raw
    if ($envContent -match "PASTE_YOUR" -or $envContent -match "YOUR_") {
        Write-Host "      UYARI: .env.local içinde doldurulmamış alanlar var (PASTE_YOUR_...)" -ForegroundColor Red
    } else {
        Write-Host "      .env.local hazır." -ForegroundColor Green
    }
}

# --- 4) Servisleri başlat ---
Write-Host "[4/4] Servisler başlatılıyor..." -ForegroundColor Yellow
Write-Host ""
Write-Host "  Python servis (FastAPI): http://localhost:8000" -ForegroundColor Cyan
Write-Host "  Next.js arayüz        : http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "  (Kapatmak için bu pencereyi kapatın)" -ForegroundColor DarkGray
Write-Host ""

# Python servisini arka planda başlat
Start-Process powershell -ArgumentList "-NoExit","-Command","cd '$root\python_service'; uvicorn main:app --reload --port 8000"

# Next.js dev server'ı başlat (ön planda)
Push-Location $root
npm run dev
Pop-Location
