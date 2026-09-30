"""
VibeNet-1D: Edge-Optimized 1D-ResNet for Snapdragon NPU & CPU Inference.
Dual-head architecture:
  Head 1: 4-class Fault Diagnosis (Normal, Imbalance, Misalignment, Bearing Fault)
  Head 2: Continuous RUL (Remaining Useful Life) Index (0.0 to 1.0)
Uses operations with direct Qualcomm Hexagon NPU / QNN integer translation support.
"""
import torch
import torch.nn as nn

class ResBlock1D(nn.Module):
    def __init__(self, channels: int):
        super().__init__()
        self.conv1 = nn.Conv1d(channels, channels, kernel_size=3, padding=1, bias=False)
        self.bn1 = nn.BatchNorm1d(channels)
        self.relu = nn.ReLU()
        self.conv2 = nn.Conv1d(channels, channels, kernel_size=3, padding=1, bias=False)
        self.bn2 = nn.BatchNorm1d(channels)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        residual = x
        out = self.relu(self.bn1(self.conv1(x)))
        out = self.bn2(self.conv2(out))
        out = self.relu(out + residual)
        return out

class VibeNet1D(nn.Module):
    def __init__(self, in_features: int = 64, num_classes: int = 4):
        super().__init__()
        # Input tensor shape: [batch, 1, 64]
        self.stem = nn.Sequential(
            nn.Conv1d(1, 32, kernel_size=5, stride=1, padding=2, bias=False),
            nn.BatchNorm1d(32),
            nn.ReLU()
        )
        self.res1 = ResBlock1D(32)
        
        # Downsample to 32 steps, 64 channels
        self.downsample = nn.Sequential(
            nn.Conv1d(32, 64, kernel_size=3, stride=2, padding=1, bias=False),
            nn.BatchNorm1d(64),
            nn.ReLU()
        )
        self.res2 = ResBlock1D(64)
        
        # Global Average Pooling -> 64-dim representation
        self.gap = nn.AdaptiveAvgPool1d(1)
        
        # Head 1: Multi-class Fault Classification
        self.classifier_head = nn.Sequential(
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(32, num_classes)
        )
        
        # Head 2: Remaining Useful Life (RUL) Regression (0.0 to 1.0)
        self.rul_head = nn.Sequential(
            nn.Linear(64, 16),
            nn.ReLU(),
            nn.Linear(16, 1),
            nn.Sigmoid()
        )

    def forward(self, x: torch.Tensor):
        # Ensure 3D shape [Batch, Channels, Length]
        if x.dim() == 2:
            x = x.unsqueeze(1)
            
        feat = self.stem(x)
        feat = self.res1(feat)
        feat = self.downsample(feat)
        feat = self.res2(feat)
        
        embedding = self.gap(feat).squeeze(-1) # [Batch, 64]
        
        logits = self.classifier_head(embedding) # [Batch, 4]
        rul = self.rul_head(embedding)           # [Batch, 1]
        
        return logits, rul

if __name__ == "__main__":
    model = VibeNet1D()
    test_input = torch.randn(2, 1, 64)
    logits, rul = model(test_input)
    print("Test forward pass successful!")
    print(f"Logits shape: {logits.shape}, RUL shape: {rul.shape}")
