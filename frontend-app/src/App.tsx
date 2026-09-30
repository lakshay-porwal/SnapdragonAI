import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { Sidebar, PageId } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { OverviewPage } from './pages/OverviewPage';
import { LiveMonitoringPage } from './pages/LiveMonitoringPage';
import { BenchmarksPage } from './pages/BenchmarksPage';
import { HardwarePage } from './pages/HardwarePage';
import { DiagnosisCard } from './components/DiagnosisCard';
import { HealthScoreCard } from './components/HealthScoreCard';
import { ChartCard } from './components/ChartCard';
import { useTelemetryStream } from './hooks/useTelemetryStream';

export function App() {
  const [currentPage, setCurrentPage] = useState<PageId>('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isBenchmarking, setIsBenchmarking] = useState(false);

  const {
    packet,
    isConnected,
    hardwareStatus,
    aiStatus,
    setFaultMode,
    toggleHardwareMode,
    tripRelay,
    resetRelay
  } = useTelemetryStream();

  const handleRunBenchmark = async () => {
    setIsBenchmarking(true);
    try {
      const res = await fetch('http://localhost:8000/api/benchmark');
      const data = await res.json();
      alert(`Benchmark Completed!\nPlatform: ${data.hardware_environment.status_label}\nCPU Mean Latency: ${data.cpu_benchmark.mean_latency_ms} ms\nThroughput: ${data.cpu_benchmark.throughput_inf_per_sec} inf/s\nModel Size: ${data.cpu_benchmark.model_size_kb} KB`);
    } catch (e: any) {
      alert(`Benchmark error: ${e.message}`);
    } finally {
      setIsBenchmarking(false);
    }
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'overview':
        return (
          <OverviewPage
            packet={packet}
            hardwareStatus={hardwareStatus}
            onSelectMode={setFaultMode}
            onRunBenchmark={handleRunBenchmark}
            isBenchmarking={isBenchmarking}
          />
        );
      case 'live':
        return <LiveMonitoringPage packet={packet} />;
      case 'diagnostics':
        return (
          <div className="space-y-6">
            <DiagnosisCard 
              prediction={packet?.ai_prediction || null} 
              decision={packet?.decision || null} 
            />
          </div>
        );
      case 'health':
        return (
          <div className="space-y-6 max-w-xl mx-auto">
            <HealthScoreCard
              score={packet?.decision?.health_score_pct ?? 95}
              isoZone={packet?.decision?.iso_zone ?? 'Zone A (Good)'}
              rms={packet?.telemetry?.rms_vibration ?? 0.25}
            />
          </div>
        );
      case 'analytics':
        return (
          <div className="space-y-6">
            <ChartCard
              title="Spectral Power Distribution (FFT)"
              subtitle="Energy concentration across rotational harmonics"
              type="bar"
              data={packet?.spectrum?.psd?.map((p, idx) => ({ freq: `${(idx * 16).toFixed(0)}Hz`, power: p })) || []}
              dataKey="power"
              color="#f43f5e"
            />
          </div>
        );
      case 'benchmarks':
        return (
          <BenchmarksPage
            hardwareStatus={hardwareStatus}
            prediction={packet?.ai_prediction || null}
            onRunBenchmark={handleRunBenchmark}
            isBenchmarking={isBenchmarking}
          />
        );
      case 'hardware':
        return (
          <HardwarePage
            telemetry={packet?.telemetry || null}
            onToggleHardwareMode={() => {
              const nextMode = packet?.telemetry?.hardware_mode === 'hardware' ? 'simulation' : 'hardware';
              toggleHardwareMode(nextMode);
            }}
          />
        );
      case 'settings':
        return (
          <div className="glass-panel p-6 rounded-2xl border border-edge-border space-y-4">
            <h2 className="text-lg font-bold text-white">System Settings & Model Config</h2>
            <div className="text-xs font-mono text-slate-300 space-y-2">
              <p>Host API Endpoint: http://localhost:8000</p>
              <p>WebSocket Telemetry: ws://localhost:8000/ws/telemetry</p>
              <p>Active Model Path: models/vibenet_1d_int8.onnx</p>
              <p>Target Deployment: Snapdragon HP PC (ARM64 Windows / Hexagon HTP)</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <ThemeProvider>
    <div className="min-h-screen flex" style={{ background: 'var(--bg-page)', color: 'var(--text-primary)', transition: 'background 0.25s ease' }}>
      {/* Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onSelectPage={setCurrentPage}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div 
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        <Navbar
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          hardwareStatus={hardwareStatus}
          telemetry={packet?.telemetry || null}
          isConnected={isConnected}
          onToggleHardwareMode={() => {
            const nextMode = packet?.telemetry?.hardware_mode === 'hardware' ? 'simulation' : 'hardware';
            toggleHardwareMode(nextMode);
          }}
          onTripRelay={tripRelay}
          onResetRelay={resetRelay}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto w-full">
          {renderCurrentPage()}
        </main>
      </div>
    </div>
    </ThemeProvider>
  );
}

export default App;
