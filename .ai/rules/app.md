---
paths:
    - "app/**"
---

# App

## Database transaction style

Use manual DB::beginTransaction(), DB::commit(), and DB::rollBack() inside try/catch blocks. Do not use DB::transaction() closures.

## Idempotent write pattern

Prefer find-then-branch-then-save (Model::where(...)->first(), then create or update manually). Use firstOrCreate()/updateOrCreate() only for simple keyed lookups; do not use upsert().

## Static Str helpers over Stringable

Use static Str::method() calls (Str::random(), Str::finish(), Str::startsWith(), etc.), not Str::of()->... fluent chains.

## Prefer dependency injection

Prefer constructor or method dependency injection over app(), resolve(), or App::make() when the dependency can be type-hinted. Avoid service location for settings and application services that the container can provide.

## Prefer PHP attributes

Use PHP attributes whenever the framework supports them (e.g. #[ObservedBy] for observers, and other attribute-based APIs). Prefer attributes over equivalent provider registration or magic-method styles.
