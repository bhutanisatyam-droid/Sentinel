import os
import sys
import time
from dotenv import load_dotenv
from supabase import create_client, Client

def main():
    print("================================================================")
    print("      SENTINEL: RESETTING DEMO TRANSACTIONS AND ALERTS          ")
    print("================================================================")
    
    load_dotenv()
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not supabase_key:
        print("X Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env")
        sys.exit(1)

    supabase: Client = create_client(supabase_url, supabase_key)

    try:
        # We need to find the specific transactions to delete so we can also delete their alerts.
        # 1. demo_user_% & user_geo_traveler transactions
        print("🔍 Searching for demo transactions...")
        demo_txns = supabase.table("transactions").select("id").or_("user_id.like.demo_user_%,user_id.eq.user_geo_traveler").execute()
        
        # 2. PAN Evasion manual transactions (49999.0)
        pan_txns = supabase.table("transactions").select("id").eq("amount", 49999.0).execute()
        
        # 3. Behavioral Anomaly transactions (3000000.0)
        anomaly_txns = supabase.table("transactions").select("id").eq("amount", 3000000.0).execute()
        
        # Collect all IDs
        all_ids = []
        if demo_txns.data: all_ids.extend([t["id"] for t in demo_txns.data])
        if pan_txns.data: all_ids.extend([t["id"] for t in pan_txns.data])
        if anomaly_txns.data: all_ids.extend([t["id"] for t in anomaly_txns.data])
        
        all_ids = list(set(all_ids)) # Deduplicate
        
        if not all_ids:
            print("✅ No demo transactions found to clean up.")
            sys.exit(0)
            
        print(f"🗑️ Found {len(all_ids)} transactions to delete.")
        
        # Delete alerts referencing these transactions
        # Alerts store transaction_id in the details JSON. For simplicity and robustness,
        # since SQLite/Supabase makes JSON querying complex for mass deletes sometimes, 
        # we will fetch top recent alerts and check their details string.
        print("🔍 Scanning recent alerts for these transactions...")
        alerts = supabase.table("alerts").select("id, details").order("created_at", desc=True).limit(1000).execute()
        
        alerts_to_delete = []
        for alert in alerts.data:
            details_str = alert.get("details", "")
            if not details_str: continue
            
            # Simple substring match against the known transaction IDs
            for txn_id in all_ids:
                if txn_id in str(details_str):
                    alerts_to_delete.append(alert["id"])
                    break
                    
        if alerts_to_delete:
            print(f"🗑️ Deleting {len(alerts_to_delete)} associated alerts...")
            # Delete in chunks of 50
            for i in range(0, len(alerts_to_delete), 50):
                chunk = alerts_to_delete[i:i+50]
                supabase.table("alerts").delete().in_("id", chunk).execute()
                time.sleep(0.1)
                
        print(f"🗑️ Deleting {len(all_ids)} transactions...")
        # Delete transactions in chunks of 50
        for i in range(0, len(all_ids), 50):
            chunk = all_ids[i:i+50]
            supabase.table("transactions").delete().in_("id", chunk).execute()
            time.sleep(0.1)
            
        print("✅ Demo data reset successfully.")
        
    except Exception as e:
        print(f"X Error resetting data: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
