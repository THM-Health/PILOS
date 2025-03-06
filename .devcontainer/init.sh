#!/bin/bash

IMAGE=pilos/pilos:dev-develop

# Copy .env.example file
cp .env.example .env

./sail up -d --no-deps app
./sail composer install
./sail npm install
./sail artisan key:generate
./sail npm run build
./sail bash -c "sed -i 's/APP_ENV=production/APP_ENV=local/g' .env"
./sail bash -c "sed -i 's/APP_DEBUG=false/APP_DEBUG=true/g' .env"
./sail bash -c "sed -i 's/#VITE_SSL=false/VITE_SSL=true/g' .env"

# Create SSL certificate
./sail bash -c "openssl req -new -newkey rsa:4096 -days 365 -nodes -x509 -subj '/CN=pilos.local' -keyout ssl/privkey.pem -out ssl/fullchain.pem"

./sail down
