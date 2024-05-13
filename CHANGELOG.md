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
- Room type restrictions (max. participants, max. duration, require access code, allow record attendance) ([#883])
- Limit results in user search ([#883])
- Allow changing the default admin role ([#883])
- Option to drain a server ([#911])
- Show server connection status in server list ([#911])
- End detached meetings after server failure ([#911])
- Config options for server health `BBB_SERVER_ONLINE_THRESHOLD` and `BBB_SERVER_OFFLINE_THRESHOLD` ([#911])
- Config option for server load calculation `BBB_LOAD_MIN_USER_COUNT` and `BBB_LOAD_MIN_USER_INTERVAL` ([#956])
- Plugin to customize the server load calculation ([#956])
- Save selected room tab in url to preserve selection on reload ([#977])
- Default settings in the room type for the room settings and option to enforce these settings in the room type ([#75], [#695], [#1059])
- Room type description ([#75], [#695], [#1059])
- Sorting the room history list ([#1004])
- Search and filter options to list of room members ([#1005])
- Search and filter options to list of room files ([#1006])
- Search and filter options to list of personalized room links ([#1007])
- Recording management ([#31], [#896]) 

### Changed
- Renamed env option OWN_ROOMS_PAGINATION_PAGE_SIZE to ROOM_PAGINATION_PAGE_SIZE (OWN_ROOMS_PAGINATION_PAGE_SIZE deprecated) ([#373])
- Refactor user interface for room search and home page ([#372], [#373])
- Refactor user interface room details ([#681], [#724])
- **Breaking:** Split container into separate containers for the application, cronjobs and queue workers ([#617])
- PHP 8.3 docker base image using alpine ([#704], [#735], [#792])
- Renamed artisan command `users:create:admin` to `users:create:superuser` ([#883])
- Refactored frontend from Vue2 to Vue3, replacing BootstrapVue with PrimeVue ([#883])
- Upgrade to Laravel 11 ([#927])
- Refactor server health, making it more robust against temporary connection issues ([#911])
- Calculation of server load uses the participants amount, during starting phase using a configurable min. amount ([#956])
- Layout of room features tab view ([#967])
- **Breaking:** Time periods for room token expiration ([#968])
- Layout of the room history list ([#1004])
- Layout of the room members list ([#1005])
- Layout of the room files list ([#1006])
- Layout of the personalized room links list ([#1007])

### Fixed
- Issue frontend recompiled on every restart due to a hashing issue ([#792])

### Removed
- Documentation for running PILOS without docker ([#617])
- Max. participants and max. duration from room settings ([#883])
- Global attendance logging setting ([#905])
- Environment variables for room history chart colors, room type colors and banner colors; replaced by using the theme colors ([#1071])

## [v3.0.3] - 2024-05-02
### Fixed
- Error starting meeting with files on a scalelite server ([#1045])

### Changed
- Bump Dependencies

## [v3.0.2] - 2024-03-28
### Changed
- Bump Dependencies

## [v3.0.1] - 2024-01-09
### Fixed
- Docker compose volume mapping framework folder

## [v3.0.0] - 2023-12-19
### Changed
- Migration from Vue 2 due to EOL to Vue 3 with @vue/compat ([#743])
- Disable CI frontend tests (incompatible with Vue 3) ([#743])

## Older versions
You can find the changelog for older versions there [here](https://github.com/THM-Health/PILOS/blob/2.x/CHANGELOG.md)

[#31]: https://github.com/THM-Health/PILOS/issues/31
[#75]: https://github.com/THM-Health/PILOS/issues/75
[#372]: https://github.com/THM-Health/PILOS/issues/372
[#373]: https://github.com/THM-Health/PILOS/pull/373
[#532]: https://github.com/THM-Health/PILOS/issues/532
[#617]: https://github.com/THM-Health/PILOS/pull/617
[#649]: https://github.com/THM-Health/PILOS/issues/649
[#650]: https://github.com/THM-Health/PILOS/pull/650
[#681]: https://github.com/THM-Health/PILOS/pull/681
[#686]: https://github.com/THM-Health/PILOS/pull/686
[#695]: https://github.com/THM-Health/PILOS/issues/695
[#704]: https://github.com/THM-Health/PILOS/issues/704
[#724]: https://github.com/THM-Health/PILOS/pull/724
[#735]: https://github.com/THM-Health/PILOS/pull/735
[#743]: https://github.com/THM-Health/PILOS/pull/743
[#792]: https://github.com/THM-Health/PILOS/pull/792
[#883]: https://github.com/THM-Health/PILOS/pull/883
[#896]: https://github.com/THM-Health/PILOS/pull/896
[#905]: https://github.com/THM-Health/PILOS/pull/905
[#911]: https://github.com/THM-Health/PILOS/pull/911
[#927]: https://github.com/THM-Health/PILOS/pull/927
[#956]: https://github.com/THM-Health/PILOS/pull/956
[#967]: https://github.com/THM-Health/PILOS/pull/967
[#968]: https://github.com/THM-Health/PILOS/pull/968
[#977]: https://github.com/THM-Health/PILOS/pull/977
[#1004]: https://github.com/THM-Health/PILOS/pull/1004
[#1005]: https://github.com/THM-Health/PILOS/pull/1005
[#1006]: https://github.com/THM-Health/PILOS/pull/1006
[#1007]: https://github.com/THM-Health/PILOS/pull/1007
[#1045]: https://github.com/THM-Health/PILOS/issues/1045
[#1059]: https://github.com/THM-Health/PILOS/pull/1059
[#1071]: https://github.com/THM-Health/PILOS/issues/1071

[unreleased]: https://github.com/THM-Health/PILOS/compare/v3.0.3...develop
[v3.0.0]: https://github.com/THM-Health/PILOS/releases/tag/v3.0.0
[v3.0.1]: https://github.com/THM-Health/PILOS/releases/tag/v3.0.1
[v3.0.2]: https://github.com/THM-Health/PILOS/releases/tag/v3.0.2
[v3.0.3]: https://github.com/THM-Health/PILOS/releases/tag/v3.0.3
