---
paths:
    - "app/**"
    - "tests/**"
---

# File uploads

## Never use clientExtension() for stored filenames

Do not call `UploadedFile::clientExtension()` (or Symfony `guessClientExtension()`) when choosing an on-disk name, path, or public URL.

`clientExtension()` is derived from the **client-supplied multipart `Content-Type`**, not from validated filename or file content. That header is not covered by Laravel’s `extensions` / `mimes` / `File::types()` rules and can be spoofed (e.g. `application/x-httpd-php` → `.php` while the body and filename still pass validation). See GHSA-qr8q-4pjq-4r52.

When writing **or reviewing** upload code, reject any use of `clientExtension()` / `guessClientExtension()` for storage. Prefer:

- `guessExtension()` (content / finfo), after `File::types()` / `mimes` validation, or
- `getClientOriginalExtension()` only when it was explicitly validated with `extensions:` and the allow-list cannot include dangerous types, or
- a **fixed** server-chosen extension (e.g. force `.css`), or
- Laravel `store()` / `storePublicly()` / `hashName()` (uses content-based extension)

```php
// BAD — Content-Type controls the stored extension
$path = $file->storeAs('uploads', 'file.'.$file->clientExtension(), 'public');

// GOOD — content-based extension
$path = $file->storeAs('uploads', 'file.'.$file->guessExtension(), 'public');

// GOOD — fixed extension
$path = $file->storeAs('styles', 'theme.css', 'public');
```

Also flag storing user uploads under a web-executable path without ensuring the web server will not run them (PILOS: only `/index.php` may reach php-fpm; other `*.php` must 404).
