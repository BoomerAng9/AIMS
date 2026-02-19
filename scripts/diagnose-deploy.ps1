#!/usr/bin/env pwsh
# =============================================================================
# A.I.M.S. Deployment Diagnostic Script
# Run: .\scripts\diagnose-deploy.ps1
# =============================================================================

$PROJECT = "ai-managed-services"
$SA      = "aims-github-deploy@$PROJECT.iam.gserviceaccount.com"
$REGION  = "us-central1"
$REPO    = "aims-docker"
$GH_REPO = "BoomerAng9/AIMS"

$pass = 0; $fail = 0; $warn = 0

function Check($label, $ok, $detail = "") {
    if ($ok -eq $true)        { Write-Host "  [OK]   $label" -ForegroundColor Green;  $script:pass++ }
    elseif ($ok -eq $false)   { Write-Host "  [FAIL] $label" -ForegroundColor Red;    $script:fail++ }
    else                      { Write-Host "  [WARN] $label" -ForegroundColor Yellow;  $script:warn++ }
    if ($detail) { Write-Host "         $detail" -ForegroundColor DarkGray }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " A.I.M.S. Deployment Diagnostics" -ForegroundColor Cyan
Write-Host " Project: $PROJECT" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# --- 1. GCP Auth ---
Write-Host "--- 1. GCP Authentication ---" -ForegroundColor White
$account = (gcloud config get-value account 2>$null)
Check "Logged in to gcloud" ($account -ne "") "Active account: $account"

$proj = (gcloud config get-value project 2>$null)
Check "gcloud project is $PROJECT" ($proj -eq $PROJECT) "Current project: $proj"

# --- 2. APIs ---
Write-Host "`n--- 2. Required GCP APIs ---" -ForegroundColor White
$apis = @(
    "cloudbuild.googleapis.com",
    "run.googleapis.com",
    "storage.googleapis.com",
    "artifactregistry.googleapis.com",
    "secretmanager.googleapis.com",
    "iam.googleapis.com"
)
$enabledApis = (gcloud services list --enabled --project=$PROJECT --format="value(config.name)" 2>$null)
foreach ($api in $apis) {
    Check "API enabled: $api" ($enabledApis -contains $api)
}

# --- 3. Service Account ---
Write-Host "`n--- 3. Service Account (aims-github-deploy) ---" -ForegroundColor White
$saExists = (gcloud iam service-accounts describe $SA --project=$PROJECT 2>$null)
Check "Service account exists" ($saExists -ne $null)

$requiredRoles = @(
    "roles/cloudbuild.builds.editor",
    "roles/run.admin",
    "roles/iam.serviceAccountUser",
    "roles/artifactregistry.writer",
    "roles/storage.admin"
)
if ($saExists) {
    $policy = (gcloud projects get-iam-policy $PROJECT --format=json 2>$null | ConvertFrom-Json)
    foreach ($role in $requiredRoles) {
        $binding = $policy.bindings | Where-Object { $_.role -eq $role }
        $hasRole = $binding -and ($binding.members -contains "serviceAccount:$SA")
        Check "  SA has role: $role" $hasRole
    }
}

# --- 4. Cloud Build SA permissions ---
Write-Host "`n--- 4. Cloud Build Service Account ---" -ForegroundColor White
$cbSA = "1008658271134@cloudbuild.gserviceaccount.com"
$cbRoles = @("roles/run.admin", "roles/iam.serviceAccountUser", "roles/secretmanager.secretAccessor")
if ($policy) {
    foreach ($role in $cbRoles) {
        $binding = $policy.bindings | Where-Object { $_.role -eq $role }
        $hasRole = $binding -and ($binding.members -contains "serviceAccount:$cbSA")
        Check "  Cloud Build SA has role: $role" $hasRole
    }
}

# --- 5. Artifact Registry ---
Write-Host "`n--- 5. Artifact Registry ---" -ForegroundColor White
$arRepo = (gcloud artifacts repositories describe $REPO --location=$REGION --project=$PROJECT --format=json 2>$null | ConvertFrom-Json)
Check "Artifact Registry repo '$REPO' exists in $REGION" ($arRepo -ne $null)
if ($arRepo) { Check "  Format is DOCKER" ($arRepo.format -eq "DOCKER") }

# --- 6. Conflicting Cloud Build Triggers ---
Write-Host "`n--- 6. Cloud Build Triggers ---" -ForegroundColor White
$triggers = (gcloud builds triggers list --project=$PROJECT --format=json 2>$null | ConvertFrom-Json)
if ($triggers -and $triggers.Count -gt 0) {
    Check "Conflicting Cloud Build triggers found!" $null "Found $($triggers.Count) trigger(s) - these may conflict with GitHub Actions"
    $triggers | ForEach-Object { Write-Host "       Trigger: $($_.name) ($($_.id))" -ForegroundColor DarkYellow }
    Write-Host "       Run: gcloud builds triggers delete <id> --project=$PROJECT --quiet" -ForegroundColor DarkGray
} else {
    Check "No conflicting Cloud Build triggers" $true
}

# --- 7. GitHub Secrets ---
Write-Host "`n--- 7. GitHub Secrets (BoomerAng9/AIMS) ---" -ForegroundColor White
$secrets = (curl -s "https://api.github.com/repos/$GH_REPO/actions/secrets" | ConvertFrom-Json).secrets
$requiredSecrets = @("GCP_SA_KEY")
$requiredVars    = @("GCP_PROJECT")
foreach ($s in $requiredSecrets) {
    $exists = $secrets | Where-Object { $_.name -eq $s }
    Check "GitHub secret '$s' exists" ($exists -ne $null) $(if (!$exists) { "Go to: https://github.com/$GH_REPO/settings/secrets/actions" })
}
$vars = (curl -s "https://api.github.com/repos/$GH_REPO/actions/variables" | ConvertFrom-Json).variables
foreach ($v in $requiredVars) {
    $exists = $vars | Where-Object { $_.name -eq $v }
    Check "GitHub variable '$v' exists" ($exists -ne $null)
}

# --- 8. Dockerfiles ---
Write-Host "`n--- 8. Dockerfiles Referenced in cloudbuild.yaml ---" -ForegroundColor White
$dockerfiles = @(
    "backend/uef-gateway/Dockerfile",
    "frontend/Dockerfile",
    "backend/agents/research-ang/Dockerfile",
    "backend/agents/router-ang/Dockerfile"
)
foreach ($df in $dockerfiles) {
    Check "  $df" (Test-Path $df)
}

# --- Summary ---
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " Results: $pass passed, $fail failed, $warn warnings" -ForegroundColor $(if ($fail -gt 0) { "Red" } elseif ($warn -gt 0) { "Yellow" } else { "Green" })
Write-Host "========================================`n" -ForegroundColor Cyan

if ($fail -gt 0) {
    Write-Host "Run .\scripts\setup-gcp-deploy.ps1 to auto-fix issues" -ForegroundColor Yellow
}
