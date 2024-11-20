<img src="https://raw.githubusercontent.com/THM-Health/PILOS/4.x/public/images/logo.svg" width="250px"></img>

![Status](https://github.com/THM-Health/PILOS/workflows/CI/badge.svg)
[![codecov](https://codecov.io/gh/THM-Health/PILOS/branch/4.x/graph/badge.svg?token=6EXYQKIG3W)](https://codecov.io/gh/THM-Health/PILOS)

PILOS (Platform for Interactive Live-Online Seminars) is an easy to use frontend for [BigBlueButton](https://bigbluebutton.org/) developed at the TH Mittelhessen University of Applied Sciences ([THM](https://thm.de/)) Faculty of Health ([FB GES](https://www.thm.de/ges/)).
It is based on the experience of students, teachers and staff during the covid-19 pandemic, and the raised need for a modern and flexible video conferencing system for the use case of digital class rooms, group learning and other digital meetings.

**This Frontend uses BigBlueButton and is not endorsed or certified by BigBlueButton Inc. BigBlueButton and the BigBlueButton Logo are trademarks of BigBlueButton Inc.**

## Table of Contents

-   [About](#about)
-   [Architecture](#architecture)
-   [Installation](#installation)
-   [Stacks](#stacks)
-   [Contributing](#contributing)
-   [License](#license)

## About

The interface is similar to another open-source project [Greenlight](https://github.com/bigbluebutton/greenlight).
During the online semester 2020 many features araised that could not be solved or were hard to implement into Greenlight.
The team behind Greenlight did an amazing job, and we want to thank for their hard work!

✅/❌ [Comparison Greenlight and PILOS](https://thm-health.github.io/PILOS/docs/administration/greenlight)

However, due to the underlying ruby-on-rails software architecture and the small amount of rails software-packages
we decided to build a new system with another architecture.

## Screenshots

### Welcome, Home and Login

<img src="https://github.com/THM-Health/PILOS/assets/4281791/9e77f33e-2e03-4f78-8db1-0b5bd3e6fe36" width="30%"></img>
<img src="https://github.com/THM-Health/PILOS/assets/4281791/9fcac911-3fc2-404e-bd9e-fe5e66e6783f" width="30%"></img>
<img src="https://github.com/THM-Health/PILOS/assets/4281791/3d4c5d70-febb-4369-923b-6335ad7652e1" width="30%"></img>

### User profile

<img src="https://github.com/THM-Health/PILOS/assets/4281791/80209d1e-d419-4a90-87dd-73eb231f2d98" width="30%"></img>
<img src="https://github.com/THM-Health/PILOS/assets/4281791/e73e845e-a885-4506-aeec-86604e8d97e3" width="30%"></img>
<img src="https://github.com/THM-Health/PILOS/assets/4281791/0d7ac489-8f33-4761-8132-44078992fef8" width="30%"></img>
<img src="https://github.com/THM-Health/PILOS/assets/4281791/f88d7dbb-16e5-49cc-bf20-5751210c7ba5" width="30%"></img>

### Room settings

<img src="https://github.com/THM-Health/PILOS/assets/4281791/fc8dde9a-5eda-4be3-a6a9-f4f38c2ac839" width="30%"></img>
<img src="https://github.com/THM-Health/PILOS/assets/4281791/0d50aea4-5a23-4618-95eb-db2adaf3de1b" width="30%"></img>
<img src="https://github.com/THM-Health/PILOS/assets/4281791/55ee94d8-50ed-468c-a2c5-c3d44fcfb62e" width="30%"></img>
<img src="https://github.com/THM-Health/PILOS/assets/4281791/79531007-387e-4c36-81b0-d900bc626702" width="30%"></img>
<img src="https://github.com/THM-Health/PILOS/assets/4281791/7a1908dc-70db-4989-bff3-a2e66ea5d857" width="30%"></img>
<img src="https://github.com/THM-Health/PILOS/assets/4281791/6d4562f0-e9e5-4dfd-8891-b20be5954d3f" width="30%"></img>
<img src="https://github.com/THM-Health/PILOS/assets/4281791/2adafcce-57ce-46ea-b6fb-98aa1d156790" width="30%"></img>
<img src="https://github.com/THM-Health/PILOS/assets/4281791/7512ab98-bc93-47dd-9c15-23bec1b9a787" width="30%"></img>

### Settings

<img src="https://github.com/THM-Health/PILOS/assets/4281791/e7eb9ff0-d961-481a-9977-155ac61a0d14" width="30%"></img>
<img src="https://github.com/THM-Health/PILOS/assets/4281791/40a4836a-0ada-4883-9432-6165c7fdc32b" width="30%"></img>
<img src="https://github.com/THM-Health/PILOS/assets/4281791/65e6e2a0-9781-4797-be81-5905bcb41459" width="30%"></img>
<img src="https://github.com/THM-Health/PILOS/assets/4281791/945a1a23-ed09-406f-86f1-ca81c2f51387" width="30%"></img>
<img src="https://github.com/THM-Health/PILOS/assets/4281791/15afabdd-1777-48b7-8b8e-8d51b4164f4e" width="30%"></img>
<img src="https://github.com/THM-Health/PILOS/assets/4281791/f7ba7584-de55-4209-bd2e-6d920b16fa8e" width="30%"></img>

### Servers, Server-Pools, Meetings

<img src="https://github.com/THM-Health/PILOS/assets/4281791/6221bea3-975a-4ca1-9b2b-cddc4f9368eb" width="30%"></img>
<img src="https://github.com/THM-Health/PILOS/assets/4281791/0523b0c4-d460-430d-873b-c946331d51af" width="30%"></img>
<img src="https://github.com/THM-Health/PILOS/assets/4281791/4ad130bd-d33a-4a6d-bf2d-ffd9a3638282" width="30%"></img>
<img src="https://github.com/THM-Health/PILOS/assets/4281791/ec331dec-45d5-4316-8e99-03f7ed5409ed" width="30%"></img>
<img src="https://github.com/THM-Health/PILOS/assets/4281791/5f414402-bb4d-43e5-8f2c-2ed44dc54661" width="30%"></img>

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
