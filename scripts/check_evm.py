import json
import os
import subprocess

TOKEN = os.environ.get("SUPABASE_TOKEN", "")
REF = os.environ.get("SUPABASE_REF", "")
API = f"https://api.supabase.com/v1/projects/{REF}/database/query"

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

print(run("select item_code, description, planned_mh, earned_mh, spent_mh, cpi, spi from evm_summary order by item_code"))
