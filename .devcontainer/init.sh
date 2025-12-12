#!/bin/bash

IMAGE=pilos/pilos:dev-develop

# Copy .env.example file
cp .env.example .env

export APP_KEY=base64:$(openssl rand -base64 32)

sed -i "s|APP_URL=http://localhost|APP_URL=https://${CODESPACE_NAME}-80.app.github.dev|g" .env
sed -i "s|APP_KEY=|APP_KEY=${APP_KEY}|g" .env
sed -i 's|APP_ENV=production|APP_ENV=local|g' .env
sed -i 's|APP_DEBUG=false|APP_DEBUG=true|g' .env
sed -i 's|CONTAINER_DEV_IMAGE=pilos/pilos:local-dev|CONTAINER_DEV_IMAGE=pilos/pilos:dev-develop|g' .env