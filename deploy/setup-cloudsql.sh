#!/bin/bash

# Exit on error
set -e

# Configuration
PROJECT_ID="stocktimus"  # Replace with your project ID
INSTANCE_NAME="stocktimus-db"
REGION="us-east1"  # Replace with your preferred region
DB_NAME="options_db"
DB_USER="options_user"
DB_VERSION="POSTGRES_15"

# Create Cloud SQL instance
echo "Creating Cloud SQL instance..."
DB_ROOT_PASSWORD="$(openssl rand -base64 24)"
gcloud sql instances create $INSTANCE_NAME \
    --database-version=$DB_VERSION \
    --cpu=2 \
    --memory=4GB \
    --region=$REGION \
    --project=$PROJECT_ID \
    --root-password=$DB_ROOT_PASSWORD \
    --storage-size=20GB \
    --storage-type=SSD \
    --availability-type=zonal \
    --backup-start-time="23:00" \
    --enable-point-in-time-recovery


# Create database
echo "Creating database..."
gcloud sql databases create $DB_NAME \
    --instance=$INSTANCE_NAME \
    --project=$PROJECT_ID

# Create user
echo "Creating database user..."
DB_PASSWORD="$(openssl rand -base64 24)"
gcloud sql users create $DB_USER \
    --instance=$INSTANCE_NAME \
    --password=$DB_PASSWORD \
    --project=$PROJECT_ID


# Output connection information
echo "Database setup complete!"
echo "Connection Information:"
echo "Instance Name: $INSTANCE_NAME"
echo "Database Name: $DB_NAME"
echo "Username: $DB_USER"
echo "Password: $DB_PASSWORD"
echo "Connection string will be: postgresql://$DB_USER:$DB_PASSWORD@127.0.0.1:5432/$DB_NAME"
echo "Remember to use Cloud SQL Proxy for local development!"

# Save credentials to a secure file
echo "Saving credentials to .env.production..."
cat > .env.production << EOL
DB_INSTANCE_NAME=$INSTANCE_NAME
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_CONNECTION_NAME=$PROJECT_ID:$REGION:$INSTANCE_NAME
DB_ROOT_PASSWORD=$DB_ROOT_PASSWORD
EOL

echo "Credentials saved to .env.production"
