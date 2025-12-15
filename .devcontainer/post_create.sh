#!/bin/bash

composer install
npm install

sed -i "s|APP_URL=http://localhost|APP_URL=https://${CODESPACE_NAME}-80.app.github.dev|g" .env

php artisan key:generate