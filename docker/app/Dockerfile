FROM php:8.3-fpm-alpine

LABEL maintainer="Samuel Weirich"
LABEL description="Development and production container for PILOS, compatible with laravel sail; heavily inspired by offical image"

ARG WWWGROUP=82
ARG WWWUSER=82

WORKDIR /var/www/html

ENV TZ=UTC

RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Add system dependencies
RUN apk --no-cache add \
    shadow \
    bash su-exec \
    pv \
    supervisor \
    nginx \
    mysql-client postgresql-client \
    nodejs npm

# Add PHP extensions
ADD https://github.com/mlocati/docker-php-extension-installer/releases/latest/download/install-php-extensions /usr/local/bin/
RUN chmod +x /usr/local/bin/install-php-extensions \
    && install-php-extensions bcmath pdo_mysql pdo_pgsql pgsql ldap zip opcache soap xdebug gd @composer

# Change www-data user and group id
RUN apk add --no-cache --virtual .mod-deps shadow \
  && usermod -d /var/www www-data \
  && chown www-data:www-data /var/www/ \
  && usermod -u $WWWUSER www-data \
  && groupmod -o -g $WWWGROUP www-data \
  && apk del .mod-deps

# Copy start script
COPY ./docker/app/entrypoint /usr/local/bin/entrypoint
RUN chmod +x /usr/local/bin/entrypoint

# Copy scheduler script
COPY ./docker/app/scheduler /usr/local/etc/scheduler
RUN chmod +x /usr/local/etc/scheduler/run.sh

# Copy frontend wrapper script
COPY ./docker/app/frontend /usr/local/etc/frontend
RUN chmod +x /usr/local/etc/frontend/run.sh
RUN chown www-data:www-data /usr/local/etc/frontend/

# Copy supervisor config
RUN mkdir -p /var/log/supervisor
COPY ./docker/app/supervisord/ /etc/supervisor/conf.d

# Enable nginx site
COPY ./docker/app/nginx/sites-enabled /etc/nginx/sites-enabled
COPY ./docker/app/nginx/nginx.conf /etc/nginx/nginx.conf
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

# Copy application files
COPY --chown=www-data:www-data ./ /var/www/html

USER www-data
# Run npm and composer install as www-data user
RUN npm install --production
RUN composer install --no-dev

USER root

EXPOSE 80
EXPOSE 443

ENTRYPOINT ["entrypoint"]
