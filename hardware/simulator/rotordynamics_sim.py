"""
High-Fidelity Rotordynamics Physics Telemetry Simulator.
Generates real-time continuous 3-axis vibration, motor speed, and casing temperature.
Allows live interactive fault injection:
  - 0: Normal
  - 1: Imbalance
  - 2: Misalignment
  - 3: Bearing Outer Race Fault
  - 4: Overheat / Lubrication Starvation
"""
import numpy as np
import time
from typing import Dict, Any

class RotordynamicSimulator:
    def __init__(self, sampling_rate: int = 1000, base_rpm: float = 1780.0):
        self.sampling_rate = sampling_rate
        self.base_rpm = base_rpm
        self.current_mode = 0 # 0: Normal, 1: Imbalance, 2: Misalign, 3: Bearing, 4: Overheat
        self.seq = 0
        self.simulated_temp = 38.5
        self.relay_state = 1 # 1: Closed/Running, 0: Tripped/Interlocked
        self.time_offset = 0.0

    def set_fault_mode(self, mode: int):
        if mode in [0, 1, 2, 3, 4]:
            self.current_mode = mode

    def reset_relay(self):
        self.relay_state = 1

    def trip_relay(self):
        self.relay_state = 0

    def generate_batch(self, num_samples: int = 512) -> Dict[str, Any]:
        """
        Synthesizes a continuous block of vibration waveform samples and machine telemetry.
        """
        self.seq += 1
        duration = num_samples / self.sampling_rate
        t = np.linspace(self.time_offset, self.time_offset + duration, num_samples, endpoint=False)
        self.time_offset += duration

        # Add small realistic RPM drift (+-15 RPM)
        rpm = self.base_rpm + 12.0 * np.sin(0.2 * self.time_offset)
        f0 = rpm / 60.0

        # Base nominal vibration
        ax = 0.25 * np.sin(2 * np.pi * f0 * t) + np.random.normal(0, 0.08, num_samples)
        ay = 0.22 * np.cos(2 * np.pi * f0 * t) + np.random.normal(0, 0.08, num_samples)
        az = 0.98 + 0.15 * np.sin(2 * np.pi * 2 * f0 * t) + np.random.normal(0, 0.05, num_samples)

        # Temperature baseline
        target_temp = 38.0

        if self.current_mode == 1:
            # Mass Dynamic Imbalance: 1X fundamental amplification
            unbalance_amp = 2.4
            ax += unbalance_amp * np.sin(2 * np.pi * f0 * t + 0.3)
            ay += (0.85 * unbalance_amp) * np.cos(2 * np.pi * f0 * t + 0.3)
            target_temp = 48.0

        elif self.current_mode == 2:
            # Shaft Angular Misalignment: 2X and 3X harmonic dominance
            misalign_amp = 1.9
            ax += misalign_amp * np.sin(2 * np.pi * 2 * f0 * t) + 0.9 * np.sin(2 * np.pi * 3 * f0 * t)
            ay += 1.4 * np.cos(2 * np.pi * 2 * f0 * t + 0.5)
            target_temp = 54.0

        elif self.current_mode == 3:
            # Bearing Outer Race Fault (BPFO)
            f_bpfo = 3.57 * f0
            period_samples = max(2, int(self.sampling_rate / f_bpfo))
            impulses = np.zeros(num_samples)
            for idx in range(0, num_samples, period_samples):
                impulses[idx] = np.random.uniform(3.5, 6.2)
            
            # Dampened resonance response
            t_decay = np.linspace(0, 0.04, int(self.sampling_rate * 0.04))
            impulse_kernel = np.exp(-140.0 * t_decay) * np.sin(2 * np.pi * 315.0 * t_decay)
            bearing_noise = np.convolve(impulses, impulse_kernel, mode='same')
            
            ax += bearing_noise
            ay += 0.7 * bearing_noise
            az += 0.5 * bearing_noise
            target_temp = 72.0

        elif self.current_mode == 4:
            # Overheat & lubrication dry run
            ax += np.random.normal(0, 0.65, num_samples)
            target_temp = 88.0

        # Thermal inertia lag
        self.simulated_temp += 0.05 * (target_temp - self.simulated_temp)

        rms_val = float(np.sqrt(np.mean(ax**2)))
        peak_val = float(np.max(np.abs(ax)))

        return {
            "seq": self.seq,
            "timestamp": time.time(),
            "rpm": round(float(rpm), 1),
            "temp_c": round(float(self.simulated_temp), 1),
            "ax": ax.astype(np.float32).tolist(),
            "ay": ay.astype(np.float32).tolist(),
            "az": az.astype(np.float32).tolist(),
            "rms_vibration": round(rms_val, 3),
            "peak_vibration": round(peak_val, 3),
            "relay_state": self.relay_state,
            "simulated_fault_mode": self.current_mode
        }
