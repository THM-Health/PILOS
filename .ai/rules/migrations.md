---
paths:
    - "database/migrations/**"
---

# Migrations

## Primary keys default to auto-increment

Default to auto-increment integer primary keys. Use non-incrementing string IDs or UUIDs only when the identifier must be hard to guess or is otherwise domain-driven.

## Foreign key declaration by referenced key type

Use $table->foreign("col")->references("id")->on("table") when the referenced primary key is not a standard bigint id. Use $table->foreignId("col")->constrained() for standard bigint pivot/junction foreign keys. Do not use foreignIdFor().

## Enum columns in migrations

Store enum values as integer-family columns (integer, tinyInteger, smallInteger). Do not use DB enum() columns. Default values may reference PHP enum cases.

## Reversible migration down methods

Always implement real reverse logic in down() — drop created tables/columns and undo data transforms where applicable.
