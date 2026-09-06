import json
import os
import subprocess

TOKEN = os.environ.get("SUPABASE_TOKEN", "")
REF = os.environ.get("SUPABASE_REF", "")
API = f"https://api.supabase.com/v1/projects/{REF}/database/query"

sql = """
ALTER TABLE public.weekly_physical_progress ADD COLUMN IF NOT EXISTS kazanilan_mh NUMERIC(14,2) NOT NULL DEFAULT 0;

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
    SELECT work_item_id, SUM(kazanilan_mh) AS earned_mh
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
"""

body = json.dumps({"query": sql})
p = subprocess.run(
    ["curl.exe", "-s", "-X", "POST", API,
     "-H", f"Authorization: Bearer {TOKEN}",
     "-H", "Content-Type: application/json",
     "--data-binary", body],
    capture_output=True, text=True,
)
print(p.stdout)
