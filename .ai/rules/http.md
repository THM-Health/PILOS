---
paths:
    - "app/Http/**"
---

# Http

## No repository or DTO layer

Query Eloquent directly in controllers and services. Pass Eloquent models, arrays, or plain objects. Do not introduce repositories, query objects, or spatie/laravel-data DTOs.

## Validate with Form Request classes

Type-hint a dedicated Form Request per endpoint; put rules in rules(). Reserve Validator::make() for non-controller validation (services, middleware).

## Server-side named routes

Use route("name") for Laravel backend routes (auth callbacks, recording downloads, API webhooks). Do not use action([...]).

## Eager-loading strategy for list endpoints

List/index queries use SQL joins for sortable related columns. Reserve $with for child models that always need their parent. Do not enable preventLazyLoading.
