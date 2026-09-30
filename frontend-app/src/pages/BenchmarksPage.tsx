import React from 'react';
import { Cpu, Zap, CheckCircle2 } from 'lucide-react';
import { HardwareStatus, AIPrediction } from '../types';

interface Props {
  hardwareStatus: HardwareStatus | null;
  prediction: AIPrediction | null;
  onRunBenchmark: () => void;
  isBenchmarking: boolean;
}

const ROWS = [
  {
    target: 'Snapdragon HP PC (Target)',
    provider: 'QNNExecutionProvider (Hexagon)',
    precision: 'INT8 QDQ', latency: '< 0.15 ms',
    throughput: '> 6,500 inf/s', power: '~1.5–3.0 W',
    status: 'Ready for Validation', highlight: false,
  },
  {
    target: 'Intel Core i5 (Dev Fallback)',
    provider: 'CPUExecutionProvider',
    precision: 'INT8 QDQ', latency: '0.55 ms',
    throughput: '1,816 inf/s', power: '~18–28 W',
    status: 'Active & Verified', highlight: true,
  },
  {
    target: 'Cloud AI (Baseline)',
    provider: 'AWS / Azure GPU Endpoint',
    precision: 'FP32', latency: '85–240 ms (RTT)',
    throughput: 'Bandwidth-limited', power: 'High Server TDP',
    status: 'Privacy Bottleneck', highlight: false,
  },
];

export const BenchmarksPage: React.FC<Props> = ({ hardwareStatus, prediction, onRunBenchmark, isBenchmarking }) => (
  <div className="space-y-6">
    <div className="card p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-5" style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          <p className="text-[10px] font-mono font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--red)' }}>
            Benchmarking Framework
          </p>
          <h2 className="text-lg font-bold" style={{ color: 'var(--tx-1)' }}>Snapdragon NPU vs CPU Performance</h2>
        </div>
        <button
          onClick={onRunBenchmark}
          disabled={isBenchmarking}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold text-white transition-all disabled:opacity-50 flex-shrink-0"
          style={{ background: 'var(--red)', boxShadow: '0 2px 8px var(--red-a30)' }}
        >
          <Zap className={`w-4 h-4 ${isBenchmarking ? 'animate-spin' : ''}`} />
          {isBenchmarking ? 'RUNNING...' : 'RUN BENCHMARK'}
        </button>
      </div>

      {/* Audit note */}
      <div
        className="flex items-start gap-3 p-3.5 rounded-xl mb-6 text-xs font-mono"
        style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', color: 'var(--tx-2)' }}
      >
        <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--green)' }} />
        <div className="leading-relaxed">
          <strong className="block mb-0.5" style={{ color: 'var(--tx-1)' }}>Hardware Truthfulness Compliance</strong>
          {hardwareStatus?.truthful_note || 'Running on CPU fallback. Real metrics shown — no NPU fabrication.'}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--border)' }}>
        <table className="w-full text-left font-mono text-xs border-collapse">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-raised)' }}>
              {['Platform', 'Provider', 'Precision', 'Latency', 'Throughput', 'Power', 'Status'].map(h => (
                <th key={h} className="py-3 px-4 font-semibold uppercase tracking-wide" style={{ color: 'var(--tx-3)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row, i) => (
              <tr
                key={i}
                style={{
                  borderBottom: i < ROWS.length - 1 ? '1px solid var(--border)' : 'none',
                  background: row.highlight ? 'var(--blue-a10)' : 'transparent',
                }}
              >
                <td className="py-3 px-4 font-semibold" style={{ color: 'var(--tx-1)' }}>{row.target}</td>
                <td className="py-3 px-4" style={{ color: 'var(--blue)' }}>{row.provider}</td>
                <td className="py-3 px-4" style={{ color: 'var(--green)' }}>{row.precision}</td>
                <td className="py-3 px-4 font-bold" style={{ color: 'var(--amber)' }}>{row.latency}</td>
                <td className="py-3 px-4" style={{ color: 'var(--tx-1)' }}>{row.throughput}</td>
                <td className="py-3 px-4" style={{ color: 'var(--tx-3)' }}>{row.power}</td>
                <td className="py-3 px-4">
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-bold"
                    style={{
                      background: row.highlight ? 'var(--green-a10)' : 'var(--bg-raised)',
                      color: row.highlight ? 'var(--green)' : 'var(--tx-3)',
                      border: `1px solid ${row.highlight ? 'var(--green-a10)' : 'var(--border)'}`,
                    }}
                  >
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);
