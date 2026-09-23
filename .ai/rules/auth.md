---
paths:
    - "app/Auth/**"
---

# Auth

## Auth organized by protocol

Place each authentication driver under app/Auth/{Protocol}/ with its Provider, Controller, ServiceProvider, and user/value classes as needed.

## SPA redirect and link URLs

Use hardcoded frontend path strings (/external_login, /rooms, /logout, etc.) for SPA destinations. Use url("/path") when an absolute URL is required.
