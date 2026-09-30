@echo off
echo ========================================================
echo   VIBEGUARD NEUROEDGE - FULL AUTOMATED PIPELINE
echo   Train -> Export ONNX -> Quantize INT8 -> Benchmark
echo ========================================================
echo.
python -m ai.dataset.generator
if errorlevel 1 goto error
python -m ai.training.train
if errorlevel 1 goto error
python -m ai.optimization.export_onnx
if errorlevel 1 goto error
python -m benchmarks.run_benchmark
if errorlevel 1 goto error
echo.
echo ========================================================
echo   PIPELINE SUCCESSFULLY COMPLETED!
echo ========================================================
goto end
:error
echo [ERROR] Pipeline failed during execution.
:end
pause
