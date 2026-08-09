# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies with legacy peer deps as required by Tiptap/React Day Picker conflicts
RUN npm install --legacy-peer-deps

# Copy all source files
COPY . .

# Set API URL to empty so axios uses relative path '/api' which Nginx proxies
ENV REACT_APP_BACKEND_URL=""

# Build the app
RUN npm run build

# Serve stage
FROM nginx:alpine

# Copy built assets from build stage
COPY --from=build /app/build /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
