import os
import sys
import uuid
from dotenv import load_dotenv
from supabase import create_client, Client

# Add backend dir to path so we can import app modules if needed
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def seed_users():
    load_dotenv()
    supabase_url = os.environ.get("SUPABASE_URL")
    # MUST use service role key to bypass RLS and create users
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not supabase_key:
        print("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
        return

    print("🔌 Connecting to Supabase...")
    supabase: Client = create_client(supabase_url, supabase_key)

    # 1. Test database connection / schema existence
    try:
        print("🔍 Checking if user_profiles table exists...")
        res = supabase.table("user_profiles").select("id").limit(1).execute()
        print("✅ user_profiles table exists and is accessible.")
    except Exception as e:
        print(f"❌ Database error: The migration might not be applied correctly. Details: {e}")
        return

    # 2. Define our test users
    test_users = [
        {"email": "admin@sentinel.local", "password": "password123", "role": "ADMIN", "name": "System Admin"},
        {"email": "officer@sentinel.local", "password": "password123", "role": "COMPLIANCE_OFFICER", "name": "Senior Officer"},
        {"email": "analyst@sentinel.local", "password": "password123", "role": "COMPLIANCE_ANALYST", "name": "Tier 1 Analyst"},
        {"email": "customer@sentinel.local", "password": "password123", "role": "CUSTOMER", "name": "Demo Customer"}
    ]

    print("\n🌱 Seeding test users via Admin Auth API...")
    
    for user_data in test_users:
        try:
            # Check if user already exists
            print(f"   Creating {user_data['email']}...")
            auth_res = supabase.auth.admin.create_user({
                "email": user_data["email"],
                "password": user_data["password"],
                "email_confirm": True,
                "user_metadata": {"full_name": user_data["name"]}
            })
            user_id = auth_res.user.id
            print(f"   ✅ Created auth user {user_id}")
            
            # The trigger SHOULD have auto-created a CUSTOMER profile. Let's force update the role.
            print(f"   Updating role to {user_data['role']} in user_profiles...")
            update_res = supabase.table("user_profiles").update({
                "role": user_data["role"],
                "full_name": user_data["name"]
            }).eq("id", user_id).execute()
            
            if len(update_res.data) > 0:
                print(f"   ✅ Profile updated successfully to {user_data['role']}")
            else:
                print(f"   ❌ Warning: Expected a profile to update, but none found. Did the trigger fire?")
                
        except Exception as e:
            err_msg = str(e)
            if "already been registered" in err_msg or "User already exists" in err_msg:
                print(f"   ℹ️ User {user_data['email']} already exists. Updating their role directly.")
                # We need to find their ID... Since the admin API doesn't easily let us find by email cleanly in typical supabase-py
                # Let's try to query auth.users if we have permissions... wait, supabase-py admin API has list_users
                try:
                    users_res = supabase.auth.admin.list_users()
                    target_id = next((u.id for u in users_res if getattr(u, 'email', '') == user_data['email']), None)
                    if target_id:
                        supabase.table("user_profiles").upsert({
                            "id": target_id,
                            "role": user_data["role"],
                            "full_name": user_data["name"]
                        }).execute()
                        print(f"   ✅ Profile updated for existing user.")
                except Exception as inner_e:
                     print(f"   ⚠️ Could not update existing user profile: {inner_e}")
            else:
                print(f"   ❌ Error creating user {user_data['email']}: {e}")

    print("\n🎉 Seeding complete. You can now test these credentials.")

if __name__ == "__main__":
    seed_users()
