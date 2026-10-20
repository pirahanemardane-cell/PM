# Permissions

Roles: guest, customer, staff, admin
Code: src/lib/permissions.ts can(role, permission)
Server: src/lib/admin/require-permission.ts

Admin panel still uses requireAdmin (admin only) for safety.
Staff can be opened later per-page with requirePermission.
