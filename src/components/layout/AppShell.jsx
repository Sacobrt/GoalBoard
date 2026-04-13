import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../features/auth/store/authStore";
import { useSidebarStore } from "../../shared/hooks/useSidebarStore";
import { useMediaQuery } from "../../shared/hooks/useMediaQuery";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { CommandPalette } from "../patterns/CommandPalette";
import { useEffect } from "react";

/**
 * AppShell — the top-level layout wrapper for all authenticated routes.
 * Contains Sidebar, Header, and content area.
 * Pages render inside <Outlet /> and MUST NOT control layout.
 */
export function AppShell() {
    const user = useAuthStore((s) => s.user);
    const isDesktop = useMediaQuery("(min-width: 768px)");
    const setCollapsed = useSidebarStore((s) => s.setCollapsed);

    // Auto-collapse on mobile, expand on desktop (initial load only)
    useEffect(() => {
        setCollapsed(!isDesktop);
    }, [isDesktop, setCollapsed]);

    if (!user) return <Navigate to="/" replace />;

    return (
        <>
            <CommandPalette />
            <div className="flex h-screen overflow-hidden bg-background">
                <Sidebar />
                <div className="flex-1 flex flex-col min-w-0">
                    <Header />
                    <main className="flex-1 overflow-y-auto">
                        <div className="px-5">
                            <Outlet />
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
}
