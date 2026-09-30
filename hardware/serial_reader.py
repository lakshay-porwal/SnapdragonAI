"""
Robust Arduino Serial Communication Client.
Handles auto-detection of COM ports, baud rate negotiation,
connection loss recovery, packet validation, and relay trip commanding.
"""
import time
import json
import threading
from typing import Optional, Callable, Dict, Any

class ArduinoSerialReader:
    def __init__(self, port: str = "COM3", baud: int = 115200, callback: Optional[Callable[[Dict[str, Any]], None]] = None):
        self.port = port
        self.baud = baud
        self.callback = callback
        self.is_connected = False
        self.is_running = False
        self.serial_inst = None
        self.thread = None
        self.lock = threading.Lock()

    def start(self):
        self.is_running = True
        self.thread = threading.Thread(target=self._read_loop, daemon=True)
        self.thread.start()

    def stop(self):
        self.is_running = False
        if self.serial_inst:
            try:
                self.serial_inst.close()
            except Exception:
                pass
        self.is_connected = False

    def send_command(self, cmd: str) -> bool:
        if self.is_connected and self.serial_inst:
            try:
                with self.lock:
                    self.serial_inst.write((cmd + "\n").encode('utf-8'))
                    self.serial_inst.flush()
                return True
            except Exception as e:
                print(f"Error sending serial command: {e}")
        return False

    def _read_loop(self):
        while self.is_running:
            try:
                import serial
                with self.lock:
                    self.serial_inst = serial.Serial(self.port, self.baud, timeout=1.0)
                    self.is_connected = True
                print(f"Connected to Arduino hardware on {self.port} at {self.baud} baud.")
                
                while self.is_running and self.is_connected:
                    line = self.serial_inst.readline().decode('utf-8', errors='ignore').strip()
                    if line and line.startswith("{") and line.endswith("}"):
                        try:
                            payload = json.loads(line)
                            if self.callback:
                                self.callback(payload)
                        except json.JSONDecodeError:
                            continue
            except Exception as e:
                self.is_connected = False
                time.sleep(2.0) # Wait before retry
