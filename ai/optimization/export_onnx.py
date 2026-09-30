"""
Export and Post-Training Quantization (PTQ) Pipeline for VibeNet-1D.
Exports PyTorch weights to:
  1. Standard ONNX FP32
  2. Static Quantized INT8 ONNX (Targeting Qualcomm Hexagon NPU / QNN)
Verifies parity between PyTorch and ONNX inference.
"""
import os
import numpy as np
import torch
from ai.models.vibenet_1d import VibeNet1D
import onnx
import onnxruntime as ort
from onnxruntime.quantization import quantize_static, CalibrationDataReader, QuantType, QuantFormat

class VibeNetCalibrationDataReader(CalibrationDataReader):
    def __init__(self, dataset_path: str = "ai/dataset/vibeguard_dataset.npz", num_samples: int = 100):
        super().__init__()
        data = np.load(dataset_path)
        X_val = data['X_val'][:num_samples] # [num_samples, 64]
        # Reshape to [1, 1, 64] per batch
        self.data = [X_val[i:i+1].reshape(1, 1, 64).astype(np.float32) for i in range(len(X_val))]
        self.enum_data = iter(self.data)

    def get_next(self):
        sample = next(self.enum_data, None)
        if sample is not None:
            return {"input": sample}
        return None

def export_to_onnx(
    checkpoint_path: str = "models/vibenet_1d.pth",
    fp32_onnx_path: str = "models/vibenet_1d_fp32.onnx",
    int8_onnx_path: str = "models/vibenet_1d_int8.onnx",
    dataset_path: str = "ai/dataset/vibeguard_dataset.npz"
):
    os.makedirs(os.path.dirname(fp32_onnx_path), exist_ok=True)
    
    # 1. Load PyTorch model
    model = VibeNet1D(in_features=64, num_classes=4)
    if os.path.exists(checkpoint_path):
        model.load_state_dict(torch.load(checkpoint_path, map_location="cpu"))
        print(f"Loaded weights from {checkpoint_path}")
    else:
        print(f"Checkpoint {checkpoint_path} not found. Using initialized weights.")
        
    model.eval()
    dummy_input = torch.randn(1, 1, 64, dtype=torch.float32)

    # 2. Export FP32 ONNX
    print(f"Exporting FP32 ONNX model to {fp32_onnx_path}...")
    torch.onnx.export(
        model,
        dummy_input,
        fp32_onnx_path,
        export_params=True,
        opset_version=17,
        do_constant_folding=True,
        input_names=['input'],
        output_names=['logits', 'rul'],
        dynamic_axes={
            'input': {0: 'batch_size'},
            'logits': {0: 'batch_size'},
            'rul': {0: 'batch_size'}
        }
    )

    # Validate ONNX graph
    onnx_model = onnx.load(fp32_onnx_path)
    onnx.checker.check_model(onnx_model)
    fp32_size_kb = os.path.getsize(fp32_onnx_path) / 1024
    print(f"FP32 ONNX export validated! File size: {fp32_size_kb:.2f} KB")

    # 3. Static Quantization to INT8 (Qualcomm QNN / NPU profile)
    print(f"Executing Static Post-Training Quantization (PTQ) -> {int8_onnx_path}...")
    calibration_reader = VibeNetCalibrationDataReader(dataset_path=dataset_path, num_samples=100)
    
    try:
        quantize_static(
            model_input=fp32_onnx_path,
            model_output=int8_onnx_path,
            calibration_data_reader=calibration_reader,
            quant_format=QuantFormat.QDQ, # QDQ format supported by Qualcomm QNN EP
            activation_type=QuantType.QInt8,
            weight_type=QuantType.QInt8,
            per_channel=True,
            reduce_range=False
        )
        int8_size_kb = os.path.getsize(int8_onnx_path) / 1024
        print(f"INT8 ONNX model successfully generated! File size: {int8_size_kb:.2f} KB ({fp32_size_kb / int8_size_kb:.1f}x compression)")
    except Exception as e:
        print(f"Warning during INT8 quantization: {e}")
        print("Falling back to standard dynamic INT8 quantization...")
        from onnxruntime.quantization import quantize_dynamic
        quantize_dynamic(
            model_input=fp32_onnx_path,
            model_output=int8_onnx_path,
            weight_type=QuantType.QInt8
        )
        int8_size_kb = os.path.getsize(int8_onnx_path) / 1024
        print(f"Dynamic INT8 ONNX generated: {int8_size_kb:.2f} KB")

    # 4. Parity check with ONNX Runtime
    session = ort.InferenceSession(fp32_onnx_path, providers=['CPUExecutionProvider'])
    ort_inputs = {session.get_inputs()[0].name: dummy_input.numpy()}
    ort_outs = session.run(None, ort_inputs)
    with torch.no_grad():
        py_logits, py_rul = model(dummy_input)
    
    diff_logits = np.max(np.abs(py_logits.numpy() - ort_outs[0]))
    print(f"PyTorch vs ONNX Runtime parity check max diff: {diff_logits:.6f}")
    assert diff_logits < 1e-4, "Parity check error between PyTorch and ONNX!"
    print("Export and verification completed successfully!")

if __name__ == "__main__":
    export_to_onnx()
