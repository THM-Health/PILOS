#!/bin/bash

composer install
npm install
npm run build

sed -i "s|APP_URL=.*|APP_URL=https://${CODESPACE_NAME}-80.app.github.dev|g" .env
sed -i "s|#VITE_HOST=.*|VITE_HOST=${CODESPACE_NAME}-1073.app.github.dev|g" .env
sed -i "s|#VITE_PORT=.*|VITE_PORT=1073|g" .env
sed -i "s|#VITE_HMR_PORT=.*|VITE_HMR_PORT=443|g" .env

php artisan key:generate