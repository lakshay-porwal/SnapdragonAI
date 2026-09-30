import React from 'react';
import { 
  Activity, 
  Thermometer, 
  RotateCw, 
  Cpu, 
  Clock, 
  AlertCircle
} from 'lucide-react';
import { MetricCard } from '../components/MetricCard';
import { ChartCard } from '../components/ChartCard';
import { DiagnosisCard } from '../components/DiagnosisCard';
import { RecommendationCard } from '../components/RecommendationCard';
import { HealthScoreCard } from '../components/HealthScoreCard';
import { SnapdragonPerformanceCard } from '../components/SnapdragonPerformanceCard';
import { ScenarioInjector } from '../components/ScenarioInjector';
import { WebSocketPacket, HardwareStatus } from '../types';

interface OverviewPageProps {
  packet: WebSocketPacket | null;
  hardwareStatus: HardwareStatus | null;
  onSelectMode: (mode: number) => void;
  onRunBenchmark: () => void;
  isBenchmarking: boolean;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  packet,
  hardwareStatus,
  onSelectMode,
  onRunBenchmark,
  isBenchmarking
}) => {
  const telemetry = packet?.telemetry;
  const prediction = packet?.ai_prediction;
  const decision = packet?.decision;

  // Format waveform data for Recharts line chart
  const waveformData = telemetry?.waveform?.map((val, idx) => ({
    time: `${(idx * 2.0).toFixed(0)}ms`,
    accel: Number(val.toFixed(2))
  })) || Array.from({ length: 32 }, (_, i) => ({ time: `${i * 2}ms`, accel: 0 }));

  // Format FFT spectrum for Recharts bar chart
  const spectrumData = packet?.spectrum?.psd?.slice(0, 24).map((p, idx) => ({
    freq: `${(idx * 16.5).toFixed(0)}Hz`,
    power: Number(p.toFixed(3))
  })) || Array.from({ length: 24 }, (_, i) => ({ freq: `${i * 16}Hz`, power: 0 }));

  return (
    <div className="space-y-6">
      {/* 1. Snapdragon AI Performance Banner (Top Priority Enterprise Section) */}
      <SnapdragonPerformanceCard 
        hardwareStatus={hardwareStatus}
        prediction={prediction || null}
        onRunBenchmark={onRunBenchmark}
        isBenchmarking={isBenchmarking}
      />

      {/* 2. Primary KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="RMS Acceleration"
          value={telemetry?.rms_vibration ? telemetry.rms_vibration.toFixed(2) : '0.25'}
          unit="g"
          subtext="ISO 10816 Threshold: 4.5g"
          icon={Activity}
          color={telemetry && telemetry.rms_vibration > 4.5 ? 'red' : 'blue'}
          badge="Live 20Hz"
        />
        <MetricCard
          title="Shaft Velocity"
          value={telemetry?.rpm ? Math.round(telemetry.rpm) : '1,780'}
          unit="RPM"
          subtext="Rotational Frequency ~ 29.7 Hz"
          icon={RotateCw}
          color="emerald"
        />
        <MetricCard
          title="Bearing Housing Temp"
          value={telemetry?.temp_c ? telemetry.temp_c.toFixed(1) : '38.2'}
          unit="°C"
          subtext="Thermal Equilibrium Range"
          icon={Thermometer}
          color={telemetry && telemetry.temp_c > 65.0 ? 'red' : 'amber'}
        />
        <MetricCard
          title="On-Device Latency"
          value={prediction?.latency_ms ? prediction.latency_ms.toFixed(2) : '0.55'}
          unit="ms"
          subtext="Target Snapdragon NPU: < 0.15ms"
          icon={Clock}
          color="violet"
          badge="Zero Cloud"
        />
      </div>

      {/* 3. AI Verdict & Health Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <HealthScoreCard
          score={decision?.health_score_pct ?? 95}
          isoZone={decision?.iso_zone ?? 'Zone A (Good)'}
          rms={telemetry?.rms_vibration ?? 0.25}
        />
        <div className="lg:col-span-2">
          <DiagnosisCard
            prediction={prediction || null}
            decision={decision || null}
          />
        </div>
      </div>

      {/* 4. Live Oscilloscope Waveform & FFT Spectrum */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Live Vibration Waveform (Accelerometry)"
          subtitle="Sliding time-series window sampled at 1 kHz"
          type="line"
          data={waveformData}
          dataKey="accel"
          color="var(--blue)"
          yDomain={[-4, 4]}
          unit="g"
        />
        <ChartCard
          title="Fast Fourier Transform (Power Spectrum)"
          subtitle="Real-time spectral harmonic decomposition"
          type="bar"
          data={spectrumData}
          dataKey="power"
          color="var(--red)"
          legendItems={[
            { label: '1X RPM (~30Hz)', color: '#00f0ff' },
            { label: '2X / 3X Harmonics', color: '#f59e0b' },
            { label: 'BPFO Defect Band', color: '#f43f5e' }
          ]}
        />
      </div>

      {/* 5. Prescriptive Maintenance & Explainability */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecommendationCard decision={decision || null} />

        <div className="card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
              <AlertCircle className="w-4 h-4" style={{ color: 'var(--blue)' }} />
              <div>
                <p className="text-[10px] font-mono font-semibold uppercase tracking-widest" style={{ color: 'var(--tx-3)' }}>
                  Physics Explainability
                </p>
                <h3 className="text-sm font-semibold" style={{ color: 'var(--tx-1)' }}>
                  Root Cause Spectral Evidence
                </h3>
              </div>
            </div>

            <ul className="space-y-2 font-mono text-xs">
              {decision?.root_cause_explanation?.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 p-3 rounded-xl" style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', color: 'var(--tx-2)' }}>
                  <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: 'var(--blue)' }} />
                  <span className="leading-relaxed">{item}</span>
                </li>
              )) || (
                <li className="flex items-start gap-2.5 p-3 rounded-xl" style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', color: 'var(--tx-2)' }}>
                  <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: 'var(--green)' }} />
                  <span>Harmonic vibration energy remains balanced across fundamental and sub-harmonics.</span>
                </li>
              )}
            </ul>
          </div>

          <div className="mt-4 pt-3 flex items-center justify-between text-[11px] font-mono" style={{ borderTop: '1px solid var(--border)', color: 'var(--tx-3)' }}>
            <span>VibeNet-1D (PyTorch → ONNX INT8)</span>
            <span style={{ color: 'var(--green)', fontWeight: 700 }}>100% On-Device</span>
          </div>
        </div>
      </div>

      {/* 6. Interactive Scenario Fault Injector */}
      <ScenarioInjector
        currentMode={telemetry?.simulated_fault_mode ?? 0}
        onSelectMode={onSelectMode}
      />
    </div>
  );
};
