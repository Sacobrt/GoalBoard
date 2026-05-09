import { Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { DashboardPage } from "../features/home/pages/DashboardPage";
import { LandingPage } from "../features/landing/pages/LandingPage";
import { GetStartedPage } from "../features/auth/pages/GetStartedPage";
import { RequestDemoPage } from "../features/landing/pages/RequestDemoPage";
import { HelpCenterPage } from "../features/landing/pages/HelpCenterPage";
import { TermsPage } from "../features/landing/pages/TermsPage";
import { KanbanPage } from "../features/kanban/pages/KanbanPage";
import { BoardSettingsPage } from "../features/board/pages/BoardSettingsPage";
import { WorkloadPage } from "../features/board/pages/WorkloadPage";
import { AdminDashboard } from "../features/admin/pages/AdminDashboard";
import { SettingsPage } from "../features/settings/pages/SettingsPage";
import { ProtectedRoute } from "../shared/auth/ProtectedRoute";
import { PublicRoute } from "../shared/auth/PublicRoute";

export default function App() {
    return (
        <Routes>
            {/* Public routes — redirect to dashboard if already authenticated */}
            <Route element={<PublicRoute />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<GetStartedPage />} />
            </Route>

            {/* Accessible to everyone (logged-in or not) */}
            <Route path="/request-demo" element={<RequestDemoPage />} />

            {/* Landing page — accessible to everyone (logged-in or not) */}
            <Route path="/" element={<LandingPage />} />

            {/* Static pages */}
            <Route path="/help" element={<HelpCenterPage />} />
            <Route path="/terms" element={<TermsPage />} />

            {/* Protected routes (AppShell layout) */}
            <Route element={<AppShell />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/board/:boardId" element={<KanbanPage />} />
                <Route path="/board/:boardId/settings" element={<BoardSettingsPage />} />
                <Route path="/board/:boardId/workload" element={<WorkloadPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute permission="canAccessAdminPanel">
                            <AdminDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
        </Routes>
    );
}
