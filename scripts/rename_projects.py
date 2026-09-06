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

# Organizasyon adını GOS olarak güncelle
print("org:", run("UPDATE organizations SET name = 'GES İnşaat Moskova' WHERE id = (SELECT id FROM organizations ORDER BY created_at LIMIT 1)"))

# Eski demo projeleri (Ankara/İstanbul/İzmir) Nagatino-2'ye dönüştür
print("proj:", run("""
UPDATE projects SET
  name = CASE code WHEN 'ANK-001' THEN 'Nagatino-2 Hotel' WHEN 'IST-002' THEN 'Nagatino-2 Residential' WHEN 'IZM-003' THEN 'Nagatino-2 Hotel (Faz 2)' ELSE name END,
  client_name = 'GES Moscow',
  address = 'Nagatino, Moskova'
WHERE organization_id = (SELECT id FROM organizations ORDER BY created_at LIMIT 1)
"""))

print("--- SONUC ---")
print(run("select code, name, client_name from projects order by code"))
