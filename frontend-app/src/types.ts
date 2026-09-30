export interface TelemetryData {
  seq: number;
  timestamp: number;
  rpm: number;
  temp_c: number;
  rms_vibration: number;
  peak_vibration: number;
  relay_state: number;
  hardware_mode: 'simulation' | 'hardware';
  simulated_fault_mode: number;
  waveform: number[];
}

export interface SpectrumData {
  freqs: number[];
  psd: number[];
}

export interface AIPrediction {
  predicted_class: number;
  fault_label: string;
  confidence: number;
  probabilities: number[];
  rul: number;
  latency_ms: number;
  backend: string;
  precision: string;
  is_npu: boolean;
}

export interface DecisionData {
  iso_zone: string;
  severity_level: string;
  severity_color: string;
  trip_interlock: boolean;
  recommended_action: string;
  urgency: string;
  expected_impact: string;
  root_cause_explanation: string[];
  estimated_hours_remaining: number;
  health_score_pct: number;
}

export interface WebSocketPacket {
  telemetry: TelemetryData;
  spectrum: SpectrumData;
  ai_prediction: AIPrediction;
  decision: DecisionData;
}

export interface HardwareStatus {
  os: string;
  machine: string;
  processor: string;
  is_arm64: boolean;
  is_snapdragon_detected: boolean;
  available_execution_providers: string[];
  qnn_available: boolean;
  recommended_provider: string;
  status_label: string;
  is_npu_active: boolean;
  truthful_note: string;
}

export interface AIStatus {
  active_model: string;
  precision: string;
  execution_provider: string;
  is_npu_active: boolean;
  hardware_environment: string;
  snapdragon_status: string;
}
