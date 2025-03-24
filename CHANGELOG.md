# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Bump base PHP image to 8.4 ([#1937])

### Fixed

- Logo url in emails for logos with absolute path ([#1900])
- Logo height and width in emails ([#1900])
- Download files with special characters in the filename ([#1960])
- Close join/start dialog before joining the BBB meeting ([#1940])

## [v4.3.1] - 2025-02-17

### Fixed

- Greenlight compatibility default_room route ([5c9059b](https://github.com/THM-Health/PILOS/commit/5c9059b54a3707d160f200a0f896679afcbf66d6))
- Recording documentation ([d6962c4](https://github.com/THM-Health/PILOS/commit/d6962c41130664d75ba8797544442f2f087f84aa), [603fd3d](https://github.com/THM-Health/PILOS/commit/603fd3dca29bc4dd743bae2eafa0ca12c113f509))

## [v4.3.0] - 2025-02-03

### Added

- Missing loading retry button on room types overview page ([#1588])
- Reload button for replacement room type in delete dialog on room types overview page ([#1588])
- Permission restrictions to prevent non-superusers from editing and deleting superusers ([#1651])
- Permission restrictions to prevent non-superusers from assigning the superuser role ([#1651])
- Environment variable for configuring restricted permissions that cannot be assigned to non-superuser roles ([#1651])
- Display raw permission names in the admin interface ([#1651])
- Visual tests with [Happo.io](https://happo.io) ([#1600])
- Artisan command for provisioning via JSON file ([#1636], [#1678])
- Frontend tests for Footer ([#1150], [#1844])
- Frontend tests for Banner ([#1150], [#1844])
- Frontend tests for Forgot Password, Password Reset, Verify Email pages ([#1150], [#1844])
- Frontend tests for Admin Index page ([#1150], [#1844])
- Frontend tests for Admin Settings page ([#1150], [#1844])
- Frontend tests for Admin Users page ([#1150], [#1844])
- Frontend tests for Admin Roles page ([#1150], [#1844])
- Frontend tests for Admin Room Types page ([#1150], [#1844])
- Frontend tests for Admin Servers page ([#1150], [#1844])
- Frontend tests for Admin Server Pools page ([#1150], [#1844])
- Frontend tests for Meetings Index page ([#1150], [#1844])

### Changed

- Real-time input validation on create superuser command ([#1651])
- Error handling in room statistics ([#1535], [#1600])
- Error handling in room attendance ([#1535], [#1600])
- Close multiselect dropdowns on selection ([#1588])
- Permissions loading behaviour on view/edit page of roles ([#1588])
- Improve frontend tests for login page ([#1794])
- Access code input type on room settings section to hide browser arrow buttons ([#1827], [#1829])
- Improve current Frontend tests ([#1150], [#1844])
- Bumped BBB Recording Player to 5.2.1 ([#1855])

### Fixed

- Search not disabled during loading on the overview pages for roles, room types, servers and server pools ([#1675], [#1588])
- Overlays not shown after loading error on view/edit pages of servers and server pools ([#1677], [#1588])
- Dialog buttons not disabled correctly during actions on the overview/view/edit pages for roles, room types, servers and server pools ([#1711], [#1588])
- Dialogs being closable during loading on the overview/view/edit pages for roles, room types, servers and server pools ([#1588])
- Form validation error messages on view/edit pages room types, server pools and application settings ([#1588])
- Error handling on the overview page of users ([#1588])
- Stale error handling on the view/edit page of sever pools ([#1588])
- 404 error handling on the room types delete dialog ([#1588])
- Set empty BBB logo image url ([#1751], [#1588])
- 401 error handling on view/edit/create page of users ([#1588])
- Overlay reload buttons on view/edit/create page of roles, room types, servers and server pools ([#1588])
- Wrong error message shown for 422 errors when verifying email ([#1744], [#1758])
- Broken banner link style 'warning' ([#1759], [#1760])
- Inconsistent select/multiselect loading states ([#1772])
- Input fields not disabled correctly on login page ([#1791], [#1794])
- Style of 'clear' button of the room replacement selector in the 'Delete room type' dialog ([#1784], [#1787])
- Inconsistent result ordering in tables on equal primary sorting criteria ([#1601], [#1795])
- Missing form validation feedback for password fields on login page ([#1801])
- Missing form validation feedback on forgot password page ([#1802])
- Room limit radio on edit roles page not reset on stale error ([#1824], [#1825])

## [v4.2.0] - 2025-01-06

### Added

- Configurable hook script for recording synchronization ([#1484], [#1604])
- Rate limiting for room access code authentication ([#669], [#1617])
- Logging for room authentication ([#669], [#1617])
- Command to test email configuration ([#530], [#1618])

### Changed

- The recording import task is now prevented from running until the previous run has finished ([#1484], [#1604])
- Adjust frontend tests to better check the resetting of form errors ([#1679], [#1702])
- Error handling in create room dialog ([#1704])

### Fixed

- Reload room type list on form validation error in new room dialog ([#1523], [#1616])
- Room overview buttons not disabled during loading ([#1595])
- Form errors not always cleared correctly ([#1679], [#1702])
- Unnecessary loading of server pools in the room types read-only view ([#1721], [#1724])
- Unnecessary loading of server in the server pools read-only view ([#1721], [#1724])
- Missing permissions inheritance for user index view ([#1724])
- Wrong permission check when showing create new server pool button ([#1724])
- Styling issue in the role selection dropdown on the user index view ([#1724])
- Broken permission checks when loading the user view/edit page in the admin UI ([#1724])
- xdebug always enabled ([#1727])

### Removed

- Unnecessary permission inheritance for the roomTypes.view and serverPools.view permissions ([#1721], [#1724])

## [v4.1.2] - 2024-11-22

### Added

- Logging for server health changes ([#1608])
- Logging for detached meeting handling ([#1608])
- Logging for meeting not running on BBB server ([#1608])

### Fixed

- Meeting retention cleanup not working with server retention set to unlimited ([878ce6b](https://github.com/THM-Health/PILOS/commit/878ce6b3a3aa596fb6cf228150ffe047a1c94641))
- Meeting marked as ended prematurely during starting phase of a new meeting ([#1607], [#1608])

## [v4.1.1] - 2024-11-20

### Added

- Frontend tests for Room Recordings Tab ([#1150], [#1549])
- Frontend tests for Room Browser Notifications ([#1150], [#1549])
- Frontend tests for Room History Tab ([#1150], [#1549])
- Frontend tests for Room Personalized Links / Room Tokens Tab ([#1150], [#1549])

### Changed

- Improve current frontend tests ([#1150], [#1549])
- OpenSans as application font ([#1558], [#1569])

### Fixed

- Responsive chart sizing ([#1536], [#1537])
- Wrong setting values shown for expert settings in room type change confirmation modal when expert mode is disabled ([#1495])
- Wrong icon and tooltip for participant count ([68c72ce](https://github.com/THM-Health/PILOS/commit/68c72ce573fe9ea9dbabca82792977faa587daf6))
- Missing info toast after browser notification has been granted on request ([0b92d86](https://github.com/THM-Health/PILOS/commit/0b92d86f3d6a3138dcd19ddac57b5e43b592014c))
- Wrong file size computation in admin UI ([8b1e5c6](https://github.com/THM-Health/PILOS/commit/8b1e5c68a40de3455d12df2c57dd14aead03fa0c))
- Line-break in App Banner and room terms of use ([345de45](https://github.com/THM-Health/PILOS/commit/345de458ed4a6cd87b1adfe13c8392cf02500d6f))
- Background color of dropdown button options in dark mode for the room description editor ([#1493], [#1565])
- Responsive style of dropdown button for the room description editor ([#1565])
- Responsive layout of toolbar for the room description editor ([#1565])
- Missing error handling for 404 errors for personalized links actions ([#1559], [#1561])
- Error and loading state of the RoomTypeChangeButton dialog ([#1548])

## [v4.1.0] - 2024-10-17

### Added

- Admin option to disable welcome page ([#1420], [#1441])
- Admin option to customize terms of use for file download or disable it ([#1435], [#1440])
- Frontend tests for Login, Logout, Locales ([#1150], [#1483])
- Frontend tests for Room Index page ([#1150], [#1483])
- Frontend tests for Room page ([#1150], [#1483])
- Frontend tests for Room Members Tab ([#1150], [#722],[#1483])
- Frontend tests for Room Settings Tab ([#1150], [#721], [#1483])
- Frontend tests for Room Files Tab ([#1150], [#1483])
- Frontend tests for Room Description Tab ([#1150], [#1483])
- Frontend tests for User Profile ([#1150], [#1483])

### Changed

- Improve autocomplete in user profile ([#1452])
- Disable file upload UI elements during upload ([#1449])
- Improve accessibility for icon only buttons ([#1489])

### Fixed

- Loading overlay not covering whole page during scrolling ([#1442])
- Inconsistent error handling in dialogs ([#1444])
- Missing "user not found" error message after the "too many results" error in room transfer ([#1477])
- Wrong and missing ids and labels in forms ([#1452])
- Lazy load profile tabs to prevent form id issues ([#1452])
- Missing nocanon apache reverse proxy keyword in docs ([e4830ba](https://github.com/THM-Health/PILOS/commit/e4830ba5ca5ea9dc3f98f7fc6e7cf4e42d1977f4))
- Text truncate in data tables ([#1489])
- Accessibility issues with wrong html header element order ([#1489])

## [v4.0.0] - 2024-09-26

### Added

- Short description for rooms ([#373])
- Room favorites ([#373])
- Show current room name in the page title ([#649], [#650])
- Show amount of users in a room ([#681])
- Env option PHP_FPM_PM_MAX_CHILDREN, NGINX_WORKER_PROCESSES, NGINX_WORKER_CONNECTIONS and NGINX_WORKER_RLIMIT_NOFILE to customize nginx and php-fpm ([#792])
- **Breaking:** Redis docker service as default caching and queuing driver ([#617])
- Laravel Pulse for system monitoring ([#617])
- Laravel Horizon for queue management ([#617])
- PILOS CLI for common tasks ([#617])
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
- Config options for server health `BBB_SERVER_ONLINE_THRESHOLD` and `BBB_SERVER_OFFLINE_THRESHOLD` ([#911], [#1076])
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
- Content-Security-Policy ([#315],[#1090])
- Custom create parameters in room type settings ([#574])
- Setting to change the lifetime of toast messages ([#1102])
- User search can find user by email ([#1120])
- Cypress system tests ([#1166])
- Dark mode ([#1204])
- Theming options in the UI ([#1204])

### Changed

- Refactor user interface for room search and home page ([#372], [#373])
- Refactor user interface room details ([#681], [#724])
- **Breaking:** Split container into separate containers for the application, cronjobs and queue workers ([#617])
- PHP 8.3 docker base image using alpine ([#704], [#735], [#792])
- Renamed artisan command `users:create:admin` to `users:create:superuser` ([#883])
- Refactored frontend from Vue2 to Vue3, replacing BootstrapVue with PrimeVue v4 ([#883], [#1204])
- Upgrade to Laravel 11 ([#927])
- Refactor server health, making it more robust against temporary connection issues ([#911])
- Calculation of server load uses the participants amount, during starting phase using a configurable min. amount ([#956])
- Layout of room features tab view ([#967])
- **Breaking:** Time periods for room token expiration ([#968])
- Layout of the room history list ([#1004])
- Layout of the room members list ([#1005])
- Layout of the room files list ([#1006])
- Layout of the personalized room links list ([#1007])
- Bumped docker compose mariadb version to 11 ([#1080])
- **Breaking:** Global application settings storage ([#985], [#989])
- **Breaking:** The learning dashboard is no longer disabled and the meeting layout is no longer always "custom". These settings can be set with create-api-parameters in the room type settings. ([#574])
- Cypress tests for basic frontend features ([#760], [#1126])
- Environment variable for BigBlueButton Test-Server in integration tests ([#1159])
- Pagination size for rooms ([#1204])
- Landing page layout ([#1216], [#1332])

### Fixed

- Various postgres incompatibility issues ([#1078], [#1079])
- Ldap debug logging ([#1252])

### Removed

- Documentation for running PILOS without docker ([#617])
- Max. participants and max. duration from room settings ([#883])
- Global attendance logging setting ([#905])
- Theming options in .env and sass files ([#1204])

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
[#315]: https://github.com/THM-Health/PILOS/issues/315
[#372]: https://github.com/THM-Health/PILOS/issues/372
[#373]: https://github.com/THM-Health/PILOS/pull/373
[#530]: https://github.com/THM-Health/PILOS/issues/530
[#532]: https://github.com/THM-Health/PILOS/issues/532
[#574]: https://github.com/THM-Health/PILOS/pull/574
[#617]: https://github.com/THM-Health/PILOS/pull/617
[#649]: https://github.com/THM-Health/PILOS/issues/649
[#650]: https://github.com/THM-Health/PILOS/pull/650
[#669]: https://github.com/THM-Health/PILOS/issues/669
[#681]: https://github.com/THM-Health/PILOS/pull/681
[#686]: https://github.com/THM-Health/PILOS/pull/686
[#695]: https://github.com/THM-Health/PILOS/issues/695
[#704]: https://github.com/THM-Health/PILOS/issues/704
[#721]: https://github.com/THM-Health/PILOS/issues/721
[#722]: https://github.com/THM-Health/PILOS/issues/722
[#724]: https://github.com/THM-Health/PILOS/pull/724
[#735]: https://github.com/THM-Health/PILOS/pull/735
[#743]: https://github.com/THM-Health/PILOS/pull/743
[#760]: https://github.com/THM-Health/PILOS/issues/760
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
[#985]: https://github.com/THM-Health/PILOS/issues/985
[#989]: https://github.com/THM-Health/PILOS/pull/989
[#1004]: https://github.com/THM-Health/PILOS/pull/1004
[#1005]: https://github.com/THM-Health/PILOS/pull/1005
[#1006]: https://github.com/THM-Health/PILOS/pull/1006
[#1007]: https://github.com/THM-Health/PILOS/pull/1007
[#1045]: https://github.com/THM-Health/PILOS/issues/1045
[#1059]: https://github.com/THM-Health/PILOS/pull/1059
[#1071]: https://github.com/THM-Health/PILOS/issues/1071
[#1076]: https://github.com/THM-Health/PILOS/issues/1076
[#1078]: https://github.com/THM-Health/PILOS/issues/1078
[#1079]: https://github.com/THM-Health/PILOS/pull/1079
[#1080]: https://github.com/THM-Health/PILOS/pull/1080
[#1090]: https://github.com/THM-Health/PILOS/pull/1090
[#1102]: https://github.com/THM-Health/PILOS/pull/1102
[#1120]: https://github.com/THM-Health/PILOS/pull/1120
[#1126]: https://github.com/THM-Health/PILOS/pull/1126
[#1150]: https://github.com/THM-Health/PILOS/issues/1150
[#1159]: https://github.com/THM-Health/PILOS/pull/1159
[#1166]: https://github.com/THM-Health/PILOS/pull/1166
[#1204]: https://github.com/THM-Health/PILOS/pull/1204
[#1216]: https://github.com/THM-Health/PILOS/issues/1216
[#1332]: https://github.com/THM-Health/PILOS/pull/1332
[#1420]: https://github.com/THM-Health/PILOS/issues/1420
[#1435]: https://github.com/THM-Health/PILOS/issues/1435
[#1440]: https://github.com/THM-Health/PILOS/pull/1440
[#1441]: https://github.com/THM-Health/PILOS/pull/1441
[#1442]: https://github.com/THM-Health/PILOS/pull/1442
[#1444]: https://github.com/THM-Health/PILOS/pull/1444
[#1449]: https://github.com/THM-Health/PILOS/pull/1449
[#1452]: https://github.com/THM-Health/PILOS/pull/1452
[#1477]: https://github.com/THM-Health/PILOS/pull/1477
[#1483]: https://github.com/THM-Health/PILOS/pull/1483
[#1484]: https://github.com/THM-Health/PILOS/issues/1484
[#1489]: https://github.com/THM-Health/PILOS/pull/1489
[#1493]: https://github.com/THM-Health/PILOS/issues/1493
[#1495]: https://github.com/THM-Health/PILOS/pull/1495
[#1523]: https://github.com/THM-Health/PILOS/issues/1523
[#1535]: https://github.com/THM-Health/PILOS/issues/1535
[#1536]: https://github.com/THM-Health/PILOS/issues/1536
[#1537]: https://github.com/THM-Health/PILOS/pull/1537
[#1548]: https://github.com/THM-Health/PILOS/pull/1548
[#1549]: https://github.com/THM-Health/PILOS/pull/1549
[#1558]: https://github.com/THM-Health/PILOS/issues/1558
[#1559]: https://github.com/THM-Health/PILOS/issues/1559
[#1561]: https://github.com/THM-Health/PILOS/pull/1561
[#1565]: https://github.com/THM-Health/PILOS/pull/1565
[#1588]: https://github.com/THM-Health/PILOS/pull/1588
[#1569]: https://github.com/THM-Health/PILOS/pull/1569
[#1595]: https://github.com/THM-Health/PILOS/pull/1595
[#1600]: https://github.com/THM-Health/PILOS/pull/1600
[#1601]: https://github.com/THM-Health/PILOS/issues/1601
[#1604]: https://github.com/THM-Health/PILOS/pull/1604
[#1607]: https://github.com/THM-Health/PILOS/issues/1607
[#1608]: https://github.com/THM-Health/PILOS/pull/1608
[#1616]: https://github.com/THM-Health/PILOS/pull/1616
[#1617]: https://github.com/THM-Health/PILOS/pull/1617
[#1618]: https://github.com/THM-Health/PILOS/pull/1618
[#1636]: https://github.com/THM-Health/PILOS/issues/1636
[#1651]: https://github.com/THM-Health/PILOS/issues/1651
[#1675]: https://github.com/THM-Health/PILOS/issues/1675
[#1677]: https://github.com/THM-Health/PILOS/issues/1677
[#1678]: https://github.com/THM-Health/PILOS/pull/1678
[#1679]: https://github.com/THM-Health/PILOS/issues/1679
[#1702]: https://github.com/THM-Health/PILOS/pull/1702
[#1704]: https://github.com/THM-Health/PILOS/pull/1704
[#1711]: https://github.com/THM-Health/PILOS/issues/1711
[#1721]: https://github.com/THM-Health/PILOS/issues/1721
[#1724]: https://github.com/THM-Health/PILOS/pull/1724
[#1744]: https://github.com/THM-Health/PILOS/issues/1744
[#1751]: https://github.com/THM-Health/PILOS/issues/1751
[#1758]: https://github.com/THM-Health/PILOS/pull/1758
[#1759]: https://github.com/THM-Health/PILOS/issues/1759
[#1760]: https://github.com/THM-Health/PILOS/pull/1760
[#1772]: https://github.com/THM-Health/PILOS/pull/1772
[#1784]: https://github.com/THM-Health/PILOS/issues/1784
[#1787]: https://github.com/THM-Health/PILOS/pull/1787
[#1791]: https://github.com/THM-Health/PILOS/issues/1791
[#1794]: https://github.com/THM-Health/PILOS/pull/1794
[#1795]: https://github.com/THM-Health/PILOS/pull/1795
[#1801]: https://github.com/THM-Health/PILOS/pull/1801
[#1802]: https://github.com/THM-Health/PILOS/pull/1802
[#1824]: https://github.com/THM-Health/PILOS/issues/1824
[#1825]: https://github.com/THM-Health/PILOS/pull/1825
[#1827]: https://github.com/THM-Health/PILOS/issues/1827
[#1829]: https://github.com/THM-Health/PILOS/pull/1829
[#1844]: https://github.com/THM-Health/PILOS/pull/1844
[#1855]: https://github.com/THM-Health/PILOS/pull/1855
[#1900]: https://github.com/THM-Health/PILOS/pull/1900
[#1937]: https://github.com/THM-Health/PILOS/pull/1937
[#1940]: https://github.com/THM-Health/PILOS/pull/1940
[#1960]: https://github.com/THM-Health/PILOS/pull/1960
[unreleased]: https://github.com/THM-Health/PILOS/compare/v4.3.1...develop
[v3.0.0]: https://github.com/THM-Health/PILOS/releases/tag/v3.0.0
[v3.0.1]: https://github.com/THM-Health/PILOS/releases/tag/v3.0.1
[v3.0.2]: https://github.com/THM-Health/PILOS/releases/tag/v3.0.2
[v3.0.3]: https://github.com/THM-Health/PILOS/releases/tag/v3.0.3
[v4.0.0]: https://github.com/THM-Health/PILOS/releases/tag/v4.0.0
[v4.1.0]: https://github.com/THM-Health/PILOS/releases/tag/v4.1.0
[v4.1.1]: https://github.com/THM-Health/PILOS/releases/tag/v4.1.1
[v4.1.2]: https://github.com/THM-Health/PILOS/releases/tag/v4.1.2
[v4.2.0]: https://github.com/THM-Health/PILOS/releases/tag/v4.2.0
[v4.3.0]: https://github.com/THM-Health/PILOS/releases/tag/v4.3.0
[v4.3.1]: https://github.com/THM-Health/PILOS/releases/tag/v4.3.1
