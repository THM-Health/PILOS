# Frontend Guidelines

## Tools and Architecture
- PrimeVue is used for building user interfaces as a Vue.js SPA application.
- Vue Router is used for client-side routing.
- Pinia is used for state management.
- Axios is used for making HTTP requests to the backend API.
- Vite is used as the build tool for faster development and optimized production builds.
- Vue 3 Composition API is preferred for building components and managing state.
- vue18n is used for internationalization and localization.

## Documentation
- Follow PrimeVue documentation for component usage and customization at https://primevue.org/llms/llms.txt

## Styling
- PrimeVue's styled mode is used, which is using Tailwind CSS utility classes for styling. PrimeVue has it's own tailwind styles but it can be extended with Tailwind CSS classes.
- Always prefer using PrimeVue components over custom components when possible.
- Use PrimeVue's colors over specifying custom colors to maintain design consistency.

## Conventions
- The frontend contains of pages and components. Each frontend route maps to a page component located in the `resources/js/views` directory.
- For CRUD resources we usually have an Index page (for listing items), a View page (for viewing a single item). If the logic for creating is vastly different from editing, we have a dedicated New page, otherwise we use the View page for creating, viewing and editing.
- Complex pages or sections should be broken down into smaller, reusable components located in the `resources/js/components` directory.
- All pages and components follow the PascalCase naming convention describing their purpose from the broder context to the more specific context.
