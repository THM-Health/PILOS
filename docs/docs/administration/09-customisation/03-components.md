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

- LandingHeroSection (`resources/js/components/LandingHeroSection.vue`)
- LandingFeaturesSection (`resources/js/components/LandingFeaturesSection.vue`)

The LandingHeroSection contains the animated hero section with the title (`resources/js/components/LandingHeroTitle.vue`), description, the call to action button (`resources/js/components/LandingHeroCTA.vue`) and the images of users.

You can overwrite all or just some of these components to adjust the welcome page to your needs.

If you only want to change the text, you can do this by overwriting the locales. All text used on the welcome page is part of the locale group `home`.
See the [Locales](./02-locales.md#overriding-locales) documentation for more information on how to overwrite locales.

## Footer

The footer component is stored in `resources/js/components/Footer.vue` and accesses global settings to get the links for the legal notice and privacy policy.

## Overwrite components or pages

To override a page or component you need to first copy the file to the `resources/custom/js` folder, change the content and rebuild the frontend.

### Example custom welcome page

**1. Adjust docker-compose file**

Custom components, pages and locales are stored in the `resources/custom` folder.
You need to adjust the docker-compose file to mount this folder into the container.
To preserve the changes between restarts of the container, you should set the environment variable `BUILD_FRONTEND` in the `.env` file to `true`.
This will automatically build the frontend when the container is started.
The build is stored in the `public/build` folder, therefore you must also mount this folder in the container in order to preserve the build between container restarts.

```yaml
- "./resources/custom:/var/www/html/resources/custom"
- "./public/build:/var/www/html/public/build"
```

**2. Copy the view file**

You can do this using the following docker compose command:

```bash
docker compose cp app:/var/www/html/resources/js/views/Home.vue ./resources/custom/js/views/Home.vue
```

**3. Change the file content**

You can change anything you like in the file.

In case you want to add a new translation key, you need to add it to the `resources/custom/lang` folder.
For more information on how to customize the locales, see the [Locales](./02-locales.md) documentation.

**4. Rebuild the frontend**

After changing any view or component, you can rebuild the frontend to apply the changes directly without restarting the container.

```bash
docker compose exec app pilos-cli frontend:build
```
