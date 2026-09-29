---
paths:
    - "app/Http/Controllers/**"
---

# Controllers

## Multi-method controllers with explicit routes

Use plain multi-method controllers with domain-specific action names. Register routes explicitly with [Controller::class, "method"]. Reserve Route::apiResource() for simple admin CRUD only. Do not default to invokable controllers.

## Controller authorization call sites

Register standard CRUD authorization with authorizeResource() in API controller constructors. Use $this->authorize() for ad-hoc checks in controller methods (especially web/download controllers). Use $user->can() only for conditional branching inside methods, not as the primary access gate.
