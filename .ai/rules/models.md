---
paths:
    - "app/Models/**"
---

# Models

## Mass assignment via fillable

Use $fillable allow-lists for mass assignment. Do not use $guarded = [] or leave models without an explicit allow-list.

## Primary keys default to auto-increment

Default to auto-increment integer primary keys. Use non-incrementing string IDs or UUIDs only when the identifier must be hard to guess or is otherwise domain-driven.

## Model lifecycle via observers

Eloquent lifecycle logic lives in app/Observers/*, registered with #[ObservedBy] on the model. Do not use booted() callbacks on models.

## Enum casts on models

Cast enum columns to their PHP enum class (e.g. RoomUserRole::class).

## model_name and getLogLabel on models

Add AddsModelNameTrait to models sent to the frontend. Implement getLogLabel() on models and use it in Log:: context arrays.

## Accessors and mutators via Attribute class

Use the Illuminate\Database\Eloquent\Casts\Attribute class for accessors and mutators (Attribute::make). Do not add new legacy getXxxAttribute() / setXxxAttribute() methods.

## Prefer PHP attributes for model metadata

Attach model metadata with PHP attributes (e.g. #[ObservedBy]) instead of registering the same behavior in service providers.
