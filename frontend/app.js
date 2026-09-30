/**
 * VibeGuard NeuroEdge - Client-side WebSocket & Telemetry Dashboard Controller.
 * Handles Chart.js live oscilloscope, FFT frequency spectrum,
 * AI fault diagnosis updates, and hardware/scenario injection commands.
 */

let websocket = null;
let waveformChart = null;
let spectrumChart = null;
let currentMode = 0;
let isHardware = false;

document.addEventListener("DOMContentLoaded", () => {
  initCharts();
  initWebSocket();
  fetchHardwareStatus();
  fetchAIStatus();
  bindUIEvents();
});

// 1. Initialize Chart.js Oscilloscope & FFT Spectrum
function initCharts() {
  const chartFont = { family: "'JetBrains Mono', monospace", size: 10 };
  const gridColor = 'rgba(255, 255, 255, 0.05)';
  const tickColor = '#64748b';

  // Waveform Oscilloscope Chart
  const ctxWave = document.getElementById('waveformChart').getContext('2d');
  const wavePoints = 64;
  const initialLabels = Array.from({ length: wavePoints }, (_, i) => `${(i * 1.0).toFixed(0)}ms`);
  const initialData = Array(wavePoints).fill(0);

  waveformChart = new Chart(ctxWave, {
    type: 'line',
    data: {
      labels: initialLabels,
      datasets: [{
        label: 'Acceleration (g)',
        data: initialData,
        borderColor: '#00f0ff',
        backgroundColor: 'rgba(0, 240, 255, 0.08)',
        borderWidth: 2,
        tension: 0.25,
        fill: true,
        pointRadius: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      scales: {
        x: { grid: { color: gridColor }, ticks: { color: tickColor, font: chartFont, maxTicksLimit: 8 } },
        y: {
          min: -4.0,
          max: 4.0,
          grid: { color: gridColor },
          ticks: { color: tickColor, font: chartFont }
        }
      },
      plugins: { legend: { display: false } }
    }
  });

  // FFT Power Spectrum Chart
  const ctxSpec = document.getElementById('spectrumChart').getContext('2d');
  const specBins = 32;
  const initialFreqs = Array.from({ length: specBins }, (_, i) => `${(i * 15.6).toFixed(0)}Hz`);
  const initialPSD = Array(specBins).fill(0);

  spectrumChart = new Chart(ctxSpec, {
    type: 'bar',
    data: {
      labels: initialFreqs,
      datasets: [{
        label: 'Power Spectral Density',
        data: initialPSD,
        backgroundColor: (context) => {
          const idx = context.dataIndex;
          if (idx === 2) return '#00f0ff'; // 1X RPM area
          if (idx === 4 || idx === 6) return '#f59e0b'; // 2X, 3X area
          if (idx >= 7 && idx <= 10) return '#ef4444'; // BPFO band
          return 'rgba(56, 189, 248, 0.4)';
        },
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      scales: {
        x: { grid: { color: gridColor }, ticks: { color: tickColor, font: chartFont, maxTicksLimit: 8 } },
        y: { min: 0, max: 1.0, grid: { color: gridColor }, ticks: { color: tickColor, font: chartFont } }
      },
      plugins: { legend: { display: false } }
    }
  });
}

// 2. Establish High-Speed WebSocket Connection
function initWebSocket() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}/ws/telemetry`;

  websocket = new WebSocket(wsUrl);

  websocket.onopen = () => {
    console.log("Connected to VibeGuard Telemetry WebSocket Pipeline.");
  };

  websocket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      updateDashboard(data);
    } catch (e) {
      console.error("Malformed packet received:", e);
    }
  };

  websocket.onclose = () => {
    console.warn("WebSocket disconnected. Retrying in 2 seconds...");
    setTimeout(initWebSocket, 2000);
  };
}

// 3. Update Dashboard with Real-Time Frame
function updateDashboard(frame) {
  const { telemetry, spectrum, ai_prediction, decision } = frame;

  // Telemetry KPIs
  document.getElementById('val-rms').textContent = `${telemetry.rms_vibration.toFixed(2)} g`;
  document.getElementById('val-peak').textContent = `${telemetry.peak_vibration.toFixed(2)} g`;
  document.getElementById('val-rpm').textContent = `${Math.round(telemetry.rpm)} RPM`;
  document.getElementById('val-temp').textContent = `${telemetry.temp_c.toFixed(1)} °C`;

  // Relay Badge
  const relayBadge = document.getElementById('relay-status-badge');
  const relayLabel = document.getElementById('relay-label');
  if (telemetry.relay_state === 1) {
    relayBadge.className = "relay-badge relay-engaged";
    relayLabel.textContent = "RELAY: CLOSED (NOMINAL)";
  } else {
    relayBadge.className = "relay-badge relay-tripped";
    relayLabel.textContent = "RELAY: TRIPPED (INTERLOCK)";
  }

  // Update AI Health & Diagnosis
  const faultTitle = document.getElementById('ai-fault-title');
  faultTitle.textContent = ai_prediction.fault_label;
  faultTitle.style.color = decision.severity_color;

  const confPct = Math.round(ai_prediction.confidence * 100);
  document.getElementById('ai-confidence-val').textContent = `${confPct}%`;
  document.getElementById('ai-confidence-fill').style.width = `${confPct}%`;

  // ISO Zone Badge
  const isoBadge = document.getElementById('iso-zone-badge');
  isoBadge.textContent = decision.iso_zone;
  isoBadge.style.borderColor = decision.severity_color;
  isoBadge.style.color = decision.severity_color;

  // Remaining Useful Life (RUL)
  const rulPct = Math.round(ai_prediction.rul * 100);
  document.getElementById('rul-percent').textContent = `${rulPct}%`;
  document.getElementById('rul-hours-val').textContent = `${Math.round(decision.estimated_hours_remaining).toLocaleString()} hrs`;
  document.getElementById('rul-circle-path').setAttribute('stroke-dasharray', `${rulPct}, 100`);
  if (rulPct < 25) {
    document.getElementById('rul-circle-path').style.stroke = '#ef4444';
  } else if (rulPct < 60) {
    document.getElementById('rul-circle-path').style.stroke = '#f59e0b';
  } else {
    document.getElementById('rul-circle-path').style.stroke = '#00f0ff';
  }

  // Actionable Recommendation Box
  document.getElementById('rec-urgency').textContent = `URGENCY: ${decision.urgency}`;
  document.getElementById('rec-action-text').textContent = decision.recommended_action;
  document.getElementById('rec-impact-text').textContent = decision.expected_impact;

  // Snapdragon Metric Pills
  document.getElementById('pill-provider').textContent = ai_prediction.backend;
  document.getElementById('pill-latency').textContent = `${ai_prediction.latency_ms} ms`;
  document.getElementById('pill-precision').textContent = ai_prediction.precision;
  document.getElementById('pill-npu-flag').textContent = ai_prediction.is_npu ? "ACTIVE (Hexagon NPU)" : "Inactive (CPU Fallback)";

  // Explainability List
  const explainList = document.getElementById('explain-list');
  explainList.innerHTML = '';
  decision.root_cause_explanation.forEach(exp => {
    const li = document.createElement('li');
    li.textContent = exp;
    explainList.appendChild(li);
  });

  // Probability Breakdown Bars
  if (ai_prediction.probabilities && ai_prediction.probabilities.length === 4) {
    ai_prediction.probabilities.forEach((p, idx) => {
      const pct = Math.round(p * 100);
      const bar = document.getElementById(`prob-bar-0`.replace('0', idx));
      const val = document.getElementById(`prob-val-0`.replace('0', idx));
      if (bar) bar.style.width = `${pct}%`;
      if (val) val.textContent = `${pct}%`;
    });
  }

  // Live Waveform Plot
  if (waveformChart && telemetry.waveform) {
    waveformChart.data.datasets[0].data = telemetry.waveform;
    // Auto-scale Y axis smoothly if vibration spikes
    const peak = telemetry.peak_vibration;
    const yBound = Math.max(2.5, Math.ceil(peak * 1.3));
    waveformChart.options.scales.y.min = -yBound;
    waveformChart.options.scales.y.max = yBound;
    waveformChart.update();
  }

  // Live FFT Spectrum Plot
  if (spectrumChart && spectrum.psd) {
    spectrumChart.data.datasets[0].data = spectrum.psd;
    spectrumChart.update();
  }
}

// 4. Fetch Truthful Hardware Status
async function fetchHardwareStatus() {
  try {
    const res = await fetch('/api/hardware/status');
    const data = await res.json();
    document.getElementById('backend-status-title').textContent = data.status_label;
    document.getElementById('truthful-banner-text').textContent = data.truthful_note;
  } catch (e) {
    console.error("Hardware fetch failed:", e);
  }
}

// 5. Fetch AI Engine Status
async function fetchAIStatus() {
  try {
    const res = await fetch('/api/ai/status');
    const data = await res.json();
    document.getElementById('pill-provider').textContent = data.execution_provider;
    document.getElementById('pill-precision').textContent = data.precision;
  } catch (e) {
    console.error("AI status fetch failed:", e);
  }
}

// 6. Bind User Controls and Scenarios
function bindUIEvents() {
  // Scenario injection buttons
  const buttons = document.querySelectorAll('.btn-scenario');
  buttons.forEach(btn => {
    btn.addEventListener('click', async () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const mode = parseInt(btn.getAttribute('data-mode'));
      currentMode = mode;
      
      // Dispatch via API
      await fetch('/api/simulator/mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode })
      });
    });
  });

  // Emergency Trip
  document.getElementById('btn-trip').addEventListener('click', async () => {
    await fetch('/api/interlock/trip', { method: 'POST' });
  });

  // Reset Relay
  document.getElementById('btn-reset').addEventListener('click', async () => {
    await fetch('/api/interlock/reset', { method: 'POST' });
  });

  // Hardware Mode Toggle
  document.getElementById('btn-toggle-hw').addEventListener('click', async () => {
    isHardware = !isHardware;
    const targetMode = isHardware ? 'hardware' : 'simulation';
    const res = await fetch('/api/hardware/mode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: targetMode })
    });
    const data = await res.json();
    const badge = document.getElementById('hardware-mode-badge');
    const label = document.getElementById('hardware-mode-label');
    if (data.active_hardware_mode === 'hardware') {
      badge.className = 'mode-badge hardware-active';
      label.textContent = 'LIVE ARDUINO HARDWARE';
    } else {
      badge.className = 'mode-badge simulation-active';
      label.textContent = 'SIMULATION MODE';
    }
  });

  // Run Benchmark Button
  document.getElementById('btn-run-benchmark').addEventListener('click', async () => {
    const btn = document.getElementById('btn-run-benchmark');
    btn.textContent = 'Benchmarking...';
    btn.disabled = true;
    try {
      const res = await fetch('/api/benchmark');
      const data = await res.json();
      alert(`Benchmark Complete!\nCPU Latency (Mean): ${data.cpu_benchmark.mean_latency_ms} ms\nThroughput: ${data.cpu_benchmark.throughput_inf_per_sec} inf/sec\nSnapdragon Status: ${data.snapdragon_npu_benchmark.status || 'Active'}`);
    } catch (e) {
      alert(`Benchmark error: ${e}`);
    } finally {
      btn.textContent = '🚀 Run Hardware Benchmark';
      btn.disabled = false;
    }
  });
}
