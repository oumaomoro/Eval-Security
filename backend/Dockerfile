FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies first for layer caching
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application source
COPY . .

# Expose API port
EXPOSE 3001

# Start the application
CMD ["node", "server.js"]
