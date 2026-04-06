import os
import pandas as pd
from services.soil_model import soil_analyzer, CROP_NAMES_TH


def parse_and_summarize(file_path: str) -> dict:
    """
    Parse a CSV or Excel file containing soil data and return a structured summary.
    Uses the Deep Learning model (SoilNet) for crop recommendation.
    """
    ext = os.path.splitext(file_path)[1].lower()

    if ext == ".csv":
        df = pd.read_csv(file_path)
    elif ext in {".xlsx", ".xls"}:
        df = pd.read_excel(file_path)
    else:
        raise ValueError(f"Unsupported file type: {ext}")

    # ---- TC09 fix: validate that the file has at least one usable soil column ----
    KNOWN_SOIL_COLS = {
        "n", "p", "k", "nitrogen", "phosphorus", "potassium",
        "ph", "temperature", "humidity", "rainfall",
    }
    file_cols_lower = {c.lower() for c in df.columns}
    matched = file_cols_lower & KNOWN_SOIL_COLS
    if not matched:
        raise ValueError(
            "ไม่พบคอลัมน์ข้อมูลดินที่รับรองในไฟล์นี้ กรุณาเพิ่มคอลัมน์: "
            "N, P, K, pH, temperature, humidity หรือ rainfall "
            f"(พบคอลัมน์: {', '.join(df.columns.tolist()[:10])})"
        )
    # -------------------------------------------------------------------------

    # Build raw rows for the data table (round floats to 2 dp)
    raw_rows = df.to_dict(orient="records")
    rows = [
        {k: round(v, 2) if isinstance(v, float) else v for k, v in row.items()}
        for row in raw_rows
    ]
    columns = list(df.columns)

    # Numeric summary (basic stats)
    numeric_cols = df.select_dtypes(include="number").columns.tolist()
    summary = {}
    for col in numeric_cols:
        summary[col] = {
            "mean": float(f"{float(df[col].mean()):.2f}"),
            "min": float(f"{float(df[col].min()):.2f}"),
            "max": float(f"{float(df[col].max()):.2f}"),
            "std": float(f"{float(df[col].std()):.2f}") if len(df) > 1 else 0,
        }

    # ===== Deep Learning Analysis =====
    dl_result = soil_analyzer.analyze_dataframe(df)

    # Generate human-readable insight text from DL results
    npk_text = _format_dl_insights(dl_result)

    return {
        "filename": os.path.basename(file_path),
        "total_rows": len(df),
        "columns": columns,
        "rows": rows[:400],  # Cap at 400 rows (covers ~1 full year of daily data)
        "summary": summary,
        "npk_insights": npk_text,
        "dl_analysis": dl_result,  # Full structured DL output
    }


def _format_dl_insights(dl_result: dict) -> str:
    """Format the Deep Learning model output as human-readable text."""
    if dl_result.get("error"):
        return f"⚠️ {dl_result['error']}"

    hs = dl_result.get("health_summary")
    if not hs:
        return "No soil health analysis available."

    avgs = dl_result.get("averages", {})
    model = dl_result.get("model_used", "unknown")

    lines = [
        f"🤖 วิเคราะห์โดย: {'ระบบ DinApp' if model == 'deep_learning' else 'Rule-Based Analysis'}",
        f"📊 จำนวนตัวอย่าง: {dl_result.get('total_samples', 0)} แถว",
        f"",
        f"🏥 สุขภาพดินโดยรวม: {hs['overall']}",
        f"   ✅ ดี: {hs['good_pct']}% | ⚠️ ปานกลาง: {hs['moderate_pct']}% | ❌ แย่: {hs['poor_pct']}%",
        f"",
        f"📈 ค่าเฉลี่ย:",
    ]

    key_labels = {
        "N": "Nitrogen (N)",
        "P": "Phosphorus (P)",
        "K": "Potassium (K)"
    }
    
    for key, val in avgs.items():
        label = key_labels.get(key, key)
        lines.append(f"   {label}: {val}")

    # Crop recommendation (if available)
    crop_rec = dl_result.get("crop_recommendation")
    if crop_rec and "top_crops" in crop_rec:
        lines.append(f"")
        lines.append(f"🌾 พืชที่แนะนำจาก DinApp:")
        for i, crop in enumerate(crop_rec["top_crops"], 1):
            lines.append(f"   {i}. {crop['crop_th']} ({crop['crop']}) — ความมั่นใจ {crop['confidence']}%")

    # Risks
    risks = dl_result.get("risks", [])
    if risks:
        lines.append(f"")
        lines.append(f"⚠️ ความเสี่ยง:")
        for r in risks:
            lines.append(f"   • {r}")

    # Fertilizer
    fert = dl_result.get("fertilizer_recommendations", [])
    if fert:
        lines.append(f"")
        lines.append(f"🌱 คำแนะนำปุ๋ย:")
        for f_rec in fert:
            lines.append(f"   • {f_rec}")

    return "\n".join(lines)
