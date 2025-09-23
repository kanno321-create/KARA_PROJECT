# scripts/rollback_production.ps1
# KIS Estimator 긴급 롤백 스크립트

param(
    [string]$CurrentVersion = "GA_1.0",
    [string]$RollbackVersion = "GA_0.9",
    [string]$BasePath = "C:\apps\kis",
    [switch]$Force = $false
)

Write-Host "============================================================" -ForegroundColor Red
Write-Host "KIS Estimator - EMERGENCY ROLLBACK" -ForegroundColor Red
Write-Host "============================================================" -ForegroundColor Red

Write-Host "`nCurrent Version: $CurrentVersion" -ForegroundColor Yellow
Write-Host "Rollback To: $RollbackVersion" -ForegroundColor Yellow

if (-not $Force) {
    $confirm = Read-Host "`nAre you sure you want to rollback? (yes/no)"
    if ($confirm -ne "yes") {
        Write-Host "Rollback cancelled" -ForegroundColor Yellow
        exit 0
    }
}

# 1. 현재 서비스 중지
Write-Host "`n[1/6] Stopping current service..." -ForegroundColor Yellow

# NSSM 서비스 중지
$nssmPath = "C:\tools\nssm\nssm.exe"
if (Test-Path $nssmPath) {
    & $nssmPath stop KIS_Estimator_GA 2>$null
    Start-Sleep -Seconds 2
}

# Python 프로세스 강제 종료
Get-Process python -ErrorAction SilentlyContinue | Where-Object {
    $_.Path -like "*KIS_Estimator*"
} | Stop-Process -Force

Write-Host "  [OK] Service stopped" -ForegroundColor Green

# 2. 포트 해제 확인
Write-Host "`n[2/6] Verifying port release..." -ForegroundColor Yellow
$maxRetries = 10
$retryCount = 0

while ($retryCount -lt $maxRetries) {
    $portCheck = netstat -an | Select-String ":8787"
    if (-not $portCheck) {
        Write-Host "  [OK] Port 8787 is free" -ForegroundColor Green
        break
    }
    Write-Host "  Waiting for port release... ($retryCount/$maxRetries)" -ForegroundColor Yellow
    Start-Sleep -Seconds 1
    $retryCount++
}

if ($retryCount -eq $maxRetries) {
    Write-Error "Port 8787 is still in use!"
    exit 1
}

# 3. 롤백 버전 확인
Write-Host "`n[3/6] Verifying rollback version..." -ForegroundColor Yellow
$rollbackPath = Join-Path $BasePath "KIS_Estimator_$RollbackVersion"

if (-not (Test-Path $rollbackPath)) {
    Write-Error "Rollback version not found: $rollbackPath"

    # 백업 찾기
    $backups = Get-ChildItem "$BasePath\KIS_Estimator_*.backup.*" -Directory | Sort-Object CreationTime -Descending
    if ($backups.Count -gt 0) {
        Write-Host "  Found backups:" -ForegroundColor Yellow
        $backups | ForEach-Object { Write-Host "    - $($_.Name)" }
        $useBackup = Read-Host "Use latest backup? (yes/no)"
        if ($useBackup -eq "yes") {
            $rollbackPath = $backups[0].FullName
            Write-Host "  Using backup: $rollbackPath" -ForegroundColor Green
        } else {
            exit 1
        }
    } else {
        exit 1
    }
}

Write-Host "  [OK] Rollback version found" -ForegroundColor Green

# 4. 이전 버전 시작
Write-Host "`n[4/6] Starting previous version..." -ForegroundColor Yellow
Set-Location $rollbackPath

# 환경변수 재설정
$env:RBAC_EVIDENCE = "ADMIN_ONLY"
$env:PORT = "8787"
$env:SSL = "RECOMMENDED"
$env:MIXED_EXCEPTIONS_MONTHLY = "2"
$env:KIS_ENV = "PRODUCTION"

# 서비스 시작
if (Test-Path $nssmPath) {
    & $nssmPath remove KIS_Estimator_GA confirm 2>$null
    & $nssmPath install KIS_Estimator_GA "C:\Python\python.exe"
    & $nssmPath set KIS_Estimator_GA AppDirectory $rollbackPath
    & $nssmPath set KIS_Estimator_GA AppParameters "-u deploy\fastmcp\server.mock.py"
    & $nssmPath set KIS_Estimator_GA Start SERVICE_AUTO_START
    & $nssmPath start KIS_Estimator_GA
} else {
    # 개발 모드
    Start-Job -ScriptBlock {
        param($path)
        Set-Location $path
        python -u deploy\fastmcp\server.mock.py
    } -ArgumentList $rollbackPath | Out-Null
}

Start-Sleep -Seconds 3
Write-Host "  [OK] Previous version started" -ForegroundColor Green

# 5. 스모크 테스트
Write-Host "`n[5/6] Running smoke tests..." -ForegroundColor Yellow

try {
    $health = Invoke-RestMethod -Uri "http://127.0.0.1:8787/v1/health" -Method GET
    if ($health.ok) {
        Write-Host "  [PASS] Health check" -ForegroundColor Green
    } else {
        throw "Health check failed"
    }
} catch {
    Write-Error "Rollback verification failed: $_"
    exit 1
}

# 6. 로그 수집
Write-Host "`n[6/6] Collecting evidence..." -ForegroundColor Yellow

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$evidencePath = "C:\logs\rollback_$timestamp"
New-Item -ItemType Directory -Path $evidencePath -Force | Out-Null

# 실패 버전 로그 수집
$failedPath = Join-Path $BasePath "KIS_Estimator_$CurrentVersion"
if (Test-Path "$failedPath\logs") {
    Copy-Item "$failedPath\logs\*" $evidencePath -Recurse -Force
}

# 시스템 정보 수집
@{
    timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    rollback_from = $CurrentVersion
    rollback_to = $RollbackVersion
    reason = "Emergency rollback triggered"
    operator = $env:USERNAME
    machine = $env:COMPUTERNAME
} | ConvertTo-Json | Out-File "$evidencePath\rollback_info.json"

Write-Host "  [OK] Evidence collected at: $evidencePath" -ForegroundColor Green

# JIRA 이슈 생성 프롬프트
Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "ROLLBACK COMPLETE" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Rolled back from: $CurrentVersion -> $RollbackVersion"
Write-Host "Evidence location: $evidencePath"
Write-Host "Service status: RUNNING (on previous version)"
Write-Host ""
Write-Host "REQUIRED ACTIONS:" -ForegroundColor Yellow
Write-Host "  1. Create JIRA issue with evidence"
Write-Host "  2. Notify team via Slack/email"
Write-Host "  3. Analyze root cause from logs"
Write-Host "  4. Plan hotfix deployment"
Write-Host ""
Write-Host "JIRA Template:" -ForegroundColor Cyan
Write-Host "  Title: [ROLLBACK] KIS Estimator $CurrentVersion -> $RollbackVersion"
Write-Host "  Priority: Critical"
Write-Host "  Evidence: $evidencePath"
Write-Host "  Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host ""