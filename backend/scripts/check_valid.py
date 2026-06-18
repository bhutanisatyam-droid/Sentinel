import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
supabase = create_client(os.environ.get("SUPABASE_URL"), os.environ.get("SUPABASE_SERVICE_ROLE_KEY"))

res = supabase.table("alerts").select("id, severity, ai_summary").neq('ai_summary', 'None').order("created_at", desc=True).limit(50).execute()

valid = [a for a in res.data if a.get("ai_summary") and "429" not in a["ai_summary"]]

print(f"Found {len(valid)} valid Groq Explainabilities.")
for i, a in enumerate(valid[:3]):
    print(f"[{i+1}] Alert {a['id']}:")
    print(f"{a['ai_summary']}\n")
