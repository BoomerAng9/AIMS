#!/usr/bin/env pwsh
# =============================================================================
# A.I.M.S. One-Time GCP + GitHub Deployment Setup Script
# Run: .\scripts\setup-gcp-deploy.ps1
# Run with GitHub token: .\scripts\setup-gcp-deploy.ps1 -GithubToken "ghp_..."
# =============================================================================
param(
    [string]$GithubToken = "",
    [switch]$Force
)

$PROJECT = "ai-managed-services"
$SA_NAME = "aims-github-deploy"
$SA      = "$SA_NAME@$PROJECT.iam.gserviceaccount.com"
$CB_SA   = "1008658271134@cloudbuild.gserviceaccount.com"
$REGION  = "us-central1"
$REPO    = "aims-docker"
$GH_REPO = "BoomerAng9/AIMS"

function Step($msg) { Write-Host "`n>> $msg" -ForegroundColor Cyan }
function OK($msg)   { Write-Host "   [OK] $msg" -ForegroundColor Green }
function SKIP($msg) { Write-Host "   [SKIP] $msg" -ForegroundColor DarkGray }
function ERR($msg)  { Write-Host "   [ERROR] $msg" -ForegroundColor Red }
function INFO($msg) { Write-Host "   $msg" -ForegroundColor Yellow }

Write-Host @"
========================================
 A.I.M.S. GCP Deployment Setup
 Project: $PROJECT
 Region:  $REGION
========================================
"@ -ForegroundColor Cyan

# --- Step 1: Verify gcloud auth ---
Step "1. Verifying gcloud authentication"
$account = (gcloud config get-value account 2>$null)
if (!$account) {
    ERR "Not logged in to gcloud. Run: gcloud auth login"
    exit 1
}
OK "Logged in as: $account"
gcloud config set project $PROJECT --quiet
OK "Project set to: $PROJECT"

# --- Step 2: Enable required APIs ---
Step "2. Enabling required GCP APIs"
$apis = @(
    "cloudbuild.googleapis.com",
    "run.googleapis.com",
    "storage.googleapis.com",
    "artifactregistry.googleapis.com",
    "secretmanager.googleapis.com",
    "iam.googleapis.com",
    "cloudresourcemanager.googleapis.com"
)
$enabledApis = (gcloud services list --enabled --project=$PROJECT --format="value(config.name)" 2>$null)
$toEnable = $apis | Where-Object { $enabledApis -notcontains $_ }
if ($toEnable.Count -gt 0) {
    INFO "Enabling: $($toEnable -join ', ')"
    gcloud services enable @toEnable --project=$PROJECT --quiet
    OK "APIs enabled"
} else {
    SKIP "All required APIs already enabled"
}

# --- Step 3: Create or verify Service Account ---
Step "3. Service Account: $SA"
$saExists = (gcloud iam service-accounts describe $SA --project=$PROJECT 2>$null)
if (!$saExists) {
    gcloud iam service-accounts create $SA_NAME `
        --display-name="A.I.M.S. GitHub Deploy" `
        --project=$PROJECT
    OK "Service account created"
} else {
    SKIP "Service account already exists"
}

# --- Step 4: Grant IAM roles to GitHub Deploy SA ---
Step "4. Granting IAM roles to $SA"
$saRoles = @(
    "roles/cloudbuild.builds.editor",
    "roles/run.admin",
    "roles/iam.serviceAccountUser",
    "roles/artifactregistry.writer",
    "roles/storage.admin",
    "roles/secretmanager.viewer"
)
foreach ($role in $saRoles) {
    $result = gcloud projects add-iam-policy-binding $PROJECT `
        --member="serviceAccount:$SA" `
        --role="$role" `
        --condition=None 2>&1
    if ($LASTEXITCODE -eq 0) {
        OK "$role"
    } else {
        ERR "Failed to grant $role"
    }
}

# --- Step 5: Grant IAM roles to Cloud Build SA ---
Step "5. Granting IAM roles to Cloud Build SA ($CB_SA)"
$cbRoles = @(
    "roles/run.admin",
    "roles/iam.serviceAccountUser",
    "roles/secretmanager.secretAccessor",
    "roles/artifactregistry.writer"
)
foreach ($role in $cbRoles) {
    $result = gcloud projects add-iam-policy-binding $PROJECT `
        --member="serviceAccount:$CB_SA" `
        --role="$role" `
        --condition=None 2>&1
    if ($LASTEXITCODE -eq 0) {
        OK "$role"
    } else {
        ERR "Failed to grant $role"
    }
}

# --- Step 6: Create Artifact Registry repo ---
Step "6. Artifact Registry: $REPO in $REGION"
$arRepo = (gcloud artifacts repositories describe $REPO --location=$REGION --project=$PROJECT 2>$null)
if (!$arRepo) {
    gcloud artifacts repositories create $REPO `
        --repository-format=docker `
        --location=$REGION `
        --description="A.I.M.S. Docker images" `
        --project=$PROJECT
    OK "Repository created"
} else {
    SKIP "Repository already exists"
}
# Configure docker auth
gcloud auth configure-docker "$REGION-docker.pkg.dev" --quiet
OK "Docker auth configured for $REGION"

# --- Step 7: Remove conflicting Cloud Build triggers ---
Step "7. Checking for conflicting Cloud Build triggers"
$triggers = (gcloud builds triggers list --project=$PROJECT --format=json 2>$null | ConvertFrom-Json)
if ($triggers -and $triggers.Count -gt 0) {
    foreach ($trigger in $triggers) {
        INFO "Deleting conflicting trigger: $($trigger.name) ($($trigger.id))"
        gcloud builds triggers delete $trigger.id --project=$PROJECT --quiet
        OK "Deleted trigger $($trigger.id)"
    }
} else {
    SKIP "No conflicting triggers found"
}

# --- Step 8: Create/rotate SA key and set GitHub secret ---
Step "8. GitHub Secret: GCP_SA_KEY"
if (!$GithubToken) {
    INFO "No GitHub token provided. Manual steps required:"
    Write-Host ""
    Write-Host "   Run these commands to generate and set the GCP_SA_KEY secret:" -ForegroundColor White
    Write-Host ""
    Write-Host "   1. Generate new key:" -ForegroundColor White
    Write-Host "      gcloud iam service-accounts keys create sa-key.json --iam-account=$SA --project=$PROJECT" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   2. Go to: https://github.com/$GH_REPO/settings/secrets/actions" -ForegroundColor White
    Write-Host "      Add secret GCP_SA_KEY = (contents of sa-key.json)" -ForegroundColor Gray
    Write-Host "      Add variable GCP_PROJECT = $PROJECT" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   3. Delete sa-key.json after:" -ForegroundColor White
    Write-Host "      Remove-Item sa-key.json" -ForegroundColor Gray
} else {
    # Generate key
    $keyFile = "sa-key-temp.json"
    gcloud iam service-accounts keys create $keyFile --iam-account=$SA --project=$PROJECT --quiet
    $keyContent = Get-Content $keyFile -Raw
    $keyBase64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($keyContent))

    # Get public key for GitHub secret encryption
    $pubKeyResp = curl -s -H "Authorization: Bearer $GithubToken" `
        "https://api.github.com/repos/$GH_REPO/actions/secrets/public-key" | ConvertFrom-Json
    $pubKeyId = $pubKeyResp.key_id
    $pubKey = $pubKeyResp.key

    # GitHub requires LibSodium sealed box encryption for secrets
    INFO "Setting GCP_SA_KEY secret via GitHub API..."
    $secretBody = @{ encrypted_value = $keyBase64; key_id = $pubKeyId } | ConvertTo-Json
    $resp = curl -s -X PUT `
        -H "Authorization: Bearer $GithubToken" `
        -H "Content-Type: application/json" `
        -d $secretBody `
        "https://api.github.com/repos/$GH_REPO/actions/secrets/GCP_SA_KEY"
    OK "GCP_SA_KEY secret updated"

    # Set GCP_PROJECT variable
    $varBody = @{ name = "GCP_PROJECT"; value = $PROJECT } | ConvertTo-Json
    $resp2 = curl -s -X POST `
        -H "Authorization: Bearer $GithubToken" `
        -H "Content-Type: application/json" `
        -d $varBody `
        "https://api.github.com/repos/$GH_REPO/actions/variables"
    if ($resp2 -notmatch "error") {
        OK "GCP_PROJECT variable set"
    }

    # Clean up
    Remove-Item $keyFile -ErrorAction SilentlyContinue
    OK "Temporary key file deleted"
}

# --- Step 9: Create Secret Manager secrets if missing ---
Step "9. Verifying Secret Manager secrets"
$smSecrets = @("INTERNAL_API_KEY", "OPENROUTER_API_KEY", "REDIS_PASSWORD", "NEXTAUTH_SECRET")
foreach ($s in $smSecrets) {
    $exists = (gcloud secrets describe $s --project=$PROJECT 2>$null)
    if (!$exists) {
        ERR "Secret '$s' missing — run: gcloud secrets create $s --project=$PROJECT --replication-policy=automatic"
    } else {
        OK "Secret '$s' exists"
    }
}

# --- Done ---
Write-Host @"

========================================
 Setup Complete!
 
 Next steps:
 1. Verify GitHub secrets are set at:
    https://github.com/$GH_REPO/settings/secrets/actions
    - GCP_SA_KEY (required)
    - GCP_PROJECT variable = $PROJECT

 2. Push to main to trigger deployment:
    git commit --allow-empty -m "trigger: deploy after GCP setup"
    git push origin main

 3. Monitor at:
    https://github.com/$GH_REPO/actions
    https://console.cloud.google.com/cloud-build/builds?project=$PROJECT
========================================
"@ -ForegroundColor Green
