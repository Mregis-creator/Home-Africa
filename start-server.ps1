# PowerShell script to start local server for HOME AFRICA

Write-Host "Starting local server for HOME AFRICA..." -ForegroundColor Green
Write-Host ""
Write-Host "Server will start at http://localhost:8000" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Check if Python is available
try {
    $pythonVersion = python --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Using Python HTTP Server..." -ForegroundColor Green
        python -m http.server 8000
        exit
    }
} catch {
    # Python not found, continue
}

# Check if Node.js is available
try {
    $nodeVersion = node --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Using Node.js HTTP Server..." -ForegroundColor Green
        Write-Host "Installing http-server if needed..." -ForegroundColor Yellow
        
        # Check if http-server is installed
        $httpServerInstalled = npm list -g http-server 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Installing http-server globally..." -ForegroundColor Yellow
            npm install -g http-server
        }
        
        Write-Host "Starting server and opening browser..." -ForegroundColor Green
        http-server -p 8000 -o
        exit
    }
} catch {
    # Node.js not found, continue
}

Write-Host "ERROR: Neither Python nor Node.js found!" -ForegroundColor Red
Write-Host ""
Write-Host "Please install one of the following:" -ForegroundColor Yellow
Write-Host "1. Python 3: https://www.python.org/downloads/"
Write-Host "2. Node.js: https://nodejs.org/"
Write-Host ""
Write-Host "Or use VS Code Live Server extension instead." -ForegroundColor Cyan
Read-Host "Press Enter to exit"

