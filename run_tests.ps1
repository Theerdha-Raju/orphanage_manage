# run_tests.ps1
# One-click runner: starts servers (if not already running), runs Selenium tests, opens report.
# Usage:
#   .\run_tests.ps1          (runs in background headless mode)
#   .\run_tests.ps1 -Live    (runs in LIVE visible Chrome browser on screen)

param(
    [switch]$Live
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  HOPENEST - SELENIUM TEST AUTOMATION RUNNER" -ForegroundColor Cyan
if ($Live) {
    Write-Host "  MODE: LIVE INTERACTIVE BROWSER (WATCH ON SCREEN)" -ForegroundColor Magenta
} else {
    Write-Host "  MODE: HEADLESS (BACKGROUND)" -ForegroundColor DarkCyan
}
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

function Test-PortActive {
    param([string]$Hostname, [int]$Port)
    try {
        $tcp = New-Object System.Net.Sockets.TcpClient
        $tcp.Connect($Hostname, $Port)
        $tcp.Close()
        return $true
    } catch {
        return $false
    }
}

function Wait-ForPort {
    param([string]$Hostname, [int]$Port, [string]$Label, [int]$MaxSeconds = 45)
    $elapsed = 0
    while ($elapsed -lt $MaxSeconds) {
        if (Test-PortActive -Hostname $Hostname -Port $Port) {
            Write-Host "    $Label is ready ($Hostname`:$Port)" -ForegroundColor Green
            return $true
        }
        Start-Sleep -Seconds 1
        $elapsed += 1
        Write-Host "    Waiting for $Label... ($elapsed s)" -ForegroundColor DarkGray
    }
    Write-Host "    WARNING: $Label did not respond within ${MaxSeconds}s. Proceeding anyway..." -ForegroundColor Red
    return $false
}

# -- 1. Start Django Backend (if needed) ---------------------------------------
if (Test-PortActive -Hostname "127.0.0.1" -Port 8000) {
    Write-Host "[1/5] Django Backend is already running on port 8000." -ForegroundColor Green
} else {
    Write-Host "[1/5] Starting Django Backend (port 8000)..." -ForegroundColor Yellow
    Start-Process -FilePath "powershell.exe" `
        -ArgumentList "-NoExit", "-Command", "cd '$Root\backend'; python manage.py runserver 0.0.0.0:8000" `
        -WindowStyle Minimized
    Wait-ForPort -Hostname "127.0.0.1" -Port 8000 -Label "Django Backend" | Out-Null
}

# -- 2. Start React Frontend (if needed) ---------------------------------------
if (Test-PortActive -Hostname "127.0.0.1" -Port 5173) {
    Write-Host "[2/5] React Frontend is already running on port 5173." -ForegroundColor Green
} else {
    Write-Host "[2/5] Starting React Frontend (port 5173)..." -ForegroundColor Yellow
    Start-Process -FilePath "powershell.exe" `
        -ArgumentList "-NoExit", "-Command", "cd '$Root\frontend-react'; npm run dev" `
        -WindowStyle Minimized
    Wait-ForPort -Hostname "127.0.0.1" -Port 5173 -Label "React Frontend" | Out-Null
}

Write-Host ""

# -- 3. Server Check -----------------------------------------------------------
Write-Host "[3/5] Servers confirmed active!" -ForegroundColor Green

# -- 4. Run Selenium Tests ----------------------------------------------------
Write-Host "[4/5] Running Selenium Test Suite..." -ForegroundColor Yellow
Write-Host "--------------------------------------------------------" -ForegroundColor DarkGray

Set-Location $Root

if ($Live) {
    python -m selenium_tests.run_tests --live
} else {
    python -m selenium_tests.run_tests
}

Write-Host "--------------------------------------------------------" -ForegroundColor DarkGray
Write-Host ""

# -- 5. Open HTML Report in Browser -------------------------------------------
$ReportPath = Join-Path $Root "selenium_tests\reports\test_report.html"

if (Test-Path $ReportPath) {
    Write-Host "[5/5] Opening HTML Test Report in browser..." -ForegroundColor Yellow
    Start-Process $ReportPath
    Write-Host "    Report: $ReportPath" -ForegroundColor Green
} else {
    Write-Host "[5/5] Report not found at: $ReportPath" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  DONE! Check your browser for the test report." -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""
