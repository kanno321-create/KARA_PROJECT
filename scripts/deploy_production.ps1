# scripts/deploy_production.ps1
# KIS Estimator GA 1.0.0 운영 배포 스크립트

param(
    [string]$DeployPath = "C:\apps\kis\KIS_Estimator_GA_1.0",
    [string]$ArtifactPath = "dist\GA\KIS_Estimator_GA_1.0.zip",
    [switch]$SkipTests = $false,
    [switch]$ServiceMode = $false
)

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "KIS Estimator GA 1.0.0 - Production Deployment Script" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

# 1. 해시 검증
Write-Host "`n[1/7] Verifying artifact integrity..." -ForegroundColor Yellow
$expectedHash = "0de4aaa84955cdda9c18f90e18ad2c017191f02d14f75bc11cb40f0d0ee4d451"
$actualHash = (Get-FileHash $ArtifactPath -Algorithm SHA256).Hash.ToLower()

if ($actualHash -ne $expectedHash) {
    Write-Error "Artifact hash mismatch! Expected: $expectedHash, Got: $actualHash"
    exit 1
}
Write-Host "  [OK] Artifact hash verified" -ForegroundColor Green

# 2. 배포 디렉토리 준비
Write-Host "`n[2/7] Preparing deployment directory..." -ForegroundColor Yellow
if (Test-Path $DeployPath) {
    Write-Host "  Directory exists. Backing up..." -ForegroundColor Yellow
    $backupPath = "$DeployPath.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    Move-Item $DeployPath $backupPath -Force
    Write-Host "  Backup created: $backupPath" -ForegroundColor Green
}

New-Item -ItemType Directory -Path $DeployPath -Force | Out-Null
Write-Host "  [OK] Directory prepared: $DeployPath" -ForegroundColor Green

# 3. 아티팩트 압축 해제
Write-Host "`n[3/7] Extracting artifact..." -ForegroundColor Yellow
Expand-Archive -Path $ArtifactPath -DestinationPath $DeployPath -Force
Write-Host "  [OK] Extraction complete" -ForegroundColor Green

# 4. 필수 파일 확인
Write-Host "`n[4/7] Verifying required files..." -ForegroundColor Yellow
$requiredFiles = @(
    "deploy\fastmcp\server.mock.py",
    "scripts\mock_gateway.py",
    "scripts\evidence_bundler.py",
    "deploy\fastmcp\openapi_estimate_v1.yaml",
    "tests\regression\seeds\regression_seeds_v2.jsonl"
)

foreach ($file in $requiredFiles) {
    $fullPath = Join-Path $DeployPath $file
    if (-not (Test-Path $fullPath)) {
        Write-Error "Required file missing: $file"
        exit 1
    }
}
Write-Host "  [OK] All required files present" -ForegroundColor Green

# 5. 환경변수 설정
Write-Host "`n[5/7] Setting environment variables..." -ForegroundColor Yellow
$env:RBAC_EVIDENCE = "ADMIN_ONLY"
$env:PORT = "8787"
$env:SSL = "RECOMMENDED"
$env:MIXED_EXCEPTIONS_MONTHLY = "2"
$env:KIS_ENV = "PRODUCTION"
Write-Host "  [OK] Environment configured" -ForegroundColor Green

# 6. 서비스 시작
Write-Host "`n[6/7] Starting service..." -ForegroundColor Yellow
Set-Location $DeployPath

if ($ServiceMode) {
    # Windows Service 모드
    Write-Host "  Installing as Windows Service..." -ForegroundColor Yellow

    # NSSM 경로 확인
    $nssmPath = "C:\tools\nssm\nssm.exe"
    if (-not (Test-Path $nssmPath)) {
        Write-Error "NSSM not found at $nssmPath"
        exit 1
    }

    # 기존 서비스 제거
    & $nssmPath stop KIS_Estimator_GA 2>$null
    & $nssmPath remove KIS_Estimator_GA confirm 2>$null

    # 새 서비스 설치
    & $nssmPath install KIS_Estimator_GA "C:\Python\python.exe"
    & $nssmPath set KIS_Estimator_GA AppDirectory $DeployPath
    & $nssmPath set KIS_Estimator_GA AppParameters "-u deploy\fastmcp\server.mock.py"
    & $nssmPath set KIS_Estimator_GA Start SERVICE_AUTO_START
    & $nssmPath start KIS_Estimator_GA

    Write-Host "  [OK] Service started" -ForegroundColor Green
} else {
    # 개발 모드 (백그라운드 프로세스)
    Write-Host "  Starting in development mode..." -ForegroundColor Yellow
    $job = Start-Job -ScriptBlock {
        param($path)
        Set-Location $path
        python -u deploy\fastmcp\server.mock.py
    } -ArgumentList $DeployPath

    Start-Sleep -Seconds 3
    Write-Host "  [OK] Server started (Job ID: $($job.Id))" -ForegroundColor Green
}

# 7. 스모크 테스트
if (-not $SkipTests) {
    Write-Host "`n[7/7] Running smoke tests..." -ForegroundColor Yellow
    Start-Sleep -Seconds 2

    # Health check
    try {
        $health = Invoke-RestMethod -Uri "http://127.0.0.1:8787/v1/health" -Method GET
        if ($health.ok) {
            Write-Host "  [PASS] Health check" -ForegroundColor Green
        } else {
            throw "Health check failed"
        }
    } catch {
        Write-Error "Smoke test failed: $_"
        exit 1
    }

    # Create estimate test
    $createBody = @{
        brand = "SANGDO"
        form = "ECONOMIC"
        installation = @{
            location = "INDOOR"
            mount = "FLUSH"
        }
        device = @{
            type = "MCCB"
        }
        main = @{
            af = 600
            poles = "3P"
        }
        branches = @(
            @{
                af = 100
                poles = "3P"
                qty = 1
            }
        )
        accessories = @{
            enabled = $false
            items = @()
        }
    } | ConvertTo-Json -Depth 10

    try {
        $create = Invoke-RestMethod -Uri "http://127.0.0.1:8787/v1/estimate/create" `
            -Method POST -ContentType "application/json" -Body $createBody
        if ($create.enclosure) {
            Write-Host "  [PASS] Create estimate" -ForegroundColor Green
        } else {
            throw "Create estimate failed"
        }
    } catch {
        Write-Error "Create test failed: $_"
        exit 1
    }

    # Evidence test
    try {
        $evidence = Invoke-RestMethod -Uri "http://127.0.0.1:8787/v1/estimate/test123/evidence" -Method GET
        if ($evidence.bundle) {
            Write-Host "  [PASS] Evidence bundle" -ForegroundColor Green
        } else {
            throw "Evidence test failed"
        }
    } catch {
        Write-Error "Evidence test failed: $_"
        exit 1
    }

    Write-Host "`n[OK] All smoke tests passed" -ForegroundColor Green
}

# 최종 결과
Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "DEPLOYMENT SUCCESSFUL" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Version: GA-1.0.0"
Write-Host "Location: $DeployPath"
Write-Host "Port: 8787"
Write-Host "Status: RUNNING"
Write-Host "Monitor: http://127.0.0.1:8787/v1/health"
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Configure reverse proxy (Nginx/IIS)"
Write-Host "  2. Setup monitoring dashboard"
Write-Host "  3. Enable audit logging"
Write-Host "  4. Test RBAC policies"
Write-Host ""