---
paths:
    - "app/Http/Resources/**"
---

# Resources

## Resource relationship inclusion

Gate optional relationships and nested data with fluent resource methods (withPermissions(), withDetails(), withServers(), etc.) and $this->when() / whenPivotLoaded(). Do not use whenLoaded().

## Expose model_name in resources

Include model_name in JsonResources for frontend-facing models so the SPA can run policy checks.
