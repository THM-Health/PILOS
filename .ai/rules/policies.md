---
paths:
    - "app/Policies/**"
---

# Policies

## Domain authorization in Policy classes

Put model and domain authorization in Policy classes under app/Policies. Use Gate::define only for dev-tool dashboard gates (Horizon, Telescope, Pulse). Bare permission strings are resolved globally via Gate::before and User::hasPermission(), not via Gate::define.
