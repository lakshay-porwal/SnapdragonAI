import React from 'react';
import { HeartPulse } from 'lucide-react';

interface Props { score: number; isoZone?: string; rms: number; }

export const HealthScoreCard: React.FC<Props> = ({ score, isoZone = 'Zone A', rms }) => {
  const color = score >= 80 ? 'var(--green)' : score >= 50 ? 'var(--amber)' : 'var(--red)';
  const label = score >= 80 ? 'EXCELLENT' : score >= 50 ? 'WARNING' : 'CRITICAL';
  const R = 42, C = 2 * Math.PI * R;
  const offset = C - (score / 100) * C;

  return (
    <div className="card p-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <HeartPulse className="w-4 h-4" style={{ color: 'var(--red)' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--tx-1)' }}>Machine Health</h3>
        </div>
        <span
          className="text-[10px] font-mono px-2 py-0.5 rounded-full"
          style={{ background: 'var(--bg-raised)', color: 'var(--tx-2)', border: '1px solid var(--border)' }}
        >
          {isoZone}
        </span>
      </div>

      {/* Gauge */}
      <div className="flex flex-col items-center py-2">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r={R} stroke="var(--bg-raised)" strokeWidth="8" fill="none" />
            <circle
              cx="50" cy="50" r={R}
              stroke={color} strokeWidth="8" fill="none"
              strokeDasharray={C} strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-bold font-mono" style={{ color: 'var(--tx-1)' }}>
              {Math.round(score)}%
            </span>
            <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: 'var(--tx-3)' }}>
              HEALTH
            </span>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-5 mt-4 text-[11px] font-mono">
          <div className="flex flex-col items-center gap-0.5">
            <span style={{ color: 'var(--tx-3)' }}>RMS</span>
            <span style={{ color: 'var(--tx-1)', fontWeight: 700 }}>{rms.toFixed(2)} g</span>
          </div>
          <div className="w-px h-6" style={{ background: 'var(--border-md)' }} />
          <div className="flex flex-col items-center gap-0.5">
            <span style={{ color: 'var(--tx-3)' }}>CONDITION</span>
            <span style={{ color, fontWeight: 700 }}>{label}</span>
          </div>
        </div>
      </div>

      <p className="text-[11px] font-mono text-center pt-3" style={{ color: 'var(--tx-4)', borderTop: '1px solid var(--border)' }}>
        Continuous rotordynamics evaluation
      </p>
    </div>
  );
};
