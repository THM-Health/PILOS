<!--
SPDX-FileCopyrightText: 2025 Technische Hochschule Mittelhessen (THM) and PILOS contributors

SPDX-License-Identifier: AGPL-3.0-or-later
-->

# Frontend Guidelines

## Tools and Architecture

- **PrimeVue** is used for building the UI within a Vue.js SPA.
- **Vue Router** handles client-side routing.
- **Pinia** manages application state.
- **Axios** is used for HTTP communication with the backend API.
- **Vite** is the build tool for fast development and optimized production builds.
- **Vue 3 Composition API** is the preferred pattern for components and state logic.
- **vue-i18n** provides internationalization and localization support.

## Documentation

- Follow the official PrimeVue documentation for component usage and customization: https://primevue.org/llms/llms.txt

## Styling

- PrimeVue’s **styled mode** is used, built on top of Tailwind CSS utility classes.
- PrimeVue includes its own Tailwind presets, like custom colors.
- Prefer **PrimeVue components** over custom UI components whenever possible.
- Use **PrimeVue color tokens** instead of custom colors to maintain design consistency.

## Conventions

- The frontend is structured into **pages** and **components**:
    - Page components are stored in `resources/js/views` and map directly to routes.
    - Reusable components are stored in `resources/js/components`.
- For CRUD resources:
    - Use an **Index** page for listing items.
    - Use a **View** page for viewing/editing a single item.
    - Add a **New** page only if the creation flow is significantly different from editing.
- Naming conventions:
    - Use **PascalCase** for all pages and components.
    - Names should go from broad context → specific purpose (e.g., `UserProfileForm`, `ProjectListItem`).
