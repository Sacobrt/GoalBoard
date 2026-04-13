import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../features/auth/store/authStore";

export function PublicRoute() {
    const user = useAuthStore((s) => s.user);
    if (user) {
        return <Navigate to="/dashboard" replace />;
    }
    return <Outlet />;
}
