import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
url = os.environ.get('SUPABASE_URL')
key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')

sb = create_client(url, key)

# Query a single row to see column names
res = sb.table('transactions').select('*').limit(0).execute()
print("Data:", res.data)

# Try inserting a minimal row to see what columns are accepted
# Actually let's just query the information_schema via RPC or postgrest
# Simplest: fetch 1 row if any exist, or try OPTIONS
import requests
headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}",
}
# Use the OpenAPI schema endpoint to find table columns
resp = requests.get(f"{url}/rest/v1/", headers=headers)
if resp.status_code == 200:
    schema = resp.json()
    if "definitions" in schema:
        txn_def = schema["definitions"].get("transactions", {})
        if txn_def:
            print("\nTransactions table columns:")
            for col, info in txn_def.get("properties", {}).items():
                print(f"  {col}: {info.get('type', 'unknown')} - {info.get('description', '')}")
        else:
            print("No 'transactions' definition found in schema")
    else:
        print("No definitions in schema response")
        # Try paths
        paths = schema.get("paths", {})
        txn_path = paths.get("/transactions", {})
        if txn_path:
            print("\nTransactions path found, checking GET parameters:")
            get_op = txn_path.get("get", {})
            params = get_op.get("parameters", [])
            for p in params:
                if p.get("in") == "query" and p.get("name") not in ["select", "order", "limit", "offset", "Range", "Range-Unit", "on_conflict", "Prefer"]:
                    print(f"  {p['name']}")
else:
    print(f"Failed to fetch schema: {resp.status_code} {resp.text[:500]}")
