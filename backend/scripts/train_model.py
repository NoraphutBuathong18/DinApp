"""
Train SoilNet — a deep learning model for crop recommendation.

Uses the real Crop Recommendation dataset to train a neural network
that predicts the best crop based on soil and climate conditions.

Usage:
    cd backend
    python scripts/train_model.py
"""

import os
import sys
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

# Add parent directory to path so we can import the model
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from services.soil_model import SoilNet, FEATURE_COLS, CROP_LABELS


def train():
    print("=" * 60)
    print("  SoilNet Training — Crop Recommendation Model")
    print("=" * 60)

    # ===== 1. Load Real Data =====
    data_path = os.path.join(os.path.dirname(__file__), "..", "storage", "Crop_recommendation (1).csv")
    if not os.path.exists(data_path):
        print(f"❌ Dataset not found at: {data_path}")
        return

    df = pd.read_csv(data_path)
    print(f"\n📊 Dataset: {data_path}")
    print(f"   Rows: {len(df)}, Columns: {list(df.columns)}")
    print(f"   Crop classes: {df['label'].nunique()}")

    # ===== 2. Prepare Features & Labels =====
    # Map column names (case-insensitive)
    col_map = {}
    for feat in FEATURE_COLS:
        for col in df.columns:
            if col.lower() == feat.lower():
                col_map[feat] = col
                break

    feature_cols = [col_map[f] for f in FEATURE_COLS]
    X = df[feature_cols].values.astype(np.float32)

    # Encode crop labels to integers matching CROP_LABELS order
    label_to_idx = {label: idx for idx, label in enumerate(CROP_LABELS)}
    y = df["label"].map(label_to_idx).values.astype(np.int64)

    print(f"   Features shape: {X.shape}")
    print(f"   Labels shape: {y.shape}")

    # ===== 3. Normalize =====
    mean = X.mean(axis=0)
    std = X.std(axis=0)
    X_normalized = (X - mean) / (std + 1e-8)

    print(f"\n📐 Normalization:")
    for i, feat in enumerate(FEATURE_COLS):
        print(f"   {feat:>12s}: mean={mean[i]:.2f}, std={std[i]:.2f}")

    # ===== 4. Train/Test Split =====
    X_train, X_test, y_train, y_test = train_test_split(
        X_normalized, y, test_size=0.2, random_state=42, stratify=y
    )

    train_dataset = TensorDataset(torch.FloatTensor(X_train), torch.LongTensor(y_train))
    test_dataset = TensorDataset(torch.FloatTensor(X_test), torch.LongTensor(y_test))
    train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True)
    test_loader = DataLoader(test_dataset, batch_size=32)

    print(f"\n   Train: {len(X_train)} samples, Test: {len(X_test)} samples")

    # ===== 5. Train Model =====
    model = SoilNet(n_features=7, n_classes=22)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=50, gamma=0.5)

    n_epochs = 200
    print(f"\n🏋️ Training for {n_epochs} epochs...")
    best_acc = 0
    best_state = None

    for epoch in range(n_epochs):
        model.train()
        total_loss = 0
        correct = 0
        total = 0

        for batch_X, batch_y in train_loader:
            optimizer.zero_grad()
            outputs = model(batch_X)
            loss = criterion(outputs, batch_y)
            loss.backward()
            optimizer.step()

            total_loss += loss.item()
            _, predicted = outputs.max(1)
            correct += predicted.eq(batch_y).sum().item()
            total += batch_y.size(0)

        scheduler.step()
        train_acc = correct / total * 100

        if (epoch + 1) % 25 == 0:
            # Evaluate
            model.eval()
            test_correct = 0
            test_total = 0
            with torch.no_grad():
                for batch_X, batch_y in test_loader:
                    outputs = model(batch_X)
                    _, predicted = outputs.max(1)
                    test_correct += predicted.eq(batch_y).sum().item()
                    test_total += batch_y.size(0)
            test_acc = test_correct / test_total * 100

            print(f"   Epoch {epoch + 1:3d}/{n_epochs} — "
                  f"Loss: {total_loss / len(train_loader):.4f} | "
                  f"Train: {train_acc:.1f}% | Test: {test_acc:.1f}%")

            if test_acc > best_acc:
                best_acc = test_acc
                best_state = model.state_dict().copy()

    # ===== 6. Save Best Model =====
    model_dir = os.path.join(os.path.dirname(__file__), "..", "models")
    os.makedirs(model_dir, exist_ok=True)
    model_path = os.path.join(model_dir, "soil_model.pth")

    torch.save({
        "model_state_dict": best_state or model.state_dict(),
        "mean": mean.tolist(),
        "std": std.tolist(),
        "crop_labels": CROP_LABELS,
        "feature_cols": FEATURE_COLS,
    }, model_path)

    print(f"\n✅ Best model saved to: {os.path.abspath(model_path)}")
    print(f"   Best test accuracy: {best_acc:.1f}%")
    print(f"   Model size: {os.path.getsize(model_path) / 1024:.1f} KB")

    # ===== 7. Quick Demo =====
    model.load_state_dict(best_state or model.state_dict())
    model.eval()

    print(f"\n🌾 Demo predictions:")
    test_samples = [
        {"N": 90, "P": 42, "K": 43, "temp": 21, "humid": 82, "ph": 6.5, "rain": 203},
        {"N": 20, "P": 60, "K": 20, "temp": 25, "humid": 65, "ph": 7.0, "rain": 100},
        {"N": 40, "P": 67, "K": 40, "temp": 24, "humid": 85, "ph": 6.8, "rain": 150},
    ]
    for s in test_samples:
        feats = np.array([s["N"], s["P"], s["K"], s["temp"], s["humid"], s["ph"], s["rain"]], dtype=np.float32)
        normalized = (feats - mean) / (std + 1e-8)
        tensor = torch.FloatTensor(normalized).unsqueeze(0)
        with torch.no_grad():
            out = model(tensor)
            probs = torch.softmax(out, dim=1).squeeze()
            top_idx = probs.argmax().item()
            top_prob = probs[top_idx].item() * 100
        print(f"   N={s['N']:3d} P={s['P']:2d} K={s['K']:2d} pH={s['ph']:.1f} → "
              f"{CROP_LABELS[top_idx]} ({top_prob:.0f}%)")


if __name__ == "__main__":
    train()
