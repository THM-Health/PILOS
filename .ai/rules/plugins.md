---
paths:
    - "app/Plugins/**"
---

# Plugins

## Plugin contract override pattern

Define contracts in Plugins/Contracts/, defaults in Plugins/Defaults/, overrides in Plugins/Custom/. Bind via PluginServiceProvider and config/plugins.php.
