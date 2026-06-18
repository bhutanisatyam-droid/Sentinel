import math
from datetime import datetime, timedelta

class TransactionFeatureExtractor:
    def extract_features(self, transaction: dict, user_history: list[dict], user_profile: dict) -> dict:
        amount = transaction.get("amount", 0.0)
        timestamp_str = transaction.get("timestamp")
        
        # Parse timestamp
        try:
            txn_time = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
        except (ValueError, TypeError, AttributeError):
            txn_time = datetime.utcnow()

        # 1. amount_zscore
        user_mean = user_profile.get("mean_transaction_amount", 0.0)
        user_std = user_profile.get("std_transaction_amount", 0.0)
        amount_zscore = (amount - user_mean) / user_std if user_std > 0 else 0.0

        # 2. amount_log
        amount_log = math.log10(amount + 1)

        # Calculate time windows
        time_24h_ago = txn_time - timedelta(hours=24)
        time_7d_ago = txn_time - timedelta(days=7)
        
        txn_count_24h = 0
        txn_count_7d = 0
        unique_counterparties_7d = set()
        last_txn_time = None
        max_historical_amount = 0.0

        # Process user history
        for past_txn in user_history:
            past_amount = past_txn.get("amount", 0.0)
            if past_amount > max_historical_amount:
                max_historical_amount = past_amount
                
            try:
                past_time = datetime.fromisoformat(past_txn.get("timestamp").replace('Z', '+00:00'))
            except (ValueError, TypeError, AttributeError):
                continue
                
            if last_txn_time is None or past_time > last_txn_time:
                last_txn_time = past_time

            if past_time >= time_24h_ago:
                txn_count_24h += 1
            if past_time >= time_7d_ago:
                txn_count_7d += 1
                unique_counterparties_7d.add(past_txn.get("counterparty_id"))

        # 3. time_since_last_txn_hours
        if last_txn_time:
            time_since_last_txn_hours = (txn_time - last_txn_time).total_seconds() / 3600.0
        else:
            time_since_last_txn_hours = 0.0

        # 4 & 5 & 6
        unique_cps_7d_count = len(unique_counterparties_7d)

        # 7 & 8
        hour_of_day = txn_time.hour
        day_of_week = txn_time.weekday()

        # 9. is_round_number
        is_round_number = 1.0 if (amount > 0 and amount % 1000 == 0) else 0.0

        # 10. amount_to_avg_ratio
        amount_to_avg_ratio = (amount / user_mean) if user_mean > 0 else 0.0

        # 11. max_amount_ratio
        max_amount_ratio = (amount / max_historical_amount) if max_historical_amount > 0 else 0.0

        # 12. velocity_change
        avg_daily_txn_count = user_profile.get("avg_daily_txn_count", 0.0)
        if avg_daily_txn_count > 0:
            velocity_change = (txn_count_24h - avg_daily_txn_count) / avg_daily_txn_count
        else:
            velocity_change = 0.0

        return {
            "amount_zscore": float(amount_zscore),
            "amount_log": float(amount_log),
            "time_since_last_txn_hours": float(time_since_last_txn_hours),
            "txn_count_24h": float(txn_count_24h),
            "txn_count_7d": float(txn_count_7d),
            "unique_counterparties_7d": float(unique_cps_7d_count),
            "hour_of_day": float(hour_of_day),
            "day_of_week": float(day_of_week),
            "is_round_number": float(is_round_number),
            "amount_to_avg_ratio": float(amount_to_avg_ratio),
            "max_amount_ratio": float(max_amount_ratio),
            "velocity_change": float(velocity_change)
        }

    def batch_extract(self, transactions: list[dict], user_histories: dict, user_profiles: dict) -> list[dict]:
        features = []
        for txn in transactions:
            user_id = txn.get("user_id")
            history = user_histories.get(user_id, [])
            profile = user_profiles.get(user_id, {})
            features.append(self.extract_features(txn, history, profile))
        return features
