import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
url = os.environ.get('SUPABASE_URL')
key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')

sb = create_client(url, key)
res = sb.table('transactions').select('id', count='exact').limit(0).execute()
print(f"Transactions uploaded: {res.count}")
