import { useState, useEffect, useRef, useCallback } from 'react';
import { WebSocketPacket, HardwareStatus, AIStatus } from '../types';

export function useTelemetryStream() {
  const [packet, setPacket] = useState<WebSocketPacket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [hardwareStatus, setHardwareStatus] = useState<HardwareStatus | null>(null);
  const [aiStatus, setAIStatus] = useState<AIStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const [hwRes, aiRes] = await Promise.all([
        fetch('http://localhost:8000/api/hardware/status'),
        fetch('http://localhost:8000/api/ai/status')
      ]);
      if (hwRes.ok) setHardwareStatus(await hwRes.json());
      if (aiRes.ok) setAIStatus(await aiRes.json());
    } catch (e: any) {
      console.warn('API fetch warning:', e.message);
    }
  }, []);

  useEffect(() => {
    fetchStatus();

    const connectWebSocket = () => {
      try {
        const ws = new WebSocket('ws://localhost:8000/ws/telemetry');
        wsRef.current = ws;

        ws.onopen = () => {
          setIsConnected(true);
          setError(null);
        };

        ws.onmessage = (event) => {
          try {
            const data: WebSocketPacket = JSON.parse(event.data);
            setPacket(data);
          } catch (err) {
            console.error('Failed to parse telemetry packet', err);
          }
        };

        ws.onerror = () => {
          setError('WebSocket connection error');
          setIsConnected(false);
        };

        ws.onclose = () => {
          setIsConnected(false);
          // Try reconnect in 2s
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, 2000);
        };
      } catch (err: any) {
        setError(err.message);
        setIsConnected(false);
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, 2000);
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [fetchStatus]);

  const setFaultMode = async (mode: number) => {
    try {
      await fetch('http://localhost:8000/api/simulator/mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode })
      });
    } catch (err) {
      console.error('Error changing fault mode', err);
    }
  };

  const toggleHardwareMode = async (mode: 'simulation' | 'hardware') => {
    try {
      await fetch('http://localhost:8000/api/hardware/mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode })
      });
    } catch (err) {
      console.error('Error toggling hardware mode', err);
    }
  };

  const tripRelay = async () => {
    try {
      await fetch('http://localhost:8000/api/interlock/trip', { method: 'POST' });
    } catch (err) {
      console.error('Error tripping relay', err);
    }
  };

  const resetRelay = async () => {
    try {
      await fetch('http://localhost:8000/api/interlock/reset', { method: 'POST' });
    } catch (err) {
      console.error('Error resetting relay', err);
    }
  };

  return {
    packet,
    isConnected,
    hardwareStatus,
    aiStatus,
    error,
    refreshStatus: fetchStatus,
    setFaultMode,
    toggleHardwareMode,
    tripRelay,
    resetRelay
  };
}
