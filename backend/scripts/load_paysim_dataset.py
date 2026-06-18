import pandas as pd
import uuid
import argparse
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
from supabase import create_client, Client

# Actual Supabase "transactions" table columns:
# id, user_id, amount, currency, type, counterparty_id,
# location_lat, location_lon, ip_address, device_fingerprint,
# risk_score, created_at
#
# We use risk_score=100 for fraud ground truth, risk_score=0 for clean.

def main():
    parser = argparse.ArgumentParser(description="Load PaySim dataset into Sentinel.")
    parser.add_argument("--csv", required=True, help="Path to PaySim CSV file")
    parser.add_argument("--limit", type=int, default=5000, help="Total rows to load (default 5000)")
    parser.add_argument("--supabase-url", help="Supabase URL")
    parser.add_argument("--supabase-key", help="Supabase Key")
    parser.add_argument("--dry-run", action="store_true", help="Print summary without inserting")
    
    args = parser.parse_args()
    
    load_dotenv()
    
    supabase_url = args.supabase_url or os.environ.get("SUPABASE_URL")
    supabase_key = args.supabase_key or os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY")
    
    if not args.dry_run and (not supabase_url or not supabase_key):
        print("Error: Supabase URL and Key are required for insertion (via args or .env)")
        return
        
    if not args.dry_run:
        supabase: Client = create_client(supabase_url, supabase_key)
        
    print(f"Reading dataset from {args.csv}...")
    
    target_total = args.limit
    target_fraud = int(target_total * 0.2)
    
    collected_fraud = []
    collected_clean = []
    
    chunksize = 10000
    try:
        for chunk in pd.read_csv(args.csv, chunksize=chunksize):
            fraud_rows = chunk[chunk['isFraud'] == 1]
            clean_rows = chunk[chunk['isFraud'] == 0]
            
            current_fraud_count = sum(len(df) for df in collected_fraud) if collected_fraud else 0
            current_clean_count = sum(len(df) for df in collected_clean) if collected_clean else 0
            
            if current_fraud_count < target_fraud:
                needed = target_fraud - current_fraud_count
                collected_fraud.append(fraud_rows.head(needed))
                
            if current_clean_count < target_total:
                needed = target_total - current_clean_count
                collected_clean.append(clean_rows.head(needed))
                
            current_fraud_count = sum(len(df) for df in collected_fraud) if collected_fraud else 0
            current_clean_count = sum(len(df) for df in collected_clean) if collected_clean else 0
            
            if current_fraud_count >= target_fraud and current_clean_count >= target_total:
                break
    except FileNotFoundError:
        print(f"Error: Could not find file {args.csv}")
        return
    except Exception as e:
        print(f"Error reading CSV: {e}")
        return
        
    df_fraud = pd.concat(collected_fraud) if collected_fraud else pd.DataFrame()
    df_clean = pd.concat(collected_clean) if collected_clean else pd.DataFrame()
    
    actual_fraud = min(len(df_fraud), target_fraud)
    df_fraud = df_fraud.head(actual_fraud)
    
    actual_clean = min(len(df_clean), target_total - actual_fraud)
    df_clean = df_clean.head(actual_clean)
    
    final_df = pd.concat([df_fraud, df_clean]).reset_index(drop=True)
    
    if len(final_df) == 0:
        print("No valid data found in CSV.")
        return
        
    print(f"Extracted {len(final_df)} rows. Processing conversions...")
    
    base_date = datetime(2026, 2, 1, 0, 0, 0)
    
    type_mapping = {
        "CASH_IN": "CREDIT",
        "CASH_OUT": "DEBIT",
        "PAYMENT": "DEBIT",
        "TRANSFER": "DEBIT",
        "DEBIT": "DEBIT"
    }
    
    records = []
    for _, row in final_df.iterrows():
        timestamp = base_date + timedelta(hours=int(row['step']))
        mapped_type = type_mapping.get(row['type'], "OTHER")
        is_fraud = bool(row['isFraud'])
        
        record = {
            "id": str(uuid.uuid4()),
            "user_id": str(row['nameOrig']),
            "counterparty_id": str(row['nameDest']),
            "amount": float(row['amount']),
            "currency": "INR",
            "type": mapped_type,
            "risk_score": 100 if is_fraud else 0,
            "created_at": timestamp.isoformat()
        }
        records.append(record)
        
    df_records = pd.DataFrame(records)
    print("\n--- Summary ---")
    print(f"Total rows loaded: {len(records)}")
    if len(records) > 0:
        fraud_count = (df_records['risk_score'] == 100).sum()
        clean_count = len(records) - fraud_count
        print(f"Fraud vs clean count: {fraud_count} fraud / {clean_count} clean")
        print(f"Unique users: {df_records['user_id'].nunique()}")
        print(f"Unique counterparties: {df_records['counterparty_id'].nunique()}")
        print(f"Date range: {df_records['created_at'].min()} to {df_records['created_at'].max()}")
        print(f"Transaction type distribution:\n{df_records['type'].value_counts().to_string()}")
        
    if args.dry_run:
        print("\nDry run completed. No data was inserted into Supabase.")
        return
        
    print("\nInserting into Supabase...")
    batch_size = 500
    for i in range(0, len(records), batch_size):
        batch = records[i:i + batch_size]
        try:
            supabase.table("transactions").upsert(batch).execute()
            print(f"Inserted batch {i//batch_size + 1}/{(len(records) + batch_size - 1)//batch_size} ({len(batch)} records)")
        except Exception as e:
            print(f"Error inserting batch {i//batch_size + 1}: {e}")
            
    print("Done!")

if __name__ == "__main__":
    main()
