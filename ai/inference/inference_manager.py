"""
Hardware-Agnostic Snapdragon & CPU Inference Manager.
Loads either INT8 or FP32 ONNX model.
Configures Qualcomm QNN Execution Provider if Snapdragon NPU is present,
otherwise gracefully falls back to CPUExecutionProvider.
"""
import os
import time
import numpy as np
from typing import Dict, Any, Tuple, Optional
import onnxruntime as ort
from backend.hardware_detector import detect_hardware

class InferenceManager:
    FAULT_CLASSES = [
        "Normal Operation",
        "Mass Dynamic Imbalance",
        "Shaft Angular Misalignment",
        "Bearing Outer Race Fatigue"
    ]
    
    def __init__(
        self,
        fp32_model_path: str = "models/vibenet_1d_fp32.onnx",
        int8_model_path: str = "models/vibenet_1d_int8.onnx",
        prefer_int8: bool = True,
        backend_override: Optional[str] = None
    ):
        self.fp32_model_path = fp32_model_path
        self.int8_model_path = int8_model_path
        self.prefer_int8 = prefer_int8
        self.backend_override = backend_override
        
        self.hardware_info = detect_hardware()
        self.session = None
        self.active_provider = "CPUExecutionProvider"
        self.active_model_path = None
        self.active_precision = "FP32"
        self._initialize_session()

    def _initialize_session(self):
        # 1. Determine model file
        if self.prefer_int8 and os.path.exists(self.int8_model_path):
            self.active_model_path = self.int8_model_path
            self.active_precision = "INT8"
        elif os.path.exists(self.fp32_model_path):
            self.active_model_path = self.fp32_model_path
            self.active_precision = "FP32"
        else:
            raise FileNotFoundError(f"Neither {self.int8_model_path} nor {self.fp32_model_path} found!")

        # 2. Determine execution provider
        available_providers = ort.get_available_providers()
        chosen_providers = []

        if self.backend_override:
            if self.backend_override == "qnn" and "QNNExecutionProvider" in available_providers:
                # Configure Qualcomm QNN HTP (Hexagon Tensor Processor / NPU) backend
                qnn_options = {
                    "backend_path": "QnnHtp.dll", # Windows ARM64 QNN HTP DLL
                    "htp_performance_mode": "burst",
                    "enable_htp_fp16_precision": "1"
                }
                chosen_providers.append(("QNNExecutionProvider", qnn_options))
            elif self.backend_override == "dml" and "DmlExecutionProvider" in available_providers:
                chosen_providers.append("DmlExecutionProvider")
            else:
                chosen_providers.append("CPUExecutionProvider")
        else:
            # Auto mode
            if "QNNExecutionProvider" in available_providers:
                qnn_options = {
                    "backend_path": "QnnHtp.dll",
                    "htp_performance_mode": "burst",
                    "enable_htp_fp16_precision": "1"
                }
                chosen_providers.append(("QNNExecutionProvider", qnn_options))
            chosen_providers.append("CPUExecutionProvider")

        # Session options for edge inference
        sess_options = ort.SessionOptions()
        sess_options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
        sess_options.intra_op_num_threads = 2 # Efficient power profile on battery

        try:
            self.session = ort.InferenceSession(self.active_model_path, sess_options=sess_options, providers=chosen_providers)
            self.active_provider = self.session.get_providers()[0]
        except Exception as e:
            print(f"Provider negotiation failed: {e}. Falling back to standard CPUExecutionProvider.")
            self.session = ort.InferenceSession(self.active_model_path, sess_options=sess_options, providers=["CPUExecutionProvider"])
            self.active_provider = "CPUExecutionProvider"

        self.input_name = self.session.get_inputs()[0].name
        self.output_names = [out.name for out in self.session.get_outputs()]

    def predict(self, feature_vector: np.ndarray) -> Dict[str, Any]:
        """
        Runs edge inference on 64-dim feature vector.
        Returns:
          - predicted_class (int)
          - fault_label (str)
          - confidence (float)
          - probabilities (list)
          - rul (float)
          - latency_ms (float)
          - backend (str)
        """
        # Ensure shape [1, 1, 64]
        if feature_vector.ndim == 1:
            inp = feature_vector.reshape(1, 1, 64).astype(np.float32)
        elif feature_vector.ndim == 2:
            inp = feature_vector.reshape(feature_vector.shape[0], 1, 64).astype(np.float32)
        else:
            inp = feature_vector.astype(np.float32)

        start_time = time.perf_counter()
        outputs = self.session.run(self.output_names, {self.input_name: inp})
        latency_ms = (time.perf_counter() - start_time) * 1000.0

        logits = outputs[0][0] # [4]
        rul_val = float(outputs[1][0][0]) if len(outputs) > 1 else 1.0

        # Softmax
        exp_logits = np.exp(logits - np.max(logits))
        probs = exp_logits / np.sum(exp_logits)
        pred_idx = int(np.argmax(probs))
        confidence = float(probs[pred_idx])

        return {
            "predicted_class": pred_idx,
            "fault_label": self.FAULT_CLASSES[pred_idx],
            "confidence": confidence,
            "probabilities": probs.tolist(),
            "rul": max(0.0, min(1.0, rul_val)),
            "latency_ms": round(latency_ms, 3),
            "backend": self.active_provider,
            "precision": self.active_precision,
            "is_npu": "QNN" in self.active_provider
        }
