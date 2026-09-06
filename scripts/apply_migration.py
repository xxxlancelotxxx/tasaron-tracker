# Migration uygulama: Supabase Management API uzerinden SQL calistirir
import os, urllib.request, json, sys

API_TOKEN = os.environ.get("SUPABASE_TOKEN", "")
PROJECT_REF = os.environ.get("SUPABASE_REF", "")
SQL_PATH = r"C:\Users\berkant.senturk\Documents\Default Project\supabase\migrations\20260904000000_tasaron_takip_schema.sql"

with open(SQL_PATH, "r", encoding="utf-8") as f:
    sql = f.read()

# SQL migrasyonu parcalara bol (cok uzunsa API limiti olabilir)
payload = json.dumps({"query": sql}).encode("utf-8")

url = f"https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query"
req = urllib.request.Request(url, data=payload, method="POST")
req.add_header("Authorization", f"Bearer {API_TOKEN}")
req.add_header("Content-Type", "application/json")

try:
    resp = urllib.request.urlopen(req, timeout=120)
    body = resp.read().decode("utf-8")
    print("HTTP", resp.status)
    print("SUCCESS")
    print(body[:2000])
except urllib.error.HTTPError as e:
    body = e.read().decode("utf-8")
    print("HTTP", e.code)
    print("ERROR")
    print(body[:3000])
