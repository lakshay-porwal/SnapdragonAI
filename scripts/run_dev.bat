@echo off
echo ========================================================
echo   VIBEGUARD NEUROEDGE - LAUNCHING LOCAL DEV SERVER
echo   Snapdragon AI Industrial Vibration Sentinel
echo ========================================================
echo.
echo Target Architecture: Snapdragon-Powered HP PCs (ARM64 Hexagon NPU)
echo Local Environment: Intel/x64 Fallback Active
echo Server listening at: http://localhost:8000
echo.
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
pause
