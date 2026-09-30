"""
VibeGuard NeuroEdge - Signal Preprocessing & Feature Extraction Engine.
Extracts FFT spectrum, statistical moments, and rotordynamic features.
Runs purely on-device with zero cloud dependencies.
"""
import numpy as np
from typing import Dict, Tuple, Any

def compute_time_domain_features(signal: np.ndarray) -> np.ndarray:
    """
    Computes 16 time-domain statistical moments and kinematic indicators:
    RMS, Peak-to-Peak, Peak, Mean, Variance, Std, Kurtosis, Skewness,
    Crest Factor, Shape Factor, Impulse Factor, Margin Factor, Energy,
    Zero-Crossing Rate, Mean Absolute Deviation, Spectral Entropy proxy.
    """
    n = len(signal)
    if n == 0:
        return np.zeros(16, dtype=np.float32)
    
    mean_val = np.mean(signal)
    detrended = signal - mean_val
    std_val = np.std(signal) + 1e-9
    variance_val = np.var(signal)
    rms_val = np.sqrt(np.mean(signal**2)) + 1e-9
    peak_val = np.max(np.abs(signal))
    p2p_val = np.ptp(signal)
    
    # Higher order moments
    kurtosis_val = np.mean((detrended / std_val)**4) - 3.0
    skewness_val = np.mean((detrended / std_val)**3)
    
    # Dimensionless fault indicators
    crest_factor = peak_val / rms_val
    shape_factor = rms_val / (np.mean(np.abs(signal)) + 1e-9)
    impulse_factor = peak_val / (np.mean(np.abs(signal)) + 1e-9)
    margin_factor = peak_val / ((np.mean(np.sqrt(np.abs(signal))) + 1e-9)**2)
    
    energy_val = np.sum(signal**2) / n
    zero_crossings = np.sum(np.diff(np.signbit(detrended))) / n
    mad_val = np.mean(np.abs(detrended))
    
    # Normalized envelope variance proxy
    analytic_env = np.abs(signal)
    env_variance = np.var(analytic_env) / (variance_val + 1e-9)
    
    features = np.array([
        rms_val, p2p_val, peak_val, mean_val,
        variance_val, std_val, kurtosis_val, skewness_val,
        crest_factor, shape_factor, impulse_factor, margin_factor,
        energy_val, zero_crossings, mad_val, env_variance
    ], dtype=np.float32)
    
    return np.nan_to_num(features, nan=0.0, posinf=100.0, neginf=-100.0)

def compute_frequency_domain_features(signal: np.ndarray, sampling_rate: int = 1000, num_bins: int = 32) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    Computes Fast Fourier Transform (FFT) Power Spectral Density (PSD)
    and aggregates into normalized frequency energy bins suitable for 1D-CNN input.
    Returns: (binned_features [num_bins], freqs, psd)
    """
    n = len(signal)
    if n < 4:
        return np.zeros(num_bins, dtype=np.float32), np.array([]), np.array([])
    
    # Apply Hanning window to mitigate spectral leakage
    window = np.hanning(n)
    windowed_signal = (signal - np.mean(signal)) * window
    
    fft_vals = np.fft.rfft(windowed_signal)
    psd = (np.abs(fft_vals) ** 2) / (n * sampling_rate + 1e-9)
    freqs = np.fft.rfftfreq(n, d=1.0 / sampling_rate)
    
    # Resample / Bin PSD into fixed number of energy bands (e.g., 32 bins)
    bin_size = len(psd) // num_bins
    if bin_size < 1:
        # Interpolate if signal length is shorter
        binned = np.interp(np.linspace(0, len(psd)-1, num_bins), np.arange(len(psd)), psd)
    else:
        binned = np.zeros(num_bins, dtype=np.float32)
        for i in range(num_bins):
            start_idx = i * bin_size
            end_idx = (i + 1) * bin_size if i < num_bins - 1 else len(psd)
            binned[i] = np.mean(psd[start_idx:end_idx])
            
    # Log-scale compression to handle dynamic vibration range
    binned = np.log1p(binned)
    binned_norm = binned / (np.max(binned) + 1e-9)
    
    return np.nan_to_num(binned_norm.astype(np.float32), nan=0.0), freqs, psd

def extract_feature_vector(signal: np.ndarray, sampling_rate: int = 1000, rpm: float = 1800.0, temp: float = 35.0) -> np.ndarray:
    """
    Produces complete 64-dimensional feature vector:
    - [0:32]  : 32 FFT Normalized Power Spectral Density Bins
    - [32:48] : 16 Time-domain Statistical & Waveform Metrics
    - [48:64] : 16 Operational & Harmonic Kinematic Features (RPM, Temp, 1x/2x/3x harmonics)
    Input shape returned: [1, 64] float32
    """
    fft_bins, freqs, psd = compute_frequency_domain_features(signal, sampling_rate=sampling_rate, num_bins=32)
    time_feats = compute_time_domain_features(signal)
    
    # Kinematic & Machine Operational indicators
    f0 = rpm / 60.0  # Fundamental shaft rotational frequency (Hz)
    
    def get_energy_near(target_freq: float, tolerance: float = 2.5) -> float:
        if len(freqs) == 0:
            return 0.0
        mask = (freqs >= target_freq - tolerance) & (freqs <= target_freq + tolerance)
        return float(np.sum(psd[mask])) if np.any(mask) else 0.0

    e_1x = get_energy_near(f0)
    e_2x = get_energy_near(2 * f0)
    e_3x = get_energy_near(3 * f0)
    e_4x = get_energy_near(4 * f0)
    # Bearing outer race defect frequency proxy (BPFO ~ 3.57 * f0)
    e_bpfo = get_energy_near(3.57 * f0)
    # Bearing inner race defect frequency proxy (BPFI ~ 5.43 * f0)
    e_bpfi = get_energy_near(5.43 * f0)
    
    total_energy = float(np.sum(psd) + 1e-9)
    ratio_1x = e_1x / total_energy
    ratio_2x = e_2x / total_energy
    ratio_3x = e_3x / total_energy
    ratio_bpfo = e_bpfo / total_energy
    ratio_bpfi = e_bpfi / total_energy
    
    norm_rpm = (rpm - 1000.0) / 3000.0
    norm_temp = (temp - 20.0) / 80.0
    
    kinematic_feats = np.array([
        norm_rpm, norm_temp, f0 / 100.0,
        ratio_1x, ratio_2x, ratio_3x,
        ratio_bpfo, ratio_bpfi,
        e_1x, e_2x, e_3x, e_bpfo, e_bpfi,
        total_energy,
        float(np.mean(signal)),
        float(np.std(signal))
    ], dtype=np.float32)
    
    feature_vector = np.concatenate([fft_bins, time_feats, kinematic_feats], axis=0)
    return np.nan_to_num(feature_vector.reshape(1, 64), nan=0.0).astype(np.float32)
