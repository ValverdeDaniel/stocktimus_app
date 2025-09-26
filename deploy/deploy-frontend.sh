#!/bin/bash

# Exit on error
set -e

# Configuration
PROJECT_ID="stocktimus"  # Replace with your project ID
REGION="us-east1"     # Replace with your preferred region
SERVICE_NAME="stocktimus-frontend"

# Build and push the container
echo "Building and pushing frontend container..."
gcloud builds submit ../frontend \
    --tag gcr.io/$PROJECT_ID/$SERVICE_NAME

BACKEND_URL=$(gcloud run services describe stocktimus-backend \
    --platform managed \
    --region $REGION \
    --project $PROJECT_ID \
    --format 'value(status.url)')

# Deploy to Cloud Run
echo "Deploying frontend to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
    --platform managed \
    --region $REGION \
    --project $PROJECT_ID \
    --allow-unauthenticated \
    --set-env-vars "REACT_APP_API_URL=$BACKEND_URL"


SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
    --platform managed \
    --region $REGION \
    --project $PROJECT_ID \
    --format 'value(status.url)')

echo "Frontend deployed sucessfully!"
echo "Service URL: $SERVICE_URL"
