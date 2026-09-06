import json
import os
import subprocess
import urllib.request

TOKEN = os.environ.get("SUPABASE_TOKEN", "")
REF = os.environ.get("SUPABASE_REF", "")
API = f"https://api.supabase.com/v1/projects/{REF}/database/query"


def sql(q):
    p = subprocess.run(
        ["curl.exe", "-s", "-X", "POST", API,
         "-H", f"Authorization: Bearer {TOKEN}",
         "-H", "Content-Type: application/json",
         "--data-binary", json.dumps({"query": q})],
        capture_output=True, text=True,
    )
    return json.loads(p.stdout)


org = sql("select id from organizations limit 1")[0]["id"]
proj = sql("select id as work_item_id, project_id from work_items limit 1")[0]
print("org_id:", org)
print("work_item_id:", proj["work_item_id"])
print("project_id:", proj["project_id"])

# 1500 TL birim fiyatla teklif gir -> en dusuk (1180) uzerinden %27 pahali, uyari beklenir
payload = {
    "organization_id": org,
    "project_id": proj["project_id"],
    "work_item_id": proj["work_item_id"],
    "iscilik_fiyat": "200",
    "malzeme_fiyat": "1300",
    "birim": "m³",
    "threshold_percent": "10",
}
req = urllib.request.Request(
    "http://127.0.0.1:8000/bids/compare",
    data=json.dumps(payload).encode("utf-8"),
    method="POST",
)
req.add_header("Content-Type", "application/json")
try:
    resp = urllib.request.urlopen(req, timeout=30)
    result = json.loads(resp.read().decode("utf-8"))
    print("\n=== KARSILASTIRMA SONUCU ===")
    print(json.dumps(result, indent=2, ensure_ascii=False))
except urllib.error.HTTPError as e:
    print("HTTP", e.code, e.read().decode("utf-8")[:500])
