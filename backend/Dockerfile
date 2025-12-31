# Use official Node.js image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first (better caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port (Cloud Run defaults to 8080, but app uses 5000. 
# We can override via env var, but good to align)
ENV PORT=5000
EXPOSE 5000

# Start the application
CMD ["node", "index.js"]
