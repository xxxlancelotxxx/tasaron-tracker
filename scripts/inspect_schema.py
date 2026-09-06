import json
import os
import subprocess

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

tables = sql("select table_name from information_schema.tables where table_schema='public' order by table_name")
print("MEVCUT TABLOLAR:")
for t in tables:
    print(" -", t["table_name"])

print()
cols = sql("select table_name, column_name from information_schema.columns where table_schema='public' order by table_name, ordinal_position")
by_table = {}
for c in cols:
    by_table.setdefault(c["table_name"], []).append(c["column_name"])
for t, cs in by_table.items():
    print(f"{t}: {', '.join(cs)}")
