import React, { useState } from 'react';
import { Play, Pause } from 'lucide-react';
import { ChartCard } from '../components/ChartCard';
import { WebSocketPacket } from '../types';

interface Props { packet: WebSocketPacket | null; }

export const LiveMonitoringPage: React.FC<Props> = ({ packet }) => {
  const [isPaused, setIsPaused] = useState(false);
  const t = packet?.telemetry;

  const waveform = t?.waveform?.map((v, i) => ({ time: `${(i * 2).toFixed(0)}ms`, accel: +v.toFixed(2) })) || [];
  const spectrum = packet?.spectrum?.psd?.map((p, i) => ({ freq: `${(i * 15.6).toFixed(0)}Hz`, power: +p.toFixed(3) })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div
        className="card flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5"
      >
        <div>
          <p className="text-[10px] font-mono font-bold uppercase tracking-widest" style={{ color: 'var(--red)' }}>
            High-Frequency Streaming
          </p>
          <h2 className="text-lg font-bold" style={{ color: 'var(--tx-1)' }}>
            Live Oscilloscope & Spectral Analyzer
          </h2>
        </div>
        <button
          onClick={() => setIsPaused(p => !p)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-bold transition-all"
          style={{
            background: isPaused ? 'var(--amber-a10)' : 'var(--bg-raised)',
            color: isPaused ? 'var(--amber)' : 'var(--tx-2)',
            border: `1px solid ${isPaused ? 'var(--amber-a10)' : 'var(--border)'}`,
          }}
        >
          {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          {isPaused ? 'RESUME' : 'PAUSE'}
        </button>
      </div>

      {/* Charts */}
      <div className="space-y-6">
        <ChartCard
          title="Raw 3-Axis Accelerometer Waveform (X)"
          subtitle="1 kHz time-series — 512-point sliding frame"
          type="line" data={waveform} dataKey="accel"
          color="var(--blue)" yDomain={[-5, 5]} unit="g"
        />
        <ChartCard
          title="Power Spectral Density (PSD)"
          subtitle="Hanning-windowed FFT — 1X, 2X, and defect harmonics"
          type="bar" data={spectrum} dataKey="power"
          color="var(--red)"
          legendItems={[
            { label: '1X Harmonic', color: 'var(--blue)' },
            { label: '2X–3X', color: 'var(--amber)' },
            { label: 'Defect Peak', color: 'var(--red)' },
          ]}
        />
      </div>
    </div>
  );
};
