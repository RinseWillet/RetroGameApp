# ---- Build stage ----
FROM node:22-alpine AS build

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build with arcade base path for NAS deployment
COPY . .
RUN VITE_BASE_PATH=/arcade/ npm run build

# ---- Runtime stage ----
FROM nginx:alpine

# Custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Static files from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Nginx listens on 80; proxied via webgis-edge network from main nginx
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
