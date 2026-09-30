# System Architecture & Technical Specification

## 1. Overview
**VibeGuard NeuroEdge** is a high-performance edge AI predictive maintenance platform engineered specifically for **Snapdragon-powered HP PCs** deployed on industrial shop floors, testing facilities, and cleanrooms.

Connecting to machinery vibration instrumentation via an **Arduino sensor node** (or its software rotordynamics simulator), VibeGuard processes raw vibration waveforms, extracts spectral Fourier decompositions and statistical kinematic moments, and executes real-time inference on the **Qualcomm Hexagon NPU via ONNX Runtime / QNN Execution Provider** with strict fallback to Intel/x64 CPUs for cross-platform development.

---

## 2. End-to-End Architectural Dataflow

```
[ Industrial Machinery / Motor ]
               │
               ▼
[ Physical Sensors: MPU6050 Accelerometer (3-axis) + Hall RPM + Temperature Probe ]
               │
               ▼ (USB Virtual COM / 115200 Baud JSON Packets)
[ Arduino Serial Ingestion Layer / Physics-Based Rotordynamic Simulator ]
               │
               ▼ (Sliding Window: 256 - 512 samples)
[ Digital Filtering & Edge Feature Extractor ]
   ├─ Hanning-Windowed Fast Fourier Transform (FFT) -> 32 PSD Energy Bins
   ├─ 16 Time-Domain Waveform Moments (RMS, Kurtosis, Crest Factor, Skewness)
   └─ 16 Kinematic Harmonics (1X, 2X, 3X, BPFO/BPFI defect frequency bands)
               │
               ▼ [1, 64] float32 Feature Vector
[ Hardware-Agnostic Snapdragon Inference Manager ]
   ├─ If Snapdragon ARM64 Detected ──► Qualcomm QNN Execution Provider (Hexagon NPU)
   └─ If Intel x64 Fallback ──────────► CPUExecutionProvider (Multithreaded Kernels)
               │
               ▼
[ VibeNet-1D Dual-Head Inference Engine ]
   ├─ Head 1 (Logits): 4-Class Fault Classification (Normal, Imbalance, Misalign, Bearing)
   └─ Head 2 (Sigmoid): Remaining Useful Life (RUL) Index [0.0 - 1.0]
               │
               ▼
[ Decision & Explainability Engine ]
   ├─ ISO 10816-3 Vibration Severity Classification (Zone A, B, C, D)
   ├─ Root Cause Feature Attribution (Harmonic energy breakdown)
   ├─ Prescriptive Maintenance Action Generation
   └─ Automated Safety Interlock Relay Signal (Emergency trip on critical fault)
               │
               ▼ (FastAPI WebSocket Stream @ 15-20 Hz)
[ Industrial Dark-Mode Glassmorphic Edge Dashboard ]
   ├─ Real-Time Oscilloscope Waveform & FFT Spectrum Analyzer
   ├─ Snapdragon Hardware Acceleration Audit (NPU vs CPU, Latency, Precision)
   ├─ Interactive Scenario Fault Injector (Modes 0 - 4)
   └─ One-Click Physical Hardware / Simulation Mode Switch
```

---

## 3. Truthful Hardware Detection Specification
The system enforces strict compliance with **Rule 27 (Truthful Hardware Reporting)**:
- **On Intel Core i5 Laptop (Lenovo Yoga Slim 6):**
  - Detects `AMD64` architecture and `GenuineIntel` processor.
  - Automatically loads `CPUExecutionProvider`.
  - Sets UI label: `Intel/x64 CPU Fallback (Intel Core i5)` and explicitly states: *"Snapdragon benchmark pending hardware validation on target Snapdragon-powered HP PC."*
- **On Snapdragon-Powered HP PC:**
  - Detects `ARM64` architecture and Qualcomm processor.
  - Loads `QNNExecutionProvider` targeting the Hexagon Tensor Processor (`QnnHtp.dll`).
  - Sets UI label: `Qualcomm Snapdragon NPU (QNN Accelerated)` with INT8 QDQ quantization.
