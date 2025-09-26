#!/bin/sh

if [ "$ENVIRONMENT" = "local" ] || [ -z "$ENVIRONMENT" ]; then
    echo "Starting in development mode..."
    exec npm start
else
    echo "Starting in production mode..."
    # Cloud Run provides $PORT environment variable
    PORT="${PORT:-3000}"
    
    # Replace API URL in built files if provided
    if [ ! -z "$REACT_APP_API_URL" ]; then
        echo "Configuring API URL: $REACT_APP_API_URL"
        find /app/build -type f -name "*.js" -exec sed -i "s,REACT_APP_API_URL_PLACEHOLDER,$REACT_APP_API_URL,g" {} +
    fi
    
    # Configure nginx to listen on the correct port
    sed -i "s/listen 3000/listen $PORT/g" /etc/nginx/http.d/default.conf
    
    # Start nginx
    exec nginx -g 'daemon off;'
fi
