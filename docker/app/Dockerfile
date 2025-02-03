FROM php:8.3-fpm-alpine

LABEL maintainer="Samuel Weirich"
LABEL description="Development and production container for PILOS, compatible with laravel sail; heavily inspired by offical image"

ARG WWWGROUP=82
ARG WWWUSER=82
ARG PLAYBACK_PLAYER_VERSION=5.2.1
ARG VITE_COVERAGE="false"

WORKDIR /var/www/html

ENV TZ=UTC \
    PHP_FPM_PM_MAX_CHILDREN=100 \
    NGINX_WORKER_PROCESSES=auto \
    NGINX_WORKER_CONNECTIONS=auto \
    NGINX_WORKER_RLIMIT_NOFILE=auto \
    PILOS_SPOOL_GID=2000

RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Add system dependencies
RUN apk --no-cache add \
    shadow \
    bash su-exec gettext libintl git \
    pv \
    supervisor \
    nginx \
    mysql-client postgresql-client \
    nodejs npm

# Add PHP extensions
ADD https://github.com/mlocati/docker-php-extension-installer/releases/latest/download/install-php-extensions /usr/local/bin/
RUN chmod +x /usr/local/bin/install-php-extensions \
    && install-php-extensions redis pcntl bcmath pdo_mysql pdo_pgsql pgsql ldap zip opcache soap xdebug gd @composer \
    && rm /usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini

# Change www-data user and group id
RUN apk add --no-cache --virtual .mod-deps shadow \
  && usermod -d /var/www www-data \
  && usermod -u $WWWUSER www-data \
  && groupmod -o -g $WWWGROUP www-data \
  && chown www-data:www-data /var/www/ \
  && chown www-data:www-data -R /var/lib/nginx/ \
  && apk del .mod-deps

# Copy entrypoint
COPY ./docker/app/entrypoint /usr/local/bin/entrypoint
RUN chmod +x /usr/local/bin/entrypoint

# Copy pilos-cli
COPY ./docker/app/pilos-cli /usr/local/bin/pilos-cli
RUN chmod +x /usr/local/bin/pilos-cli

# Copy cron config
COPY ./docker/app/cron/scheduler /etc/cron.d/scheduler
RUN chmod 644 /etc/cron.d/scheduler
RUN crontab /etc/cron.d/scheduler

# Copy bbb-player script
COPY ./docker/app/playback-player /usr/local/etc/playback-player
RUN chmod +x /usr/local/etc/playback-player/build.sh
RUN chown www-data:www-data /usr/local/etc/playback-player/

# Install BBB Recording Player
RUN mkdir -p /var/www/html/public/playback-player
RUN chown -R www-data:www-data /var/www/html
RUN pilos-cli playback-player:build $PLAYBACK_PLAYER_VERSION

# Copy supervisor config
RUN mkdir -p /var/log/supervisor
COPY ./docker/app/supervisord/ /etc/supervisor/conf.d

# Enable nginx site
COPY ./docker/app/nginx/sites-enabled /etc/nginx/sites-enabled
COPY ./docker/app/nginx/templates /etc/nginx/templates
COPY ./docker/app/nginx/snippets-available /etc/nginx/snippets-available
RUN ls -la /etc/nginx/
RUN mkdir -p /etc/nginx/snippets

# Copy php config files
COPY ./docker/app/php/zz-docker.conf /usr/local/etc/php-fpm.d/zz-docker.conf
COPY ./docker/app/php/php.ini /usr/local/etc/php/conf.d/99-app.ini
COPY ./docker/app/php/opcache.ini /usr/local/etc/php/conf.d/opcache.ini
RUN mkdir -p /var/log/php

# Copy ldap config files
COPY ./docker/app/ldap/ /etc/openldap

# Copy application files
COPY --chown=www-data:www-data ./ /var/www/html

# Build frontend
RUN if [ "$VITE_COVERAGE" != "true" ] ; then \
    su-exec www-data npm install --omit=dev && \
    su-exec www-data npm run build; \
  else \
    echo "Build frontend for coverage (instrumented and with sourcemap)" && \
    su-exec www-data npm install && \
    su-exec www-data npm run build -- --config vite.config.coverage.js; \
  fi

# Run and optimize composer for production
RUN su-exec www-data composer install --no-dev
RUN su-exec www-data composer dump-autoload -o

EXPOSE 80
EXPOSE 443

ENTRYPOINT ["entrypoint"]
