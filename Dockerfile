# Use Nginx to serve the static files
FROM nginx:alpine

# Copy custom nginx config (optional)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built React files
COPY ./dist /usr/share/nginx/html

# Expose port
EXPOSE 1982

CMD ["nginx", "-g", "daemon off;"]