"""
Unit & Integration Tests for VibeGuard NeuroEdge.
Validates:
1. Signal preprocessing & 64-dim feature vector extraction
2. Hardware detector truthful output
3. ONNX model inference & fallback parity
4. Decision engine ISO 10816-3 thresholds
5. Rotordynamics physics simulator telemetry structure
"""
import pytest
import numpy as np
import os
import onnxruntime as ort

from ai.preprocessing.feature_extractor import (
    compute_time_domain_features,
    compute_frequency_domain_features,
    extract_feature_vector
)
from backend.hardware_detector import detect_hardware
from backend.decision_engine import DecisionEngine
from ai.inference.inference_manager import InferenceManager
from hardware.simulator.rotordynamics_sim import RotordynamicSimulator

def test_time_domain_features():
    signal = np.sin(np.linspace(0, 2 * np.pi, 256))
    feats = compute_time_domain_features(signal)
    assert feats.shape == (16,)
    assert not np.any(np.isnan(feats))
    # RMS of sine wave of amplitude 1 is ~0.707
    assert 0.65 < feats[0] < 0.75

def test_frequency_domain_features():
    signal = np.sin(np.linspace(0, 20 * np.pi, 512))
    binned, freqs, psd = compute_frequency_domain_features(signal, sampling_rate=1000, num_bins=32)
    assert len(binned) == 32
    assert not np.any(np.isnan(binned))
    assert len(freqs) > 0
    assert len(psd) == len(freqs)

def test_feature_vector_dimension():
    signal = np.random.randn(512)
    vec = extract_feature_vector(signal, sampling_rate=1000, rpm=1800.0, temp=42.0)
    assert vec.shape == (1, 64)
    assert not np.any(np.isnan(vec))

def test_hardware_detector():
    info = detect_hardware()
    assert "os" in info
    assert "machine" in info
    assert "available_execution_providers" in info
    assert "truthful_note" in info
    # Must never falsify NPU when running on Intel x64
    if not info["is_arm64"]:
        assert info["is_npu_active"] is False

def test_inference_manager():
    mgr = InferenceManager(prefer_int8=True)
    assert mgr.session is not None
    dummy = np.random.randn(64).astype(np.float32)
    res = mgr.predict(dummy)
    assert "predicted_class" in res
    assert 0 <= res["predicted_class"] <= 3
    assert "confidence" in res
    assert 0.0 <= res["confidence"] <= 1.0
    assert "rul" in res
    assert 0.0 <= res["rul"] <= 1.0
    assert "latency_ms" in res
    assert res["latency_ms"] > 0

def test_decision_engine():
    mock_pred = {"predicted_class": 0, "confidence": 0.98, "rul": 0.92}
    dec = DecisionEngine.evaluate(mock_pred, rms_vibration=1.2, temperature=35.0, rpm=1800.0)
    assert dec["iso_zone"] == "Zone A (Good)"
    assert dec["trip_interlock"] is False

    # Critical fault test
    mock_crit = {"predicted_class": 3, "confidence": 0.95, "rul": 0.08}
    dec_crit = DecisionEngine.evaluate(mock_crit, rms_vibration=8.5, temperature=78.0, rpm=1800.0)
    assert dec_crit["trip_interlock"] is True

def test_simulator_batch():
    sim = RotordynamicSimulator(sampling_rate=1000)
    batch = sim.generate_batch(num_samples=256)
    assert len(batch["ax"]) == 256
    assert batch["rms_vibration"] > 0
    assert batch["relay_state"] in [0, 1]
