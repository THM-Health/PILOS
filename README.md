# PILOS

![Status](https://github.com/THM-Health/PILOS/workflows/CI/badge.svg)
[![codecov](https://codecov.io/gh/THM-Health/PILOS/branch/master/graph/badge.svg?token=6EXYQKIG3W)](https://codecov.io/gh/THM-Health/PILOS)

PILOS (Platform for Interactive Live-Online Seminars) is an easy to use frontend for [BigBlueButton](https://bigbluebutton.org/) developed at the TH Mittelhessen University of Applied Sciences ([THM](https://thm.de/)) Faculty of Health ([FB GES](https://www.thm.de/ges/)).
It is based on the experience of students, teachers and staff during the covid-19 pandemic, and the raised need for a modern and flexible video conferencing system for the use case of digital class rooms, group learning and other digital meetings. 


**This Frontend uses BigBlueButton and is not endorsed or certified by BigBlueButton Inc. BigBlueButton and the BigBlueButton Logo are trademarks of BigBlueButton Inc.**

## Table of Contents 
* [About](#about)
* [Architecture](#architecture)
* [Installation](#installation)
* [Stacks](#stacks)
* [Contributing](#contributing)
* [License](#license)

## About

The interface is similar to another open-source project [Greenlight](https://github.com/bigbluebutton/greenlight).
During the online semester 2020 many features araised that could not be solved or were hard to implement into Greenlight.
The team behind Greenlight did an amazing job, and we want to thank for their hard work!

✅/❌ [Comparison Greenlight and PILOS](https://github.com/THM-Health/PILOS/wiki/Comparison-Greenlight-and-PILOS)

However, due to the underlying ruby-on-rails software architecture and the small amount of rails software-packages
we decided to build a new system with another architecture.

## Screenshots
### Welcome, Home and Login
<img src="https://user-images.githubusercontent.com/4281791/179394928-85062946-0204-4463-98a4-970de9af9711.png" width="30%"></img>
<img src="https://user-images.githubusercontent.com/4281791/179394213-41450e6e-0fe0-4a17-b097-eab3de6a8bb4.png" width="30%"></img>
<img src="https://user-images.githubusercontent.com/4281791/179394929-217fc9c9-1447-4822-94c7-7c2826cc9dff.png" width="30%"></img>

### User profile
<img src="https://user-images.githubusercontent.com/4281791/179394216-f47a0030-9f49-4607-a2ed-5b2a110a6e9c.png" width="30%"></img>

### Room settings
<img src="https://user-images.githubusercontent.com/4281791/179394223-b792d6f1-1033-425b-b027-6903c8e0fc0d.png" width="30%"></img>
<img src="https://user-images.githubusercontent.com/4281791/179394222-f43b3adb-1602-41bd-aad8-7802b99787b7.png" width="30%"></img>
<img src="https://user-images.githubusercontent.com/4281791/179394219-6822cfc1-7d2a-4076-bc93-5974737e1e1f.png" width="30%"></img>
<img src="https://user-images.githubusercontent.com/4281791/179394221-ffa5f399-7256-4c30-9f6d-9b24746ceba9.png" width="30%"></img>
<img src="https://user-images.githubusercontent.com/4281791/179394235-0ce8c63a-98d9-4d79-8516-75d24684fe2c.png" width="30%"></img>
<img src="https://user-images.githubusercontent.com/4281791/179394224-26da44de-6aca-454f-b884-f60a17e3d066.png" width="30%"></img>
<img src="https://user-images.githubusercontent.com/4281791/179394218-edbc616d-8cf3-4657-9fca-92df8cea411f.png" width="30%"></img>
<img src="https://user-images.githubusercontent.com/4281791/179394225-4b5e7407-d8ae-4fb4-a7f1-82c7d28f9d67.png" width="30%"></img>


### Settings
<img src="https://user-images.githubusercontent.com/4281791/179394234-a789014b-e80d-4cad-9f1f-7708a59061d3.png" width="30%"></img>
<img src="https://user-images.githubusercontent.com/4281791/179394211-5e9a99f0-e11a-4b16-8b59-55d67b005f6d.png" width="30%"></img>
<img src="https://user-images.githubusercontent.com/4281791/179394235-0ce8c63a-98d9-4d79-8516-75d24684fe2c.png" width="30%"></img>
<img src="https://user-images.githubusercontent.com/4281791/179394217-46785049-0f83-4ebe-83c4-160f88e8e57e.png" width="30%"></img>
<img src="https://user-images.githubusercontent.com/4281791/179394229-60f46ce9-b848-434c-93c4-7ddd92c34951.png" width="30%"></img>
<img src="https://user-images.githubusercontent.com/4281791/179394227-d4240121-b8cf-4790-ade0-c34456337fe4.png" width="30%"></img>

### Servers, Server-Pools, Meetings
<img src="https://user-images.githubusercontent.com/4281791/179394233-eccf88e3-4fd7-4bf1-b074-19a682c9adfc.png" width="30%"></img>
<img src="https://user-images.githubusercontent.com/4281791/179394232-7e1ad5bf-7d0c-42f2-8e4f-e11860c2417c.png" width="30%"></img>
<img src="https://user-images.githubusercontent.com/4281791/179394215-0413ca7d-8fa8-4eca-b764-45ab5a3355cc.png" width="30%"></img>
<img src="https://user-images.githubusercontent.com/4281791/179394231-729f22c1-ab2a-4c7d-8d79-93b0812fd15f.png" width="30%"></img>
<img src="https://user-images.githubusercontent.com/4281791/179394226-4db4d5b0-0849-4bdb-bdd4-7a6902187ea0.png" width="30%"></img>


## Architecture

PILOS is using [Vue.js](https://vuejs.org/) as the Frontend JavaScript Framework, [Laravel](https://laravel.com/) as a PHP based JSON API and littleredbutton's [bigbluebutton-api-php](https://github.com/littleredbutton/bigbluebutton-api-php) as the api for controlling BBB.

## Installation

A BigBlueButton server is necessary to use this application. See how to set up a BigBlueButton server [here](https://docs.bigbluebutton.org/).

For information on installing PILOS using Docker or native, have a look at our [Installing PILOS](INSTALL.md) documentation.

## Stacks

The main parts of the application are:

1. [BigBlueButton](https://bigbluebutton.org/) - BigBlueButton is an open source web conferencing system.
2. [littleredbutton/bigbluebutton-api-php](https://github.com/littleredbutton/bigbluebutton-api-php) - An unofficial php api for BigBlueButton.
3. [Laravel](https://laravel.com/) - Laravel is a web application framework with expressive, elegant syntax. We’ve already laid the foundation — freeing you to create without sweating the small things.Laravel is a web application framework with expressive, elegant syntax. We’ve already laid the foundation — freeing you to create without sweating the small things.
4. [Vue](https://vuejs.org/) -  a progressive Javascript framework for building user interfaces.

A almost full list of libraries and other software components can be found [here](https://github.com/THM-Health/PILOS/wiki/Libraries)!

## Contributing

Please check our contribution [guidelines](CONTRIBUTING.md).

## License

This PILOS project is open-sourced software licensed under the LGPL license.
