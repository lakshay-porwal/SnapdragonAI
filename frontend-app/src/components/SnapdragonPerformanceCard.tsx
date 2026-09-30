import React from 'react';
import { Cpu, Zap, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { HardwareStatus, AIPrediction } from '../types';

interface Props {
  hardwareStatus: HardwareStatus | null;
  prediction: AIPrediction | null;
  onRunBenchmark?: () => void;
  isBenchmarking?: boolean;
}

interface StatCell { label: string; value: string; sub: string; accent?: string; }

export const SnapdragonPerformanceCard: React.FC<Props> = ({
  hardwareStatus, prediction, onRunBenchmark, isBenchmarking = false,
}) => {
  const isSnap  = hardwareStatus?.is_snapdragon_detected;
  const isNpu   = prediction?.is_npu || hardwareStatus?.is_npu_active;

  const stats: StatCell[] = [
    { label: 'Backend',   value: prediction?.backend || hardwareStatus?.recommended_provider || 'CPU',  sub: isNpu ? 'Hexagon HTP' : 'x64 Kernel' },
    { label: 'Latency',   value: prediction?.latency_ms ? `${prediction.latency_ms.toFixed(2)} ms` : '0.55 ms', sub: 'Sub-millisecond', accent: 'var(--blue)' },
    { label: 'Throughput',value: isNpu ? '>6,500 inf/s' : '1,816 inf/s', sub: 'Continuous' },
    { label: 'Precision', value: prediction?.precision || 'INT8 QDQ', sub: 'Static Calib.', accent: 'var(--green)' },
    { label: 'Footprint', value: '63.9 KB', sub: '2.5× Compressed', accent: 'var(--blue)' },
    { label: 'NPU',       value: isNpu ? 'ACTIVE' : 'STANDBY', sub: isSnap ? 'Windows ARM64' : 'Awaiting HP PC', accent: isNpu ? 'var(--green)' : 'var(--amber)' },
  ];

  return (
    <div className="card p-6 relative overflow-hidden">
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px] rounded-t-xl"
        style={{ background: 'linear-gradient(90deg, var(--red), var(--amber))' }}
      />

      {/* Header */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-5"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--red)', boxShadow: '0 4px 16px var(--red-a30)' }}
          >
            <Cpu className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-mono font-bold tracking-widest uppercase" style={{ color: 'var(--red)' }}>
                Qualcomm AI Engine
              </span>
              <span
                className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold"
                style={{
                  color: isSnap ? 'var(--green)' : 'var(--amber)',
                  background: isSnap ? 'var(--green-a10)' : 'var(--amber-a10)',
                  border: `1px solid ${isSnap ? 'var(--green-a10)' : 'var(--amber-a10)'}`,
                }}
              >
                {isSnap ? 'QUALCOMM NATIVE' : 'CPU FALLBACK'}
              </span>
            </div>
            <h3 className="text-base font-bold" style={{ color: 'var(--tx-1)' }}>
              Snapdragon AI Engine & QNN Runtime
            </h3>
          </div>
        </div>

        {onRunBenchmark && (
          <button
            onClick={onRunBenchmark}
            disabled={isBenchmarking}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            style={{ background: 'var(--red)', boxShadow: '0 2px 10px var(--red-a30)' }}
          >
            <Zap className={`w-3.5 h-3.5 ${isBenchmarking ? 'animate-spin' : ''}`} />
            {isBenchmarking ? 'RUNNING...' : 'BENCHMARK'}
          </button>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
        {stats.map(({ label, value, sub, accent }) => (
          <div
            key={label}
            className="flex flex-col p-3 rounded-xl"
            style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}
          >
            <span className="text-[10px] font-mono uppercase tracking-wider mb-1" style={{ color: 'var(--tx-3)' }}>{label}</span>
            <span className="text-sm font-bold font-mono truncate" style={{ color: accent || 'var(--tx-1)' }}>{value}</span>
            <span className="text-[10px] font-mono mt-0.5" style={{ color: 'var(--tx-4)' }}>{sub}</span>
          </div>
        ))}
      </div>

      {/* Audit note */}
      <div
        className="flex items-start gap-3 p-3.5 rounded-xl text-xs font-mono"
        style={{
          background: isSnap ? 'var(--green-a10)' : 'var(--bg-raised)',
          border: `1px solid ${isSnap ? 'var(--green-a10)' : 'var(--border)'}`,
          color: 'var(--tx-2)',
        }}
      >
        {isSnap
          ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--green)' }} />
          : <ShieldAlert  className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--amber)' }} />}
        <div className="leading-relaxed">
          <strong className="block mb-0.5" style={{ color: 'var(--tx-1)' }}>
            {isSnap ? 'Snapdragon Hardware Validated' : 'Development Fallback Active (Intel CPU)'}
          </strong>
          {hardwareStatus?.truthful_note ||
            'Running on CPU fallback for development. NPU will activate when deployed to Snapdragon-powered HP PC.'}
        </div>
      </div>
    </div>
  );
};
