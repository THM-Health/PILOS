---
title: Configuration
---

Additionally to the [general configuration options](../administration/03-configuration.md), the development environment can be configured with the following options.

## Development Configuration

| Option            | Default Value         | Description                                                 |
|-------------------|-----------------------|-------------------------------------------------------------|
| `APP_PORT`        | `80`                  | Port for the application.                                   |
| `APP_SSL_PORT`    | `443`                 | Port for the application with SSL.                          |
| `DOCS_PORT`       | `3000`                | Port for the documentation.                                 |
| `VITE_ENABLE_AXE` | `false`               | Enable accessibility check tools.                           |
| `VITE_SSL`        | `false`               | Use SSL for development hot reloading of the frontend code. |
| `VITE_HOST`       | `localhost`           | Domain and port for the Vite dev server.                    |
| `VITE_PORT`       | `1073`                | Port for the Vite dev server.                               |
| `WWWGROUP`        | `82` (alpine default) | Group ID of the `www-data` user inside the container.       |
| `WWWUSER`         | `82` (alpine default) | User ID of the `www-data` user inside the container.        |
