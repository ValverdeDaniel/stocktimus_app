#!/bin/bash

if [ "$ENVIRONMENT" = "local" ] || [ -z "$ENVIRONMENT" ]; then
    echo "Running in local development mode..."
    
    # For local development, wait for the database container
    echo "Waiting for database connection..."
    until PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c '\q' 2>/dev/null; do
        echo "Database is unavailable - sleeping"
        sleep 1
    done

    echo "Database is ready!"
    
    # Apply migrations
    python manage.py migrate
    
    # Start development server for local environment
    echo "Starting Django development server..."
    exec python manage.py runserver 0.0.0.0:8000

else
    echo "Running in Cloud Run production mode..."
    
    # Start Cloud SQL proxy if DB_CONNECTION_NAME is provided
    if [ ! -z "$DB_CONNECTION_NAME" ]; then
        /cloud_sql_proxy -instances=$DB_CONNECTION_NAME=tcp:5432 &
        echo "Started Cloud SQL Proxy for $DB_CONNECTION_NAME"
        
        # Wait for Cloud SQL Proxy to be ready
        sleep 2
    fi

    # Wait for database to be ready
    echo "Waiting for database connection..."
    if [ ! -z "$DB_CONNECTION_NAME" ]; then
        # For Cloud SQL Proxy, check Unix socket
        until PGPASSWORD=$DB_PASSWORD psql "host=/cloudsql/$DB_CONNECTION_NAME" -U $DB_USER -d $DB_NAME -c '\q' 2>/dev/null; do
            echo "Database is unavailable - sleeping"
            sleep 1
        done
    fi

    echo "Database is ready!"
    # Apply migrations
    python manage.py migrate

    # Start gunicorn server
    # TODO / WARN
    exec gunicorn --bind :$PORT --workers 4 --threads 2 --timeout 0 stocktimus.wsgi:application
fi