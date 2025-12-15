#!/bin/bash

# Copy .env.example file
cp .env.example .env

sed -i 's|APP_ENV=production|APP_ENV=local|g' .env
sed -i 's|APP_DEBUG=false|APP_DEBUG=true|g' .env
sed -i 's|CONTAINER_DEV_IMAGE=pilos/pilos:local-dev|CONTAINER_DEV_IMAGE=pilos/pilos:dev-develop|g' .env