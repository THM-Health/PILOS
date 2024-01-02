FROM php:8.3-fpm-alpine

LABEL maintainer="Samuel Weirich"
LABEL description="Development container for PILOS, compatible with laravel sail; heavily inspired by offical image"

ARG WWWGROUP=33
ARG WWWUSER=33

WORKDIR /var/www/html

ENV DEBIAN_FRONTEND noninteractive
ENV TZ=UTC

RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

RUN apk --no-cache add \
    shadow \
    bash su-exec \
    pv \
    supervisor \
    nginx \
    mysql-client postgresql-client postgresql-dev openldap-dev \
    libzip-dev libxml2-dev \
    nodejs npm \
    composer \
    && docker-php-ext-configure pgsql -with-pgsql=/usr/local/pgsql \
    && docker-php-ext-install -j$(nproc) bcmath pdo_mysql pdo_pgsql pgsql ldap zip opcache soap \
    && rm -rf /var/cache/apk/* /tmp/* /var/tmp/*

# Add xdebug
RUN apk add --no-cache --virtual .build-deps $PHPIZE_DEPS linux-headers \
    && pecl install xdebug-3.3.1 \
    && docker-php-ext-enable xdebug \
    && apk del -f .build-deps

RUN usermod -d /var/www www-data
RUN chown www-data:www-data /var/www/


RUN usermod -u $WWWUSER www-data
RUN groupmod -o -g $WWWGROUP www-data

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

# Increase limits
RUN echo 'www-data soft nofile 65535' >> /etc/security/limits.conf
RUN echo 'www-data hard nofile 65535' >> /etc/security/limits.conf

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
RUN npm install
RUN composer install

USER root

EXPOSE 80
EXPOSE 443

ENTRYPOINT ["entrypoint"]
