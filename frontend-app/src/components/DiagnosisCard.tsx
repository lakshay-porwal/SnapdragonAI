import React from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon, HelpCircle } from 'lucide-react';
import { AIPrediction, DecisionData } from '../types';

interface Props { prediction: AIPrediction | null; decision: DecisionData | null; }

const CLASSES = [
  { name: 'Normal',              accent: 'var(--green)',  bg: 'var(--green-a10)' },
  { name: 'Imbalance',           accent: 'var(--amber)',  bg: 'var(--amber-a10)' },
  { name: 'Misalignment',        accent: 'var(--red)',    bg: 'var(--red-a10)'   },
  { name: 'Bearing Fault',       accent: 'var(--violet)', bg: 'var(--violet-a10)'},
];

export const DiagnosisCard: React.FC<Props> = ({ prediction, decision }) => {
  const fc       = prediction?.predicted_class ?? 0;
  const label    = prediction?.fault_label || 'Normal Operation';
  const conf     = prediction ? Math.round(prediction.confidence * 100) : 99;
  const severity = decision?.severity_color || 'var(--green)';

  const SIcon = () => {
    if (fc === 0) return <ShieldCheck  className="w-5 h-5" style={{ color: 'var(--green)'  }} />;
    if (fc === 1) return <AlertTriangle className="w-5 h-5" style={{ color: 'var(--amber)'  }} />;
    if (fc === 2) return <AlertTriangle className="w-5 h-5" style={{ color: 'var(--red)'    }} />;
    if (fc === 3) return <AlertOctagon  className="w-5 h-5" style={{ color: 'var(--violet)' }} />;
    return <HelpCircle className="w-5 h-5" style={{ color: 'var(--tx-3)' }} />;
  };

  return (
    <div className="card p-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}>
            <SIcon />
          </div>
          <div>
            <p className="text-[10px] font-mono font-semibold tracking-widest uppercase" style={{ color: 'var(--tx-3)' }}>
              Edge AI Verdict
            </p>
            <h3 className="text-sm font-bold" style={{ color: 'var(--tx-1)' }}>
              Health Classification
            </h3>
          </div>
        </div>
        <span
          className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full"
          style={{ color: severity, background: `${severity}18`, border: `1px solid ${severity}40` }}
        >
          {decision?.iso_zone || 'ZONE A'}
        </span>
      </div>

      {/* Label */}
      <div>
        <p className="text-[11px] font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--tx-3)' }}>
          Identified State
        </p>
        <p className="text-2xl font-bold tracking-tight" style={{ color: severity }}>
          {label}
        </p>
      </div>

      {/* Confidence bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[11px] font-mono" style={{ color: 'var(--tx-3)' }}>
          <span>Model certainty</span>
          <span style={{ color: 'var(--tx-1)', fontWeight: 700 }}>{conf}%</span>
        </div>
        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-raised)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${conf}%`, background: `linear-gradient(90deg, var(--red), var(--green))` }}
          />
        </div>
      </div>

      {/* Class pills */}
      <div className="grid grid-cols-2 gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
        {CLASSES.map((cls, i) => {
          const prob = prediction?.probabilities ? Math.round(prediction.probabilities[i] * 100) : (i === 0 ? 99 : 0);
          const active = fc === i;
          return (
            <div
              key={i}
              className="flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-mono"
              style={{
                background: active ? cls.bg : 'var(--bg-raised)',
                color: active ? cls.accent : 'var(--tx-3)',
                border: `1px solid ${active ? cls.accent + '40' : 'var(--border)'}`,
                fontWeight: active ? 700 : 400,
              }}
            >
              <span className="truncate">{cls.name}</span>
              <span>{prob}%</span>
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <div className="flex justify-between text-[10px] font-mono pt-1" style={{ color: 'var(--tx-4)', borderTop: '1px solid var(--border)' }}>
        <span>ISO 10816-3 Class II</span>
        <span style={{ color: 'var(--green)', fontWeight: 600 }}>100% On-Device</span>
      </div>
    </div>
  );
};
