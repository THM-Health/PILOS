# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
## [v2.4.3] - 2024-03-28
### Changed
- Bump Dependencies

## [v2.4.2] - 2024-01-09
### Fixed
- Docker compose volume mapping framework folder

## [v2.4.1] - 2023-12-19
### Changed
- Reduction of api calls when changing locale

## [v2.4.0] - 2023-12-18
### Added
- Audio notification on room start ([#747])

### Fixed
- Drag and Drop file uploading ([#747])

### Changed
- Renamed env option VITE_DEFAULT_LOCALE to DEFAULT_LOCALE (VITE_DEFAULT_LOCALE deprecated) ([#747])
- Renamed env option VITE_AVAILABLE_LOCALES to ENABLED_LOCALES (VITE_AVAILABLE_LOCALES deprecated) ([#747])

## [v2.3.4] - 2023-11-24
### Fixed
- Error copying personalized room link ([#700], [#701])

## [v2.3.3] - 2023-11-13
### Fixed
- Moderator only message missing room link and access code ([#684], [#685])

## [v2.3.2] - 2023-11-06
### Fixed
- Layout issue in access for participants ([#653], [#654])

### Removed
- v-clipboard dependency ([#654])

## [v2.3.1] - 2023-10-16
### Changed
- Updated dependencies

### Security
- Fixed CSRF vulnerability [CVE-2023-4585](https://security.snyk.io/vuln/SNYK-JS-AXIOS-6032459) in axios 

## [v2.3.0] - 2023-10-16
### Added
- Shibboleth authentication ([#20], [#497])
- Option to disable local authentication ([#505], [#506])
- Database Import command: Support for postgres database ([#545])
- Greenlight v2 migration command: Import social users ([#497])
- Greenlight v2 migration command: Using database transactions to undo changes in case of errors ([#497])
- Link Github page in the footer ([#620], [#621])

### Fixed
- Missing locale strings from fallback locale ([#576])
- Greenlight v2 migration command: Room feature 'Room Authentication' missing ([#497])
- Greenlight v2 migration command: Room name too long ([#497])
- Room type unselected in room settings on changes to the room type settings ([#577], [#586])
- Application setting 'Give local users the possibility to change their password' not saved

### Changed
- Allow more characters for role names ([#535], [#536])
- Renamed env option PASSWORD_SELF_RESET_ENABLED to PASSWORD_CHANGE_ALLOWED and enabled by default (PASSWORD_SELF_RESET_ENABLED deprecated) ([#506])

## [v2.2.0] - 2023-08-28
### Added
- French localisation
- Support for PostgreSQL ([#503], [#504])
- Warning for waiting room settings ([#302], [#509])

### Changed
- Bump dependencies
- Improve performance on permission checks ([#469])

### Fixed
- Network error on logout due to reload of all components
- Internal server error on using personalized room links ([#470])

## [v2.1.1] - 2023-07-04
### Changed
- Bump dependencies

### Removed
- Unused .env variables from example file and docs

## [v2.1.0] - 2023-06-29
### Added
- Bulk import room members ([#282], [#299])
- Option to set custom LDAP filter ([#344])
- Option to load LDAP attributes as authenticated user ([#344])
- Custom localization for backend ([#345])
- Room description / welcome page ([#270],[#273]) 
- OPCache for better performance ([#371])
- Laravel telescope for local development and testing ([#380], [#381])
- Logging for many user and system actions ([#380], [#381])
- Redirect back to previous viewed room after login ([#346], [#386])

### Changed
- **Breaking:** Custom localization file format ([#345])
- Switch internal webserver from apache to nginx ([#371])
- Increase PHP-FPM workers ([#371])
- Default log channel ([#381])

### Fixed
- Broken localization in form validation ([#345])
- Showing old validation error in personalized room links modal ([#377], [#389])

### Removed
- Dedicated login button on room view ([#386])

## [v2.0.0] - 2023-04-28
### Added
- **Breaking:** Config option to disable LDAP (disabled by default) ([#236],[#237])
- **Breaking:** Custom theme / color support for application css style (see docs/UPGRADE.md) ([#231],[#232],[#255])
- Show application version in footer  ([#334],[#335])
- Optimization of composer and laravel in production environment ([#327])
- Artisan command to migrate database dump file ([#322], [#325])
- Support to customize trusted proxies ([#305],[#306])
- Confirmation for password and email change ([#277],[#304])
- Email notification on password and email change ([#277],[#304])
- Management of logged in sessions ([#277],[#304])
- Customization options for legal notice url and privacy policy url in UI and env ([#234],[#261])
- Bulk edit and bulk remove options for room members ([#211], [#216])
- Improved change of base url, welcome message limit, room name limit, room refresh rate ([#243],[#244])
- Override welcome page, feature component and footer with custom code ([#234],[#235],[#249])
- Meeting running indicator to own rooms page and find room / all rooms list ([#253],[#258])
- Default user role on fresh installation ([#267],[#268])
- OpenLDAP and phpLDAPadmin to local dev environment ([#225],[#250])
- Dockerfile for production deployment ([#262],[#266])

### Changed
- **Breaking:** LDAP attribute and role mapping ([#340])
- **Breaking:** Env prefix from MIX_ to VITE_ ([#296])
- **Breaking:** Combine backend and frontend localization into single json file ([#284], [#287])
- **Breaking:** Renamed .env setting MIX_WELCOME_MESSAGE_LIMIT to WELCOME_MESSAGE_LIMIT ([#243],[#244])
- **Breaking:** Renamed .env setting MIX_ROOM_NAME_LIMIT to ROOM_NAME_LIMIT ([#243],[#244])
- **Breaking:** Renamed .env setting MIX_REFRESH_RATE to ROOM_REFRESH_RATE ([#243],[#244])
- **Breaking:** API attributes and parameters naming convention ([#259],[#260])
- **Breaking:** Drop support for PHP 7.4 and PHP 8.0 ([#226],[#227])
- **Breaking:** Replace laravel homestead with laravel sail ([#225],[#228],[#254])
- Look and feel of flash messages ([#287])
- Random room polling interval ([#229],[#230])
- Use application name in join room link ([#249])
- API Routes for bulk edit and bulk delete of room members ([#337],[#338])
- Upgrade to Laravel 10 ([#226],[#227], [#325])
- Bump dependencies ([#328])
- Frontend vue state management, replace vuex with pinia ([#293],[#292])
- Frontend build tool, replace laravel mix with vite ([#297],[#296])
- Frontend testing framework, replace jest with vitest ([#298],[#296])
- Replace FlashMessages with bootstrap vue toast ([#296])
- Replace v-clipboard with vue-clipboard2 ([#296])
- Refactored view/edit of single user ([#277],[#304])
- Migrate testing frameworks from mocha to jest and refactor tests ([#225],[#240])
- Restructure/refactor code to service classes ([#248])

### Fixed
- **Breaking:** Inconsistent naming convention for localization strings ([#288], [#287])
- **Breaking:** Database column inconsistencies ([#241],[#242])
- Broken room search / all rooms layout in safari ([#329],[#330])
- Room authentication error on lang change ([#331],[#333])
- Broken default image assets ([#307],[#308])
- Error on logout if room member list is shown ([#280], [#281])
- Support for different Font Awesome syntax ([#287])
- Error displaying the favicon after uploading in the application settings ([#285],[#289])
- Error on adding new room member without selecting a user ([#216])
- Tooltip covering view and edit button in server pool overview ([#245],[#246])
- Tooltip not hiding ([#252],[#256])
- Default profile image not shown on new user page ([#264],[#265])
- Inconsistent backend route names ([#279],[#309])
- Broken code coverage ([#278],[#296])

### Removed
- **Breaking:** Legal notice url and privacy policy url internationalisation ([#234],[#261])
- **Breaking:** .env setting MIX_FRONTEND_BASE_URL ([#243],[#244])
- Git hooks ([#217],[#228])

## [v2.0.0-RC.4] - 2023-04-27
### Changed
- **Breaking:** LDAP attribute and role mapping ([#340])
- API Routes for bulk edit and bulk delete of room members ([#337],[#338])

## [v2.0.0-RC.3] - 2023-03-27
### Added
- Show application version in footer  ([#334],[#335])

### Fixed
- Broken room search / all rooms layout in safari ([#329],[#330])
- Room authentication error on lang change ([#331],[#333])

### Changed
- Revert adding Content-Security-Policy ([#315],[#317])

## [v2.0.0-RC.2] - 2023-03-23
### Added
- Optimization of composer and laravel in production environment ([#327])
- Artisan command to migrate database dump file ([#322], [#325])

### Fixed
- Scheduler not running in production environment ([#323],[#327])
- Database upgrade command not running in production environment ([#324],[#326])

### Changed
- Upgrade to Laravel 10 ([#325])
- Update and cleanup node dependencies ([#328])

## [v2.0.0-RC.1] - 2023-03-09
### Added
- Support to customize trusted proxies ([#305],[#306])
- Content-Security-Policy ([#315],[#317])

### Fixed
- Broken default image assets ([#307],[#308])
- Inconsistent backend route names ([#279],[#309])
- Override welcome page, feature component and footer with custom code ([#310],[#311])
- Override locales ([#312],[#313])
- **Breaking:** Override default logo and favicon ([#314],[#316])

## [v2.0.0-alpha.5] - 2023-03-09
### Added
- Confirmation for password and email change ([#277],[#304])
- Email notification on password and email change ([#277],[#304])
- Management of logged in sessions ([#277],[#304])

### Fixed
- Error in docker-compose-dev.yml leads to deletion of the database in the development environment ([#294], [#295])
- Error in docker container causing wrong permissions on windows ([#296])
- Broken code coverage ([#278],[#296])

### Changed
- **Breaking:** Env prefix from MIX_ to VITE_ ([#296])
- Frontend vue state management, replace vuex with pinia ([#293],[#292])
- Frontend build tool, replace laravel mix with vite ([#297],[#296])
- Frontend testing framework, replace jest with vitest ([#298],[#296])
- Replace FlashMessages with bootstrap vue toast ([#296])
- Replace v-clipboard with vue-clipboard2 ([#296])
- Refactored view/edit of single user ([#277],[#304])

## [v2.0.0-alpha.4] - 2022-11-15
### Changed
- **Breaking:** Combine backend and frontend localization into single json file ([#284], [#287])
- Look and feel of flash messages ([#287])

### Fixed
- **Breaking:** Inconsistent naming convention for localization strings ([#288], [#287])
- Error on logout if room member list is shown ([#280], [#281])
- Support for different Font Awesome syntax ([#287])
- Error displaying the favicon after uploading in the application settings ([#285],[#289])

## [v2.0.0-alpha.3] - 2022-10-28
### Added
- Customization options for legal notice url and privacy policy url in UI and env ([#234],[#261])
- Bulk edit and bulk remove options for room members ([#211], [#216])

### Fixed
- Error on adding new room member without selecting a user ([#216])

### Removed
- **Breaking:** Legal notice url and privacy policy url internationalisation ([#234],[#261])

## [v2.0.0-alpha.2] - 2022-10-05
### Fixed
- **Breaking:** Wrong database migration filenames ([#271],[#272])
- Missing PostgreSQL driver in docker image ([#275],[#276])

## [v2.0.0-alpha.1] - 2022-09-23

### Added
- **Breaking:** Config option to disable LDAP (disabled by default) ([#236],[#237])
- **Breaking:** Custom theme / color support for application css style (see UPGRADE.md) ([#231],[#232],[#255])
- Improved change of base url, welcome message limit, room name limit, room refresh rate ([#243],[#244])
- Override welcome page, feature component and footer with custom code ([#234],[#235],[#249])
- OpenLDAP and phpLDAPadmin to local dev environment ([#225],[#250])
- Meeting running indicator to own rooms page and find room / all rooms list ([#253],[#258])
- Dockerfile for production deployment ([#262],[#266])
- Default user role on fresh installation ([#267],[#268])

### Changed
- Upgrade to Laravel 9 ([#226],[#227])
- **Breaking:** Drop support for PHP 7.4 and PHP 8.0 ([#226],[#227])
- **Breaking:** Replace laravel homestead with laravel sail ([#225],[#228],[#254])
- **Breaking:** Renamed .env setting MIX_WELCOME_MESSAGE_LIMIT to WELCOME_MESSAGE_LIMIT ([#243],[#244])
- **Breaking:** Renamed .env setting MIX_ROOM_NAME_LIMIT to ROOM_NAME_LIMIT ([#243],[#244])
- **Breaking:** Renamed .env setting MIX_REFRESH_RATE to ROOM_REFRESH_RATE ([#243],[#244])
- **Breaking:** LDAP_ROLE_MAP syntax ([#250])
- **Breaking:** API attributes and parameters naming convention ([#259],[#260])
- Random room polling interval ([#229],[#230])
- Migrate testing frameworks from mocha to jest and refactor tests ([#225],[#240])
- Restructure/refactor code to service classes ([#248])
- Use application name in join room link ([#249])

### Fixed
- **Breaking:** Database column inconsistencies ([#241],[#242])
- Tooltip covering view and edit button in server pool overview ([#245],[#246])
- Tooltip not hiding ([#252],[#256])
- Default profile image not shown on new user page ([#264],[#265])

### Removed
- **Breaking:** .env setting MIX_FRONTEND_BASE_URL ([#243],[#244])
- Git hooks ([#217],[#228])

## [1.9.5] - 2022-07-25
### Fixed
- Tooltip covering view and edit button in server pool overview ([#245], Backport from [#246])

## [v1.9.4] - 2022-06-30
### Changed
- Update composer dependencies ([#221],[#222])
- Update php-cs-fixer ([#221],[#222])
- Add php 8.1 support ([#221],[#222])
- Unify used icons ([#223],[#224])
- Update node dependencies and fontawesome ([#223],[#224])

## [v1.9.3] - 2022-04-14
### Fixed
- Server error 500 on login, if entryUUID in ldap changed ([#212], [#213])

## [v1.9.2] - 2022-03-18
### Fixed
- Room fails to start if its name has a length of 1 ([#204], [#205])
- Server error 500 if room type is invalid ([#205])

### Changed
- Update node dependencies ([#195])

## [v1.9.1] - 2022-03-17
### Fixed
- Broken sorting of BBB version in server list ([#202], [#203])

## [v1.9.0] - 2022-03-17
### Added 
- Support for BBB2.4 API, disable learning dashboard and change default layout ([#190], [#191])
- Show BBB version in server list and view ([#199], [#200])

### Changed
- Update php und node dependencies ([#191])

## [v1.8.0] - 2022-01-20
### Added
- Browser notifications on room start ([#124], [#178])
- Automatically delete old or unused rooms with prior email notification  ([#186], [#187])

### Changed
- More structured layout for application settings ([#187])
- Update php dependencies ([#187])

## [v1.7.0] - 2021-11-16
### Added
- Logo and custom css for BBB room ([#68], [#152])
- Role filter in user list ([#161], [#174])

### Fixed
- Missing tooltips on some buttons ([#175], [#176])

## [v1.6.1] - 2021-11-04
### Fixed
- Rooms can be started simultaneously which leads to users being in different bbb rooms ([#172])
- Rooms can be closed directly after being created by a failed join request or cronjob, if the bbb api response is slow ([#170], [#172])
- Unnecessary ldap requests ([#171], [#173])

## [v1.6.0] - 2021-11-01
### Added
- Personalized room tokens ([#72], [#145])

## [v1.5.0] - 2021-09-07
### Added
- Support for parallel testing ([#157], [#158])
- Modal to confirm end of room membership ([#159], [#165])
- Profile image for room member list and user avatar in BBB ([#166], [#167])

### Changed
- Update BBB api to v4.0.0 ([#155], [#156])
- Update Laravel to v8 and bump other dependencies ([#157], [#158])
- Allow more special chars in guest name and show invalid chars ([#162], [#163])

## [v1.4.1] - 2021-07-28
### Fixed
- Missing a slash after hostname in email template and room join url in bbb room ([#153], [#154])

## [v1.4.0] - 2021-07-09
### Added
- Room type restriction for specific roles ([#98], [#127])
- Migration command to import users, rooms and shared access from greenlight ([#117], [#118])
- Migration from greenlight guide (MIGRATE_GREENLIGHT.md) ([#141], [#142])
- Greenlight compatibility mode to support most common greenlight urls ([#141], [#142])
- Attendance logging for each meeting; UI to see attendance and meeting statistics ([#133], [#134])
- Email in user search dialog in room membership ([#147], [#150])

### Fixed
- Not listable room types in room filter ([#138], [#140])
- Incompatible room id field for greenlight room ids ([#143], [#144])
- Start time in the list of currently running meetings not adjusted to the user's time zone setting ([#134])

## [v1.3.0] - 2021-05-05
### Added
- Co-owner room role, permissions to view and edit all rooms (incl. memberships, files and settings) ([#110], [#116])

### Fixed
- Incorrect count of user rooms if search is used ([#129], [#130])
- Broken error handling on room view navigation ([#131], [#132])
- Error on empty access code ([#136], [#137])
- Guests were unable to download files from a room with access code ([#116])

### Security
- Limit the user details available through the user search ([#116])

## [v1.2.0] - 2021-04-09
### Added 
- System wide default presentation ([#119], [#120])
- Configurable help link ([#123], [#125])

## [v1.1.0] - 2021-03-08
### Added
- Room list/search, room and room type setting to allow public room search ([#63], [#108])
- List of running meetings ([#63], [#108])

### Fixed
- Failing redirect to login if session expired ([#121], [#122])

## [v1.0.0] - 2021-03-02
### Added
- Authentication with LDAP and Email-Address ([#1], [#3])
- Loading screen for loading events of the application ([#6], [#11])
- Localization with a locale switcher and saving selected locale for authenticated users ([#8], [#13])
- Flash messages on a successful login and on errors catched by the global vue error handler ([#7], [#16],[#44],[#43],[#101],[#102])
- Footer with Impress and Privacy policy ([#9], [#17])
- Authenticator type to users model ([#19], [#21])
- Roles and permissions concept, management of roles and included permissions ([#12], [#22], [#45], [#103], [#105])
- Page to create, view, change settings and delete rooms, start/join meetings ([#4], [#18],[#32],[#33],[#37],[#46])
- Search field and pagination to the room overview page  ([#39], [#49])
- File upload for room owner and file download for participants ([#4], [#18])
- Agreement check before file download ([#50],[#54])
- Global settings, .env as default; added logo path and room limit ([#34],[#36])
- Setting menu for administrators ([#35], [#38], [#97],[#100])
- Room type management pages to admin settings ([#62], [#73])
- A middleware to check whether the request is in sync with model of the database and not stale ([#40], [#41])
- Management of users and profile page with possibility to disable audio echo test ([#10], [#66], [#67], [#87])
- Management of application settings ([#55], [#60])
- Management of servers ([#30], [#88])
- Artisan command to check server and meeting status, build live and historical data ([#64], [#65])
- Artisan command to create a new admin user ([#81])
- Application banner that can be modified through the application settings ([#89], [#94])
- Management of server pools, used by load balancer and added to room type ([#96], [#99])
- Password self reset, password reset by an administrator and password generation with password reset for registered users ([#106], [#107])
- Logging for failed/successful logins and ldap roles ([#112], [#113])

[#1]: https://github.com/THM-Health/PILOS/issues/1
[#3]: https://github.com/THM-Health/PILOS/pull/3
[#4]: https://github.com/THM-Health/PILOS/issues/4
[#6]: https://github.com/THM-Health/PILOS/issues/6
[#7]: https://github.com/THM-Health/PILOS/issues/7
[#8]: https://github.com/THM-Health/PILOS/issues/8
[#9]: https://github.com/THM-Health/PILOS/issues/9
[#10]: https://github.com/THM-Health/PILOS/issues/10
[#11]: https://github.com/THM-Health/PILOS/pull/11
[#12]: https://github.com/THM-Health/PILOS/issues/12
[#13]: https://github.com/THM-Health/PILOS/pull/13
[#16]: https://github.com/THM-Health/PILOS/pull/16
[#17]: https://github.com/THM-Health/PILOS/pull/17
[#18]: https://github.com/THM-Health/PILOS/pull/18
[#19]: https://github.com/THM-Health/PILOS/issues/19
[#20]: https://github.com/THM-Health/PILOS/issues/20
[#21]: https://github.com/THM-Health/PILOS/pull/21
[#22]: https://github.com/THM-Health/PILOS/pull/22
[#30]: https://github.com/THM-Health/PILOS/issues/30
[#32]: https://github.com/THM-Health/PILOS/issues/32
[#33]: https://github.com/THM-Health/PILOS/pull/33
[#34]: https://github.com/THM-Health/PILOS/issues/34
[#35]: https://github.com/THM-Health/PILOS/pull/35
[#36]: https://github.com/THM-Health/PILOS/pull/36
[#37]: https://github.com/THM-Health/PILOS/issues/37
[#38]: https://github.com/THM-Health/PILOS/issues/38
[#39]: https://github.com/THM-Health/PILOS/issues/39
[#40]: https://github.com/THM-Health/PILOS/issues/40
[#41]: https://github.com/THM-Health/PILOS/pull/41
[#43]: https://github.com/THM-Health/PILOS/issues/43
[#44]: https://github.com/THM-Health/PILOS/pull/44
[#45]: https://github.com/THM-Health/PILOS/pull/45
[#46]: https://github.com/THM-Health/PILOS/pull/46
[#49]: https://github.com/THM-Health/PILOS/pull/49
[#50]: https://github.com/THM-Health/PILOS/issues/50
[#54]: https://github.com/THM-Health/PILOS/pull/54
[#55]: https://github.com/THM-Health/PILOS/issues/55
[#60]: https://github.com/THM-Health/PILOS/pull/60
[#62]: https://github.com/THM-Health/PILOS/issues/62
[#63]: https://github.com/THM-Health/PILOS/issues/63
[#64]: https://github.com/THM-Health/PILOS/issues/64
[#65]: https://github.com/THM-Health/PILOS/pull/65
[#66]: https://github.com/THM-Health/PILOS/pull/66
[#67]: https://github.com/THM-Health/PILOS/issues/67
[#68]: https://github.com/THM-Health/PILOS/issues/68
[#72]: https://github.com/THM-Health/PILOS/issues/72
[#73]: https://github.com/THM-Health/PILOS/pull/73
[#81]: https://github.com/THM-Health/PILOS/pull/81
[#87]: https://github.com/THM-Health/PILOS/pull/87
[#88]: https://github.com/THM-Health/PILOS/pull/88
[#89]: https://github.com/THM-Health/PILOS/issues/89
[#94]: https://github.com/THM-Health/PILOS/pull/94
[#96]: https://github.com/THM-Health/PILOS/issues/96
[#97]: https://github.com/THM-Health/PILOS/issues/97
[#98]: https://github.com/THM-Health/PILOS/issues/98
[#99]: https://github.com/THM-Health/PILOS/pull/99
[#100]: https://github.com/THM-Health/PILOS/pull/100
[#101]: https://github.com/THM-Health/PILOS/issues/101
[#102]: https://github.com/THM-Health/PILOS/pull/102
[#103]: https://github.com/THM-Health/PILOS/issues/103
[#105]: https://github.com/THM-Health/PILOS/pull/105
[#106]: https://github.com/THM-Health/PILOS/issues/106
[#107]: https://github.com/THM-Health/PILOS/pull/107
[#108]: https://github.com/THM-Health/PILOS/pull/108
[#110]: https://github.com/THM-Health/PILOS/issues/110
[#112]: https://github.com/THM-Health/PILOS/issues/112
[#113]: https://github.com/THM-Health/PILOS/pull/113
[#116]: https://github.com/THM-Health/PILOS/pull/116
[#117]: https://github.com/THM-Health/PILOS/issues/117
[#118]: https://github.com/THM-Health/PILOS/pull/118
[#119]: https://github.com/THM-Health/PILOS/issues/119
[#120]: https://github.com/THM-Health/PILOS/pull/120
[#121]: https://github.com/THM-Health/PILOS/issues/121
[#122]: https://github.com/THM-Health/PILOS/pull/122
[#123]: https://github.com/THM-Health/PILOS/issues/123
[#124]: https://github.com/THM-Health/PILOS/issues/124
[#125]: https://github.com/THM-Health/PILOS/pull/125
[#127]: https://github.com/THM-Health/PILOS/pull/127
[#129]: https://github.com/THM-Health/PILOS/issues/129
[#130]: https://github.com/THM-Health/PILOS/pull/130
[#131]: https://github.com/THM-Health/PILOS/issues/131
[#132]: https://github.com/THM-Health/PILOS/pull/132
[#133]: https://github.com/THM-Health/PILOS/issues/133
[#134]: https://github.com/THM-Health/PILOS/pull/134
[#136]: https://github.com/THM-Health/PILOS/issues/136
[#137]: https://github.com/THM-Health/PILOS/pull/137
[#138]: https://github.com/THM-Health/PILOS/issues/138
[#140]: https://github.com/THM-Health/PILOS/pull/140
[#141]: https://github.com/THM-Health/PILOS/issues/141
[#142]: https://github.com/THM-Health/PILOS/pull/142
[#143]: https://github.com/THM-Health/PILOS/issues/143
[#144]: https://github.com/THM-Health/PILOS/pull/144
[#145]: https://github.com/THM-Health/PILOS/pull/145
[#147]: https://github.com/THM-Health/PILOS/issues/147
[#150]: https://github.com/THM-Health/PILOS/pull/150
[#152]: https://github.com/THM-Health/PILOS/pull/152
[#153]: https://github.com/THM-Health/PILOS/issues/153
[#154]: https://github.com/THM-Health/PILOS/pull/154
[#155]: https://github.com/THM-Health/PILOS/issues/155
[#156]: https://github.com/THM-Health/PILOS/pull/156
[#157]: https://github.com/THM-Health/PILOS/issues/157
[#158]: https://github.com/THM-Health/PILOS/pull/158
[#159]: https://github.com/THM-Health/PILOS/issues/159
[#161]: https://github.com/THM-Health/PILOS/issues/161
[#162]: https://github.com/THM-Health/PILOS/issues/162
[#163]: https://github.com/THM-Health/PILOS/pull/163
[#165]: https://github.com/THM-Health/PILOS/pull/165
[#166]: https://github.com/THM-Health/PILOS/issues/166
[#167]: https://github.com/THM-Health/PILOS/pull/167
[#170]: https://github.com/THM-Health/PILOS/issues/170
[#171]: https://github.com/THM-Health/PILOS/issues/171
[#172]: https://github.com/THM-Health/PILOS/pull/172
[#173]: https://github.com/THM-Health/PILOS/pull/173
[#174]: https://github.com/THM-Health/PILOS/pull/174
[#175]: https://github.com/THM-Health/PILOS/issues/175
[#176]: https://github.com/THM-Health/PILOS/pull/176
[#178]: https://github.com/THM-Health/PILOS/pull/178
[#186]: https://github.com/THM-Health/PILOS/issues/186
[#187]: https://github.com/THM-Health/PILOS/pull/187
[#190]: https://github.com/THM-Health/PILOS/issues/190
[#191]: https://github.com/THM-Health/PILOS/pull/191
[#195]: https://github.com/THM-Health/PILOS/pull/195
[#199]: https://github.com/THM-Health/PILOS/issues/199
[#200]: https://github.com/THM-Health/PILOS/pull/200
[#202]: https://github.com/THM-Health/PILOS/issues/202
[#203]: https://github.com/THM-Health/PILOS/pull/203
[#204]: https://github.com/THM-Health/PILOS/issues/204
[#205]: https://github.com/THM-Health/PILOS/pull/205
[#211]: https://github.com/THM-Health/PILOS/issues/211
[#212]: https://github.com/THM-Health/PILOS/issues/212
[#213]: https://github.com/THM-Health/PILOS/pull/213
[#216]: https://github.com/THM-Health/PILOS/pull/216
[#217]: https://github.com/THM-Health/PILOS/issues/217
[#221]: https://github.com/THM-Health/PILOS/issues/221
[#222]: https://github.com/THM-Health/PILOS/pull/222
[#223]: https://github.com/THM-Health/PILOS/issues/223
[#224]: https://github.com/THM-Health/PILOS/pull/224
[#225]: https://github.com/THM-Health/PILOS/issues/225
[#226]: https://github.com/THM-Health/PILOS/issues/226
[#227]: https://github.com/THM-Health/PILOS/pull/227
[#228]: https://github.com/THM-Health/PILOS/pull/228
[#229]: https://github.com/THM-Health/PILOS/issues/229
[#230]: https://github.com/THM-Health/PILOS/pull/230
[#231]: https://github.com/THM-Health/PILOS/issues/231
[#232]: https://github.com/THM-Health/PILOS/pull/232
[#234]: https://github.com/THM-Health/PILOS/issues/234
[#235]: https://github.com/THM-Health/PILOS/issues/235
[#236]: https://github.com/THM-Health/PILOS/issues/236
[#237]: https://github.com/THM-Health/PILOS/pull/237
[#240]: https://github.com/THM-Health/PILOS/pull/240
[#241]: https://github.com/THM-Health/PILOS/issues/241
[#242]: https://github.com/THM-Health/PILOS/pull/242
[#243]: https://github.com/THM-Health/PILOS/issues/243
[#244]: https://github.com/THM-Health/PILOS/pull/244
[#245]: https://github.com/THM-Health/PILOS/issues/245
[#246]: https://github.com/THM-Health/PILOS/pull/246
[#248]: https://github.com/THM-Health/PILOS/pull/248
[#249]: https://github.com/THM-Health/PILOS/pull/249
[#250]: https://github.com/THM-Health/PILOS/pull/250
[#252]: https://github.com/THM-Health/PILOS/issues/252
[#253]: https://github.com/THM-Health/PILOS/issues/253
[#254]: https://github.com/THM-Health/PILOS/pull/254
[#255]: https://github.com/THM-Health/PILOS/pull/255
[#256]: https://github.com/THM-Health/PILOS/pull/256
[#258]: https://github.com/THM-Health/PILOS/pull/258
[#259]: https://github.com/THM-Health/PILOS/issues/259
[#260]: https://github.com/THM-Health/PILOS/pull/260
[#261]: https://github.com/THM-Health/PILOS/pull/261
[#262]: https://github.com/THM-Health/PILOS/pull/262
[#264]: https://github.com/THM-Health/PILOS/issues/264
[#265]: https://github.com/THM-Health/PILOS/pull/265
[#266]: https://github.com/THM-Health/PILOS/issues/266
[#267]: https://github.com/THM-Health/PILOS/issues/267
[#268]: https://github.com/THM-Health/PILOS/pull/268
[#270]: https://github.com/THM-Health/PILOS/issues/270
[#271]: https://github.com/THM-Health/PILOS/issues/271
[#272]: https://github.com/THM-Health/PILOS/pull/272
[#273]: https://github.com/THM-Health/PILOS/pull/273
[#275]: https://github.com/THM-Health/PILOS/issues/275
[#276]: https://github.com/THM-Health/PILOS/pull/276
[#277]: https://github.com/THM-Health/PILOS/pull/277
[#278]: https://github.com/THM-Health/PILOS/issues/278
[#279]: https://github.com/THM-Health/PILOS/issues/279
[#280]: https://github.com/THM-Health/PILOS/issues/280
[#281]: https://github.com/THM-Health/PILOS/pull/281
[#282]: https://github.com/THM-Health/PILOS/issues/282
[#284]: https://github.com/THM-Health/PILOS/issues/284
[#285]: https://github.com/THM-Health/PILOS/issues/285
[#287]: https://github.com/THM-Health/PILOS/pull/287
[#288]: https://github.com/THM-Health/PILOS/issues/288
[#289]: https://github.com/THM-Health/PILOS/pull/289
[#294]: https://github.com/THM-Health/PILOS/issues/294
[#295]: https://github.com/THM-Health/PILOS/pull/295
[#292]: https://github.com/THM-Health/PILOS/pull/292
[#293]: https://github.com/THM-Health/PILOS/issues/293
[#296]: https://github.com/THM-Health/PILOS/pull/296
[#297]: https://github.com/THM-Health/PILOS/issues/297
[#298]: https://github.com/THM-Health/PILOS/issues/298
[#299]: https://github.com/THM-Health/PILOS/pull/299
[#302]: https://github.com/THM-Health/PILOS/issues/302
[#304]: https://github.com/THM-Health/PILOS/issues/304
[#305]: https://github.com/THM-Health/PILOS/issues/305
[#306]: https://github.com/THM-Health/PILOS/pull/306
[#307]: https://github.com/THM-Health/PILOS/issues/307
[#308]: https://github.com/THM-Health/PILOS/pull/308
[#309]: https://github.com/THM-Health/PILOS/pull/309
[#310]: https://github.com/THM-Health/PILOS/issues/310
[#311]: https://github.com/THM-Health/PILOS/pull/311
[#312]: https://github.com/THM-Health/PILOS/issues/312
[#313]: https://github.com/THM-Health/PILOS/pull/313
[#314]: https://github.com/THM-Health/PILOS/issues/314
[#315]: https://github.com/THM-Health/PILOS/issues/315
[#317]: https://github.com/THM-Health/PILOS/pull/317
[#316]: https://github.com/THM-Health/PILOS/pull/316
[#322]: https://github.com/THM-Health/PILOS/issues/322
[#323]: https://github.com/THM-Health/PILOS/issues/323
[#324]: https://github.com/THM-Health/PILOS/issues/324
[#325]: https://github.com/THM-Health/PILOS/pull/325
[#326]: https://github.com/THM-Health/PILOS/pull/326
[#327]: https://github.com/THM-Health/PILOS/pull/327
[#328]: https://github.com/THM-Health/PILOS/pull/328
[#329]: https://github.com/THM-Health/PILOS/issues/329
[#330]: https://github.com/THM-Health/PILOS/pull/330
[#331]: https://github.com/THM-Health/PILOS/issues/331
[#333]: https://github.com/THM-Health/PILOS/pull/333
[#334]: https://github.com/THM-Health/PILOS/issues/334
[#335]: https://github.com/THM-Health/PILOS/pull/335
[#337]: https://github.com/THM-Health/PILOS/issues/337
[#338]: https://github.com/THM-Health/PILOS/pull/338
[#340]: https://github.com/THM-Health/PILOS/pull/340
[#344]: https://github.com/THM-Health/PILOS/pull/344
[#345]: https://github.com/THM-Health/PILOS/pull/345
[#346]: https://github.com/THM-Health/PILOS/issues/346
[#371]: https://github.com/THM-Health/PILOS/pull/371
[#377]: https://github.com/THM-Health/PILOS/issues/377
[#380]: https://github.com/THM-Health/PILOS/issues/380
[#381]: https://github.com/THM-Health/PILOS/pull/381
[#386]: https://github.com/THM-Health/PILOS/pull/386
[#389]: https://github.com/THM-Health/PILOS/pull/389
[#469]: https://github.com/THM-Health/PILOS/pull/469
[#470]: https://github.com/THM-Health/PILOS/pull/470
[#497]: https://github.com/THM-Health/PILOS/pull/497
[#503]: https://github.com/THM-Health/PILOS/issues/503
[#504]: https://github.com/THM-Health/PILOS/pull/504
[#505]: https://github.com/THM-Health/PILOS/issues/505
[#506]: https://github.com/THM-Health/PILOS/pull/506
[#509]: https://github.com/THM-Health/PILOS/pull/509
[#535]: https://github.com/THM-Health/PILOS/issues/535
[#536]: https://github.com/THM-Health/PILOS/pull/536
[#545]: https://github.com/THM-Health/PILOS/pull/545
[#576]: https://github.com/THM-Health/PILOS/pull/576
[#577]: https://github.com/THM-Health/PILOS/issues/577
[#586]: https://github.com/THM-Health/PILOS/pull/586
[#620]: https://github.com/THM-Health/PILOS/issues/620
[#621]: https://github.com/THM-Health/PILOS/pull/621
[#653]: https://github.com/THM-Health/PILOS/issues/653
[#654]: https://github.com/THM-Health/PILOS/pull/654
[#684]: https://github.com/THM-Health/PILOS/issues/684
[#685]: https://github.com/THM-Health/PILOS/pull/685
[#700]: https://github.com/THM-Health/PILOS/issues/700
[#701]: https://github.com/THM-Health/PILOS/pull/701
[#747]: https://github.com/THM-Health/PILOS/pull/747

[unreleased]: https://github.com/THM-Health/PILOS/compare/v2.4.3...develop
[v1.0.0]: https://github.com/THM-Health/PILOS/releases/tag/v1.0.0
[v1.1.0]: https://github.com/THM-Health/PILOS/releases/tag/v1.1.0
[v1.2.0]: https://github.com/THM-Health/PILOS/releases/tag/v1.2.0
[v1.3.0]: https://github.com/THM-Health/PILOS/releases/tag/v1.3.0
[v1.4.0]: https://github.com/THM-Health/PILOS/releases/tag/v1.4.0
[v1.4.1]: https://github.com/THM-Health/PILOS/releases/tag/v1.4.1
[v1.5.0]: https://github.com/THM-Health/PILOS/releases/tag/v1.5.0
[v1.6.0]: https://github.com/THM-Health/PILOS/releases/tag/v1.6.0
[v1.6.1]: https://github.com/THM-Health/PILOS/releases/tag/v1.6.1
[v1.7.0]: https://github.com/THM-Health/PILOS/releases/tag/v1.7.0
[v1.8.0]: https://github.com/THM-Health/PILOS/releases/tag/v1.8.0
[v1.9.0]: https://github.com/THM-Health/PILOS/releases/tag/v1.9.0
[v1.9.1]: https://github.com/THM-Health/PILOS/releases/tag/v1.9.1
[v1.9.2]: https://github.com/THM-Health/PILOS/releases/tag/v1.9.2
[v1.9.3]: https://github.com/THM-Health/PILOS/releases/tag/v1.9.3
[v1.9.4]: https://github.com/THM-Health/PILOS/releases/tag/v1.9.4
[v1.9.5]: https://github.com/THM-Health/PILOS/releases/tag/v1.9.5
[v2.0.0-alpha.1]: https://github.com/THM-Health/PILOS/releases/tag/v2.0.0-alpha.1
[v2.0.0-alpha.2]: https://github.com/THM-Health/PILOS/releases/tag/v2.0.0-alpha.2
[v2.0.0-alpha.3]: https://github.com/THM-Health/PILOS/releases/tag/v2.0.0-alpha.3
[v2.0.0-alpha.4]: https://github.com/THM-Health/PILOS/releases/tag/v2.0.0-alpha.4
[v2.0.0-alpha.5]: https://github.com/THM-Health/PILOS/releases/tag/v2.0.0-alpha.5
[v2.0.0-RC.1]: https://github.com/THM-Health/PILOS/releases/tag/v2.0.0-RC.1
[v2.0.0-RC.2]: https://github.com/THM-Health/PILOS/releases/tag/v2.0.0-RC.2
[v2.0.0-RC.3]: https://github.com/THM-Health/PILOS/releases/tag/v2.0.0-RC.3
[v2.0.0-RC.4]: https://github.com/THM-Health/PILOS/releases/tag/v2.0.0-RC.4
[v2.0.0]: https://github.com/THM-Health/PILOS/releases/tag/v2.0.0
[v2.1.0]: https://github.com/THM-Health/PILOS/releases/tag/v2.1.0
[v2.1.1]: https://github.com/THM-Health/PILOS/releases/tag/v2.1.1
[v2.2.0]: https://github.com/THM-Health/PILOS/releases/tag/v2.2.0
[v2.3.0]: https://github.com/THM-Health/PILOS/releases/tag/v2.3.0
[v2.3.1]: https://github.com/THM-Health/PILOS/releases/tag/v2.3.1
[v2.3.2]: https://github.com/THM-Health/PILOS/releases/tag/v2.3.2
[v2.3.3]: https://github.com/THM-Health/PILOS/releases/tag/v2.3.3
[v2.3.4]: https://github.com/THM-Health/PILOS/releases/tag/v2.3.4
[v2.4.0]: https://github.com/THM-Health/PILOS/releases/tag/v2.4.0
[v2.4.1]: https://github.com/THM-Health/PILOS/releases/tag/v2.4.1
[v2.4.2]: https://github.com/THM-Health/PILOS/releases/tag/v2.4.2
[v2.4.3]: https://github.com/THM-Health/PILOS/releases/tag/v2.4.3
