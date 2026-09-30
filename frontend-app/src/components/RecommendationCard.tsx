import React from 'react';
import { Wrench, Clock } from 'lucide-react';
import { DecisionData } from '../types';

interface Props { decision: DecisionData | null; }

function urgencyColor(u: string) {
  const l = u.toLowerCase();
  if (l.includes('critical') || l.includes('immediate')) return 'var(--red)';
  if (l.includes('high'))   return 'var(--amber)';
  if (l.includes('medium')) return 'var(--blue)';
  return 'var(--green)';
}

export const RecommendationCard: React.FC<Props> = ({ decision }) => {
  const urgency = decision?.urgency || 'None';
  const action  = decision?.recommended_action || 'Maintain scheduled monitoring. No maintenance required.';
  const impact  = decision?.expected_impact || 'Zero downtime risk; energy efficiency within optimal curve.';
  const est     = decision?.estimated_hours_remaining ? Math.round(decision.estimated_hours_remaining).toLocaleString() : '2,280';
  const uc      = urgencyColor(urgency);

  return (
    <div className="card p-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}>
            <Wrench className="w-4 h-4" style={{ color: 'var(--red)' }} />
          </div>
          <div>
            <p className="text-[10px] font-mono font-semibold uppercase tracking-widest" style={{ color: 'var(--tx-3)' }}>
              Prescriptive Action
            </p>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--tx-1)' }}>Maintenance Plan</h3>
          </div>
        </div>
        <span
          className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full"
          style={{ color: uc, background: `${uc}18`, border: `1px solid ${uc}40` }}
        >
          {urgency}
        </span>
      </div>

      {/* Action */}
      <div className="rounded-xl p-4" style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}>
        <p className="text-[10px] font-mono uppercase tracking-widest mb-1.5" style={{ color: 'var(--tx-3)' }}>
          Recommended Procedure
        </p>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--tx-1)' }}>{action}</p>
      </div>

      {/* Impact */}
      <div className="rounded-xl p-4" style={{ background: 'var(--bg-sunken)', border: '1px solid var(--border)' }}>
        <p className="text-[10px] font-mono uppercase tracking-widest mb-1.5" style={{ color: 'var(--tx-3)' }}>
          Expected Impact
        </p>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--tx-2)' }}>{impact}</p>
      </div>

      {/* RUL */}
      <div
        className="flex items-center justify-between p-3 rounded-xl mt-auto"
        style={{ background: 'var(--blue-a10)', border: '1px solid var(--blue-a10)' }}
      >
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" style={{ color: 'var(--blue)' }} />
          <span className="text-[12px] font-mono" style={{ color: 'var(--tx-2)' }}>Est. Operating Window</span>
        </div>
        <div className="flex items-baseline gap-1 font-mono">
          <span className="text-base font-bold" style={{ color: 'var(--blue)' }}>{est}</span>
          <span className="text-xs" style={{ color: 'var(--tx-3)' }}>hrs</span>
        </div>
      </div>
    </div>
  );
};
