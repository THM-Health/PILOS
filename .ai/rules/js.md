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
