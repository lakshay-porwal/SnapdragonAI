import React from 'react';
import {
  Activity, Cpu, Gauge, Radio, BarChart3, Zap,
  Settings, Microchip, ChevronLeft, ChevronRight, ShieldCheck,
} from 'lucide-react';

export type PageId = 'overview' | 'live' | 'diagnostics' | 'health' | 'analytics' | 'benchmarks' | 'hardware' | 'settings';

interface SidebarProps {
  currentPage: PageId;
  onSelectPage: (page: PageId) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

const NAV = [
  { id: 'overview'    as PageId, label: 'Overview',          icon: Activity  },
  { id: 'live'        as PageId, label: 'Live Telemetry',    icon: Radio     },
  { id: 'diagnostics' as PageId, label: 'AI Diagnostics',    icon: Cpu       },
  { id: 'health'      as PageId, label: 'Machine Health',    icon: Gauge     },
  { id: 'analytics'   as PageId, label: 'Spectral Analytics',icon: BarChart3 },
  { id: 'benchmarks'  as PageId, label: 'Snapdragon NPU',    icon: Zap       },
  { id: 'hardware'    as PageId, label: 'Arduino & Sensors', icon: Microchip },
  { id: 'settings'    as PageId, label: 'Settings',          icon: Settings  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage, onSelectPage, isCollapsed, onToggleCollapse, isMobileOpen, onCloseMobile,
}) => (
  <>
    {isMobileOpen && (
      <div
        className="fixed inset-0 z-40 lg:hidden"
        style={{ background: 'rgba(0,0,0,0.35)' }}
        onClick={onCloseMobile}
      />
    )}

    <aside
      style={{
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border)',
        boxShadow: 'var(--s2)',
        transition: 'all 0.25s ease',
        width: isCollapsed ? '72px' : '240px',
      }}
      className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      {/* Brand */}
      <div
        className="flex items-center justify-between h-14 px-3"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--red)', boxShadow: '0 2px 10px var(--red-a30)' }}
          >
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col truncate leading-none">
              <span className="text-[13px] font-bold tracking-tight" style={{ color: 'var(--tx-1)' }}>
                VibeGuard
              </span>
              <span className="text-[9px] font-mono tracking-widest uppercase" style={{ color: 'var(--tx-3)' }}>
                NeuroEdge
              </span>
            </div>
          )}
        </div>

        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex items-center justify-center w-6 h-6 rounded-md transition-colors"
          style={{ color: 'var(--tx-4)', border: '1px solid var(--border)' }}
        >
          {isCollapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {NAV.map(({ id, label, icon: Icon }) => {
          const active = currentPage === id;
          return (
            <button
              key={id}
              onClick={() => { onSelectPage(id); onCloseMobile(); }}
              title={isCollapsed ? label : undefined}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all relative"
              style={{
                background: active ? 'var(--red-a10)' : 'transparent',
                color: active ? 'var(--red)' : 'var(--tx-2)',
                border: `1px solid ${active ? 'var(--red-a20)' : 'transparent'}`,
              }}
              onMouseEnter={e => {
                if (!active) {
                  (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-raised)';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--tx-1)';
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--tx-2)';
                }
              }}
            >
              {active && (
                <span
                  className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full"
                  style={{ background: 'var(--red)' }}
                />
              )}
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">{label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-2" style={{ borderTop: '1px solid var(--border)' }}>
        <div
          className={`rounded-xl px-3 py-2.5 flex items-center gap-2.5 ${isCollapsed ? 'justify-center' : ''}`}
          style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}
        >
          <span className="w-2 h-2 rounded-full pulse flex-shrink-0" style={{ background: 'var(--green)' }} />
          {!isCollapsed && (
            <div className="flex flex-col truncate">
              <span className="text-[11px] font-semibold truncate" style={{ color: 'var(--tx-1)' }}>
                Snapdragon HP Edge
              </span>
              <span className="text-[9px] font-mono tracking-wider truncate" style={{ color: 'var(--tx-3)' }}>
                QNN HTP
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  </>
);
