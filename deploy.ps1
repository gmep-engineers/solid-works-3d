# TitanForge 3D - Google Cloud Run Automated Deployment Script
# Project ID: hephillu3d
$ErrorActionPreference = "Stop"

$PROJECT_ID = "hephillu3d"
$REGION = "us-central1"
$REPO_NAME = "titanforge-repo"
$IMAGE_NAME = "titanforge-app"
$SERVICE_NAME = "titanforge-app"
$TAG = $(Get-Date -Format "yyyyMMdd-HHmmss")

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Deploying TitanForge 3D to Google Cloud Run" -ForegroundColor Cyan
Write-Host "Project ID: $PROJECT_ID | Region: $REGION" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Set current project
Write-Host "`n[1/5] Setting gcloud project to $PROJECT_ID..." -ForegroundColor Yellow
gcloud config set project $PROJECT_ID

# Enable Required GCP APIs
Write-Host "`n[2/5] Enabling Cloud Run, Cloud Build, and Artifact Registry APIs..." -ForegroundColor Yellow
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com --project $PROJECT_ID

# Check if Artifact Registry repository exists, create if not
Write-Host "`n[3/5] Checking Artifact Registry repository '$REPO_NAME'..." -ForegroundColor Yellow
$repoExists = gcloud artifacts repositories describe $REPO_NAME --location=$REGION --project=$PROJECT_ID 2>$null
if (-not $repoExists) {
    Write-Host "Creating repository '$REPO_NAME' in $REGION..." -ForegroundColor Green
    gcloud artifacts repositories create $REPO_NAME `
        --repository-format=docker `
        --location=$REGION `
        --description="Docker repository for TitanForge 3D" `
        --project=$PROJECT_ID
} else {
    Write-Host "Repository '$REPO_NAME' already exists." -ForegroundColor Green
}

# Build and Push container via Cloud Build
$IMAGE_URI = "$REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/${IMAGE_NAME}:$TAG"
Write-Host "`n[4/5] Building and pushing Docker container to Cloud Build ($IMAGE_URI)..." -ForegroundColor Yellow
gcloud builds submit --tag $IMAGE_URI .

# Deploy to Cloud Run with GCS volume mount
Write-Host "`n[5/5] Deploying container to Cloud Run with persistent GCS volume..." -ForegroundColor Yellow
gcloud run deploy $SERVICE_NAME `
    --image $IMAGE_URI `
    --platform managed `
    --region $REGION `
    --allow-unauthenticated `
    --port 8080 `
    --memory 2Gi `
    --cpu 2 `
    --min-instances 0 `
    --max-instances 5 `
    "--add-volume=name=gcs-uploads,type=cloud-storage,bucket=hephillu3d-data" `
    "--add-volume-mount=volume=gcs-uploads,mount-path=/app/backend/uploads" `
    --project $PROJECT_ID

Write-Host "`n==========================================" -ForegroundColor Green
Write-Host "TitanForge 3D deployed successfully!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green

# Retrieve service URL
$SERVICE_URL = gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format="value(status.url)"
Write-Host "`nActive Cloud Run URL: $SERVICE_URL" -ForegroundColor Cyan
Write-Host "`nNext Step: Map your GoDaddy domain in Google Cloud Console:" -ForegroundColor White
Write-Host "https://console.cloud.google.com/run/domains?project=$PROJECT_ID" -ForegroundColor White

