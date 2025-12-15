#!/bin/bash

# Copy .env.example file
cp .env.example .env

sed -i 's|APP_ENV=.*|APP_ENV=local|g' .env
sed -i 's|APP_DEBUG=.*|APP_DEBUG=true|g' .env
sed -i 's|CONTAINER_DEV_IMAGE=.*|CONTAINER_DEV_IMAGE=pilos/pilos:dev-develop|g' .env

sed -i "s|#WWWGROUP=.*|WWWGROUP=1000|g" .env
sed -i "s|#WWWUSER=.*|WWWUSER=1000|g" .env