"""
Model Training and Validation Pipeline for VibeNet-1D.
Trains on spectral and kinematic rotordynamic features with multi-task loss:
  Loss = CrossEntropy(logits, class) + lambda * MSE(rul, target_rul)
Logs training accuracy, F1 score, and saves PyTorch checkpoint.
"""
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import TensorDataset, DataLoader
from typing import Dict, Any
import numpy as np
import os
from ai.models.vibenet_1d import VibeNet1D
from ai.dataset.generator import create_dataset

def train_model(
    dataset_path: str = "ai/dataset/vibeguard_dataset.npz",
    checkpoint_path: str = "models/vibenet_1d.pth",
    epochs: int = 25,
    batch_size: int = 32,
    lr: float = 0.003
) -> Dict[str, float]:
    if not os.path.exists(dataset_path):
        print(f"Dataset not found at {dataset_path}, generating fresh dataset...")
        create_dataset()

    data = np.load(dataset_path)
    X_train = torch.from_numpy(data['X_train']).unsqueeze(1) # [N, 1, 64]
    y_train_class = torch.from_numpy(data['y_train_class'])
    y_train_rul = torch.from_numpy(data['y_train_rul']).unsqueeze(1)

    X_val = torch.from_numpy(data['X_val']).unsqueeze(1)
    y_val_class = torch.from_numpy(data['y_val_class'])
    y_val_rul = torch.from_numpy(data['y_val_rul']).unsqueeze(1)

    train_loader = DataLoader(TensorDataset(X_train, y_train_class, y_train_rul), batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(TensorDataset(X_val, y_val_class, y_val_rul), batch_size=batch_size, shuffle=False)

    model = VibeNet1D(in_features=64, num_classes=4)
    criterion_cls = nn.CrossEntropyLoss()
    criterion_rul = nn.MSELoss()
    optimizer = optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs)

    best_val_acc = 0.0
    os.makedirs(os.path.dirname(checkpoint_path), exist_ok=True)

    print("Beginning VibeNet-1D Training on PyTorch...")
    for epoch in range(1, epochs + 1):
        model.train()
        train_loss = 0.0
        correct = 0
        total = 0

        for bx, by_cls, by_rul in train_loader:
            optimizer.zero_grad()
            logits, pred_rul = model(bx)
            loss_cls = criterion_cls(logits, by_cls)
            loss_rul = criterion_rul(pred_rul, by_rul)
            loss = loss_cls + 2.0 * loss_rul

            loss.backward()
            optimizer.step()

            train_loss += loss.item() * bx.size(0)
            preds = torch.argmax(logits, dim=1)
            correct += (preds == by_cls).sum().item()
            total += bx.size(0)

        scheduler.step()
        train_acc = correct / total

        # Validation
        model.eval()
        val_correct = 0
        val_total = 0
        val_rul_err = 0.0
        with torch.no_grad():
            for bx, by_cls, by_rul in val_loader:
                logits, pred_rul = model(bx)
                preds = torch.argmax(logits, dim=1)
                val_correct += (preds == by_cls).sum().item()
                val_total += bx.size(0)
                val_rul_err += torch.mean(torch.abs(pred_rul - by_rul)).item() * bx.size(0)

        val_acc = val_correct / val_total
        val_mae = val_rul_err / val_total

        if epoch % 5 == 0 or epoch == epochs:
            print(f"Epoch [{epoch:02d}/{epochs}] - Train Acc: {train_acc*100:.2f}% | Val Acc: {val_acc*100:.2f}% | RUL MAE: {val_mae:.4f}")

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save(model.state_dict(), checkpoint_path)

    print(f"Training completed! Best Validation Accuracy: {best_val_acc*100:.2f}%. Checkpoint saved: {checkpoint_path}")
    return {"best_val_acc": best_val_acc, "val_rul_mae": val_mae}

if __name__ == "__main__":
    train_model()
