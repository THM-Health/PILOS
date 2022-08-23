# Install

## .env
docker run --rm pilos/pilos:v2 cat ./.env.example > .env
docker run --rm pilos/pilos:v2 php artisan key:generate --show

## Database
### Credentials
export pass=$(openssl rand -hex 24); sed -i 's/DB_PASSWORD=password/DB_PASSWORD='$pass'/g' .env

### Migrate
docker-compose exec --user www-data app php artisan migrate --seed


## Customization
### Theming
docker compose cp app:/var/www/html/resources/sass/theme/default/. ./resources/sass/theme/custom
docker-compose exec --user www-data app npm run prod

### Start page
mkdir -p resources/custom/js/views
docker compose cp app:/var/www/html/resources/js/views/Home.vue ./resources/custom/js/views/Home.vue
docker-compose exec --user www-data app npm run prod
