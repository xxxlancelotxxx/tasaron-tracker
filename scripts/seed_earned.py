import json
import os
import subprocess

TOKEN = os.environ.get("SUPABASE_TOKEN", "")
REF = os.environ.get("SUPABASE_REF", "")
API = f"https://api.supabase.com/v1/projects/{REF}/database/query"

# Demo veride earned MH değerleri: Excel mantığına uygun (tamamlanan_miktar x birim_mh)
sql = """
UPDATE public.weekly_physical_progress SET kazanilan_mh = CASE
  WHEN work_item_id = (SELECT id FROM work_items WHERE item_code='033113.55' LIMIT 1) THEN 8460
  WHEN work_item_id = (SELECT id FROM work_items WHERE item_code='042220' LIMIT 1) THEN 49000
  WHEN work_item_id = (SELECT id FROM work_items WHERE item_code='092320.10' LIMIT 1) THEN 13650
  WHEN work_item_id = (SELECT id FROM work_items WHERE item_code='033113.85' LIMIT 1) THEN 63000
  ELSE 0 END;
"""

def run(q):
    body = json.dumps({"query": q})
    p = subprocess.run(
        ["curl.exe", "-s", "-X", "POST", API,
         "-H", f"Authorization: Bearer {TOKEN}",
         "-H", "Content-Type: application/json",
         "--data-binary", body],
        capture_output=True, text=True,
    )
    return p.stdout

print("update:", run(sql))
print("--- EVM SONUC ---")
print(run("select item_code, description, planlanan_mh, earned_mh, spent_mh, cpi, spi from evm_summary where planlanan_mh > 0 order by item_code"))
