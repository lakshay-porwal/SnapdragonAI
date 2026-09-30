"""
Truthful Hardware & Acceleration Detection Engine.
Identifies host CPU architecture, OS, and checks for:
- Qualcomm Snapdragon NPU via QNNExecutionProvider
- DirectML via DmlExecutionProvider
- CPU fallback via CPUExecutionProvider
STRICT RULE: Never falsify NPU usage.
"""
import platform
import os
from typing import Dict, Any, List

def detect_hardware() -> Dict[str, Any]:
    system_os = platform.system()
    machine = platform.machine().lower()
    processor = platform.processor()
    is_arm64 = ("arm64" in machine) or ("aarch64" in machine)
    
    # Check ONNX Runtime execution providers
    available_eps = []
    qnn_available = False
    dml_available = False
    
    try:
        import onnxruntime as ort
        available_eps = ort.get_available_providers()
        qnn_available = "QNNExecutionProvider" in available_eps
        dml_available = "DmlExecutionProvider" in available_eps
    except Exception as e:
        available_eps = ["CPUExecutionProvider"]

    # Truthful identification of platform
    is_snapdragon = is_arm64 and ("qualcomm" in processor.lower() or "snapdragon" in processor.lower() or qnn_available)

    if qnn_available:
        recommended_ep = "QNNExecutionProvider"
        hardware_status_label = "Qualcomm Snapdragon NPU (QNN Accelerated)"
        is_npu_active = True
    elif dml_available and is_snapdragon:
        recommended_ep = "DmlExecutionProvider"
        hardware_status_label = "Qualcomm Adreno GPU (DirectML)"
        is_npu_active = False
    else:
        recommended_ep = "CPUExecutionProvider"
        if is_snapdragon:
            hardware_status_label = "Snapdragon ARM64 CPU (QNN Provider Pending Setup)"
        else:
            hardware_status_label = f"Intel/x64 CPU Fallback ({processor or machine})"
        is_npu_active = False

    return {
        "os": system_os,
        "machine": machine,
        "processor": processor,
        "is_arm64": is_arm64,
        "is_snapdragon_detected": is_snapdragon,
        "available_execution_providers": available_eps,
        "qnn_available": qnn_available,
        "dml_available": dml_available,
        "recommended_provider": recommended_ep,
        "status_label": hardware_status_label,
        "is_npu_active": is_npu_active,
        "truthful_note": "Executing on native Intel CPU fallback for development. Target Snapdragon NPU will be activated when deployed to Snapdragon HP PC." if not is_snapdragon else "Running on Snapdragon native architecture."
    }

if __name__ == "__main__":
    import json
    info = detect_hardware()
    print(json.dumps(info, indent=2))
