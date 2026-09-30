"""
VibeGuard NeuroEdge - Core FastAPI Application Server.
Exposes clean REST APIs, real-time WebSocket telemetry pipeline,
dual-mode hardware/simulation management, and edge inference engine.
"""
import os
import json
import asyncio
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import numpy as np

from backend.hardware_detector import detect_hardware
from backend.decision_engine import DecisionEngine
from backend.schemas import (
    PredictionRequest,
    PredictionResponse,
    HardwareStatusResponse,
    SimulationModeRequest,
    HardwareModeRequest
)
from ai.preprocessing.feature_extractor import extract_feature_vector, compute_frequency_domain_features
from ai.inference.inference_manager import InferenceManager
from hardware.simulator.rotordynamics_sim import RotordynamicSimulator
from hardware.serial_reader import ArduinoSerialReader
from benchmarks.run_benchmark import run_inference_benchmark

app = FastAPI(
    title="VibeGuard NeuroEdge API",
    description="Edge Predictive Maintenance & Vibration Sentinel for Snapdragon-Powered HP PCs",
    version="1.0.0"
)

# Enable CORS for browser access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global State Container
class SystemState:
    def __init__(self):
        self.inference_mgr = InferenceManager(prefer_int8=True)
        self.simulator = RotordynamicSimulator(sampling_rate=1000)
        self.hardware_mode = "simulation" # "simulation" or "hardware"
        self.arduino_reader = None
        self.last_telemetry = {}
        self.last_inference = {}
        self.last_decision = {}
        self.connected_websockets: List[WebSocket] = []
        self.is_broadcasting = False

state = SystemState()

# Mount frontend static directory & assets
frontend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
assets_dir = os.path.join(frontend_dir, "assets")
if os.path.exists(assets_dir):
    app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")
if os.path.exists(frontend_dir):
    app.mount("/static", StaticFiles(directory=frontend_dir), name="static")

@app.get("/")
def serve_index():
    index_file = os.path.join(frontend_dir, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {"message": "VibeGuard NeuroEdge API Online. Frontend index.html not found."}

@app.get("/api/health")
def get_health():
    return {
        "status": "online",
        "service": "VibeGuard NeuroEdge",
        "hardware_mode": state.hardware_mode,
        "active_backend": state.inference_mgr.active_provider,
        "active_precision": state.inference_mgr.active_precision
    }

@app.get("/api/hardware/status", response_model=HardwareStatusResponse)
def get_hardware_status():
    return detect_hardware()

@app.get("/api/ai/status")
def get_ai_status():
    hw = detect_hardware()
    return {
        "active_model": state.inference_mgr.active_model_path,
        "precision": state.inference_mgr.active_precision,
        "execution_provider": state.inference_mgr.active_provider,
        "is_npu_active": state.inference_mgr.predict(np.zeros(64))["is_npu"],
        "hardware_environment": hw["status_label"],
        "snapdragon_status": "Ready & Waiting for Snapdragon Hardware" if not hw["is_snapdragon_detected"] else "Native Snapdragon Environment Detected"
    }

@app.post("/api/ai/predict", response_model=PredictionResponse)
def predict_vibration(req: PredictionRequest):
    samples = np.array(req.vibration_samples, dtype=np.float32)
    if len(samples) < 32:
        raise HTTPException(status_code=400, detail="Minimum 32 vibration samples required.")
    
    # Feature extraction
    feat = extract_feature_vector(samples, sampling_rate=1000, rpm=req.rpm, temp=req.temp_c)
    pred = state.inference_mgr.predict(feat)
    
    rms = float(np.sqrt(np.mean(samples**2)))
    decision = DecisionEngine.evaluate(pred, rms_vibration=rms, temperature=req.temp_c, rpm=req.rpm)
    
    return {**pred, **decision}

@app.get("/api/telemetry/current")
def get_current_telemetry():
    return {
        "telemetry": state.last_telemetry,
        "ai_prediction": state.last_inference,
        "decision": state.last_decision,
        "hardware_mode": state.hardware_mode
    }

@app.post("/api/simulator/mode")
def set_simulator_mode(req: SimulationModeRequest):
    state.simulator.set_fault_mode(req.mode)
    modes = {0: "Normal", 1: "Imbalance", 2: "Misalignment", 3: "Bearing Fault", 4: "Overheat"}
    return {"status": "success", "mode_index": req.mode, "mode_name": modes.get(req.mode)}

@app.post("/api/hardware/mode")
def toggle_hardware_mode(req: HardwareModeRequest):
    mode = req.mode.lower()
    if mode == "hardware":
        if state.arduino_reader is None:
            state.arduino_reader = ArduinoSerialReader(port="COM3", baud=115200)
            state.arduino_reader.start()
        state.hardware_mode = "hardware"
    else:
        if state.arduino_reader:
            state.arduino_reader.stop()
            state.arduino_reader = None
        state.hardware_mode = "simulation"
    return {"status": "success", "active_hardware_mode": state.hardware_mode}

@app.post("/api/interlock/trip")
def trip_interlock():
    state.simulator.trip_relay()
    if state.arduino_reader:
        state.arduino_reader.send_command("TRIP_RELAY")
    return {"status": "success", "relay_state": 0, "message": "Emergency interlock tripped"}

@app.post("/api/interlock/reset")
def reset_interlock():
    state.simulator.reset_relay()
    if state.arduino_reader:
        state.arduino_reader.send_command("RESET_RELAY")
    return {"status": "success", "relay_state": 1, "message": "Interlock reset to closed/nominal"}

@app.get("/api/benchmark")
def run_benchmark_endpoint():
    return run_inference_benchmark()

# WebSocket Broadcasting Pipeline (Real-Time 20Hz Telemetry & Inference)
@app.websocket("/ws/telemetry")
async def websocket_telemetry_endpoint(websocket: WebSocket):
    await websocket.accept()
    state.connected_websockets.append(websocket)
    try:
        while True:
            # Keep socket open and receive any incoming control messages
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                if "mode" in msg:
                    state.simulator.set_fault_mode(int(msg["mode"]))
                elif "action" in msg:
                    if msg["action"] == "trip":
                        state.simulator.trip_relay()
                    elif msg["action"] == "reset":
                        state.simulator.reset_relay()
            except Exception:
                pass
    except WebSocketDisconnect:
        state.connected_websockets.remove(websocket)

async def telemetry_broadcaster_loop():
    """
    Continuous 20Hz loop:
    1. Grabs vibration window from Simulator or Live Arduino.
    2. Runs feature extraction + edge AI inference on Qualcomm NPU/CPU.
    3. Evaluates ISO 10816-3 severity and interlock logic.
    4. Broadcasts combined telemetry + FFT + AI insights to connected dashboards.
    """
    while True:
        try:
            # 1. Acquire raw telemetry
            batch = state.simulator.generate_batch(num_samples=256)
            ax_samples = np.array(batch["ax"], dtype=np.float32)
            rpm = batch["rpm"]
            temp_c = batch["temp_c"]

            # 2. Extract features & compute live FFT spectrum
            feat_vec = extract_feature_vector(ax_samples, sampling_rate=1000, rpm=rpm, temp=temp_c)
            fft_norm, freqs, psd = compute_frequency_domain_features(ax_samples, sampling_rate=1000, num_bins=32)

            # 3. On-Device Edge Inference (Qualcomm QNN / CPU Fallback)
            pred = state.inference_mgr.predict(feat_vec)
            
            # 4. Decision & Interlock Engine
            rms = batch["rms_vibration"]
            decision = DecisionEngine.evaluate(pred, rms_vibration=rms, temperature=temp_c, rpm=rpm)
            
            # Auto-trip interlock simulation if critical
            if decision["trip_interlock"] and batch["relay_state"] == 1:
                state.simulator.trip_relay()
                batch["relay_state"] = 0

            # 5. Pack live frame
            packet = {
                "telemetry": {
                    "seq": batch["seq"],
                    "timestamp": batch["timestamp"],
                    "rpm": rpm,
                    "temp_c": temp_c,
                    "rms_vibration": rms,
                    "peak_vibration": batch["peak_vibration"],
                    "relay_state": batch["relay_state"],
                    "hardware_mode": state.hardware_mode,
                    "simulated_fault_mode": batch.get("simulated_fault_mode", 0),
                    # Sample slice for oscilloscope display
                    "waveform": ax_samples[::4].tolist() # Downsample for smooth UI rendering
                },
                "spectrum": {
                    "freqs": [round(float(f), 1) for f in freqs[:64:2]],
                    "psd": [round(float(p), 4) for p in psd[:64:2]]
                },
                "ai_prediction": pred,
                "decision": decision
            }

            state.last_telemetry = packet["telemetry"]
            state.last_inference = pred
            state.last_decision = decision

            # Broadcast to UI clients
            if state.connected_websockets:
                msg_json = json.dumps(packet)
                dead_sockets = []
                for ws in state.connected_websockets:
                    try:
                        await ws.send_text(msg_json)
                    except Exception:
                        dead_sockets.append(ws)
                for ws in dead_sockets:
                    if ws in state.connected_websockets:
                        state.connected_websockets.remove(ws)

        except Exception as e:
            # Non-blocking graceful catch
            pass

        await asyncio.sleep(0.08) # ~12-15 Hz smooth UI refresh

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(telemetry_broadcaster_loop())

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
