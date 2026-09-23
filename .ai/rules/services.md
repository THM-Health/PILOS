---
paths:
    - "app/Services/**"
---

# Services

## Model-bound service objects

Instantiate domain services with new Service($model). Use domain-named public methods (start, join, getJoinUrl), not handle/execute/__invoke. Do not introduce Action classes.

## No repository or DTO layer

Query Eloquent directly in controllers and services. Pass Eloquent models, arrays, or plain objects. Do not introduce repositories, query objects, or spatie/laravel-data DTOs.

## Direct service calls over events

Call services directly for domain workflow. Dispatch RoomStarted/RoomEnded only at room lifecycle boundaries for listener side effects.
