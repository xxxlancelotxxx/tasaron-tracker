import os
from pathlib import Path
from decimal import Decimal
from typing import Any, Optional

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from supabase import create_client, Client
from dotenv import load_dotenv

import httpx
import openpyxl
import io

_ENV_PATH = Path(__file__).parent / ".env.local"
if not _ENV_PATH.exists():
    _ENV_PATH = Path(__file__).parent.parent / ".env.local"
load_dotenv(_ENV_PATH)

app = FastAPI(title="Taşeron Takip Sistemi Servisi", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    raise RuntimeError("SUPABASE_URL ve SUPABASE_ANON_KEY tanımlı olmalı (.env.local)")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)


# ============================================================
# MODELLER
# ============================================================
class BidCompareRequest(BaseModel):
    organization_id: str
    project_id: str
    work_item_id: str
    iscilik_fiyat: Decimal = Field(ge=0)
    malzeme_fiyat: Decimal = Field(ge=0)
    birim: str = Field(min_length=1)
    threshold_percent: Decimal = Field(default=Decimal("10"), ge=0)


class EfficiencyReportRequest(BaseModel):
    organization_id: str
    project_id: str


# ============================================================
# ENDPOINTLER
# ============================================================
@app.get("/health")
def health():
    return {"status": "ok", "service": "tasaron-takip-python"}


@app.post("/bids/compare")
def compare_bid(req: BidCompareRequest):
    try:
        url = f"{SUPABASE_URL}/rest/v1/rpc/compare_subcontractor_bid"
        headers = {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
            "Content-Type": "application/json",
        }
        payload = {
            "p_organization_id": req.organization_id,
            "p_project_id": req.project_id,
            "p_work_item_id": req.work_item_id,
            "p_iscilik_fiyat": str(req.iscilik_fiyat),
            "p_malzeme_fiyat": str(req.malzeme_fiyat),
            "p_birim": req.birim,
            "p_threshold_percent": str(req.threshold_percent),
        }
        resp = httpx.post(url, json=payload, headers=headers, timeout=30)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/bids/excel")
async def parse_excel(file: UploadFile = File(...)):
    """Excel dosyasını parse eder: (item_code, description, unit, iscilik, malzeme) kolonlarını çıkarır."""
    content = await file.read()
    wb = openpyxl.load_workbook(io.BytesIO(content), data_only=True)
    ws = wb.active

    rows = []
    headers = None
    for i, row in enumerate(ws.iter_rows(values_only=True)):
        if i == 0:
            headers = [str(c).strip().lower() if c else "" for c in row]
            continue
        if not any(row):
            continue
        # Boş satırları atla
        data = dict(zip(headers, row))
        rows.append(data)

    return {
        "filename": file.filename,
        "headers": headers,
        "total_rows": len(rows),
        "rows": rows[:100],  # ilk 100 satır
    }


@app.post("/reports/weekly")
def weekly_report(req: EfficiencyReportRequest):
    """Bir projenin haftalık EVM raporunu hesaplar (SPI, CPI)."""
    res = (
        supabase.from_("weekly_progress")
        .select("*")
        .eq("organization_id", req.organization_id)
        .eq("project_id", req.project_id)
        .order("week_number")
        .execute()
    )
    rows = res.data or []
    report = []
    for r in rows:
        pv = float(r.get("planlanan_maliyet_pv") or 0)
        ev = float(r.get("kazanilan_deger_ev") or 0)
        ac = float(r.get("fiili_maliyet_ac") or 0)
        spi = ev / pv if pv else None
        cpi = ev / ac if ac else None
        report.append(
            {
                "week": r.get("week_number"),
                "week_start": r.get("week_start"),
                "pv": pv,
                "ev": ev,
                "ac": ac,
                "spi": round(spi, 3) if spi is not None else None,
                "cpi": round(cpi, 3) if cpi is not None else None,
            }
        )
    # Kümülatif SPI/CPI
    total_pv = sum(x["pv"] for x in report)
    total_ev = sum(x["ev"] for x in report)
    total_ac = sum(x["ac"] for x in report)
    return {
        "project_id": req.project_id,
        "weeks": report,
        "summary": {
            "total_pv": total_pv,
            "total_ev": total_ev,
            "total_ac": total_ac,
            "spi": round(total_ev / total_pv, 3) if total_pv else None,
            "cpi": round(total_ev / total_ac, 3) if total_ac else None,
        },
    }
