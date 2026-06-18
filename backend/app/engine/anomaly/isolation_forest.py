import numpy as np
import pickle
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import shap
from .feature_engineering import TransactionFeatureExtractor

class AnomalyDetector:
    def __init__(self, contamination: float = 0.05):
        self.model = None
        self.feature_extractor = TransactionFeatureExtractor()
        self.feature_names = [
            "amount_zscore", "amount_log", "time_since_last_txn_hours",
            "txn_count_24h", "txn_count_7d", "unique_counterparties_7d",
            "hour_of_day", "day_of_week", "is_round_number",
            "amount_to_avg_ratio", "max_amount_ratio", "velocity_change"
        ]
        self.scaler = StandardScaler()
        self.is_trained = False
        self.min_score = 0.0
        self.max_score = 0.0
        self.contamination = contamination

    def train(self, transactions: list[dict], user_histories: dict, user_profiles: dict):
        # Extract features
        features_list = self.feature_extractor.batch_extract(transactions, user_histories, user_profiles)
        
        # Convert to numpy array in the exact order of self.feature_names
        X = np.array([[f[name] for name in self.feature_names] for f in features_list])
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Train model
        self.model = IsolationForest(
            n_estimators=200, 
            contamination=self.contamination, 
            random_state=42, 
            n_jobs=-1
        )
        self.model.fit(X_scaled)
        
        # Calculate min/max scores for normalization later
        scores = self.model.decision_function(X_scaled)
        self.min_score = scores.min()
        self.max_score = scores.max()
        
        self.is_trained = True

    def predict(self, transaction: dict, user_history: list[dict], user_profile: dict) -> dict:
        if not self.is_trained:
            return {"anomaly": False, "score": 0.0, "error": "Model not trained"}

        # Extract & scale
        features_dict = self.feature_extractor.extract_features(transaction, user_history, user_profile)
        X = np.array([[features_dict[name] for name in self.feature_names]])
        X_scaled = self.scaler.transform(X)

        # Predict
        raw_score = self.model.decision_function(X_scaled)[0]
        
        # Normalize to 0-1 range (invert so higher = more anomalous)
        # raw_score is usually negative for anomalies, positive for normal
        if self.max_score == self.min_score:
            anomaly_score = 0.0
        else:
            normalized = (raw_score - self.min_score) / (self.max_score - self.min_score)
            anomaly_score = 1.0 - normalized

        # Use the native predict method (-1 is anomaly, 1 is normal)
        prediction = self.model.predict(X_scaled)[0]
        is_anomaly = bool(prediction == -1)
        explanations = self.get_shap_explanation(features_dict, X_scaled)

        return {
            "anomaly": is_anomaly,
            "score": float(anomaly_score),
            "feature_contributions": explanations
        }

    def get_shap_explanation(self, transaction_features: dict, X_scaled: np.ndarray = None) -> list[dict]:
        if not self.is_trained or self.model is None:
            return []
            
        if X_scaled is None:
            X = np.array([[transaction_features[name] for name in self.feature_names]])
            X_scaled = self.scaler.transform(X)

        # Isolation forest works with SHAP TreeExplainer
        explainer = shap.TreeExplainer(self.model)
        shap_values = explainer.shap_values(X_scaled)[0]

        # Combine feature names, SHAP values, and raw values
        contributions = []
        for i, name in enumerate(self.feature_names):
            contributions.append({
                "feature": name,
                "contribution": float(shap_values[i]),
                "value": float(transaction_features[name])
            })
            
        # Sort by absolute contribution (highest first) and return top 3
        contributions.sort(key=lambda x: abs(x["contribution"]), reverse=True)
        return contributions[:3]

    def save_model(self, path: str):
        with open(path, 'wb') as f:
            pickle.dump({
                'model': self.model,
                'scaler': self.scaler,
                'is_trained': self.is_trained,
                'min_score': self.min_score,
                'max_score': self.max_score
            }, f)

    def load_model(self, path: str):
        with open(path, 'rb') as f:
            data = pickle.load(f)
            self.model = data['model']
            self.scaler = data['scaler']
            self.is_trained = data['is_trained']
            self.min_score = data['min_score']
            self.max_score = data['max_score']
