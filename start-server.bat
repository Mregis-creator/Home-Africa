@echo off
echo Starting local server for HOME AFRICA...
echo.
echo Server will start at http://localhost:8000
echo Press Ctrl+C to stop the server
echo.

REM Check if Python is available
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo Using Python HTTP Server...
    python -m http.server 8000
    goto :end
)

REM Check if Node.js is available
node --version >nul 2>&1
if %errorlevel% == 0 (
    echo Using Node.js HTTP Server...
    echo Installing http-server if needed...
    npm list -g http-server >nul 2>&1
    if %errorlevel% neq 0 (
        npm install -g http-server
    )
    http-server -p 8000 -o
    goto :end
)

echo ERROR: Neither Python nor Node.js found!
echo.
echo Please install one of the following:
echo 1. Python 3: https://www.python.org/downloads/
echo 2. Node.js: https://nodejs.org/
echo.
echo Or use VS Code Live Server extension instead.
pause
:end

