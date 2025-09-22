# Base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Update the proxy configuration for Docker
ENV REACT_APP_API_URL=http://backend:8000

# Expose port 3000
EXPOSE 3000

# Start the application
CMD ["npm", "start"]