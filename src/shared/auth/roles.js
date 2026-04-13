/**
 * Role definitions for the RBAC system.
 * Start with admin/user.
 */
export const ROLES = {
    ADMIN: "admin",
    USER: "user",
};

export const DEFAULT_ROLE = ROLES.USER;

// Human-readable role labels for UI display
export const ROLE_LABELS = {
    [ROLES.ADMIN]: "Admin",
    [ROLES.USER]: "User",
};

// All available roles (ordered by privilege level)
export const ALL_ROLES = [ROLES.ADMIN, ROLES.USER];
