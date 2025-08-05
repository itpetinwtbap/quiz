FROM nginx:alpine

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create directories for SSL (optional)
RUN mkdir -p /etc/nginx/ssl

# Create custom error pages
RUN echo '<!DOCTYPE html><html><head><title>404 Not Found</title></head><body><h1>404 Not Found</h1><p>The requested resource was not found.</p></body></html>' > /usr/share/nginx/html/404.html

RUN echo '<!DOCTYPE html><html><head><title>Server Error</title></head><body><h1>Server Error</h1><p>The server encountered an internal error.</p></body></html>' > /usr/share/nginx/html/50x.html

# Set proper permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]