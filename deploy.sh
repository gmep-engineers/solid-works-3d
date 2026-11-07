#!/usr/bin/env bash
# TitanForge 3D - Automated Deployment Script for Linux / macOS
set -e

PROJECT_ID="hephillu3d"
REGION="us-central1"
REPO_NAME="titanforge-repo"
IMAGE_NAME="titanforge-app"
SERVICE_NAME="titanforge-app"
TAG=$(date +%Y%m%d-%H%M%S)

echo "=========================================="
echo "Deploying TitanForge 3D to Google Cloud Run"
echo "Project ID: $PROJECT_ID | Region: $REGION"
echo "=========================================="

echo -e "\n[1/5] Setting gcloud project to $PROJECT_ID..."
gcloud config set project "$PROJECT_ID"

echo -e "\n[2/5] Enabling APIs..."
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com --project "$PROJECT_ID"

echo -e "\n[3/5] Verifying Artifact Registry repository..."
if ! gcloud artifacts repositories describe "$REPO_NAME" --location="$REGION" --project="$PROJECT_ID" >/dev/null 2>&1; then
    gcloud artifacts repositories create "$REPO_NAME" \
        --repository-format=docker \
        --location="$REGION" \
        --description="Docker repository for TitanForge 3D" \
        --project="$PROJECT_ID"
fi

IMAGE_URI="$REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/$IMAGE_NAME:$TAG"
echo -e "\n[4/5] Building and pushing Docker container to Cloud Build ($IMAGE_URI)..."
gcloud builds submit --tag "$IMAGE_URI" .

echo -e "\n[5/5] Deploying container to Cloud Run with GCS volume..."
gcloud run deploy "$SERVICE_NAME" \
    --image "$IMAGE_URI" \
    --platform managed \
    --region "$REGION" \
    --allow-unauthenticated \
    --port 8080 \
    --memory 2Gi \
    --cpu 2 \
    --min-instances 0 \
    --max-instances 5 \
    --add-volume=name=gcs-uploads,type=cloud-storage,bucket=hephillu3d-data \
    --add-volume-mount=volume=gcs-uploads,mount-path=/app/backend/uploads \
    --project "$PROJECT_ID"

echo "=========================================="
echo "TitanForge 3D deployed successfully!"
echo "=========================================="
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" --platform managed --region "$REGION" --format="value(status.url)")
echo -e "\nActive Cloud Run URL: $SERVICE_URL"
echo "Domain: https://hephillu3d.com"
