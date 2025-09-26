# Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Build the application based on environment
ARG ENVIRONMENT=production
ENV ENVIRONMENT=$ENVIRONMENT

# For local development
RUN if [ "$ENVIRONMENT" = "local" ] ; then \
        echo "Preparing for local development" ; \
    else \
        echo "Building for production" && \
        npm run build ; \
    fi

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# For production, use nginx to serve static files
RUN if [ "$ENVIRONMENT" = "production" ] ; then \
        apk add --no-cache nginx && \
        mkdir -p /run/nginx ; \
    fi

# Copy either the development or production files
COPY --from=builder /app /app

# Copy nginx configuration for production
COPY nginx.conf /etc/nginx/http.d/default.conf

# Environment variables
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# Expose port (Cloud Run will override this with $PORT)
EXPOSE 3000

# Start script that handles both environments
COPY start-frontend.sh /app/start-frontend.sh
RUN chmod +x /app/start-frontend.sh

CMD ["/app/start-frontend.sh"]
