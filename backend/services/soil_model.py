"""
SoilNet — Deep Learning model for crop recommendation.

A PyTorch neural network trained on real soil + climate data to predict
the best crop to grow. Runs 100% locally — no API calls, no rate limits.

Input:  7 features — N, P, K, temperature, humidity, pH, rainfall
Output: 22 crop classes (rice, maize, chickpea, etc.)
"""

import os
import numpy as np
import torch
import torch.nn as nn

# ===== Model Architecture =====

CROP_LABELS = [
    "rice", "maize", "chickpea", "kidneybeans", "pigeonpeas",
    "mothbeans", "mungbean", "blackgram", "lentil", "pomegranate",
    "banana", "mango", "grapes", "watermelon", "muskmelon",
    "apple", "orange", "papaya", "coconut", "cotton", "jute", "coffee",
]

CROP_NAMES_TH = {
    "rice": "ข้าว", "maize": "ข้าวโพด", "chickpea": "ถั่วลูกไก่",
    "kidneybeans": "ถั่วแดง", "pigeonpeas": "ถั่วมะแฮะ",
    "mothbeans": "ถั่วมอธ", "mungbean": "ถั่วเขียว", "blackgram": "ถั่วดำ",
    "lentil": "ถั่วเลนทิล", "pomegranate": "ทับทิม", "banana": "กล้วย",
    "mango": "มะม่วง", "grapes": "องุ่น", "watermelon": "แตงโม",
    "muskmelon": "แคนตาลูป", "apple": "แอปเปิ้ล", "orange": "ส้ม",
    "papaya": "มะละกอ", "coconut": "มะพร้าว", "cotton": "ฝ้าย",
    "jute": "ปอกระเจา", "coffee": "กาแฟ",
}

# Feature column names (order matters — must match training)
FEATURE_COLS = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]


class SoilNet(nn.Module):
    """
    Neural network for crop recommendation.
    Input:  7 features (N, P, K, temperature, humidity, pH, rainfall)
    Output: 22 classes (crop types)
    """

    def __init__(self, n_features=7, n_classes=22):
        super(SoilNet, self).__init__()
        self.network = nn.Sequential(
            nn.Linear(n_features, 128),
            nn.ReLU(),
            nn.BatchNorm1d(128),
            nn.Dropout(0.3),
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.BatchNorm1d(64),
            nn.Dropout(0.2),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Linear(32, n_classes),
        )

    def forward(self, x):
        return self.network(x)


# ===== Optimal Ranges =====

OPTIMAL_RANGES = {
    "ph":  {"low": 5.5, "high": 7.5, "unit": ""},
    "N":   {"low": 20,  "high": 120, "unit": "kg/ha"},
    "P":   {"low": 10,  "high": 80,  "unit": "kg/ha"},
    "K":   {"low": 10,  "high": 80,  "unit": "kg/ha"},
}

FERTILIZER_MAP = {
    "low_N":  "ใส่ปุ๋ยไนโตรเจน (เช่น ยูเรีย 46-0-0) เพิ่ม",
    "high_N": "ลดปุ๋ยไนโตรเจน — อาจทำให้ใบเจริญเกินไป",
    "low_P":  "ใส่ปุ๋ยฟอสฟอรัส (เช่น 0-46-0 หรือกระดูกป่น)",
    "high_P": "ลดปุ๋ยฟอสฟอรัส — อาจสะสมเกินไป",
    "low_K":  "ใส่ปุ๋ยโพแทสเซียม (เช่น 0-0-60)",
    "high_K": "ลดปุ๋ยโพแทสเซียม",
    "low_pH": "ใส่ปูนขาว (Lime) เพื่อเพิ่มค่า pH",
    "high_pH": "ใส่กำมะถัน (Sulfur) เพื่อลดค่า pH",
}


# ===== Analyzer Class =====

class SoilAnalyzer:
    """
    Wraps SoilNet with preprocessing, prediction, and recommendation logic.
    Falls back to basic analysis if model weights are not available.
    """

    def __init__(self, model_path: str = None):
        if model_path is None:
            model_path = os.path.join(
                os.path.dirname(__file__), "..", "models", "soil_model.pth"
            )
        self.model_path = model_path
        self.model = None
        self.use_dl = False

        # Normalization parameters (loaded from checkpoint)
        self.mean = np.zeros(7)
        self.std = np.ones(7)

        self._load_model()

    def _load_model(self):
        """Try to load the trained model weights."""
        if os.path.exists(self.model_path):
            try:
                self.model = SoilNet()
                checkpoint = torch.load(self.model_path, map_location="cpu", weights_only=False)
                self.model.load_state_dict(checkpoint["model_state_dict"])
                if "mean" in checkpoint:
                    self.mean = np.array(checkpoint["mean"])
                if "std" in checkpoint:
                    self.std = np.array(checkpoint["std"])
                self.model.eval()
                self.use_dl = True
                print(f"✅ DinApp model loaded from {self.model_path}")
            except Exception as e:
                print(f"⚠️ Failed to load DinApp model: {e}. Using rule-based fallback.")
                self.use_dl = False
        else:
            print(f"ℹ️ No model file at {self.model_path}. Using rule-based fallback.")

    def _normalize(self, features: np.ndarray) -> np.ndarray:
        """Normalize features using saved mean/std."""
        return (features - self.mean) / (self.std + 1e-8)

    def predict_crop(self, n, p, k, temp, humidity, ph, rainfall) -> dict:
        """Predict the best crop for given soil + climate conditions."""
        features = np.array([n, p, k, temp, humidity, ph, rainfall], dtype=np.float32)

        if self.use_dl:
            normalized = self._normalize(features)
            tensor = torch.FloatTensor(normalized).unsqueeze(0)
            with torch.no_grad():
                output = self.model(tensor)
                probs = torch.softmax(output, dim=1).squeeze().numpy()
                top3_indices = probs.argsort()[-3:][::-1]

            top3 = []
            for idx in top3_indices:
                crop_en = CROP_LABELS[idx]
                crop_th = CROP_NAMES_TH.get(crop_en, crop_en)
                top3.append({
                    "crop": crop_en,
                    "crop_th": crop_th,
                    "confidence": round(float(probs[idx]) * 100, 1),
                })
            return {"top_crops": top3}
        else:
            return {"top_crops": [{"crop": "unknown", "crop_th": "ไม่ทราบ", "confidence": 0}]}

    def _classify_health(self, ph, n, p, k) -> str:
        """Classify soil health based on NPK + pH ranges."""
        score = 0
        if OPTIMAL_RANGES["ph"]["low"] <= ph <= OPTIMAL_RANGES["ph"]["high"]:
            score += 1
        if OPTIMAL_RANGES["N"]["low"] <= n <= OPTIMAL_RANGES["N"]["high"]:
            score += 1
        if OPTIMAL_RANGES["P"]["low"] <= p <= OPTIMAL_RANGES["P"]["high"]:
            score += 1
        if OPTIMAL_RANGES["K"]["low"] <= k <= OPTIMAL_RANGES["K"]["high"]:
            score += 1
        if score >= 3:
            return "Good"
        elif score >= 2:
            return "Moderate"
        return "Poor"

    def _identify_risks(self, ph, n, p, k) -> list:
        """Identify soil deficiency or excess risks."""
        risks = []
        if ph < OPTIMAL_RANGES["ph"]["low"]:
            risks.append("ดินเป็นกรด (Acidic soil)")
        elif ph > OPTIMAL_RANGES["ph"]["high"]:
            risks.append("ดินเป็นด่าง (Alkaline soil)")
        if n < OPTIMAL_RANGES["N"]["low"]:
            risks.append("ไนโตรเจนต่ำ (Low Nitrogen)")
        elif n > OPTIMAL_RANGES["N"]["high"]:
            risks.append("ไนโตรเจนสูงเกิน (Excess Nitrogen)")
        if p < OPTIMAL_RANGES["P"]["low"]:
            risks.append("ฟอสฟอรัสต่ำ (Low Phosphorus)")
        elif p > OPTIMAL_RANGES["P"]["high"]:
            risks.append("ฟอสฟอรัสสูงเกิน (Excess Phosphorus)")
        if k < OPTIMAL_RANGES["K"]["low"]:
            risks.append("โพแทสเซียมต่ำ (Low Potassium)")
        elif k > OPTIMAL_RANGES["K"]["high"]:
            risks.append("โพแทสเซียมสูงเกิน (Excess Potassium)")
        return risks if risks else ["ไม่พบความเสี่ยง (No risks detected)"]

    def _recommend_fertilizer(self, ph, n, p, k) -> list:
        """Generate fertilizer recommendations."""
        recs = []
        if ph < OPTIMAL_RANGES["ph"]["low"]:
            recs.append(FERTILIZER_MAP["low_pH"])
        elif ph > OPTIMAL_RANGES["ph"]["high"]:
            recs.append(FERTILIZER_MAP["high_pH"])
        if n < OPTIMAL_RANGES["N"]["low"]:
            recs.append(FERTILIZER_MAP["low_N"])
        elif n > OPTIMAL_RANGES["N"]["high"]:
            recs.append(FERTILIZER_MAP["high_N"])
        if p < OPTIMAL_RANGES["P"]["low"]:
            recs.append(FERTILIZER_MAP["low_P"])
        elif p > OPTIMAL_RANGES["P"]["high"]:
            recs.append(FERTILIZER_MAP["high_P"])
        if k < OPTIMAL_RANGES["K"]["low"]:
            recs.append(FERTILIZER_MAP["low_K"])
        elif k > OPTIMAL_RANGES["K"]["high"]:
            recs.append(FERTILIZER_MAP["high_K"])
        return recs if recs else ["ดินอยู่ในเกณฑ์ดี ไม่จำเป็นต้องปรับปรุง"]

    def analyze_dataframe(self, df) -> dict:
        """
        Run DL analysis on an entire DataFrame.
        Returns aggregate insights + crop recommendations.
        """
        # Map columns (case-insensitive)
        col_map = {}
        for target in FEATURE_COLS:
            for col in df.columns:
                if col.lower() == target.lower():
                    col_map[target] = col
                    break

        # Also check common aliases
        aliases = {
            "nitrogen": "N", "phosphorus": "P", "potassium": "K",
            "temp": "temperature", "rh": "humidity",
        }
        for col in df.columns:
            for alias, target in aliases.items():
                if col.lower() == alias and target not in col_map:
                    col_map[target] = col

        # Check which features are available
        available = [f for f in FEATURE_COLS if f in col_map]
        missing = [f for f in FEATURE_COLS if f not in col_map]

        # Need at minimum N, P, K, ph for basic analysis
        basic_cols = ["N", "P", "K", "ph"]
        basic_missing = [c for c in basic_cols if c not in col_map]

        has_imputed_data = False
        default_vals = {"N": 50.0, "P": 50.0, "K": 50.0, "ph": 6.5}

        if basic_missing:
            has_imputed_data = True
            for c in basic_missing:
                df[c] = default_vals[c]
                col_map[c] = c
                if c not in available:
                    available.append(c)
                if c in missing:
                    missing.remove(c)

        # Calculate averages
        averages = {}
        for feat in available:
            col = col_map[feat]
            averages[feat] = round(float(df[col].mean()), 2)

        avg_n = averages.get("N", 0)
        avg_p = averages.get("P", 0)
        avg_k = averages.get("K", 0)
        avg_ph = averages.get("ph", 6.5)
        avg_temp = averages.get("temperature", 25)
        avg_humid = averages.get("humidity", 60)
        avg_rain = averages.get("rainfall", 100)

        # Health classification (rule-based, always available)
        health_counts = {"Good": 0, "Moderate": 0, "Poor": 0}
        for _, row in df.iterrows():
            try:
                h = self._classify_health(
                    float(row[col_map["ph"]]),
                    float(row[col_map["N"]]),
                    float(row[col_map["P"]]),
                    float(row[col_map["K"]]),
                )
                health_counts[h] += 1
            except (ValueError, KeyError):
                continue

        total = sum(health_counts.values()) or 1
        overall_health = max(health_counts, key=health_counts.get)

        # Crop recommendation (DL model if all 7 features present)
        crop_prediction = None
        can_predict_crop = (len(missing) == 0) and self.use_dl

        if can_predict_crop:
            crop_prediction = self.predict_crop(
                avg_n, avg_p, avg_k, avg_temp, avg_humid, avg_ph, avg_rain
            )

        result = {
            "model_used": "deep_learning" if self.use_dl else "rule_based",
            "total_samples": total,
            "has_imputed_data": has_imputed_data,
            "health_summary": {
                "overall": overall_health,
                "good_pct": round(health_counts["Good"] / total * 100, 1),
                "moderate_pct": round(health_counts["Moderate"] / total * 100, 1),
                "poor_pct": round(health_counts["Poor"] / total * 100, 1),
            },
            "averages": averages,
            "risks": self._identify_risks(avg_ph, avg_n, avg_p, avg_k),
            "fertilizer_recommendations": self._recommend_fertilizer(avg_ph, avg_n, avg_p, avg_k),
        }

        if crop_prediction:
            result["crop_recommendation"] = crop_prediction

        return result


# ===== Singleton =====
soil_analyzer = SoilAnalyzer()
