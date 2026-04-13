import { useAuthStore } from "../../features/auth/store/authStore";
import { can } from "./permissions";

export function usePermission(permission) {
    const user = useAuthStore((s) => s.user);
    return can(user, permission);
}
