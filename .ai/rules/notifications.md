---
paths:
    - "app/Notifications/**"
---

# Notifications

## SPA redirect and link URLs

Use hardcoded frontend path strings (/external_login, /rooms, /logout, etc.) for SPA destinations. Use url("/path") when an absolute URL is required.

## Encrypt queued notifications that carry secrets

Queued notifications (`ShouldQueue`) are serialized into the queue store (Redis) and can be inspected in Horizon by anyone with `system.monitor`. If a notification holds a password-reset, welcome, email-verify, or other capability token (or similar secret) in a property, it **must** also implement `Illuminate\Contracts\Queue\ShouldBeEncrypted` so the job payload is encrypted at rest.

```php
class PasswordReset extends Notification implements ShouldBeEncrypted, ShouldQueue
{
    use Queueable;
}
```

Do not queue plaintext tokens. Prefer encryption over switching to `notifyNow` unless synchronous delivery is required for the flow.
