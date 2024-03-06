# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- Short description for rooms ([#373])
- Room favorites ([#373])
- Show current room name in the page title  ([#649], [#650])
- Show amount of users in a room ([#681])
- Env option PHP_FPM_PM_MAX_CHILDREN, NGINX_WORKER_PROCESSES, NGINX_WORKER_CONNECTIONS and NGINX_WORKER_RLIMIT_NOFILE to customize nginx and php-fpm ([#792])
- **Breaking:** Redis docker service as default caching and queuing driver ([#617])
- Laravel Pulse for system monitoring ([#617])
- Laravel Horizon for queue management ([#617])
- PILOS CLI for common tasks ([#617])
- Option to pre-build frontend assets for quicker startup ([#617])
- Docker container healthcheck ([#617])
- Documentation for scaling PILOS ([#617])
- Transfer room ownership ([#532], [#686])
- Search for roles, server and serverpools ([#883])
- Added room type restrictions (max. participants, max. duration, require access code, allow record attendance) ([#883])
- Limit results in user search ([#883])
- Allow changing the default admin role ([#883])

### Changed
- Renamed env option OWN_ROOMS_PAGINATION_PAGE_SIZE to ROOM_PAGINATION_PAGE_SIZE (OWN_ROOMS_PAGINATION_PAGE_SIZE deprecated) ([#373])
- Refactor user interface for room search and home page ([#372], [#373])
- Refactor user interface room details ([#681], [#724])
- **Breaking:** Split container into separate containers for the application, cronjobs and queue workers ([#617])
- PHP 8.3 docker base image using alpine ([#704], [#735], [#792])
- Renamed artisan command `users:create:admin` to `users:create:superuser` ([#883])
- Refactored frontend from Vue2 to Vue3, replacing BootstrapVue with PrimeVue ([#883])

### Fixed
- Issue frontend recompiled on every restart due to a hashing issue ([#792])

### Removed
- Documentation for running PILOS without docker ([#617])
- Max. participants and max. duration from room settings ([#883])
- Global attendance recording setting ([#905])

## [v3.0.1] - 2024-01-09
### Fixed
- Docker compose volume mapping framework folder

## [v3.0.0] - 2023-12-19
### Changed
- Migration from Vue 2 due to EOL to Vue 3 with @vue/compat ([#743])
- Disable CI frontend tests (incompatible with Vue 3) ([#743])

## Older versions
You can find the changelog for older versions there [here](https://github.com/THM-Health/PILOS/blob/2.x/CHANGELOG.md)


[#372]: https://github.com/THM-Health/PILOS/issues/372
[#373]: https://github.com/THM-Health/PILOS/pull/373
[#532]: https://github.com/THM-Health/PILOS/issues/532
[#617]: https://github.com/THM-Health/PILOS/pull/617
[#649]: https://github.com/THM-Health/PILOS/issues/649
[#650]: https://github.com/THM-Health/PILOS/pull/650
[#681]: https://github.com/THM-Health/PILOS/pull/681
[#686]: https://github.com/THM-Health/PILOS/pull/686
[#704]: https://github.com/THM-Health/PILOS/issues/704
[#724]: https://github.com/THM-Health/PILOS/pull/724
[#735]: https://github.com/THM-Health/PILOS/pull/735
[#743]: https://github.com/THM-Health/PILOS/pull/743
[#792]: https://github.com/THM-Health/PILOS/pull/792
[#883]: https://github.com/THM-Health/PILOS/pull/883
[#905]: https://github.com/THM-Health/PILOS/pull/905

[unreleased]: https://github.com/THM-Health/PILOS/compare/v3.0.1...develop
[v3.0.0]: https://github.com/THM-Health/PILOS/releases/tag/v3.0.0
[v3.0.1]: https://github.com/THM-Health/PILOS/releases/tag/v3.0.1
