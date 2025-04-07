<img src="https://raw.githubusercontent.com/THM-Health/PILOS/4.x/public/images/logo.svg" width="250px"></img>

![Status](https://github.com/THM-Health/PILOS/actions/workflows/ci.yml/badge.svg?branch=4.x)
[![codecov](https://codecov.io/gh/THM-Health/PILOS/branch/4.x/graph/badge.svg?token=6EXYQKIG3W)](https://codecov.io/gh/THM-Health/PILOS)
[![snyk.io](https://snyk.io/test/github/THM-Health/PILOS/badge.svg)](https://snyk.io/test/github/THM-Health/PILOS)

PILOS (Platform for Interactive Live-Online Seminars) is an easy to use frontend for [BigBlueButton](https://bigbluebutton.org/) developed at the TH Mittelhessen University of Applied Sciences ([THM](https://thm.de/)) Faculty of Health ([FB GES](https://www.thm.de/ges/)).
It is based on the experience of students, teachers and staff during the covid-19 pandemic, and the raised need for a modern and flexible video conferencing system for the use case of digital class rooms, group learning and other digital meetings.

**This Frontend uses BigBlueButton and is not endorsed or certified by BigBlueButton Inc. BigBlueButton and the BigBlueButton Logo are trademarks of BigBlueButton Inc.**

## Table of Contents

- [About](#about)
- [Architecture](#architecture)
- [Installation](#installation)
- [Stacks](#stacks)
- [Contributing](#contributing)
- [License](#license)

## About

The interface is similar to another open-source project [Greenlight](https://github.com/bigbluebutton/greenlight).
During the online semester 2020 many features araised that could not be solved or were hard to implement into Greenlight.
The team behind Greenlight did an amazing job, and we want to thank for their hard work!

✅/❌ [Comparison Greenlight and PILOS](https://thm-health.github.io/PILOS/docs/administration/greenlight)

However, due to the underlying ruby-on-rails software architecture and the small amount of rails software-packages
we decided to build a new system with another architecture.

## Screenshots

### Welcome, Home and Login

<img src="https://raw.githubusercontent.com/THM-Health/PILOS/refs/heads/develop/.opencode/screenshots/en/home.jpg" width="30%"></img>
<img src="https://raw.githubusercontent.com/THM-Health/PILOS/refs/heads/develop/.opencode/screenshots/en/dashboard.jpg" width="30%"></img>
<img src="https://raw.githubusercontent.com/THM-Health/PILOS/refs/heads/develop/.opencode/screenshots/en/login.jpg" width="30%"></img>

### User profile

<img src="https://raw.githubusercontent.com/THM-Health/PILOS/refs/heads/develop/.opencode/screenshots/en/profile_base.jpg" width="30%"></img>
<img src="https://raw.githubusercontent.com/THM-Health/PILOS/refs/heads/develop/.opencode/screenshots/en/profile_security.jpg" width="30%"></img>

### Room

<img src="https://raw.githubusercontent.com/THM-Health/PILOS/refs/heads/develop/.opencode/screenshots/en/room_description.jpg" width="30%"></img>
<img src="https://raw.githubusercontent.com/THM-Health/PILOS/refs/heads/develop/.opencode/screenshots/en/room_members.jpg" width="30%"></img>
<img src="https://raw.githubusercontent.com/THM-Health/PILOS/refs/heads/develop/.opencode/screenshots/en/room_files.jpg" width="30%"></img>
<img src="https://raw.githubusercontent.com/THM-Health/PILOS/refs/heads/develop/.opencode/screenshots/en/room_history.jpg" width="30%"></img>
<img src="https://raw.githubusercontent.com/THM-Health/PILOS/refs/heads/develop/.opencode/screenshots/en/room_stats.jpg" width="30%"></img>
<img src="https://raw.githubusercontent.com/THM-Health/PILOS/refs/heads/develop/.opencode/screenshots/en/room_attendance.jpg" width="30%"></img>
<img src="https://raw.githubusercontent.com/THM-Health/PILOS/refs/heads/develop/.opencode/screenshots/en/room_settings.jpg" width="30%"></img>

### Settings

<img src="https://raw.githubusercontent.com/THM-Health/PILOS/refs/heads/develop/.opencode/screenshots/en/settings.jpg" width="30%"></img>
<img src="https://raw.githubusercontent.com/THM-Health/PILOS/refs/heads/develop/.opencode/screenshots/en/app_settings.jpg" width="30%"></img>
<img src="https://raw.githubusercontent.com/THM-Health/PILOS/refs/heads/develop/.opencode/screenshots/en/users.jpg" width="30%"></img>
<img src="https://raw.githubusercontent.com/THM-Health/PILOS/refs/heads/develop/.opencode/screenshots/en/roles.jpg" width="30%"></img>
<img src="https://raw.githubusercontent.com/THM-Health/PILOS/refs/heads/develop/.opencode/screenshots/en/roles_detail.jpg" width="30%"></img>
<img src="https://raw.githubusercontent.com/THM-Health/PILOS/refs/heads/develop/.opencode/screenshots/en/room_types.jpg" width="30%"></img>
<img src="https://raw.githubusercontent.com/THM-Health/PILOS/refs/heads/develop/.opencode/screenshots/en/room_types_edit.jpg" width="30%"></img>
<img src="https://raw.githubusercontent.com/THM-Health/PILOS/refs/heads/develop/.opencode/screenshots/en/room_types_edit_settings.jpg" width="30%"></img>

### Servers, Server-Pools, Meetings

<img src="https://raw.githubusercontent.com/THM-Health/PILOS/refs/heads/develop/.opencode/screenshots/en/servers.jpg" width="30%"></img>
<img src="https://raw.githubusercontent.com/THM-Health/PILOS/refs/heads/develop/.opencode/screenshots/en/servers_edit.jpg" width="30%"></img>
<img src="https://raw.githubusercontent.com/THM-Health/PILOS/refs/heads/develop/.opencode/screenshots/en/server_pools.jpg" width="30%"></img>
<img src="https://raw.githubusercontent.com/THM-Health/PILOS/refs/heads/develop/.opencode/screenshots/en/running_meetings.jpg" width="30%"></img>

## Architecture

PILOS is using [Vue.js](https://vuejs.org/) as the Frontend JavaScript Framework, [Laravel](https://laravel.com/) as a PHP based JSON API and littleredbutton's [bigbluebutton-api-php](https://github.com/littleredbutton/bigbluebutton-api-php) as the api for controlling BBB.

## Installation

A BigBlueButton server is necessary to use this application. See how to set up a BigBlueButton server [here](https://docs.bigbluebutton.org/).

For information on installing PILOS have a look at our [documentation](https://thm-health.github.io/PILOS/docs/administration/getting-started).

## Upgrade to PILOS v4

If you have proviously used PILOS v2/v3, follow our [upgrade instructions](https://thm-health.github.io/PILOS/docs/administration/upgrade) .

## Migrate from Greenlight 2

If you have proviously used Greenlight 2, follow our [migration guide](https://thm-health.github.io/PILOS/docs/administration/advanced/migrate-greenlight).

## Stacks

The main parts of the application are:

1. [BigBlueButton](https://bigbluebutton.org/) - BigBlueButton is an open source web conferencing system.
2. [littleredbutton/bigbluebutton-api-php](https://github.com/littleredbutton/bigbluebutton-api-php) - An unofficial php api for BigBlueButton.
3. [Laravel](https://laravel.com/) - Laravel is a web application framework with expressive, elegant syntax. We’ve already laid the foundation — freeing you to create without sweating the small things.Laravel is a web application framework with expressive, elegant syntax. We’ve already laid the foundation — freeing you to create without sweating the small things.
4. [Vue](https://vuejs.org/) - a progressive Javascript framework for building user interfaces.

A almost full list of libraries and other software components can be found [here](https://github.com/THM-Health/PILOS/wiki/Libraries)!

## Contributing

Please check our [development documentation](https://thm-health.github.io/PILOS/docs/development/intro).

## Localization

The localization is managed in our [POEditor](https://poeditor.com/join/project/gWkaFBI8OH) project.
Feel free to join and help us translate PILOS into your language or improve the existing translations.

## License

This PILOS project is open-sourced software licensed under the LGPL license.
