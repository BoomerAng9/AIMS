#!/usr/bin/env pwsh
param(
    [string]$Path = "infra/.env.production",
    [switch]$TemplateMode,
    [switch]$Strict
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$resolved = Join-Path (Get-Location) $Path
if (-not (Test-Path -LiteralPath $resolved)) {
    Write-Host "[FAIL] Env file not found: $resolved" -ForegroundColor Red
    Write-Host "       Provide -Path or create the file from infra/.env.production.example" -ForegroundColor DarkGray
    exit 1
}

$lines = Get-Content -LiteralPath $resolved
$values = @{}
$duplicates = @()
$lineNo = 0

foreach ($line in $lines) {
    $lineNo++
    if ($line -match '^\s*$') { continue }
    if ($line -match '^\s*#') { continue }

    if ($line -notmatch '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$') {
        continue
    }

    $key = $Matches[1]
    $rawValue = $Matches[2]
    $value = $rawValue.Trim()

    if ($values.ContainsKey($key)) {
        $duplicates += "$key (line $lineNo)"
    }

    $values[$key] = $value
}

$required = @(
    'NEXTAUTH_SECRET',
    'INTERNAL_API_KEY',
    'POSTGRES_PASSWORD',
    'REDIS_PASSWORD',
    'OPENROUTER_API_KEY',
    'ANTHROPIC_API_KEY',
    'CHAT_RUNTIME_BRIDGE_SECRET'
)

# Placeholder-like values that must never ship.
$placeholderPattern = '(?i)(change-this|generate-a-random|yourdomain\.com|^\s*$|^your@email\.com$)'

$issues = @()
$warnings = @()

if ($duplicates.Count -gt 0) {
    $issues += "Duplicate variable declarations detected: $($duplicates -join ', ')"
}

foreach ($k in $required) {
    if (-not $values.ContainsKey($k)) {
        $issues += "Missing required key: $k"
        continue
    }

    $v = $values[$k]
    if ($v -match $placeholderPattern) {
        if (-not $TemplateMode) {
            $issues += "Required key contains placeholder/non-production value: $k"
        } else {
            $warnings += "Template placeholder detected (expected in template mode): $k"
        }
    }
}

# Canonical/legacy URL alias consistency checks.
if ($values.ContainsKey('CHAT_RUNTIME_URL')) {
    $runtimeUrl = $values['CHAT_RUNTIME_URL']

    foreach ($alias in @('CHAT_INTERFACE_URL', 'LIBRECHAT_URL')) {
        if ($values.ContainsKey($alias) -and $values[$alias] -ne '' -and $values[$alias] -ne $runtimeUrl) {
            $issues += "Alias mismatch: $alias must equal CHAT_RUNTIME_URL"
        }
    }
}

# Bridge-secret alias consistency checks.
if ($values.ContainsKey('CHAT_RUNTIME_BRIDGE_SECRET')) {
    $runtimeBridge = $values['CHAT_RUNTIME_BRIDGE_SECRET']

    foreach ($alias in @('CHAT_INTERFACE_BRIDGE_SECRET', 'LIBRECHAT_BRIDGE_SECRET', 'AIMS_BRIDGE_SHARED_SECRET')) {
        if ($values.ContainsKey($alias) -and $values[$alias] -ne '' -and $values[$alias] -ne $runtimeBridge) {
            $issues += "Bridge secret mismatch: $alias must match CHAT_RUNTIME_BRIDGE_SECRET"
        }
    }
}

# Basic production URL hygiene.
if ($values.ContainsKey('NEXTAUTH_URL') -and $values['NEXTAUTH_URL'] -notmatch '^https://') {
    $issues += 'NEXTAUTH_URL must use https:// in production'
}
if ($values.ContainsKey('CORS_ORIGIN') -and $values['CORS_ORIGIN'] -notmatch '^https://') {
    $issues += 'CORS_ORIGIN must use https:// in production'
}

# Optional strict mode: enforce II_AGENT_BRIDGE_KEY presence.
if ($Strict) {
    if (-not $values.ContainsKey('II_AGENT_BRIDGE_KEY') -or $values['II_AGENT_BRIDGE_KEY'] -match $placeholderPattern) {
        $issues += 'Strict mode: II_AGENT_BRIDGE_KEY must be set to a non-placeholder value'
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " A.I.M.S. Env Validation" -ForegroundColor Cyan
Write-Host " File: $resolved" -ForegroundColor Cyan
Write-Host " Template mode: $TemplateMode | Strict: $Strict" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($warnings.Count -gt 0) {
    foreach ($w in $warnings) {
        Write-Host "[WARN] $w" -ForegroundColor Yellow
    }
}

if ($issues.Count -gt 0) {
    foreach ($i in $issues) {
        Write-Host "[FAIL] $i" -ForegroundColor Red
    }
    Write-Host "" 
    Write-Host "Validation failed with $($issues.Count) issue(s)." -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Validation passed." -ForegroundColor Green
exit 0
