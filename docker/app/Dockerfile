# -----------------------------------------------------------------------------
# Stage: build PHP extensions (discarded; only .so / .ini are copied forward)
# -----------------------------------------------------------------------------
FROM php:8.5.12-fpm-bookworm AS php-extensions

RUN --mount=type=bind,from=ghcr.io/php/pie:bin,source=/pie,target=/usr/local/bin/pie \
    apt-get update \
    && apt-get install -y --no-install-recommends \
        $PHPIZE_DEPS \
        libfreetype6-dev \
        libicu-dev \
        libjpeg62-turbo-dev \
        libldap2-dev \
        libmagickwand-dev \
        libpng-dev \
        libpq-dev \
        libwebp-dev \
        libxml2-dev \
        libzip-dev \
        unzip \
    && docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp \
    && docker-php-ext-configure ldap --with-libdir=lib/$(uname -m)-linux-gnu \
    && docker-php-ext-install -j$(nproc) pcntl bcmath pdo_mysql pdo_pgsql pgsql ldap zip soap gd exif intl \
    && pie install \
        phpredis/phpredis \
        imagick/imagick \
        xdebug/xdebug \
    && rm -f /usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini

# -----------------------------------------------------------------------------
# Stage: build BBB recording player
# -----------------------------------------------------------------------------
FROM node:24-bookworm-slim AS playback-player

ARG PLAYBACK_PLAYER_VERSION=5.4.8

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl unzip \
    && rm -rf /var/lib/apt/lists/*

COPY ./docker/app/playback-player/build.sh /usr/local/bin/build-playback-player
RUN chmod +x /usr/local/bin/build-playback-player \
    && mkdir -p /var/www/html/public \
    && build-playback-player "$PLAYBACK_PLAYER_VERSION"

# -----------------------------------------------------------------------------
# Stage: final runtime image
# -----------------------------------------------------------------------------
FROM php:8.5.12-fpm-bookworm

LABEL maintainer="Samuel Weirich"
LABEL description="Development and production container for PILOS, compatible with laravel sail; heavily inspired by offical image"

ARG WWWGROUP=82
ARG WWWUSER=82
ARG VITE_COVERAGE="false"

WORKDIR /var/www/html

ENV TZ=UTC \
    PHP_FPM_PM_MAX_CHILDREN=100 \
    NGINX_WORKER_PROCESSES=auto \
    NGINX_WORKER_CONNECTIONS=auto \
    NGINX_WORKER_RLIMIT_NOFILE=auto \
    PILOS_SPOOL_GID=2000

RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Runtime system packages (no build toolchain)
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        bash \
        cron \
        curl \
        default-mysql-client \
        gettext-base \
        git \
        gosu \
        imagemagick \
        libfreetype6 \
        libicu72 \
        libjpeg62-turbo \
        libldap-2.5-0 \
        libmagickwand-6.q16-6 \
        libpng16-16 \
        libpq5 \
        libwebp7 \
        libxml2 \
        libzip4 \
        nginx \
        postgresql-client \
        pv \
        supervisor \
        unzip \
    && rm -rf /var/lib/apt/lists/*

# Built PHP extensions (xdebug.so present but not enabled by default)
COPY --from=php-extensions /usr/local/lib/php/extensions/ /usr/local/lib/php/extensions/
COPY --from=php-extensions /usr/local/etc/php/conf.d/docker-php-ext-*.ini /usr/local/etc/php/conf.d/

# Install Node.js (same Debian release as the PHP image)
COPY --from=node:24-bookworm-slim /usr/local/bin/node /usr/local/bin/node
COPY --from=node:24-bookworm-slim /usr/local/lib/node_modules /usr/local/lib/node_modules
RUN ln -sf /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm \
    && ln -sf /usr/local/lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer

# Change www-data user and group id
RUN usermod -d /var/www www-data \
  && usermod -u $WWWUSER www-data \
  && groupmod -o -g $WWWGROUP www-data \
  && chown www-data:www-data /var/www/ \
  && chown -R www-data:www-data /var/lib/nginx/

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

# Copy bbb-player script (for optional runtime rebuilds via pilos-cli)
COPY ./docker/app/playback-player /usr/local/etc/playback-player
RUN chmod +x /usr/local/etc/playback-player/build.sh \
    && chown www-data:www-data /usr/local/etc/playback-player/

# Copy supervisor config
RUN mkdir -p /var/log/supervisor
COPY ./docker/app/supervisord/ /etc/supervisor/conf.d

# Enable nginx site
COPY ./docker/app/nginx/sites-enabled /etc/nginx/sites-enabled
COPY ./docker/app/nginx/templates /etc/nginx/templates
COPY ./docker/app/nginx/snippets /etc/nginx/snippets
COPY ./docker/app/nginx/snippets-available /etc/nginx/snippets-available
RUN ls -la /etc/nginx/
RUN mkdir -p /etc/nginx/snippets

# Copy php config files
COPY ./docker/app/php/zz-docker.conf /usr/local/etc/php-fpm.d/zz-docker.conf
COPY ./docker/app/php/php.ini /usr/local/etc/php/conf.d/99-app.ini
COPY ./docker/app/php/opcache.ini /usr/local/etc/php/conf.d/opcache.ini
RUN mkdir -p /var/log/php

# Copy ldap config files
COPY ./docker/app/ldap/ /etc/ldap

COPY --from=playback-player --chown=www-data:www-data /var/www/html/public/playback-player /var/www/html/public/playback-player

# Copy application files
COPY --chown=www-data:www-data ./ /var/www/html

# Add folder to git safe.directory
RUN gosu www-data git config --global --add safe.directory /var/www/html

# Build frontend
RUN if [ "$VITE_COVERAGE" != "true" ] ; then \
    gosu www-data npm install --omit=dev && \
    gosu www-data npm run build; \
  else \
    echo "Build frontend for coverage (instrumented and with sourcemap)" && \
    gosu www-data npm install && \
    gosu www-data npm run build -- --config vite.config.coverage.js; \
  fi

# Run and optimize composer for production
RUN gosu www-data composer install --no-dev
RUN gosu www-data composer dump-autoload -o

EXPOSE 80
EXPOSE 443

ENTRYPOINT ["entrypoint"]
