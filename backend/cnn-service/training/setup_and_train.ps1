#!/usr/bin/env pwsh
<#
.SYNOPSIS
    One-click FFDS CNN model training setup for Windows.

.DESCRIPTION
    1. Creates/activates virtual environment
    2. Installs Python dependencies
    3. Downloads real datasets from Kaggle (10 000+ images)
       OR generates synthetic data if Kaggle creds are missing
    4. Trains the EfficientNetB0 model (2-phase)
    5. Saves model to ./model/ffds_model.h5

.PARAMETER DataDir
    Directory to store dataset images. Default: ./data

.PARAMETER ModelOutput
    Path to save trained model. Default: ./model/ffds_model.h5

.PARAMETER MinImages
    Minimum images before stopping Kaggle downloads. Default: 10000

.PARAMETER SyntheticFallback
    If set, always use synthetic data (no Kaggle needed).

.EXAMPLE
    .\training\setup_and_train.ps1
    .\training\setup_and_train.ps1 -SyntheticFallback -MinImages 3000
#>

param(
    [string]$DataDir      = "./data",
    [string]$ModelOutput  = "./model/ffds_model.h5",
    [int]$MinImages       = 10000,
    [switch]$SyntheticFallback
)

$ErrorActionPreference = "Stop"

function Write-Step($msg) {
    Write-Host ""
    Write-Host "━━━ $msg" -ForegroundColor Cyan
}

function Write-OK($msg) {
    Write-Host "  ✅ $msg" -ForegroundColor Green
}

function Write-Warn($msg) {
    Write-Host "  ⚠  $msg" -ForegroundColor Yellow
}

# ── 0. Navigate to cnn-service root ───────────────────────────────────────────
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$cnnRoot   = Split-Path -Parent $scriptDir   # parent of training/
Set-Location $cnnRoot
Write-Step "FFDS CNN Training Setup"
Write-Host "  Working dir: $cnnRoot" -ForegroundColor DarkGray

# ── 1. Virtual environment ────────────────────────────────────────────────────
Write-Step "Setting up Python virtual environment"
if (-not (Test-Path ".venv")) {
    python -m venv .venv
    Write-OK "Created .venv"
} else {
    Write-OK "Existing .venv found"
}

$pip  = ".\.venv\Scripts\pip.exe"
$py   = ".\.venv\Scripts\python.exe"

# ── 2. Install dependencies ───────────────────────────────────────────────────
Write-Step "Installing Python dependencies"
& $pip install --upgrade pip --quiet
& $pip install -r requirements.txt --quiet
Write-OK "Dependencies installed"

# ── 3. Dataset ────────────────────────────────────────────────────────────────
Write-Step "Preparing dataset"

$useKaggle = $false
if (-not $SyntheticFallback) {
    # Check if Kaggle credentials exist
    $kaggleJson = "$env:USERPROFILE\.kaggle\kaggle.json"
    $hasEnvVars = ($env:KAGGLE_USERNAME -and $env:KAGGLE_KEY)
    if ((Test-Path $kaggleJson) -or $hasEnvVars) {
        $useKaggle = $true
    } else {
        Write-Warn "No Kaggle credentials found."
        Write-Warn "  Place kaggle.json at: $kaggleJson"
        Write-Warn "  OR set KAGGLE_USERNAME + KAGGLE_KEY env vars."
        Write-Warn "  Falling back to synthetic data generation."
    }
}

if ($useKaggle) {
    Write-Host "  Downloading real datasets from Kaggle (~2-5 GB)..." -ForegroundColor DarkGray
    & $py training/download_dataset.py --data-dir $DataDir --min-images $MinImages
} else {
    $numPerClass = [math]::Max(500, [math]::Ceiling($MinImages / 3))
    Write-Host "  Generating $numPerClass synthetic images per class..." -ForegroundColor DarkGray
    & $py training/generate_mock_data.py --data-dir $DataDir --num-images $numPerClass
}

# Count images
$freshCount      = (Get-ChildItem "$DataDir/fresh"      -File -ErrorAction SilentlyContinue).Count
$borderlineCount = (Get-ChildItem "$DataDir/borderline" -File -ErrorAction SilentlyContinue).Count
$spoiledCount    = (Get-ChildItem "$DataDir/spoiled"    -File -ErrorAction SilentlyContinue).Count
$totalImages     = $freshCount + $borderlineCount + $spoiledCount

Write-OK "Dataset ready: $totalImages images"
Write-Host "    fresh=$freshCount  borderline=$borderlineCount  spoiled=$spoiledCount" -ForegroundColor DarkGray

# ── 4. Train ──────────────────────────────────────────────────────────────────
Write-Step "Training EfficientNetB0 model"
Write-Host "  This may take 30 min – 2 hrs depending on your GPU/CPU." -ForegroundColor DarkGray
Write-Host "  Model will be saved to: $ModelOutput" -ForegroundColor DarkGray

& $py training/train.py `
    --data-dir    $DataDir `
    --output      $ModelOutput `
    --epochs      15 `
    --fine-tune-epochs 10 `
    --batch-size  32

# ── 5. Done ───────────────────────────────────────────────────────────────────
Write-Step "Complete!"
if (Test-Path $ModelOutput) {
    Write-OK "Model saved: $ModelOutput"
    Write-Host ""
    Write-Host "  Start the inference server:" -ForegroundColor White
    Write-Host "    .venv\Scripts\uvicorn app.main:app --reload --port 8000" -ForegroundColor DarkGray
} else {
    Write-Warn "Model file not found — training may have failed. Check output above."
}
