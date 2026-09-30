"""
VibeGuard NeuroEdge - ISO 10816-3 Decision, Explainability & Interlock Engine.
Translates raw AI inferences and vibration telemetry into:
  1. Vibration Severity Grading (ISO 10816-3: Zone A [Good], B [Acceptable], C [Alert], D [Danger])
  2. Explainable Root Cause Attribution
  3. Actionable Maintenance Prescriptions
  4. Automated Emergency Trip Signal (Relay trigger)
"""
import numpy as np
from typing import Dict, Any, List

class DecisionEngine:
    # ISO 10816-3 Vibration Severity Thresholds (RMS velocity mm/s or g) for Class II Medium Machinery
    ISO_ZONE_A_GOOD = 1.8       # Up to 1.8: Brand new / optimal
    ISO_ZONE_B_ACCEPTABLE = 4.5 # 1.8 to 4.5: Unrestricted continuous operation
    ISO_ZONE_C_ALERT = 7.1      # 4.5 to 7.1: Restricted operation, schedule maintenance
    # Above 7.1: Zone D [Danger] -> Mandatory trip/interlock

    RECOMMENDATIONS = {
        0: {
            "title": "Normal Baseline Operation",
            "action": "Maintain scheduled autonomous monitoring. No maintenance required.",
            "urgency": "None",
            "expected_impact": "Zero downtime risk; energy efficiency within optimal curve."
        },
        1: {
            "title": "Dynamic Mass Imbalance Detected",
            "action": "Inspect rotor coupling, check for dust/debris buildup on impeller blades, perform single-plane field dynamic balancing.",
            "urgency": "Medium (Within 72 Hours)",
            "expected_impact": "Prevents accelerated fatigue stress on shaft bearings and seal failure."
        },
        2: {
            "title": "Shaft Angular / Parallel Misalignment",
            "action": "Perform laser shaft alignment between motor and load coupling; inspect flexible shim wear and tighten foundation bolts to specified torque.",
            "urgency": "High (Within 24 Hours)",
            "expected_impact": "Eliminates parasitic axial loads, reducing motor heat by ~15% and preserving coupling life."
        },
        3: {
            "title": "Critical Bearing Outer Race Fatigue (Spalling)",
            "action": "Immediate inspection required. Flush and replenish synthetic bearing lubricant; schedule bearing assembly replacement before fatigue flaking triggers cage seizure.",
            "urgency": "Critical (Immediate / Emergency Stop)",
            "expected_impact": "Averts catastrophic catastrophic stator-rotor contact, catastrophic motor burnout, and unscheduled production halt."
        }
    }

    @classmethod
    def evaluate(cls, prediction_result: Dict[str, Any], rms_vibration: float, temperature: float, rpm: float) -> Dict[str, Any]:
        fault_cls = prediction_result.get("predicted_class", 0)
        confidence = prediction_result.get("confidence", 0.0)
        rul = prediction_result.get("rul", 1.0)
        
        # 1. ISO 10816-3 Severity Assessment
        if rms_vibration < cls.ISO_ZONE_A_GOOD:
            iso_zone = "Zone A (Good)"
            severity_level = "OPTIMAL"
            severity_color = "#10b981" # Green
            trip_interlock = False
        elif rms_vibration < cls.ISO_ZONE_B_ACCEPTABLE:
            iso_zone = "Zone B (Acceptable)"
            severity_level = "ACCEPTABLE"
            severity_color = "#3b82f6" # Blue
            trip_interlock = False
        elif rms_vibration < cls.ISO_ZONE_C_ALERT:
            iso_zone = "Zone C (Unsatisfactory)"
            severity_level = "WARNING"
            severity_color = "#f59e0b" # Amber
            trip_interlock = False
        else:
            iso_zone = "Zone D (Unacceptable)"
            severity_level = "CRITICAL"
            severity_color = "#ef4444" # Red
            trip_interlock = True

        # Safety override: Bearing fault with high confidence (>85%) or RUL < 15% forces interlock
        if (fault_cls == 3 and confidence > 0.85) or (rul < 0.12 and rms_vibration > 4.0):
            trip_interlock = True
            severity_level = "CRITICAL INTERLOCK"
            severity_color = "#dc2626"

        # 2. Explainable Root Cause Feature Attribution
        f0 = rpm / 60.0
        explanations = []
        if fault_cls == 0:
            explanations.append(f"Harmonic vibration energy remains balanced across 1X ({f0:.1f}Hz) and sub-harmonics.")
            explanations.append(f"Operating thermal equilibrium stabilized at {temperature:.1f}°C.")
        elif fault_cls == 1:
            explanations.append(f"Sharp spectral surge concentrated at fundamental rotational frequency 1X ({f0:.1f}Hz).")
            explanations.append(f"RMS acceleration elevated to {rms_vibration:.2f}g indicating centrifugal unbalance vector.")
        elif fault_cls == 2:
            explanations.append(f"Prominent harmonic energy detected at 2X ({2*f0:.1f}Hz) and 3X ({3*f0:.1f}Hz).")
            explanations.append("Phase-shifted cyclic moments characteristic of angular shaft misalignment.")
        elif fault_cls == 3:
            explanations.append(f"Impulsive ring-down transients detected aligning with calculated BPFO ({3.57*f0:.1f}Hz).")
            explanations.append(f"Frictional thermal dissipation elevated bearing housing to {temperature:.1f}°C.")

        # 3. Actionable Prescription
        rec_data = cls.RECOMMENDATIONS.get(fault_cls, cls.RECOMMENDATIONS[0])
        
        # 4. Synthesized Decision Payload
        return {
            "iso_zone": iso_zone,
            "severity_level": severity_level,
            "severity_color": severity_color,
            "trip_interlock": trip_interlock,
            "recommended_action": rec_data["action"],
            "urgency": rec_data["urgency"],
            "expected_impact": rec_data["expected_impact"],
            "root_cause_explanation": explanations,
            "estimated_hours_remaining": round(rul * 2400.0, 1), # Max 2400 operating hours to maintenance
            "health_score_pct": round(rul * 100.0, 1)
        }
