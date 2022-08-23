# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Breaking:** Config option to disable LDAP (disabled by default) ([#236],[#237])
- **Breaking:** Custom theme / color support for application css style (see UPGRADE.md) ([#231],[#232],[#255])
- Improved change of base url, welcome message limit, room name limit, room refresh rate ([#243],[#244])
- Override welcome page, feature component and footer with custom code ([#234],[#235],[#249])
- OpenLDAP and phpLDAPadmin to local dev environment ([#225],[#250])
- Meeting running indicator to own rooms page and find room / all rooms list ([#253],[#258])

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
- Use application name in join room link ([#249])

### Fixed
- **Breaking:** Database column inconsistencies ([#241],[#242])
- Tooltip covering view and edit button in server pool overview ([#245],[#246])
- Tooltip not hiding ([#252],[#256])

### Removed
- **Breaking:** .env setting MIX_FRONTEND_BASE_URL ([#243],[#244])
- Git hooks ([#217],[#228])

## [1.9.5] - 2022-07-25
### Fixed
- Tooltip covering view and edit button in server pool overview ([#245], Backport from [#246])

## [1.9.4] - 2022-06-30
### Changed
- Update composer dependencies ([#221],[#222])
- Update php-cs-fixer ([#221],[#222])
- Add php 8.1 support ([#221],[#222])
- Unify used icons ([#223],[#224])
- Update node dependencies and fontawesome ([#223],[#224])

## [1.9.3] - 2022-04-14
### Fixed
- Server error 500 on login, if entryUUID in ldap changed ([#212], [#213])

## [1.9.2] - 2022-03-18
### Fixed
- Room fails to start if its name has a length of 1 ([#204], [#205])
- Server error 500 if room type is invalid ([#205])

### Changed
- Update node dependencies ([#195])

## [1.9.1] - 2022-03-17
### Fixed
- Broken sorting of BBB version in server list ([#202], [#203])

## [1.9.0] - 2022-03-17
### Added 
- Support for BBB2.4 API, disable learning dashboard and change default layout ([#190], [#191])
- Show BBB version in server list and view ([#199], [#200])

### Changed
- Update php und node dependencies ([#191])

## [1.8.0] - 2022-01-20
### Added
- Browser notifications on room start ([#124], [#178])
- Automatically delete old or unused rooms with prior email notification  ([#186], [#187])

### Changed
- More structured layout for application settings ([#187])
- Update php dependencies ([#187])

## [1.7.0] - 2021-11-16
### Added
- Logo and custom css for BBB room ([#68], [#152])
- Role filter in user list ([#161], [#174])

### Fixed
- Missing tooltips on some buttons ([#175], [#176])

## [1.6.1] - 2021-11-04
### Fixed
- Rooms can be started simultaneously which leads to users being in different bbb rooms ([#172])
- Rooms can be closed directly after being created by a failed join request or cronjob, if the bbb api response is slow ([#170], [#172])
- Unnecessary ldap requests ([#171], [#173])

## [1.6.0] - 2021-11-01
### Added
- Personalized room tokens ([#72], [#145])

## [1.5.0] - 2021-09-07
### Added
- Support for parallel testing ([#157], [#158])
- Modal to confirm end of room membership ([#159], [#165])
- Profile image for room member list and user avatar in BBB ([#166], [#167])

### Changed
- Update BBB api to v4.0.0 ([#155], [#156])
- Update Laravel to v8 and bump other dependencies ([#157], [#158])
- Allow more special chars in guest name and show invalid chars ([#162], [#163])

## [1.4.1] - 2021-07-28
### Fixed
- Missing a slash after hostname in email template and room join url in bbb room ([#153], [#154])

## [1.4.0] - 2021-07-09
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

## [1.3.0] - 2021-05-05
### Added
- Co-owner room role, permissions to view and edit all rooms (incl. memberships, files and settings) ([#110], [#116])

### Fixed
- Incorrect count of user rooms if search is used ([#129], [#130])
- Broken error handling on room view navigation ([#131], [#132])
- Error on empty access code ([#136], [#137])
- Guests were unable to download files from a room with access code ([#116])

### Security
- Limit the user details available through the user search ([#116])

## [1.2.0] - 2021-04-09
### Added 
- System wide default presentation ([#119], [#120])
- Configurable help link ([#123], [#125])

## [1.1.0] - 2021-03-08
### Added
- Room list/search, room and room type setting to allow public room search ([#63], [#108])
- List of running meetings ([#63], [#108])

### Fixed
- Failing redirect to login if session expired ([#121], [#122])

## [1.0.0] - 2021-03-02
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
[#212]: https://github.com/THM-Health/PILOS/issues/212
[#213]: https://github.com/THM-Health/PILOS/pull/213
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

[unreleased]: https://github.com/THM-Health/PILOS/compare/v1.9.5...HEAD
[1.0.0]: https://github.com/THM-Health/PILOS/releases/tag/v1.0.0
[1.1.0]: https://github.com/THM-Health/PILOS/releases/tag/v1.1.0
[1.2.0]: https://github.com/THM-Health/PILOS/releases/tag/v1.2.0
[1.3.0]: https://github.com/THM-Health/PILOS/releases/tag/v1.3.0
[1.4.0]: https://github.com/THM-Health/PILOS/releases/tag/v1.4.0
[1.4.1]: https://github.com/THM-Health/PILOS/releases/tag/v1.4.1
[1.5.0]: https://github.com/THM-Health/PILOS/releases/tag/v1.5.0
[1.6.0]: https://github.com/THM-Health/PILOS/releases/tag/v1.6.0
[1.6.1]: https://github.com/THM-Health/PILOS/releases/tag/v1.6.1
[1.7.0]: https://github.com/THM-Health/PILOS/releases/tag/v1.7.0
[1.8.0]: https://github.com/THM-Health/PILOS/releases/tag/v1.8.0
[1.9.0]: https://github.com/THM-Health/PILOS/releases/tag/v1.9.0
[1.9.1]: https://github.com/THM-Health/PILOS/releases/tag/v1.9.1
[1.9.2]: https://github.com/THM-Health/PILOS/releases/tag/v1.9.2
[1.9.3]: https://github.com/THM-Health/PILOS/releases/tag/v1.9.3
[1.9.4]: https://github.com/THM-Health/PILOS/releases/tag/v1.9.4
[1.9.5]: https://github.com/THM-Health/PILOS/releases/tag/v1.9.5
