import json, os, urllib.request

TOKEN = os.environ.get("SUPABASE_TOKEN", "")
REF = os.environ.get("SUPABASE_REF", "")

def sql(q):
    body = json.dumps({"query": q}).encode("utf-8")
    req = urllib.request.Request(
        f"https://api.supabase.com/v1/projects/{REF}/database/query",
        data=body, method="POST"
    )
    req.add_header("Authorization", f"Bearer {TOKEN}")
    req.add_header("Content-Type", "application/json")
    # curl calisiyordu; urllib 403 veriyordu. curl kullanmak yerine subprocess.
    import subprocess
    p = subprocess.run(
        ["curl.exe", "-s", "-X", "POST",
         f"https://api.supabase.com/v1/projects/{REF}/database/query",
         "-H", f"Authorization: Bearer {TOKEN}",
         "-H", "Content-Type: application/json",
         "--data-binary", json.dumps({"query": q})],
        capture_output=True, text=True
    )
    return p.stdout

q = "select (select count(*) from projects) as proj, (select count(*) from subcontractors) as subs, (select count(*) from work_items) as wi, (select count(*) from contract_bids) as bids, (select count(*) from weekly_progress) as wp"
print(sql(q))
