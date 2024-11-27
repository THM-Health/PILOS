---
title: Plugins
---

import DocCardList from '@theme/DocCardList';

The default behavior of PILOS can be customized by plugins.

## Creating a plugin

- In `app/Plugins/Contracts` you can find the contracts for each plugin.
- In `app/Plugins/Defaults` you can find the default implementation of each plugin.

To override the default implementation of a plugin, you have to create a new class with the same name that implements the corresponding contract in the `app/Plugins/Custom` namespace/folder.

## Installation

1. Adjust the docker-compose file to mount the custom plugin directory into the container.

    ```yaml
    - "./app/Plugins/Custom:/var/www/html/app/Plugins/Custom"
    ```

2. Add your plugin file the custom plugin directory `app/Plugins/Custom`.

3. Next you have to register the class name of the plugin in the `.env` file. Multiple plugins can be registered by separating them with a comma.
    ```env
    PLUGINS=ServerLoadCalculationPlugin
    ```

## Supported Plugins

<DocCardList />
