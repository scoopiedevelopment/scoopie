FROM nginx:latest

# Install OpenSSL for SSL certificate generation
RUN apt-get update && apt-get install -y openssl

# Copy the Nginx configuration and SSL generation script
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
COPY ./generate_ssl.sh /usr/local/bin/generate_ssl.sh

# Make the script executable
RUN chmod +x /usr/local/bin/generate_ssl.sh


# Entry point to run SSL generation script and start nginx
ENTRYPOINT ["/bin/sh", "-c", "/usr/local/bin/generate_ssl.sh && exec nginx -g 'daemon off;'"]
