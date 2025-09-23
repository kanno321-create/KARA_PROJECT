# scripts/monitor_production.ps1
# KIS Estimator 운영 모니터링 스크립트

param(
    [string]$Endpoint = "http://127.0.0.1:8787",
    [int]$IntervalSeconds = 30,
    [int]$MaxErrors = 5,
    [switch]$ContinuousMode = $false
)

# 메트릭 초기화
$metrics = @{
    http_2xx = 0
    http_4xx = 0
    http_5xx = 0
    total_requests = 0
    latencies = @()
    errors = @()
    start_time = Get-Date
}

# 알람 임계값
$thresholds = @{
    p95_ms = 50
    error_rate_pct = 0.5
    errors_per_minute = 5
}

function Test-Endpoint {
    param([string]$Uri, [string]$Method = "GET", [string]$Body = $null)

    $start = Get-Date
    try {
        $params = @{
            Uri = $Uri
            Method = $Method
            TimeoutSec = 5
        }
        if ($Body) {
            $params.Body = $Body
            $params.ContentType = "application/json"
        }

        $response = Invoke-RestMethod @params
        $latency = ((Get-Date) - $start).TotalMilliseconds

        return @{
            Success = $true
            StatusCode = 200
            Latency = $latency
            Response = $response
        }
    }
    catch {
        $latency = ((Get-Date) - $start).TotalMilliseconds
        $statusCode = 500

        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
        }

        return @{
            Success = $false
            StatusCode = $statusCode
            Latency = $latency
            Error = $_.Exception.Message
        }
    }
}

function Update-Metrics {
    param($Result)

    $script:metrics.total_requests++
    $script:metrics.latencies += $Result.Latency

    switch -Regex ($Result.StatusCode) {
        "^2\d\d" { $script:metrics.http_2xx++ }
        "^4\d\d" { $script:metrics.http_4xx++ }
        "^5\d\d" {
            $script:metrics.http_5xx++
            $script:metrics.errors += @{
                Time = Get-Date
                Code = $Result.StatusCode
                Error = $Result.Error
            }
        }
    }
}

function Calculate-P95 {
    param($Values)

    if ($Values.Count -eq 0) { return 0 }

    $sorted = $Values | Sort-Object
    $index = [Math]::Ceiling($sorted.Count * 0.95) - 1
    if ($index -lt 0) { $index = 0 }

    return $sorted[$index]
}

function Check-Alarms {
    # P95 체크
    $p95 = Calculate-P95 $metrics.latencies
    if ($p95 -gt $thresholds.p95_ms) {
        Write-Warning "[ALARM] P95 latency: $([Math]::Round($p95, 2))ms > ${thresholds.p95_ms}ms"
    }

    # 오류율 체크
    if ($metrics.total_requests -gt 0) {
        $errorRate = ($metrics.http_5xx / $metrics.total_requests) * 100
        if ($errorRate -gt $thresholds.error_rate_pct) {
            Write-Warning "[ALARM] Error rate: $([Math]::Round($errorRate, 2))% > ${thresholds.error_rate_pct}%"
        }
    }

    # 분당 오류 체크
    $recentErrors = $metrics.errors | Where-Object {
        (Get-Date) - $_.Time -lt [TimeSpan]::FromMinutes(1)
    }
    if ($recentErrors.Count -ge $thresholds.errors_per_minute) {
        Write-Warning "[ALARM] Errors/min: $($recentErrors.Count) >= ${thresholds.errors_per_minute}"
        Write-Warning "Consider rollback: .\scripts\rollback_production.ps1 -Force"
    }
}

function Show-Dashboard {
    Clear-Host
    $uptime = (Get-Date) - $metrics.start_time

    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host "KIS ESTIMATOR MONITORING DASHBOARD" -ForegroundColor Cyan
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Endpoint: $Endpoint"
    Write-Host "Uptime: $($uptime.ToString('hh\:mm\:ss'))"
    Write-Host "Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    Write-Host ""

    # 요청 통계
    Write-Host "REQUEST STATISTICS:" -ForegroundColor Yellow
    Write-Host "  Total Requests: $($metrics.total_requests)"
    Write-Host "  Success (2xx): $($metrics.http_2xx) ($([Math]::Round($metrics.http_2xx/$metrics.total_requests*100, 1))%)" -ForegroundColor Green
    Write-Host "  Client Errors (4xx): $($metrics.http_4xx)" -ForegroundColor Yellow
    Write-Host "  Server Errors (5xx): $($metrics.http_5xx)" -ForegroundColor Red
    Write-Host ""

    # 성능 메트릭
    Write-Host "PERFORMANCE METRICS:" -ForegroundColor Yellow
    if ($metrics.latencies.Count -gt 0) {
        $p95 = Calculate-P95 $metrics.latencies
        $avg = ($metrics.latencies | Measure-Object -Average).Average
        $min = ($metrics.latencies | Measure-Object -Minimum).Minimum
        $max = ($metrics.latencies | Measure-Object -Maximum).Maximum

        Write-Host "  P95 Latency: $([Math]::Round($p95, 2))ms $(if($p95 -gt $thresholds.p95_ms){'[!]'})"
        Write-Host "  Avg Latency: $([Math]::Round($avg, 2))ms"
        Write-Host "  Min/Max: $([Math]::Round($min, 2))ms / $([Math]::Round($max, 2))ms"
    }
    Write-Host ""

    # 최근 오류
    if ($metrics.errors.Count -gt 0) {
        Write-Host "RECENT ERRORS:" -ForegroundColor Red
        $metrics.errors | Select-Object -Last 5 | ForEach-Object {
            Write-Host "  [$($_.Time.ToString('HH:mm:ss'))] Code: $($_.Code) - $($_.Error)"
        }
    }

    # 알람 상태
    Check-Alarms
}

# 메인 루프
Write-Host "Starting monitoring..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

$testCount = 0
do {
    # Health check
    $health = Test-Endpoint "$Endpoint/v1/health"
    Update-Metrics $health

    # 주기적으로 다른 엔드포인트도 테스트
    if ($testCount % 3 -eq 1) {
        # Create estimate test
        $body = @{
            brand = "LS"
            form = "ECONOMIC"
            installation = @{ location = "INDOOR"; mount = "FLUSH" }
            device = @{ type = "MCCB" }
            main = @{ af = 100; poles = "3P" }
            branches = @(@{ af = 100; poles = "3P"; qty = 2 })
            accessories = @{ enabled = $false; items = @() }
        } | ConvertTo-Json -Depth 10

        $create = Test-Endpoint "$Endpoint/v1/estimate/create" "POST" $body
        Update-Metrics $create
    }

    # 대시보드 표시
    Show-Dashboard

    $testCount++
    if ($ContinuousMode) {
        Start-Sleep -Seconds $IntervalSeconds
    }

} while ($ContinuousMode)

# 최종 리포트
Write-Host ""
Write-Host "MONITORING SESSION COMPLETE" -ForegroundColor Green
Write-Host "Total Duration: $((Get-Date) - $metrics.start_time)"
Write-Host "Total Requests: $($metrics.total_requests)"
Write-Host "Success Rate: $([Math]::Round($metrics.http_2xx/$metrics.total_requests*100, 2))%"

if ($metrics.http_5xx -ge $MaxErrors) {
    Write-Warning "High error count detected. Consider investigation or rollback."
}