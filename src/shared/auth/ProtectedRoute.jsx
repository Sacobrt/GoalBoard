import { Navigate } from "react-router-dom";
import { usePermission } from "./usePermission";

export function ProtectedRoute({ permission, children, fallback = "/" }) {
    const allowed = usePermission(permission);
    if (!allowed) return <Navigate to={fallback} replace />;
    return children;
}
