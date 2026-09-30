import React from 'react';
import { Microchip, Usb, Activity, Radio, RefreshCw } from 'lucide-react';
import { TelemetryData } from '../types';

interface Props { telemetry: TelemetryData | null; onToggleHardwareMode: () => void; }

const SENSORS = [
  { icon: Activity,  accent: 'var(--blue)',   label: 'MPU6050 Accelerometer', desc: '3-Axis MEMS transducer, 1 kHz, ±8g range.' },
  { icon: Radio,     accent: 'var(--green)',  label: 'Hall Tachometer',       desc: 'Interrupt-driven pulse counter measuring RPM on Pin 2.' },
  { icon: Microchip, accent: 'var(--amber)',  label: 'Thermal Probe',         desc: 'DS18B20 measuring bearing temperature for friction detection.' },
  { icon: Usb,       accent: 'var(--red)',    label: 'Relay Interlock',       desc: 'Active-low emergency isolation relay triggered by AI inference.' },
];

export const HardwarePage: React.FC<Props> = ({ telemetry, onToggleHardwareMode }) => {
  const isHw = telemetry?.hardware_mode === 'hardware';
  return (
    <div className="space-y-6">
      <div className="card p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <p className="text-[10px] font-mono font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--red)' }}>
              Hardware Ingestion Layer
            </p>
            <h2 className="text-lg font-bold" style={{ color: 'var(--tx-1)' }}>Arduino Sensor Architecture</h2>
          </div>
          <button
            onClick={onToggleHardwareMode}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all"
            style={{
              background: isHw ? 'var(--green-a10)' : 'var(--amber-a10)',
              color: isHw ? 'var(--green)' : 'var(--amber)',
              border: `1px solid ${isHw ? 'var(--green-a10)' : 'var(--amber-a10)'}`,
            }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {isHw ? 'ACTIVE: ARDUINO' : 'ACTIVE: SIMULATION'}
          </button>
        </div>

        {/* Sensor grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {SENSORS.map(({ icon: Icon, accent, label, desc }) => (
            <div key={label} className="p-4 rounded-xl" style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4" style={{ color: accent }} />
                <span className="text-[11px] font-bold font-mono" style={{ color: accent }}>{label}</span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--tx-2)' }}>{desc}</p>
            </div>
          ))}
        </div>

        {/* Frame schema */}
        <div className="rounded-xl p-4 overflow-x-auto" style={{ background: 'var(--bg-sunken)', border: '1px solid var(--border)' }}>
          <p className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--tx-3)' }}>
            Telemetry Frame Schema (Serial 115200 Baud)
          </p>
          <pre className="font-mono text-xs leading-relaxed" style={{ color: 'var(--blue)' }}>
{`{
  "seq": 1042,
  "rpm": 1780.0,
  "temp_c": 38.2,
  "ax": [0.012, 0.045, -0.021, "... 64 samples @ 1kHz ..."],
  "relay_state": 1
}`}
          </pre>
        </div>
      </div>
    </div>
  );
};
