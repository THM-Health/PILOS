---
paths:
    - "app/Observers/**"
---

# Observers

## Model lifecycle via observers

Eloquent lifecycle logic lives in app/Observers/*, registered with #[ObservedBy] on the model. Do not use booted() callbacks on models.

## Prefer PHP attributes for observers

Register observers with #[ObservedBy] on the model. Do not use Model::observe() in a service provider.
