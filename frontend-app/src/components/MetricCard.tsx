import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  change?: string;
  isPositive?: boolean;
  icon: LucideIcon;
  badge?: string;
  color?: 'red' | 'blue' | 'green' | 'amber' | 'violet';
  subtext?: string;
}

const COLOR = {
  red:    { icon: 'var(--red)',    bg: 'var(--red-a10)',    val: 'var(--red)'    },
  blue:   { icon: 'var(--blue)',   bg: 'var(--blue-a10)',   val: 'var(--blue)'   },
  green:  { icon: 'var(--green)',  bg: 'var(--green-a10)',  val: 'var(--green)'  },
  amber:  { icon: 'var(--amber)',  bg: 'var(--amber-a10)',  val: 'var(--amber)'  },
  violet: { icon: 'var(--violet)', bg: 'var(--violet-a10)', val: 'var(--violet)' },
};

export const MetricCard: React.FC<MetricCardProps> = ({
  title, value, unit, change, isPositive, icon: Icon, badge, color = 'blue', subtext
}) => {
  const c = COLOR[color];
  return (
    <div
      className="card p-5 flex flex-col gap-3 fade-in"
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold tracking-wide uppercase" style={{ color: 'var(--tx-3)' }}>
          {title}
        </span>
        <div className="flex items-center gap-2">
          {badge && (
            <span
              className="text-[10px] font-mono px-1.5 py-0.5 rounded-md"
              style={{ background: 'var(--bg-raised)', color: 'var(--tx-3)', border: '1px solid var(--border)' }}
            >
              {badge}
            </span>
          )}
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: c.bg, color: c.icon }}
          >
            <Icon className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-1">
        <span className="text-[28px] font-bold tracking-tight font-mono leading-none" style={{ color: c.val }}>
          {value}
        </span>
        {unit && (
          <span className="text-sm font-semibold" style={{ color: 'var(--tx-3)' }}>{unit}</span>
        )}
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between text-[11px] font-mono pt-2"
        style={{ borderTop: '1px solid var(--border)', color: 'var(--tx-3)' }}
      >
        <span className="truncate">{subtext || '—'}</span>
        {change && (
          <span style={{ color: isPositive ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
            {change}
          </span>
        )}
      </div>
    </div>
  );
};
