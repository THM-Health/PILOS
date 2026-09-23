---
paths:
    - "lang/**"
---

# Lang

## PHP short-key translations

Add strings to lang/{locale}/{group}.php with dotted keys (group.nested.key). Use __("group.key") in PHP. Do not add lang/*.json sentence-key files.

## Centralize validation messages in lang files

Define attribute names and custom rule messages in lang/*/validation.php. Reference them via __("validation...") from Form Requests and Rule classes; use Form Request messages()/attributes() only for request-specific overrides.
