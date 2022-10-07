#!/usr/bin/env bash

if [ "$APP_ENV" == "production" ]; then
    echo "Start schedule runner"
    while [ true ]
    do
        php /var/www/html/artisan schedule:run --verbose --no-interaction >> /dev/null 2>&1 &
        sleep 60
    done
else
    echo "Schedule runner not starting in dev environment"
fi


