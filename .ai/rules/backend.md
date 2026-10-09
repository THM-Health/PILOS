---
paths:
    - "tests/Backend/**"
---

# Backend

## Backend test conventions

Use RefreshDatabase on test classes that touch the database; use DatabaseMigrations only for console tests that exercise schema wipe/import/upgrade. Create test-owned records with factories; seed RolesAndPermissionsSeeder (and ServerSeeder when servers are required) for shared reference data. Prefer real integration with facade fakes (Http::fake, Notification::fake, Storage::fake); use Mockery only for external DBs, specific service boundaries, or cache locks. Assert API JSON with assertJsonFragment, assertJsonPath, and assertJson — not AssertableJson.
