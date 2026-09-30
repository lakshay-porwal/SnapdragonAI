import React from 'react';
import { Menu, RefreshCw, Power, Zap, Sun, Moon } from 'lucide-react';
import { HardwareStatus, TelemetryData } from '../types';
import { useTheme } from '../context/ThemeContext';

interface NavbarProps {
  onOpenMobileMenu: () => void;
  hardwareStatus: HardwareStatus | null;
  telemetry: TelemetryData | null;
  isConnected: boolean;
  onToggleHardwareMode: () => void;
  onTripRelay: () => void;
  onResetRelay: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenMobileMenu,
  hardwareStatus,
  telemetry,
  isConnected,
  onToggleHardwareMode,
  onTripRelay,
  onResetRelay,
}) => {
  const { isDark, toggleTheme } = useTheme();
  const isHardware = telemetry?.hardware_mode === 'hardware';
  const isRelayEngaged = telemetry?.relay_state === 1;

  return (
    <header
      style={{
        background: 'var(--bg-navbar)',
        borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: 'var(--s1)',
        transition: 'all 0.2s ease',
      }}
      className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 sm:px-6 lg:px-8"
    >
      {/* Left — hamburger + brand */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--tx-3)' }}
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col leading-none min-w-0">
          <span
            className="text-[10px] font-mono font-bold tracking-widest uppercase"
            style={{ color: 'var(--red)' }}
          >
            VibeGuard NeuroEdge
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-sm font-semibold truncate" style={{ color: 'var(--tx-1)' }}>
              Predictive Maintenance
            </span>
            <span
              className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold"
              style={{
                background: isConnected ? 'var(--green-a10)' : 'var(--red-a10)',
                color: isConnected ? 'var(--green)' : 'var(--red)',
                border: `1px solid ${isConnected ? 'var(--green-a10)' : 'var(--red-a10)'}`,
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full pulse"
                style={{ background: isConnected ? 'var(--green)' : 'var(--red)' }}
              />
              {isConnected ? 'LIVE' : 'OFFLINE'}
            </span>
          </div>
        </div>
      </div>

      {/* Right — controls */}
      <div className="flex items-center gap-2">

        {/* Sim / Hardware */}
        <button
          onClick={onToggleHardwareMode}
          title="Toggle Simulator / Arduino"
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-semibold transition-all"
          style={{
            background: isHardware ? 'var(--green-a10)' : 'var(--amber-a10)',
            color: isHardware ? 'var(--green)' : 'var(--amber)',
            border: `1px solid ${isHardware ? 'var(--green-a10)' : 'var(--amber-a10)'}`,
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full pulse" style={{ background: isHardware ? 'var(--green)' : 'var(--amber)' }} />
          {isHardware ? 'ARDUINO' : 'SIM'}
          <RefreshCw className="w-3 h-3 opacity-50" />
        </button>

        {/* Relay */}
        <button
          onClick={isRelayEngaged ? onTripRelay : onResetRelay}
          title={isRelayEngaged ? 'Emergency Trip' : 'Reset Relay'}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
          style={{
            background: isRelayEngaged ? 'var(--red-a10)' : 'var(--green-a10)',
            color: isRelayEngaged ? 'var(--red)' : 'var(--green)',
            border: `1px solid ${isRelayEngaged ? 'var(--red-a20)' : 'var(--green-a10)'}`,
          }}
        >
          {isRelayEngaged ? <Power className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
          <span className="hidden md:inline">{isRelayEngaged ? 'Trip' : 'Reset'}</span>
        </button>

        {/* Snapdragon pill */}
        <div
          className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-mono"
          style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', color: 'var(--tx-3)' }}
        >
          <Zap className="w-3 h-3" style={{ color: 'var(--red)' }} />
          <span style={{ color: 'var(--tx-1)', fontWeight: 600 }}>Snapdragon</span>
          <span style={{ color: 'var(--tx-3)' }}>
            {hardwareStatus?.is_snapdragon_detected ? 'NPU' : 'CPU'}
          </span>
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={isDark ? 'Light mode' : 'Dark mode'}
          className="flex items-center justify-center w-8 h-8 rounded-lg transition-all"
          style={{
            background: 'var(--bg-raised)',
            border: '1px solid var(--border)',
            color: 'var(--tx-3)',
          }}
          aria-label="Toggle theme"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
