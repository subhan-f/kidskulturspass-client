# Build stage
FROM node:20-alpine as build

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy package files and install dependencies
COPY package.json ./
# Install dependencies and generate pnpm-lock.yaml if it doesn't exist
RUN pnpm install --frozen-lockfile || pnpm install

# Copy the rest of the application code
COPY . .

# Build the application
RUN pnpm run build

# Production stage
FROM nginx:alpine

# Copy the built files from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx configuration for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 8080 (Google Cloud Run default)
EXPOSE 8080

# Change nginx to listen on 8080 instead of 80
RUN sed -i.bak 's/listen\(.*\)80;/listen 8080;/g' /etc/nginx/conf.d/default.conf

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]