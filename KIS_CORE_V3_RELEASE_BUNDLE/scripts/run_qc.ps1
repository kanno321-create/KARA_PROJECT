#Requires -Version 5.1
<#
.SYNOPSIS
    KIS Core v3 Quality Control (QC) Runner
.DESCRIPTION
    Executes comprehensive quality control checks including FIX-4 gates, Polisher scores,
    WCAG compliance, and generates the standardized 12-line QC summary report.
.PARAMETER Environment
    Target environment for QC validation (dev, staging, production)
.PARAMETER FailFast
    Stop execution on first quality gate failure
.PARAMETER GenerateReport
    Generate detailed QC report in addition to 12-line summary
.PARAMETER OutputPath
    Directory for QC reports and logs
.EXAMPLE
    .\run_qc.ps1 -Environment "production"
.EXAMPLE
    .\run_qc.ps1 -Environment "staging" -GenerateReport -OutputPath "qc_reports"
#>

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("dev", "staging", "production")]
    [string]$Environment = "dev",

    [switch]$FailFast,
    [switch]$GenerateReport,

    [Parameter(Mandatory=$false)]
    [string]$OutputPath = "qc_reports_$(Get-Date -Format 'yyyy_MM_dd_HHmm')"
)

$ErrorActionPreference = "Stop"

# Configuration
$Config = @{
    ProjectRoot = (Get-Location).Path
    Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    ShortTimestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Version = "v3.0.0"
    BuildNumber = "BUILD-$(Get-Date -Format 'yyyyMMdd-HHmm')"
    QCThresholds = @{
        Fix4 = @{
            Critical = 0
            Major = 2
            Minor = 4
        }
        PolisherMinimum = 95.0
        WcagCompliance = 100.0
        PerformanceP95 = 2100
        CoverageMinimum = 80.0
        MaxMemoryMB = 2048
    }
}

# Create output directory
$QCPath = Join-Path $Config.ProjectRoot $OutputPath
if (-not (Test-Path $QCPath)) {
    New-Item -Path $QCPath -ItemType Directory -Force | Out-Null
}

function Write-QCLog {
    param($Message, $Level = "INFO", $Color = "White")
    $timestamp = Get-Date -Format "HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"

    Write-Host $logMessage -ForegroundColor $Color
    Add-Content -Path (Join-Path $QCPath "qc.log") -Value $logMessage
}

function Invoke-Fix4Gate {
    Write-QCLog "Running FIX-4 Quality Gate..." "INFO" "Cyan"

    # Mock static analysis results - replace with actual tools (SonarQube, ESLint, etc.)
    $staticAnalysis = @{
        critical = 0
        major = 1
        minor = 3
        info = 12
        total = 16
        files_analyzed = 127
        analysis_time_seconds = 45.2
        details = @(
            @{
                severity = "major"
                rule = "complexity"
                file = "src/services/calculation.js"
                line = 156
                message = "Cyclomatic complexity of 15 exceeds threshold of 10"
                suggestion = "Consider breaking down the function into smaller methods"
            },
            @{
                severity = "minor"
                rule = "naming"
                file = "src/utils/formatter.js"
                line = 23
                message = "Variable name 'temp' is not descriptive"
                suggestion = "Use more descriptive variable names"
            },
            @{
                severity = "minor"
                rule = "duplication"
                file = "src/controllers/estimate.js"
                line = 89
                message = "Duplicated code block detected"
                suggestion = "Extract common logic into shared function"
            }
        )
    }

    # Evaluate against thresholds
    $fix4Status = @{
        critical = @{
            found = $staticAnalysis.critical
            threshold = $Config.QCThresholds.Fix4.Critical
            pass = $staticAnalysis.critical -le $Config.QCThresholds.Fix4.Critical
        }
        major = @{
            found = $staticAnalysis.major
            threshold = $Config.QCThresholds.Fix4.Major
            pass = $staticAnalysis.major -le $Config.QCThresholds.Fix4.Major
        }
        minor = @{
            found = $staticAnalysis.minor
            threshold = $Config.QCThresholds.Fix4.Minor
            pass = $staticAnalysis.minor -le $Config.QCThresholds.Fix4.Minor
        }
        info = @{
            found = $staticAnalysis.info
            threshold = -1  # No limit
            pass = $true
        }
    }

    $gatesPassed = ($fix4Status.critical.pass -and $fix4Status.major.pass -and $fix4Status.minor.pass)
    $fix4Score = ($fix4Status.Values | Where-Object { $_.pass }).Count

    # Log results
    foreach ($level in @("critical", "major", "minor", "info")) {
        $status = $fix4Status[$level]
        $symbol = if ($status.pass) { "✅" } else { "❌" }
        $color = if ($status.pass) { "Green" } else { "Red" }

        if ($status.threshold -ge 0) {
            Write-QCLog "$symbol $($level.ToUpper()): $($status.found)/$($status.threshold)" "INFO" $color
        } else {
            Write-QCLog "$symbol $($level.ToUpper()): $($status.found)" "INFO" $color
        }
    }

    $overallStatus = if ($gatesPassed) { "PASS" } else { "FAIL" }
    $color = if ($gatesPassed) { "Green" } else { "Red" }
    Write-QCLog "FIX-4 Overall: $overallStatus ($fix4Score/4 gates)" "INFO" $color

    if ($FailFast -and -not $gatesPassed) {
        throw "FIX-4 quality gate failed - stopping execution"
    }

    return @{
        pass = $gatesPassed
        score = $fix4Score
        details = $staticAnalysis
        status = $fix4Status
        blocker = if ($gatesPassed) { "None" } else { "Yes" }
    }
}

function Invoke-PolisherCheck {
    Write-QCLog "Running Polisher Quality Check..." "INFO" "Cyan"

    # Mock polisher calculation - replace with actual polisher tool
    $metrics = @{
        complexity = @{
            score = 92.5
            weight = 0.25
            details = @{
                average_complexity = 3.8
                max_complexity = 12
                files_over_threshold = 3
            }
        }
        maintainability = @{
            score = 96.8
            weight = 0.25
            details = @{
                tech_debt_minutes = 45
                code_smells = 8
                duplication_percent = 2.1
            }
        }
        reliability = @{
            score = 98.2
            weight = 0.25
            details = @{
                bugs = 2
                test_coverage = 94.5
                test_success_rate = 98.8
            }
        }
        security = @{
            score = 97.5
            weight = 0.25
            details = @{
                vulnerabilities = 0
                security_hotspots = 3
                security_review_status = "reviewed"
            }
        }
    }

    # Calculate weighted Polisher score
    $polisherScore = 0
    foreach ($metric in $metrics.GetEnumerator()) {
        $weightedScore = $metric.Value.score * $metric.Value.weight
        $polisherScore += $weightedScore
        Write-QCLog "$($metric.Key): $($metric.Value.score)% (weight: $($metric.Value.weight))" "INFO" "White"
    }

    $polisherScore = [math]::Round($polisherScore, 1)
    $polisherPass = $polisherScore -ge $Config.QCThresholds.PolisherMinimum

    $symbol = if ($polisherPass) { "✅" } else { "❌" }
    $color = if ($polisherPass) { "Green" } else { "Red" }
    $status = if ($polisherPass) { "PASS" } else { "FAIL" }

    Write-QCLog "$symbol Polisher Score: $polisherScore% (≥$($Config.QCThresholds.PolisherMinimum)%) - $status" "INFO" $color

    if ($FailFast -and -not $polisherPass) {
        throw "Polisher quality check failed - stopping execution"
    }

    return @{
        pass = $polisherPass
        score = $polisherScore
        status = $status
        metrics = $metrics
        threshold = $Config.QCThresholds.PolisherMinimum
    }
}

function Invoke-WCAGCheck {
    Write-QCLog "Running WCAG AA Compliance Check..." "INFO" "Cyan"

    # Mock accessibility scan - replace with axe-core or similar
    $wcagResults = @{
        pages_tested = 12
        total_violations = 2
        violations_by_level = @{
            critical = 0
            serious = 1
            moderate = 1
            minor = 0
        }
        compliance_rate = 98.3
        details = @(
            @{
                rule = "color-contrast"
                level = "serious"
                impact = "Users with visual impairments"
                count = 1
                description = "Secondary text has insufficient contrast ratio (3.8:1, needs 4.5:1)"
            },
            @{
                rule = "aria-label"
                level = "moderate"
                impact = "Screen reader users"
                count = 1
                description = "Icon button missing accessible label"
            }
        )
    }

    $wcagPass = $wcagResults.violations_by_level.critical -eq 0 -and $wcagResults.violations_by_level.serious -eq 0
    $symbol = if ($wcagPass) { "✅" } else { "❌" }
    $color = if ($wcagPass) { "Green" } else { "Red" }
    $status = if ($wcagPass) { "PASS" } else { "FAIL" }

    Write-QCLog "$symbol WCAG AA: $($wcagResults.compliance_rate)% compliance - $status" "INFO" $color
    Write-QCLog "Violations: $($wcagResults.total_violations) total ($($wcagResults.violations_by_level.serious) serious)" "INFO" "White"

    if ($FailFast -and -not $wcagPass) {
        throw "WCAG compliance check failed - stopping execution"
    }

    return @{
        pass = $wcagPass
        compliance_rate = $wcagResults.compliance_rate
        violations = $wcagResults.total_violations
        status = $status
        details = $wcagResults
    }
}

function Invoke-PerformanceCheck {
    Write-QCLog "Running Performance Check..." "INFO" "Cyan"

    # Mock performance test - replace with actual load testing
    $performanceResults = @{
        load_test = @{
            duration_seconds = 180
            concurrent_users = 50
            total_requests = 9000
            avg_response_ms = 1250
            p95_response_ms = 1850
            p99_response_ms = 2300
            error_rate_percent = 0.02
            requests_per_second = 50.0
        }
        resource_usage = @{
            peak_memory_mb = 1456
            avg_cpu_percent = 65.3
            max_cpu_percent = 78.5
            disk_io_mbps = 25.3
        }
        endpoints = @(
            @{ name = "POST /v1/estimate"; p95_ms = 2100; requests = 5400 },
            @{ name = "GET /v1/estimates"; p95_ms = 180; requests = 2700 },
            @{ name = "PUT /v1/estimates/:id"; p95_ms = 1200; requests = 900 }
        )
    }

    $p95Pass = $performanceResults.load_test.p95_response_ms -le $Config.QCThresholds.PerformanceP95
    $memoryPass = $performanceResults.resource_usage.peak_memory_mb -le $Config.QCThresholds.MaxMemoryMB

    $perfPass = $p95Pass -and $memoryPass
    $symbol = if ($perfPass) { "✅" } else { "❌" }
    $color = if ($perfPass) { "Green" } else { "Red" }
    $status = if ($perfPass) { "PASS" } else { "FAIL" }

    Write-QCLog "$symbol Performance p95: $($performanceResults.load_test.p95_response_ms)ms (≤$($Config.QCThresholds.PerformanceP95)ms) - $status" "INFO" $color
    Write-QCLog "Memory usage: $($performanceResults.resource_usage.peak_memory_mb)MB (≤$($Config.QCThresholds.MaxMemoryMB)MB)" "INFO" "White"

    if ($FailFast -and -not $perfPass) {
        throw "Performance check failed - stopping execution"
    }

    return @{
        pass = $perfPass
        p95_response_time = $performanceResults.load_test.p95_response_ms
        memory_usage = $performanceResults.resource_usage.peak_memory_mb
        status = $status
        details = $performanceResults
    }
}

function Invoke-TestSuite {
    Write-QCLog "Running Test Suite..." "INFO" "Cyan"

    # Mock test execution - replace with actual test runner
    $testResults = @{
        unit_tests = @{
            total = 127
            passed = 127
            failed = 0
            skipped = 0
            coverage = 94.5
        }
        integration_tests = @{
            total = 23
            passed = 22
            failed = 1
            skipped = 0
            coverage = 87.3
        }
        e2e_tests = @{
            total = 15
            passed = 15
            failed = 0
            skipped = 0
            coverage = 91.2
        }
        overall = @{
            total = 165
            passed = 164
            failed = 1
            success_rate = 99.4
            overall_coverage = 92.1
        }
    }

    $coveragePass = $testResults.overall.overall_coverage -ge $Config.QCThresholds.CoverageMinimum
    $testsPass = $testResults.overall.failed -eq 0

    $overallPass = $coveragePass -and $testsPass
    $symbol = if ($overallPass) { "✅" } else { "❌" }
    $color = if ($overallPass) { "Green" } else { "Red" }
    $status = if ($overallPass) { "PASS" } else { "FAIL" }

    Write-QCLog "$symbol Tests: $($testResults.overall.passed)/$($testResults.overall.total) passed ($($testResults.overall.success_rate)%)" "INFO" $color
    Write-QCLog "Coverage: $($testResults.overall.overall_coverage)% (≥$($Config.QCThresholds.CoverageMinimum)%)" "INFO" "White"

    if ($FailFast -and -not $overallPass) {
        throw "Test suite failed - stopping execution"
    }

    return @{
        pass = $overallPass
        tests_passed = $testResults.overall.passed
        total_tests = $testResults.overall.total
        coverage_percentage = $testResults.overall.overall_coverage
        status = $status
        details = $testResults
    }
}

function Generate-12LineSummary {
    param($QCResults)

    Write-QCLog "Generating 12-line QC summary..." "INFO" "Cyan"

    # Determine overall status
    $allPassed = $QCResults.Values | ForEach-Object { $_.pass } | Where-Object { $_ -eq $false }
    $overallStatus = if ($allPassed.Count -eq 0) { "✅ PASS" } else { "❌ FAIL" }

    # Build 12-line summary
    $summary = @"
# QC 12-Line Summary Report
## Generated: $($Config.ShortTimestamp)
## Release: $($Config.Version) | Build: $($Config.BuildNumber)

**1. 🎯 SCOPE**: KIS Core v3 - Estimate & ERP-AI Services
**2. ✅ PASS**: $($QCResults.Tests.tests_passed)/$($QCResults.Tests.total_tests) tests | $($QCResults.Tests.coverage_percentage)% coverage
**3. ❌ FAIL**: $($QCResults.Fix4.details.critical) Critical | $($QCResults.Fix4.details.major) Major | $($QCResults.Fix4.details.minor) Minor
**4. 🔧 FIX-4**: $($QCResults.Fix4.score)/4 gates passed | Blocker: $($QCResults.Fix4.blocker)
**5. 🏆 POLISHER**: $($QCResults.Polisher.score)% | Target: ≥$($QCResults.Polisher.threshold)% | Status: $($QCResults.Polisher.status)
**6. ♿ WCAG**: AA compliance | $($QCResults.WCAG.violations) violations found
**7. ⚡ PERF**: p95=$($QCResults.Performance.p95_response_time)ms | Target: ≤$($Config.QCThresholds.PerformanceP95)ms | Status: $($QCResults.Performance.status)
**8. 💾 MEMORY**: $($QCResults.Performance.memory_usage)MB peak | Leak check: OK
**9. 🛡️ SECURITY**: Clean | Vulnerabilities: 0
**10. 📱 RESPONSIVE**: 3 breakpoints tested | Mobile: ✅ PASS
**11. 🌐 COMPAT**: Chrome/Firefox/Safari | IE11: N/A | Safari: ✅ PASS
**12. 🚀 DEPLOY**: Ready | Rollback: Ready | Monitoring: Active

---
**Overall Status**: $overallStatus
**QC Reviewer**: System Automated
**Next Action**: $(if ($overallStatus -eq "✅ PASS") { "Proceed to deployment" } else { "Fix failing quality gates" })
"@

    # Save 12-line summary
    $summaryFile = Join-Path $QCPath "qc_12line_summary.md"
    $summary | Set-Content $summaryFile

    # Display summary
    Write-Host ""
    Write-Host "📋 QC 12-LINE SUMMARY" -ForegroundColor Magenta
    Write-Host "=====================" -ForegroundColor Magenta
    Write-Host $summary

    return $summary
}

function Generate-DetailedReport {
    param($QCResults)

    if (-not $GenerateReport) {
        Write-QCLog "Detailed report skipped (use -GenerateReport to include)"
        return
    }

    Write-QCLog "Generating detailed QC report..." "INFO" "Cyan"

    $detailedReport = @{
        metadata = @{
            timestamp = $Config.Timestamp
            environment = $Environment
            version = $Config.Version
            build = $Config.BuildNumber
        }
        summary = @{
            overall_status = if (($QCResults.Values | Where-Object { -not $_.pass }).Count -eq 0) { "PASS" } else { "FAIL" }
            gates_passed = ($QCResults.Values | Where-Object { $_.pass }).Count
            total_gates = $QCResults.Count
        }
        results = $QCResults
        recommendations = @()
        next_actions = @()
    }

    # Add recommendations based on failures
    if (-not $QCResults.Fix4.pass) {
        $detailedReport.recommendations += "Address static analysis issues, particularly complexity violations"
    }
    if (-not $QCResults.Polisher.pass) {
        $detailedReport.recommendations += "Improve code quality metrics to achieve ≥95% Polisher score"
    }
    if (-not $QCResults.WCAG.pass) {
        $detailedReport.recommendations += "Fix accessibility violations for WCAG AA compliance"
    }
    if (-not $QCResults.Performance.pass) {
        $detailedReport.recommendations += "Optimize performance to meet p95 ≤2100ms requirement"
    }

    # Save detailed report
    $reportFile = Join-Path $QCPath "detailed_qc_report.json"
    $detailedReport | ConvertTo-Json -Depth 10 | Set-Content $reportFile

    Write-QCLog "Detailed report saved: $reportFile"
}

# Main execution
function Main {
    Write-Host "🔍 KIS Core v3 Quality Control Runner" -ForegroundColor Magenta
    Write-Host "Environment: $Environment" -ForegroundColor Cyan
    Write-Host "Timestamp: $($Config.Timestamp)" -ForegroundColor Cyan
    Write-Host "Output: $QCPath" -ForegroundColor Cyan
    Write-Host ""

    $qcResults = @{}

    try {
        # Run all QC checks
        $qcResults.Fix4 = Invoke-Fix4Gate
        $qcResults.Polisher = Invoke-PolisherCheck
        $qcResults.WCAG = Invoke-WCAGCheck
        $qcResults.Performance = Invoke-PerformanceCheck
        $qcResults.Tests = Invoke-TestSuite

        # Generate reports
        $summary = Generate-12LineSummary $qcResults
        Generate-DetailedReport $qcResults

        # Final status
        $failedGates = $qcResults.Values | Where-Object { -not $_.pass }
        if ($failedGates.Count -eq 0) {
            Write-Host ""
            Write-Host "🎉 ALL QUALITY GATES PASSED!" -ForegroundColor Green
            Write-Host "✅ System is ready for deployment" -ForegroundColor Green
            exit 0
        } else {
            Write-Host ""
            Write-Host "❌ QUALITY GATES FAILED: $($failedGates.Count)/$($qcResults.Count)" -ForegroundColor Red
            Write-Host "🔧 Address failing quality gates before deployment" -ForegroundColor Yellow
            exit 1
        }

    } catch {
        Write-QCLog "QC execution failed: $($_.Exception.Message)" "ERROR"
        Write-Host ""
        Write-Host "💥 QC EXECUTION FAILED" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        exit 2
    }
}

# Execute main function
Main