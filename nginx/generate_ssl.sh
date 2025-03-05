#!/bin/bash

# Define paths for certificates
CERT_DIR="/etc/nginx/certificates"
PRIVKEY_PATH="${CERT_DIR}/privkey.pem"
FULLCHAIN_PATH="${CERT_DIR}/fullchain.pem"

# Check if SSL certificates already exist
if [ ! -f "$PRIVKEY_PATH" ] || [ ! -f "$FULLCHAIN_PATH" ]; then
  echo "SSL certificates not found, generating new ones..."

  # Generate self-signed SSL certificates (adjust settings as needed)
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "$PRIVKEY_PATH" \
    -out "$FULLCHAIN_PATH" \
    -subj "/CN=test.localhost"

  echo "SSL certificates generated successfully!"
else
  echo "SSL certificates already exist, skipping generation."
fi
