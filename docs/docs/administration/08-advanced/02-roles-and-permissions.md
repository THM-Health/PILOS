---
title: Roles and permissions
description: Guide how to properly configure roles and permissions
---

## Introduction

Understanding roles and permissions in PILOS is essential for maintaining effective access control and system security.

---

## Permissions

Permissions are the smallest unit of access control in PILOS. They determine which actions a user can perform in the system. Rooms are an exception, where the role of a user within the room also influences their permissions.

### Common Permissions

Most areas in the system include these five permissions:

- **`viewAny`**: Allows viewing a list of items.
- **`view`**: Allows viewing a single item in detail.
- **`create`**: Allows creating new items.
- **`update`**: Allows editing existing items.
- **`delete`**: Allows deleting items.

### Permission Inheritance

Some permissions are hierarchical:

- A user with `delete` permission automatically inherits `update`, `view`, and `viewAny` permissions

The Admin interface displays inherited permissions when editing roles, helping administrators understand the full scope of granted permissions.

---

## Roles

PILOS uses a role-based access control (RBAC) system, where permissions are granted to roles instead of directly to users. This ensures consistent and manageable access control.

### Default Roles

- **Superuser**:  
  A built-in role with all available permissions.
    - Cannot be edited, deleted, or modified by anyone.

---

## Privilege Escalation Risks

Careful management of user and role permissions is crucial to prevent privilege escalation.

### Risks

1. **User Management**:  
   A user with permission to edit or create users can:

    - Assign roles with higher permissions to others.
    - Create new users with elevated privileges.

2. **Role Management**:  
   A user with permission to edit or create roles can:
    - Assign roles with higher privileges than their own to others.
    - Create high-privilege roles and assign them to themselves or others.

### Mitigation Strategies

- Treat user and role management permissions as **administrative**.
- Apply the **principle of least privilege**, granting only the permissions essential for a role's responsibilities.
- Restricting Permissions

---

## Restricting Permissions

When two levels of administrators are required (e.g., superusers and regular admins):

1. Assign the **superuser** role to the highest-level administrators.

    - Superusers have unrestricted access.
    - Non-superusers cannot edit, delete, or create superusers.

2. Create a new **regular admin** role for other administrators with restricted permissions.
    - Regular admins should not manage permissions beyond their intended scope.

**Note**: If regular admins have permissions to manage users or roles, they can bypass restrictions by assigning themselves higher privileges (see _Privilege Escalation Risks_).

---

### Using `PERMISSION_RESTRICTIONS`

To prevent regular admins from managing certain permissions:

1. Define restricted permissions in the `.env` file using the `PERMISSION_RESTRICTIONS` setting.
2. Provide a comma-separated list of restricted permissions.

Example (regular admins cannot manage servers or server pools):

```bash
PERMISSION_RESTRICTIONS=servers.*,serverPools.viewAny,serverPools.view,serverPools.create,serverPools.update,serverPools.delete
```

The permissions can either be a specific permission or a wildcard `*` to restrict all permissions of a group.

Permissions in this list cannot be assigned to roles by anyone except superusers.
