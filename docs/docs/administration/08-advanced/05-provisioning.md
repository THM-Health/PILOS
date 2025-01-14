---
title: Provisioning
description: Instructions for provisioning new PILOS instances
---

## Provisioning via JSON files

PILOS provides a command to provision servers, server pools, room types, roles, users and settings with JSON files.

**Example**

```bash
docker compose exec app pilos-cli provision:all provisioning_data.json
```

The provided file must be readable inside the container. You can place it in a mounted folder or copy it into the container.
Remember that this file contains sensitive data - you probably want to delete it after provisioning.

An example JSON file showcasing most capabilities can be found in [test data](https://github.com/THM-Health/PILOS/blob/4.x/tests/Backend/Fixtures/provisioning_data.json).

The following sections form a complete specification of the file format.

### Top-level sections

| Field          | Type     | Default | Description                            |
| -------------- | -------- | ------- | -------------------------------------- |
| `servers`      | `object` | `{}`    | Creating and/or wiping of servers      |
| `server_pools` | `object` | `{}`    | Creating and/or wiping of server pools |
| `room_types`   | `object` | `{}`    | Creating and/or wiping of room types   |
| `roles`        | `object` | `{}`    | Creating and/or wiping of user roles   |
| `users`        | `object` | `{}`    | Creating and/or wiping of users        |
| `settings`     | `object` | `{}`    | Configuration of application settings  |

### Section `servers`

| Field  | Type       | Default | Description                                                                  |
| ------ | ---------- | ------- | ---------------------------------------------------------------------------- |
| `wipe` | `boolean`  | `false` | If set to `true`, all existing servers are deleted before creating new ones. |
| `add`  | `[object]` | `[]`    | A list of new servers to create.                                             |

All items in the `add` array have the following format:

| Field         | Type      | Description                           |
| ------------- | --------- | ------------------------------------- |
| `name`        | `string`  | Server name shown in frontend         |
| `description` | `string`  | Server description shown in frontend  |
| `endpoint`    | `string`  | BBB worker API URL                    |
| `secret`      | `string`  | BBB worker API secret                 |
| `strength`    | `integer` | Server strength [1 .. 10]             |
| `status`      | `string`  | Server status [`enabled`, `disabled`] |

All fields are required and do not have default values.

### Section `server_pools`

| Field  | Type       | Default | Description                                                                       |
| ------ | ---------- | ------- | --------------------------------------------------------------------------------- |
| `wipe` | `boolean`  | `false` | If set to `true`, all existing server pools are deleted before creating new ones. |
| `add`  | `[object]` | `[]`    | A list of new server pools to create.                                             |

All items in the `add` array have the following format:

| Field         | Type       | Description                                |
| ------------- | ---------- | ------------------------------------------ |
| `name`        | `string`   | Server pool name shown in frontend         |
| `description` | `string`   | Server pool description shown in frontend  |
| `servers`     | `[string]` | Names of all servers belonging to the pool |

All fields are required and do not have default values.

### Section `room_types`

| Field  | Type       | Default | Description                                                                     |
| ------ | ---------- | ------- | ------------------------------------------------------------------------------- |
| `wipe` | `boolean`  | `false` | If set to `true`, all existing room types are deleted before creating new ones. |
| `add`  | `[object]` | `[]`    | A list of new room types to create.                                             |

All items in the `add` array have the following format:

| Field         | Type     | Description                                                                   |
| ------------- | -------- | ----------------------------------------------------------------------------- |
| `name`        | `string` | Room type name shown in frontend                                              |
| `description` | `string` | Room type description shown in frontend                                       |
| `color`       | `string` | Color used for the room type in frontend, given as hex-string, e.g. `#f00baa` |
| `server_pool` | `string` | Name of the server pool to use for meetings                                   |

All fields are required and do not have default values.

### Section `roles`

| Field  | Type       | Default | Description                                                                |
| ------ | ---------- | ------- | -------------------------------------------------------------------------- |
| `wipe` | `boolean`  | `false` | If set to `true`, all existing roles are deleted before creating new ones. |
| `add`  | `[object]` | `[]`    | A list of new roles to create.                                             |

All items in the `add` array have the following format:

| Field         | Type     | Description                  |
| ------------- | -------- | ---------------------------- |
| `name`        | `string` | Role name shown in frontend  |
| `permissions` | `object` | Permissions granted to users |

All fields are required and do not have default values. The `permissions` object has the following format:

| Field         | Type       | Default | Available permissions                                                  |
| ------------- | ---------- | ------- | ---------------------------------------------------------------------- |
| `rooms`       | `[string]` | `[]`    | `viewAll`, `create`, `manage`                                          |
| `meetings`    | `[string]` | `[]`    | `viewAny`                                                              |
| `settings`    | `[string]` | `[]`    | `viewAny`, `update`                                                    |
| `users`       | `[string]` | `[]`    | `viewAny`, `view`, `update`, `create`, `delete`, `updateOwnAttributes` |
| `roles`       | `[string]` | `[]`    | `viewAny`, `view`, `update`, `create`, `delete`                        |
| `roomTypes`   | `[string]` | `[]`    | `view`, `update`, `create`, `delete`                                   |
| `servers`     | `[string]` | `[]`    | `viewAny`, `view`, `update`, `create`, `delete`                        |
| `serverPools` | `[string]` | `[]`    | `viewAny`, `view`, `update`, `create`, `delete`                        |

### Section `users`

| Field  | Type       | Default | Description                                                                |
| ------ | ---------- | ------- | -------------------------------------------------------------------------- |
| `wipe` | `boolean`  | `false` | If set to `true`, all existing users are deleted before creating new ones. |
| `add`  | `[object]` | `[]`    | A list of new users to create.                                             |

All items in the `add` array have the following format:

| Field           | Type       | Description                                                                                                                                                                                                           |
| --------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `firstname`     | `string`   | First name                                                                                                                                                                                                            |
| `lastname`      | `string`   | Last name                                                                                                                                                                                                             |
| `email`         | `string`   | Email address                                                                                                                                                                                                         |
| `password`      | `string`   | Password (plain text!)                                                                                                                                                                                                |
| `authenticator` | `string`   | One of [`local`, `ldap`, `shibboleth`]                                                                                                                                                                                |
| `roles`         | `[string]` | List of role names                                                                                                                                                                                                    |
| `locale`        | `string`   | One of the `ENABLED_LOCALES` in `.env`; see [User Interface and Localization Configuration](https://thm-health.github.io/PILOS/docs/next/administration/configuration/#user-interface-and-localization-configuration) |
| `timezone`      | `string`   | Timezone, e.g. `Europe/Berlin`                                                                                                                                                                                        |

All fields are required and do not have default values.

### Section `settings`

| Field       | Type     | Default | Description                  |
| ----------- | -------- | ------- | ---------------------------- |
| `general`   | `object` | `{}`    | General application settings |
| `recording` | `object` | `{}`    | Recording settings           |
| `room`      | `object` | `{}`    | Room settings                |
| `user`      | `object` | `{}`    | User settings                |

#### Subsection `general`

| Field                  | Type      | Description                         |
| ---------------------- | --------- | ----------------------------------- |
| `name`                 | `string`  | Name of the application             |
| `pagination_page_size` | `integer` | Pagination page size                |
| `default_timezone`     | `string`  | Default timezone                    |
| `help_url`             | `string`  | URL to the help page                |
| `legal_notice_url`     | `string`  | URL to the legal notice             |
| `privacy_policy_url`   | `string`  | URL to the privacy policy           |
| `toast_lifetime`       | `integer` | Display duration of pop-up messages |
| `no_welcome_page`      | `boolean` | Hide welcome page                   |

#### Subsection `recording`

| Field                            | Type      | Description                                         |
| -------------------------------- | --------- | --------------------------------------------------- |
| `server_usage_enabled`           | `boolean` | Record server utilisation                           |
| `server_usage_retention_period`  | `integer` | Retention period of the server utilisation in days  |
| `meeting_usage_enabled`          | `boolean` | Record utilisation of meetings                      |
| `meeting_usage_retention_period` | `integer` | Retention period of the meeting utilisation in days |
| `attendance_retention_period`    | `integer` | Retention period of the attendance logging in days  |
| `recording_retention_period`     | `integer` | Storage duration of the recordings in days          |

#### Subsection `room`

| Field                           | Type      | Description                                 |
| ------------------------------- | --------- | ------------------------------------------- |
| `limit`                         | `integer` | Room limit                                  |
| `token_expiration`              | `integer` | Expiration time for personalized room links |
| `auto_delete_inactive_period`   | `integer` | Period until inactive rooms are deleted     |
| `auto_delete_never_used_period` | `integer` | Period until never used rooms are deleted   |
| `auto_delete_deadline_period`   | `integer` | Deadline for deletion                       |
| `file_terms_of_use`             | `string`  | Terms of use for file download              |

#### Subsection `user`

| Field                     | Type      | Description                                               |
| ------------------------- | --------- | --------------------------------------------------------- |
| `password_change_allowed` | `boolean` | Give local users the possibility to change their password |
