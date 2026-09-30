import React from 'react';
import { CheckCircle, Activity, AlertTriangle, AlertOctagon, Flame } from 'lucide-react';

interface Props { currentMode: number; onSelectMode: (mode: number) => void; }

const MODES = [
  { id: 0, short: 'Nominal',     desc: 'Balanced baseline. Smooth operation.',       icon: CheckCircle,  accent: 'var(--green)',  bg: 'var(--green-a10)'  },
  { id: 1, short: 'Imbalance',   desc: 'Severe 1X unbalance. Centrifugal stress.',   icon: Activity,     accent: 'var(--amber)',  bg: 'var(--amber-a10)'  },
  { id: 2, short: 'Misalignment',desc: '2X/3X harmonic distortion across coupling.', icon: AlertTriangle, accent: 'var(--red)',    bg: 'var(--red-a10)'    },
  { id: 3, short: 'Bearing',     desc: 'BPFO impact trains. Fatigue flaking spall.', icon: AlertOctagon, accent: 'var(--violet)', bg: 'var(--violet-a10)' },
  { id: 4, short: 'Overheat',    desc: 'Thermal runaway. Lubricant starvation.',     icon: Flame,        accent: 'var(--red)',    bg: 'var(--red-a10)'    },
];

export const ScenarioInjector: React.FC<Props> = ({ currentMode, onSelectMode }) => (
  <div className="card p-6">
    {/* Header */}
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4" style={{ borderBottom: '1px solid var(--border)' }}>
      <div>
        <p className="text-[10px] font-mono font-semibold uppercase tracking-widest" style={{ color: 'var(--red)' }}>
          Interactive Demo
        </p>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--tx-1)' }}>Mechanical Fault Injector</h3>
      </div>
      <span
        className="text-[11px] font-mono px-2.5 py-1 rounded-full"
        style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', color: 'var(--tx-2)' }}
      >
        Active: Mode {currentMode}
      </span>
    </div>

    <p className="text-xs mb-4 leading-relaxed" style={{ color: 'var(--tx-3)' }}>
      Select a fault scenario to watch the on-device AI classify in real-time:
    </p>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
      {MODES.map(({ id, short, desc, icon: Icon, accent, bg }) => {
        const active = currentMode === id;
        return (
          <button
            key={id}
            onClick={() => onSelectMode(id)}
            className="p-3.5 rounded-xl text-left flex flex-col gap-2 transition-all duration-150"
            style={{
              background: active ? bg : 'var(--bg-raised)',
              border: `1px solid ${active ? accent + '40' : 'var(--border)'}`,
              color: active ? accent : 'var(--tx-2)',
            }}
            onMouseEnter={e => {
              if (!active) (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-md)';
            }}
            onMouseLeave={e => {
              if (!active) (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider" style={{ color: active ? accent : 'var(--tx-3)' }}>
                MODE {id}
              </span>
              <Icon className="w-3.5 h-3.5" style={{ color: active ? accent : 'var(--tx-4)' }} />
            </div>
            <p className="text-[12px] font-semibold" style={{ color: active ? accent : 'var(--tx-1)' }}>{short}</p>
            <p className="text-[11px] leading-snug" style={{ color: active ? accent + 'cc' : 'var(--tx-3)' }}>{desc}</p>
          </button>
        );
      })}
    </div>
  </div>
);
