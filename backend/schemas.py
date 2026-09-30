"""
Pydantic Schemas for VibeGuard NeuroEdge REST & WebSocket API.
"""
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class TelemetryPayload(BaseModel):
    seq: int
    timestamp: float
    rpm: float
    temp_c: float
    rms_vibration: float
    peak_vibration: float
    relay_state: int
    ax: List[float]
    ay: Optional[List[float]] = None
    az: Optional[List[float]] = None

class PredictionRequest(BaseModel):
    rpm: float = Field(default=1800.0, description="Rotational speed in RPM")
    temp_c: float = Field(default=35.0, description="Surface casing temperature")
    vibration_samples: List[float] = Field(..., description="Vibration time-series waveform (min 64 samples)")

class PredictionResponse(BaseModel):
    predicted_class: int
    fault_label: str
    confidence: float
    probabilities: List[float]
    rul: float
    latency_ms: float
    backend: str
    precision: str
    is_npu: bool
    iso_zone: str
    severity_level: str
    severity_color: str
    trip_interlock: bool
    recommended_action: str
    urgency: str
    expected_impact: str
    root_cause_explanation: List[str]

class HardwareStatusResponse(BaseModel):
    os: str
    machine: str
    processor: str
    is_arm64: bool
    is_snapdragon_detected: bool
    available_execution_providers: List[str]
    qnn_available: bool
    recommended_provider: str
    status_label: str
    is_npu_active: bool
    truthful_note: str

class SimulationModeRequest(BaseModel):
    mode: int = Field(..., ge=0, le=4, description="0: Normal, 1: Imbalance, 2: Misalignment, 3: Bearing Fault, 4: Overheat")

class HardwareModeRequest(BaseModel):
    mode: str = Field(..., pattern="^(simulation|hardware)$", description="'simulation' or 'hardware'")
