import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
supabase = create_client(os.environ.get("SUPABASE_URL"), os.environ.get("SUPABASE_SERVICE_ROLE_KEY"))

res = supabase.table("alerts").select("id, severity, ai_summary").order("created_at", desc=True).limit(5).execute()
for a in res.data:
    print(f"Alert {a['id']}:")
    print(f"Explainability: {a['ai_summary']}\n")
