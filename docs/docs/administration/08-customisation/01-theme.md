---
title: Theming
description: Customise the look and feel of PILOS
---

The look of PILOS is defined by the theme.
The theme is a set of colors, fonts and styles that define the appearance of the user interface.
PILOS comes with two themes (Default and THM) that can be customized to fit your needs.

## Create a custom theme

**1. Copy the default theme**

    You need to copy the content of `resources/sass/theme/default` to `resources/sass/theme/custom`.
    This can be done with the following command in the root directory of the PILOS installation:
    ```bash
    docker compose cp app:/var/www/html/resources/sass/theme/default ./resources/sass/theme/custom
    ```

**2. Adjust values**
    
    Next you can adjust the color values in the `resources/sass/theme/custom/_variables.scss` file.
    
    In this example we change the primary color to a red color and make the UI elements not rounded:

    ```scss
    // Overrides variables of app/variables and bootstrap

    // Body background
    $bodyBg: #edf1f6;
    
    // Colors
    $purple: #8e44ad;
    $indigo: #6366F1;
    $blue: #0e84d2;
    $cyan: #06B6D4;
    $red: #c0392b;
    $orange: #d37f00;
    $yellow: #EAB308;
    $green: #27ae60;
    $pink: #EC4899;
    $teal: #0b8e93;
    $bluegray: #3a4d5d;
    
    // Branding color
    $primary: $red;
    $secondary: $bluegray;
    
    // Semantic colors
    $success: $green;
    $info: $blue;
    $warning: $orange;
    $danger: $red;
    $help: $purple;
    $contrast: #020617FF;
    
    $linkColor: $primary;
    
    // Elements to have rounded edges
    $enableRounded: false;
    ```
   
    If you like to customize the font, font color on buttons, etc. have a look at the THM theme in `resources/sass/theme/thm/`.

**3. Change the Theme**
    
    To change the theme, set the name of the theme folder in the `.env` file:
    - Default theme: `VITE_THEME=default`
    - THM theme: `VITE_THEME=thm`
    - Custom theme: `VITE_THEME=custom`

    ```shell
    VITE_THEME=custom
    ```
**4. Rebuild frontend**
    
    After changing the theme, you need to rebuild the frontend to apply the changes.
    By default the fontend is built during the startup of the container, so you can just restart the container.
    ```bash
    docker compose down && docker compose up -d
    ```

    You can also build the frontend manually without restarting the container, by running the following command:
    ```bash
    docker compose exec app pilos-cli frontend:build
    ```
