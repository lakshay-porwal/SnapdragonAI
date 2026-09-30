import React from 'react';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  type: 'line' | 'bar';
  data: any[];
  dataKey: string;
  color?: string;
  yDomain?: [number, number];
  unit?: string;
  legendItems?: { label: string; color: string }[];
}

const TooltipStyle = {
  backgroundColor: 'var(--tooltip-bg)',
  border: '1px solid var(--border-md)',
  borderRadius: '10px',
  fontFamily: 'monospace',
  fontSize: '11px',
  color: 'var(--tooltip-tx)',
  boxShadow: 'var(--s2)',
};

export const ChartCard: React.FC<ChartCardProps> = ({
  title, subtitle, type, data, dataKey, color = 'var(--blue)',
  yDomain, unit, legendItems,
}) => (
  <div className="card p-5 flex flex-col h-[340px]">
    {/* Header */}
    <div
      className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-4 pb-3"
      style={{ borderBottom: '1px solid var(--border)' }}
    >
      <div>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--tx-1)' }}>{title}</h3>
        {subtitle && (
          <p className="text-[11px] font-mono mt-0.5" style={{ color: 'var(--tx-3)' }}>{subtitle}</p>
        )}
      </div>
      {legendItems && (
        <div className="flex flex-wrap items-center gap-3">
          {legendItems.map((item, i) => (
            <span key={i} className="flex items-center gap-1 text-[11px] font-mono" style={{ color: 'var(--tx-3)' }}>
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.color }} />
              {item.label}
            </span>
          ))}
        </div>
      )}
    </div>

    {/* Chart */}
    <div className="flex-1 w-full min-h-0">
      <ResponsiveContainer width="100%" height="100%">
        {type === 'line' ? (
          <LineChart data={data} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
            <XAxis dataKey="time" stroke="var(--chart-axis)" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis domain={yDomain || ['auto', 'auto']} stroke="var(--chart-axis)" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} unit={unit} />
            <Tooltip contentStyle={TooltipStyle} />
            <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        ) : (
          <BarChart data={data} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
            <XAxis dataKey="freq" stroke="var(--chart-axis)" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--chart-axis)" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={TooltipStyle} />
            <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} isAnimationActive={false} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  </div>
);
