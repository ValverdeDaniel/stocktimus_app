#!/bin/bash

# Exit on error
set -e

# Configuration
PROJECT_ID="stocktimus"  # Replace with your project ID
REGION="us-east1"     # Replace with your preferred region
SERVICE_NAME="stocktimus-backend"

# Load environment variables
source .env.production

# Build and push the container
echo "Building and pushing backend container..."
# WARNING: might need to change this to artifactory
gcloud builds submit .. \
    --tag gcr.io/$PROJECT_ID/$SERVICE_NAME

# Deploy to Cloud Run
echo "Deploying backend to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
    --platform managed \
    --region $REGION \
    --project $PROJECT_ID \
    --allow-unauthenticated \
    --set-env-vars "DB_NAME=$DB_NAME" \
    --set-env-vars "DB_USER=$DB_USER" \
    --set-env-vars "DB_PASSWORD=$DB_PASSWORD" \
    --set-env-vars "DB_HOST=/cloudsql/$DB_CONNECTION_NAME" \
    --set-env-vars "DJANGO_DEBUG=False" \
    --set-env-vars "ENVIRONMENT=Production" \
    --add-cloudsql-instances $DB_CONNECTION_NAME

SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
    --platform managed \
    --region $REGION \
    --project $PROJECT_ID \
    --format 'value(status.url)')

echo "Backend deployed successfully !"
echo "Service URL: $SERVICE_URL"