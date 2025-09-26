#!/bin/bash

# Exit on error
set -e

# Configuration
PROJECT_ID="stocktimus"  # Replace with your project ID
REGION="us-east1"     # Replace with your preferred region

# Enable required APIs
echo "Enabling required APIs..."
gcloud services enable \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    sqladmin.googleapis.com \
    secretmanager.googleapis.com \
    --project $PROJECT_ID

# Setup Cloud SQL
echo "Setting up Cloud SQL..."
./setup-cloudsql.sh

# Deploy backend
echo "Deploying backend..."
./deploy-backend.sh

# Deploy frontend
echo "Deploying frontend..."
./deploy-frontend.sh
