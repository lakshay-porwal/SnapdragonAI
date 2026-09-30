"""
Physics-Based Synthetic Dataset Generator for Rotordynamics and Machine Fault Diagnostics.
Generates ISO 10816 compliant vibration signals for:
  Class 0: Healthy Normal Machine
  Class 1: Mass Dynamic Imbalance (1X fundamental dominance)
  Class 2: Shaft Angular Misalignment (2X, 3X harmonic dominance)
  Class 3: Bearing Outer Race Fault (BPFO impulse modulation trains)
Also computes corresponding Remaining Useful Life (RUL) indices.
"""
import numpy as np
import os
from typing import Tuple, Dict
from ai.preprocessing.feature_extractor import extract_feature_vector

def generate_vibration_sample(
    fault_type: int,
    sampling_rate: int = 1000,
    duration_sec: float = 0.512, # 512 samples
    rpm: float = 1800.0,
    noise_level: float = 0.08
) -> Tuple[np.ndarray, float, float]:
    """
    Generates synthetic raw time-series vibration signal (in mm/s or g)
    Returns: (signal, temperature, rul)
    """
    n_samples = int(sampling_rate * duration_sec)
    t = np.linspace(0, duration_sec, n_samples, endpoint=False)
    f0 = rpm / 60.0 # Fundamental rotational frequency (Hz)
    
    # Base structural mechanical hum
    signal = 0.2 * np.sin(2 * np.pi * f0 * t) + 0.05 * np.sin(2 * np.pi * 2 * f0 * t)
    temp = 32.0 + np.random.uniform(-1.5, 2.0)
    rul = 0.95 + np.random.uniform(-0.05, 0.05)
    
    if fault_type == 0:
        # Healthy normal
        noise = np.random.normal(0, noise_level, n_samples)
        signal = signal + noise
        
    elif fault_type == 1:
        # Dynamic Mass Imbalance: Strong 1X unbalance peak
        imbalance_sev = np.random.uniform(1.2, 3.5)
        signal += imbalance_sev * np.sin(2 * np.pi * f0 * t + np.random.uniform(0, np.pi))
        temp += np.random.uniform(4.0, 10.0)
        rul = np.random.uniform(0.50, 0.75)
        noise = np.random.normal(0, noise_level * 1.5, n_samples)
        signal = signal + noise
        
    elif fault_type == 2:
        # Angular Misalignment: Strong 2X and 3X harmonic peaks + phase shift
        misalign_sev = np.random.uniform(1.0, 3.0)
        signal += misalign_sev * np.sin(2 * np.pi * 2 * f0 * t + 0.4)
        signal += (0.5 * misalign_sev) * np.sin(2 * np.pi * 3 * f0 * t + 0.8)
        temp += np.random.uniform(8.0, 18.0)
        rul = np.random.uniform(0.30, 0.55)
        noise = np.random.normal(0, noise_level * 1.8, n_samples)
        signal = signal + noise
        
    elif fault_type == 3:
        # Bearing Outer Race Fault (BPFO): Repeating decaying impulse ring-downs
        # BPFO ~ 3.57 * f0
        f_bpfo = 3.57 * f0
        f_resonance = 320.0 # Bearing natural resonance ring-down frequency
        decay_rate = 120.0
        
        # Create impulse train
        impulse_period_samples = int(sampling_rate / f_bpfo)
        impulse_train = np.zeros(n_samples)
        for idx in range(0, n_samples, impulse_period_samples):
            impulse_train[idx] = np.random.uniform(2.5, 5.5)
            
        # Convolve with exponentially decaying resonance
        t_imp = np.linspace(0, 0.05, int(sampling_rate * 0.05))
        damped_wave = np.exp(-decay_rate * t_imp) * np.sin(2 * np.pi * f_resonance * t_imp)
        fault_impacts = np.convolve(impulse_train, damped_wave, mode='same')
        
        signal = signal + fault_impacts
        temp += np.random.uniform(15.0, 35.0) # High friction heating
        rul = np.random.uniform(0.05, 0.28) # Imminent failure
        noise = np.random.normal(0, noise_level * 2.0, n_samples)
        signal = signal + noise

    rul = float(np.clip(rul, 0.0, 1.0))
    return signal.astype(np.float32), float(temp), rul

def create_dataset(samples_per_class: int = 400, output_dir: str = "ai/dataset") -> str:
    """
    Generates balanced training and validation dataset and saves as compressed .npz
    """
    os.makedirs(output_dir, exist_ok=True)
    num_classes = 4
    total_samples = samples_per_class * num_classes
    
    X = np.zeros((total_samples, 64), dtype=np.float32)
    y_class = np.zeros(total_samples, dtype=np.int64)
    y_rul = np.zeros(total_samples, dtype=np.float32)
    
    idx = 0
    print(f"Synthesizing {total_samples} industrial vibration samples...")
    for c in range(num_classes):
        for _ in range(samples_per_class):
            rpm = np.random.uniform(1200.0, 2400.0)
            sig, temp, rul = generate_vibration_sample(fault_type=c, rpm=rpm)
            feat = extract_feature_vector(sig, sampling_rate=1000, rpm=rpm, temp=temp)
            
            X[idx] = feat.flatten()
            y_class[idx] = c
            y_rul[idx] = rul
            idx += 1
            
    # Shuffle dataset
    indices = np.arange(total_samples)
    np.random.seed(42)
    np.random.shuffle(indices)
    
    X = X[indices]
    y_class = y_class[indices]
    y_rul = y_rul[indices]
    
    # 80/20 train/val split
    split_idx = int(0.8 * total_samples)
    dataset_path = os.path.join(output_dir, "vibeguard_dataset.npz")
    np.savez_compressed(
        dataset_path,
        X_train=X[:split_idx],
        y_train_class=y_class[:split_idx],
        y_train_rul=y_rul[:split_idx],
        X_val=X[split_idx:],
        y_val_class=y_class[split_idx:],
        y_val_rul=y_rul[split_idx:]
    )
    print(f"Dataset successfully compiled and stored at: {dataset_path}")
    return dataset_path

if __name__ == "__main__":
    create_dataset()
