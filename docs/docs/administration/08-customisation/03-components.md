---
title: Components
description: Overwrite vue components
---

PILOS is build with Vue.js.
Each page a user can visit is stored in the `resources/js/views` folder.
Depending on the complexity of the page, the view is split into multiple components, sometimes with multiple levels of nesting.

Building and maintaining an API to allow for custom components within the whole UI is a complex task.
The frontend infrastructure is build so that in theory every component can be overwritten.
Therefore, we only support overwriting a few selected components that are mostly static and do not interact with to many other components.

## Welcome page
The welcome page is stored in `resources/js/views/Home.vue` and consists of the two components:
- LandingHeaderSection (`resources/js/components/LandingHeaderSection.vue`)
- LandingFeaturesSection (`resources/js/components/LandingFeaturesSection.vue`)

## Footer
The footer component is stored in `resources/js/components/Footer.vue` and accesses global settings to get the links for the legal notice and privacy policy.

## Overwrite components or pages

To override a page or component you need to first copy the file to the `resources/custom/js` folder, change the content and rebuild the frontend.

### Example custom welcome page

**1. Copy the view file**

    You can do this using the following docker compose command:
    ```bash
    docker compose cp app:/var/www/html/resources/js/views/Home.vue ./resources/custom/js/views/Home.vue
    ```
**2. Change the file content**

   You can change anything you like in the file.

   In case you want to add a new translation key, you need to add it to the `resources/custom/lang` folder.
   For more information on how to customize the locales, see the [Locales](./03-locales.md) documentation.

**3. Rebuild the frontend**

   After changing any view or component, you need to rebuild the frontend to apply the changes.
   By default, the frontend is built during the startup of the container, so you can just restart the container.
    ```bash
    docker compose down && docker compose up -d
    ```

   You can also build the frontend manually without restarting the container, by running the following command:
    ```bash
    docker compose exec app pilos-cli frontend:build
    ```
