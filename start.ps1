# start.ps1
# Automatically starts backend, frontend, waits for readiness, and opens in browser.

$ErrorActionPreference = "SilentlyContinue"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "         HOPENEST - STARTING PROJECT" -ForegroundColor Cyan
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
            Write-Host "  [OK] $Label is ready ($Hostname`:$Port)" -ForegroundColor Green
            return $true
        }
        Start-Sleep -Seconds 1
        $elapsed += 1
        Write-Host "  [...] Waiting for $Label... ($elapsed s)" -ForegroundColor DarkGray
    }
    Write-Host "  [WARN] $Label did not respond within ${MaxSeconds}s." -ForegroundColor Red
    return $false
}

# 1. Django Backend (Port 8000)
if (Test-PortActive -Hostname "127.0.0.1" -Port 8000) {
    Write-Host "[1/3] Django Backend is ALREADY running on port 8000." -ForegroundColor Green
} else {
    Write-Host "[1/3] Starting Django Backend Server on port 8000..." -ForegroundColor Yellow
    Start-Process -FilePath "powershell.exe" `
        -ArgumentList "-NoExit", "-Command", "cd '$Root\backend'; python manage.py runserver 0.0.0.0:8000" `
        -WindowStyle Minimized
    Wait-ForPort -Hostname "127.0.0.1" -Port 8000 -Label "Django Backend" | Out-Null
}

# 2. React Frontend (Port 5173)
if (Test-PortActive -Hostname "127.0.0.1" -Port 5173) {
    Write-Host "[2/3] React Frontend is ALREADY running on port 5173." -ForegroundColor Green
} else {
    Write-Host "[2/3] Starting React Frontend Server on port 5173..." -ForegroundColor Yellow
    Start-Process -FilePath "powershell.exe" `
        -ArgumentList "-NoExit", "-Command", "cd '$Root\frontend-react'; npm run dev" `
        -WindowStyle Minimized
    Wait-ForPort -Hostname "127.0.0.1" -Port 5173 -Label "React Frontend" | Out-Null
}

# 3. Automatically launch in default browser
Write-Host ""
Write-Host "[3/3] Automatically launching HopeNest in your browser..." -ForegroundColor Cyan
Start-Process "http://localhost:5173"

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  PROJECT RUNNING SUCCESSFULLY!" -ForegroundColor Green
Write-Host "  Frontend:     http://localhost:5173" -ForegroundColor White
Write-Host "  Backend API:  http://localhost:8000" -ForegroundColor White
Write-Host "  Admin Portal: http://localhost:8000/admin/" -ForegroundColor White
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""
