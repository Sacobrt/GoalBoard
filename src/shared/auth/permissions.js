import { ROLES } from "./roles";

/**
 * Permission map: role → array of permission keys.
 * This is the single source of truth for what each role can do.
 */
const PERMISSION_MAP = {
    [ROLES.ADMIN]: ["canAccessAdminPanel", "canManageUsers", "canManageRoles", "canEditBoard", "canDeleteBoard", "canDeleteTask", "canViewAllBoards"],
    [ROLES.USER]: ["canEditBoard", "canDeleteTask"],
};

export function can(user, permission) {
    if (!user?.role) return false;
    const perms = PERMISSION_MAP[user.role] ?? [];
    return perms.includes(permission);
}

export function getPermissionsForRole(role) {
    return PERMISSION_MAP[role] ?? [];
}

export const ALL_PERMISSIONS = ["canAccessAdminPanel", "canManageUsers", "canManageRoles", "canEditBoard", "canDeleteBoard", "canDeleteTask", "canViewAllBoards"];
