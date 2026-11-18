---
paths:
    - "resources/js/**"
---

# Js

## Frontend is a Vue SPA on Laravel API

Build UI in Vue (views/components, Vue Router, Pinia). Laravel Blade is only the SPA shell; backend data comes from /api/v1/ via Axios, not Inertia or Livewire.

## Vue i18n uses same PHP keys

Reference translations with $t("group.key") or useI18n().t(). Keys match PHP lang files; translations load from /api/v1/locale/{locale}, not separate frontend JSON files.

## Frontend authorization via JS policies

Check UI permissions with useUserPermissions().can(method, policy) — pass a Policy class name string (e.g. "UserPolicy") or a model object with model_name. Put permission logic in resources/js/policies/, not inline in components.

## Frontend views, components, stores, and API

Put routable pages in views/; reusable UI in components/; use Admin*Index/View/New naming for admin CRUD. Use Pinia stores for shared app state. HTTP calls go through useApi() → Api class.

## Vue Router params must be constrained

In `resources/js/router.js`, every dynamic segment that can flow into an API URL (or other request path) must use a restrictive param regex (e.g. `:id([a-z0-9-]+)`, `:id(\\d+)`, `:token([A-Za-z0-9]+)`). Unconstrained params are percent-decoded and can inject `/`, `?`, `&`, or `..` into same-origin API calls. Do not add `:id` / `:token` / similar without a charset regex. Update `tests/Frontend/e2e/GeneralApplication.cy.js` (“rejects urls with invalid route params”) when adding constrained params. See the comment above `export const routes` in `router.js`.
