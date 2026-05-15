import { useState, useMemo, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
    Users,
    Shield,
    Search,
    X,
    MessageSquare,
    Check,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Trash2,
    KanbanSquare,
    Pencil,
    User,
    Mail,
    Globe,
    MapPin,
    Building2,
    Briefcase,
    GraduationCap,
    Eraser,
} from "lucide-react";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from "../../../components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../../../components/ui/dialog";
import { Textarea } from "../../../components/ui/textarea";
import { ROLES, ROLE_LABELS, ALL_ROLES } from "../../../shared/auth/roles";
import { useAuthStore } from "../../auth/store/authStore";
import { PageHeader } from "../../../components/patterns/PageHeader";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { UserAvatar } from "../../../shared/components/UserAvatar";
import { useBoardStore } from "../../board/store/boardStore";
import { useDemoRequestStore } from "../store/demoRequestStore";
import { useNotificationStore } from "../../notifications/store/notificationStore";
import { timeAgo } from "../../../shared/utils/timeAgo";
import { profileSchema } from "../../settings/schemas/profileSchema";

const adminEditSchema = profileSchema.omit({ username: true });

const DEMO_GRANT_DETAIL = `Your demo board "Demo Project" has been created and is ready on your dashboard.

What's included:
  • A fully pre-populated Kanban board with realistic tasks
  • Columns: Planning, Doing, Review, Done
  • Sample tasks with due dates, labels, priorities, and descriptions
  • Workload tracker & team member simulation

Getting started:
  1. Open your Dashboard and find the "Demo Project" board
  2. Click any task card to explore task details
  3. Drag cards between columns to experience the Kanban workflow
  4. Visit Board Settings to explore customisation options

Enjoy exploring Goal Board! Reach out if you have any questions.`;

function getAllUsers() {
    return JSON.parse(localStorage.getItem("goalboard_users") ?? "[]");
}

export function AdminDashboard() {
    const currentUser = useAuthStore((s) => s.user);
    const [search, setSearch] = useState("");
    const [users, setUsers] = useState(getAllUsers);
    const location = useLocation();
    const [activeTab, setActiveTab] = useState("users"); // "users" | "boards" | "demos"

    useEffect(() => {
        document.title = "Admin \u2014 Goal Board";
    }, []);

    useEffect(() => {
        const tab = new URLSearchParams(location.search).get("tab");
        if (tab === "demos" || tab === "boards" || tab === "users") {
            setActiveTab(tab);
        }
    }, [location.search]);

    // Board management
    const boards = useBoardStore((s) => s.boards);
    const deleteBoard = useBoardStore((s) => s.deleteBoard);

    // Demo requests
    const demoRequests = useDemoRequestStore((s) => s.requests);
    const updateDemoStatus = useDemoRequestStore((s) => s.updateStatus);
    const deleteDemoRequest = useDemoRequestStore((s) => s.deleteRequest);
    const grantDemo = useDemoRequestStore((s) => s.grantDemo);
    const newDemoCount = demoRequests.filter((r) => r.status === "new").length;

    const [grantDemoReq, setGrantDemoReq] = useState(null); // The request being granted

    const PAGE_SIZE = 10;
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, search]);

    const filteredUsers = useMemo(() => {
        const q = search.toLowerCase();
        return users.filter(
            (u) =>
                !q ||
                u.username.toLowerCase().includes(q) ||
                u.email.toLowerCase().includes(q) ||
                (u.fullName && u.fullName.toLowerCase().includes(q)) ||
                (u.organization && u.organization.toLowerCase().includes(q)),
        );
    }, [users, search]);

    const filteredBoards = useMemo(() => {
        const q = search.toLowerCase();
        return boards.filter((b) => !q || b.name.toLowerCase().includes(q));
    }, [boards, search]);

    const filteredDemos = useMemo(() => {
        const q = search.toLowerCase();
        return demoRequests.filter((r) => !q || r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q) || r.company.toLowerCase().includes(q));
    }, [demoRequests, search]);

    const paginatedUsers = useMemo(() => filteredUsers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE), [filteredUsers, currentPage]);
    const paginatedBoards = useMemo(() => filteredBoards.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE), [filteredBoards, currentPage]);
    const paginatedDemos = useMemo(() => filteredDemos.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE), [filteredDemos, currentPage]);

    const allUsers = useMemo(() => getAllUsers(), []);

    function handleRoleChange(userId, newRole) {
        const updated = users.map((u) => (u.id === userId ? { ...u, role: newRole } : u));
        localStorage.setItem("goalboard_users", JSON.stringify(updated));
        setUsers(updated);

        if (userId === currentUser?.id) {
            useAuthStore.getState().updateProfile({ role: newRole });
        }
    }

    const [deleteUserId, setDeleteUserId] = useState(null);
    const userToDelete = users.find((u) => u.id === deleteUserId);

    function confirmDeleteUser() {
        if (!deleteUserId) return;
        const updated = users.filter((u) => u.id !== deleteUserId);
        localStorage.setItem("goalboard_users", JSON.stringify(updated));
        setUsers(updated);
        localStorage.removeItem(`goalboard_avatar_${deleteUserId}`);
        setDeleteUserId(null);
    }

    // Edit user dialog state
    const [editUserId, setEditUserId] = useState(null);
    const editingUser = users.find((u) => u.id === editUserId);
    const [editForm, setEditForm] = useState({});
    const [editErrors, setEditErrors] = useState({});

    function openEditUser(u) {
        setEditUserId(u.id);
        setEditErrors({});
        setEditForm({
            fullName: u.fullName ?? "",
            bio: u.bio ?? "",
            website: u.website ?? "",
            location: u.location ?? "",
            organization: u.organization ?? "",
            jobTitle: u.jobTitle ?? "",
            education: u.education ?? "",
        });
    }

    function handleEditFormChange(field, value) {
        setEditForm((prev) => ({ ...prev, [field]: value }));
    }

    function clearField(field) {
        setEditForm((prev) => ({ ...prev, [field]: "" }));
    }

    function saveEditUser() {
        if (!editUserId) return;
        const result = adminEditSchema.safeParse(editForm);
        if (!result.success) {
            const fieldErrors = {};
            for (const issue of result.error.issues) {
                const field = issue.path[0];
                if (!fieldErrors[field]) fieldErrors[field] = issue.message;
            }
            setEditErrors(fieldErrors);
            return;
        }
        setEditErrors({});
        const patch = result.data;
        const updated = users.map((u) => (u.id === editUserId ? { ...u, ...patch } : u));
        localStorage.setItem("goalboard_users", JSON.stringify(updated));
        setUsers(updated);
        // If editing self, update session too
        if (editUserId === currentUser?.id) {
            useAuthStore.getState().updateProfile(patch);
        }
        setEditUserId(null);
    }

    const [deleteBoardId, setDeleteBoardId] = useState(null);
    const boardToDelete = boards.find((b) => b.id === deleteBoardId);

    const [selectedBoardIds, setSelectedBoardIds] = useState(new Set());
    const [bulkDeleteBoards, setBulkDeleteBoards] = useState(false);

    useEffect(() => {
        setSelectedBoardIds(new Set());
    }, [activeTab, search, currentPage]);

    const allPageBoardsSelected = paginatedBoards.length > 0 && paginatedBoards.every((b) => selectedBoardIds.has(b.id));
    const someBoardsSelected = paginatedBoards.some((b) => selectedBoardIds.has(b.id));

    function toggleBoardRow(id) {
        setSelectedBoardIds((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }

    function toggleAllPageBoards() {
        if (allPageBoardsSelected) {
            setSelectedBoardIds((prev) => {
                const next = new Set(prev);
                paginatedBoards.forEach((b) => next.delete(b.id));
                return next;
            });
        } else {
            setSelectedBoardIds((prev) => {
                const next = new Set(prev);
                paginatedBoards.forEach((b) => next.add(b.id));
                return next;
            });
        }
    }

    function confirmBulkDeleteBoards() {
        selectedBoardIds.forEach((id) => deleteBoard(id));
        setSelectedBoardIds(new Set());
        setBulkDeleteBoards(false);
    }

    const [deleteDemoId, setDeleteDemoId] = useState(null);
    const demoToDelete = demoRequests.find((r) => r.id === deleteDemoId);

    const totalUsers = users.length;
    const adminCount = users.filter((u) => u.role === ROLES.ADMIN || !u.role).length;

    const STATUS_LABELS = { new: "New", contacted: "Contacted", closed: "Closed" };
    const STATUS_COLORS = { new: "bg-emerald-50 text-emerald-700", contacted: "bg-amber-50 text-amber-700", closed: "bg-slate-100 text-slate-500" };

    const activeTotal = activeTab === "users" ? filteredUsers.length : activeTab === "boards" ? filteredBoards.length : filteredDemos.length;
    const totalPages = Math.max(1, Math.ceil(activeTotal / PAGE_SIZE));
    const pageStart = activeTotal === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
    const pageEnd = Math.min(currentPage * PAGE_SIZE, activeTotal);
    const pageRange = (() => {
        if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
        if (currentPage <= 4) return [1, 2, 3, 4, 5, "...", totalPages];
        if (currentPage >= totalPages - 3) return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
    })();

    return (
        <div className="pb-8 animate-fade-in">
            <PageHeader title="Admin Panel" description="Manage users, roles, and system settings" />

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                <div className="rounded-xl border border-border p-4 bg-card">
                    <div className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4 text-primary" />
                        <span className="text-xs font-medium text-muted-foreground">Total Users</span>
                    </div>
                    <p className="text-2xl font-bold text-primary">{totalUsers}</p>
                </div>
                <div className="rounded-xl border border-border p-4 bg-card">
                    <div className="flex items-center gap-2 mb-2">
                        <Shield className="h-4 w-4 text-amber-500" />
                        <span className="text-xs font-medium text-muted-foreground">Admins</span>
                    </div>
                    <p className="text-2xl font-bold text-amber-500">{adminCount}</p>
                </div>
                <div className="rounded-xl border border-border p-4 bg-card">
                    <div className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4 text-blue-500" />
                        <span className="text-xs font-medium text-muted-foreground">Standard Users</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-500">{totalUsers - adminCount}</p>
                </div>
                <div className="rounded-xl border border-border p-4 bg-card">
                    <div className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4 text-cyan-500" />
                        <span className="text-xs font-medium text-muted-foreground">Demo Requests</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold text-cyan-500">{demoRequests.length}</p>
                        {newDemoCount > 0 && (
                            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 rounded-full px-2 py-0.5">{newDemoCount} new</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 mb-6 border-b border-border">
                <button
                    onClick={() => setActiveTab("users")}
                    className="px-4 py-2 text-sm font-medium transition-colors"
                    style={{
                        borderBottom: activeTab === "users" ? "2px solid #6366f1" : "2px solid transparent",
                        color: activeTab === "users" ? "#6366f1" : "#64748b",
                    }}
                >
                    <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" /> Users
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab("boards")}
                    className="px-4 py-2 text-sm font-medium transition-colors"
                    style={{
                        borderBottom: activeTab === "boards" ? "2px solid #6366f1" : "2px solid transparent",
                        color: activeTab === "boards" ? "#6366f1" : "#64748b",
                    }}
                >
                    <div className="flex items-center gap-2">
                        <KanbanSquare className="h-4 w-4" /> System Boards
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab("demos")}
                    className="px-4 py-2 text-sm font-medium transition-colors"
                    style={{
                        borderBottom: activeTab === "demos" ? "2px solid #06b6d4" : "2px solid transparent",
                        color: activeTab === "demos" ? "#06b6d4" : "#64748b",
                    }}
                >
                    <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" /> Demo Requests
                        {newDemoCount > 0 && (
                            <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold">
                                {newDemoCount}
                            </span>
                        )}
                    </div>
                </button>
            </div>

            <div className="rounded-xl border border-border overflow-hidden bg-card">
                <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border">
                    <div className="flex items-center gap-2">
                        {activeTab === "users" && <Users className="h-4 w-4 text-primary" />}
                        {activeTab === "boards" && <KanbanSquare className="h-4 w-4 text-primary" />}
                        {activeTab === "demos" && <MessageSquare className="h-4 w-4 text-cyan-500" />}
                        <h2 className="font-semibold text-sm text-foreground">
                            {activeTab === "users" ? "User Management" : activeTab === "boards" ? "System Boards" : "Demo Requests"}
                        </h2>
                        {activeTab === "boards" && selectedBoardIds.size > 0 && (
                            <Button size="sm" variant="destructive" className="ml-2 h-7 text-xs" onClick={() => setBulkDeleteBoards(true)}>
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete {selectedBoardIds.size} selected
                            </Button>
                        )}
                    </div>
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={`Search ${activeTab}...`}
                            className="pl-9 pr-8 h-8 text-sm"
                        />
                        {search && (
                            <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 hover:bg-black/5">
                                <X className="h-3 w-3 text-muted-foreground" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    {activeTab === "users" ? (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border bg-muted">
                                    <th className="text-left text-xs font-semibold px-5 py-3 text-muted-foreground">User</th>
                                    <th className="text-left text-xs font-semibold px-5 py-3 text-muted-foreground">Email</th>
                                    <th className="text-left text-xs font-semibold px-5 py-3 text-muted-foreground hidden lg:table-cell">Details</th>
                                    <th className="text-left text-xs font-semibold px-5 py-3 text-muted-foreground">Role</th>
                                    <th className="text-left text-xs font-semibold px-5 py-3 text-muted-foreground">Joined</th>
                                    <th className="text-right text-xs font-semibold px-5 py-3 text-muted-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedUsers.map((u) => {
                                    const isSelf = u.id === currentUser?.id;
                                    const role = u.role || ROLES.ADMIN;

                                    return (
                                        <tr key={u.id} className="border-b border-border last:border-b-0 transition-colors hover:bg-muted">
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-3">
                                                    <UserAvatar user={u} size="md" />
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium text-foreground truncate">
                                                            {u.fullName || u.username}
                                                            {isSelf && <span className="ml-1.5 text-xs font-normal text-muted-foreground">(you)</span>}
                                                        </p>
                                                        {u.fullName && <p className="text-xs text-muted-foreground truncate">@{u.username}</p>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className="text-sm truncate text-muted-foreground">{u.email}</span>
                                            </td>
                                            <td className="px-5 py-3 hidden lg:table-cell">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {u.organization && (
                                                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-muted rounded-md px-1.5 py-0.5">
                                                            <Building2 className="h-3 w-3" />
                                                            {u.organization}
                                                        </span>
                                                    )}
                                                    {u.location && (
                                                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-muted rounded-md px-1.5 py-0.5">
                                                            <MapPin className="h-3 w-3" />
                                                            {u.location}
                                                        </span>
                                                    )}
                                                    {u.jobTitle && (
                                                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-muted rounded-md px-1.5 py-0.5">
                                                            <Briefcase className="h-3 w-3" />
                                                            {u.jobTitle}
                                                        </span>
                                                    )}
                                                    {!u.organization && !u.location && !u.jobTitle && (
                                                        <span className="text-[11px] text-muted-foreground/50 italic">No details</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3">
                                                <select
                                                    value={role}
                                                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                                    className="text-xs font-medium rounded-lg px-2.5 py-1.5 border border-border cursor-pointer transition-colors hover:border-border focus:outline-none focus:ring-2 focus:ring-ring bg-card"
                                                    style={{
                                                        color: role === ROLES.ADMIN ? "#d97706" : "#64748b",
                                                    }}
                                                >
                                                    {ALL_ROLES.map((r) => (
                                                        <option key={r} value={r}>
                                                            {ROLE_LABELS[r]}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className="text-xs text-muted-foreground">
                                                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => openEditUser(u)}
                                                        className="text-muted-foreground hover:text-foreground"
                                                        title="Edit user"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    {!isSelf && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setDeleteUserId(u.id)}
                                                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                            title="Delete user"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredUsers.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-5 py-8 text-center text-sm text-muted-foreground">
                                            No users found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    ) : activeTab === "boards" ? (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border bg-muted">
                                    <th className="px-5 py-3 w-8">
                                        <input
                                            type="checkbox"
                                            checked={allPageBoardsSelected}
                                            ref={(el) => {
                                                if (el) el.indeterminate = someBoardsSelected && !allPageBoardsSelected;
                                            }}
                                            onChange={toggleAllPageBoards}
                                            className="h-4 w-4 rounded border-border cursor-pointer accent-primary"
                                            title="Select all on this page"
                                        />
                                    </th>
                                    <th className="text-left text-xs font-semibold px-5 py-3 text-muted-foreground">Board Name</th>
                                    <th className="text-left text-xs font-semibold px-5 py-3 text-muted-foreground">Owner</th>
                                    <th className="text-left text-xs font-semibold px-5 py-3 text-muted-foreground">Members</th>
                                    <th className="text-left text-xs font-semibold px-5 py-3 text-muted-foreground">Columns</th>
                                    <th className="text-right text-xs font-semibold px-5 py-3 text-muted-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedBoards.map((b) => {
                                    const owner = allUsers.find((u) => u.id === b.ownerId);
                                    const isSelected = selectedBoardIds.has(b.id);
                                    return (
                                        <tr
                                            key={b.id}
                                            onClick={() => toggleBoardRow(b.id)}
                                            className={`border-b border-border last:border-b-0 transition-colors cursor-pointer select-none ${isSelected ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted"}`}
                                        >
                                            <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleBoardRow(b.id)}
                                                    className="h-4 w-4 rounded border-border cursor-pointer accent-primary"
                                                />
                                            </td>
                                            <td className="px-5 py-3 font-medium text-foreground">{b.name}</td>
                                            <td className="px-5 py-3">
                                                {owner ? (
                                                    <div className="flex items-center gap-2">
                                                        <UserAvatar user={owner} size="sm" />
                                                        <span className="text-sm text-muted-foreground">{owner.username}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">Unknown</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3 text-muted-foreground">
                                                {b.members.length} member{b.members.length !== 1 && "s"}
                                            </td>
                                            <td className="px-5 py-3 text-muted-foreground">
                                                {b.columns.length} column{b.columns.length !== 1 && "s"}
                                            </td>
                                            <td className="px-5 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setDeleteBoardId(b.id)}
                                                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredBoards.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-5 py-8 text-center text-sm text-muted-foreground">
                                            No boards found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    ) : (
                        /* Demo Requests table */
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border bg-muted">
                                    <th className="text-left text-xs font-semibold px-4 py-2.5 text-muted-foreground">Requester</th>
                                    <th className="text-left text-xs font-semibold px-4 py-2.5 text-muted-foreground hidden md:table-cell">Details</th>
                                    <th className="text-left text-xs font-semibold px-4 py-2.5 text-muted-foreground hidden lg:table-cell">Submitted</th>
                                    <th className="text-left text-xs font-semibold px-4 py-2.5 text-muted-foreground">Status</th>
                                    <th className="text-right text-xs font-semibold px-4 py-2.5 text-muted-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedDemos.map((r) => {
                                    const isLinked = !!(r.userId && allUsers.find((u) => u.id === r.userId));
                                    const hasEmailMatch = !r.userId && allUsers.some((u) => u.email.toLowerCase() === r.email.toLowerCase());
                                    const isRegistered = isLinked || hasEmailMatch;
                                    return (
                                        <tr key={r.id} className="border-b border-border last:border-b-0 transition-colors hover:bg-muted/50 group">
                                            {/* Requester */}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-7 h-7 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center text-xs font-bold shrink-0 select-none">
                                                        {r.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium text-foreground leading-tight">{r.name}</p>
                                                        <p className="text-xs text-muted-foreground truncate">{r.email}</p>
                                                    </div>
                                                </div>
                                                <div className="mt-1.5 pl-9 flex flex-wrap gap-1">
                                                    {isLinked && (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-1.5 py-0.5">
                                                            <Check className="h-2.5 w-2.5" /> Registered
                                                        </span>
                                                    )}
                                                    {hasEmailMatch && (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-1.5 py-0.5">
                                                            <Check className="h-2.5 w-2.5" /> Account found
                                                        </span>
                                                    )}
                                                    {!isRegistered && (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-1.5 py-0.5">
                                                            Not registered
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            {/* Details: company + message */}
                                            <td className="px-4 py-3 hidden md:table-cell max-w-55">
                                                {r.company && (
                                                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-0.5">
                                                        <Building2 className="h-3 w-3 shrink-0" />
                                                        <span className="truncate font-medium text-foreground">{r.company}</span>
                                                    </div>
                                                )}
                                                <p className="text-xs text-muted-foreground truncate" title={r.message || undefined}>
                                                    {r.message ? r.message : <span className="italic">No message</span>}
                                                </p>
                                            </td>
                                            {/* Submitted */}
                                            <td className="px-4 py-3 hidden lg:table-cell whitespace-nowrap">
                                                <span className="text-xs text-muted-foreground" title={new Date(r.createdAt).toLocaleString()}>
                                                    {timeAgo(r.createdAt)}
                                                </span>
                                            </td>
                                            {/* Status */}
                                            <td className="px-4 py-3">
                                                <select
                                                    value={r.status}
                                                    onChange={(e) => updateDemoStatus(r.id, e.target.value)}
                                                    className={`text-[11px] font-semibold rounded-full px-2.5 py-1 border cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring transition-colors ${STATUS_COLORS[r.status]}`}
                                                    style={{ background: "transparent" }}
                                                >
                                                    {Object.entries(STATUS_LABELS).map(([val, label]) => (
                                                        <option key={val} value={val}>
                                                            {label}
                                                        </option>
                                                    ))}
                                                </select>
                                                {r.grantedAt && (
                                                    <div className="flex items-center gap-1 mt-1.5 text-[10px] text-emerald-600 font-semibold">
                                                        <Check className="h-3 w-3" /> Granted {timeAgo(r.grantedAt)}
                                                    </div>
                                                )}
                                            </td>
                                            {/* Actions */}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-1">
                                                    {!r.grantedAt && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-7 px-2.5 text-[11px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200 shadow-none"
                                                            onClick={() => setGrantDemoReq(r)}
                                                            title="Grant demo project"
                                                        >
                                                            <Check className="h-3 w-3" /> Grant
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setDeleteDemoId(r.id)}
                                                        className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        title="Delete request"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredDemos.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-5 py-10 text-center text-sm text-muted-foreground">
                                            {demoRequests.length === 0 ? "No demo requests yet" : "No requests match your search"}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-5 py-3 border-t border-border">
                        <span className="text-xs text-muted-foreground">
                            Showing {pageStart}–{pageEnd} of {activeTotal}
                        </span>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            {pageRange.map((page, i) =>
                                page === "..." ? (
                                    <span key={`ellipsis-${i}`} className="px-1.5 text-xs text-muted-foreground select-none">
                                        ...
                                    </span>
                                ) : (
                                    <Button
                                        key={page}
                                        variant={currentPage === page ? "default" : "outline"}
                                        size="sm"
                                        className="h-8 w-8 p-0 text-xs"
                                        onClick={() => setCurrentPage(page)}
                                    >
                                        {page}
                                    </Button>
                                ),
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <AlertDialog open={deleteUserId !== null} onOpenChange={(open) => !open && setDeleteUserId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete &ldquo;{userToDelete?.username}&rdquo;?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete the user account. This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-red-500 hover:bg-red-600" onClick={confirmDeleteUser}>
                            Delete User
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={bulkDeleteBoards} onOpenChange={(open) => !open && setBulkDeleteBoards(false)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Delete {selectedBoardIds.size} board{selectedBoardIds.size !== 1 && "s"}?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the selected {selectedBoardIds.size === 1 ? "board" : `${selectedBoardIds.size} boards`} and all their data
                            system-wide. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-red-500 hover:bg-red-600" onClick={confirmBulkDeleteBoards}>
                            Delete {selectedBoardIds.size === 1 ? "Board" : `${selectedBoardIds.size} Boards`}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={deleteBoardId !== null} onOpenChange={(open) => !open && setDeleteBoardId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete &ldquo;{boardToDelete?.name}&rdquo;?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the board and all its data system-wide. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-500 hover:bg-red-600"
                            onClick={() => {
                                deleteBoard(deleteBoardId);
                                setDeleteBoardId(null);
                            }}
                        >
                            Delete Board
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={deleteDemoId !== null} onOpenChange={(open) => !open && setDeleteDemoId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete demo request from &ldquo;{demoToDelete?.name}&rdquo;?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently remove the demo request. This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-500 hover:bg-red-600"
                            onClick={() => {
                                deleteDemoRequest(deleteDemoId);
                                setDeleteDemoId(null);
                            }}
                        >
                            Delete Request
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Edit User Dialog */}
            <Dialog open={editUserId !== null} onOpenChange={(open) => !open && setEditUserId(null)}>
                <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit User — {editingUser?.fullName || editingUser?.username}</DialogTitle>
                        <DialogDescription>Manage profile information. Use the clear button to remove sensitive data from individual fields.</DialogDescription>
                    </DialogHeader>

                    {editingUser && (
                        <div className="space-y-4 py-2">
                            {/* Read-only info */}
                            <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 border border-border">
                                <UserAvatar user={editingUser} size="lg" />
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-foreground">@{editingUser.username}</p>
                                    <p className="text-xs text-muted-foreground">{editingUser.email}</p>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                        Joined{" "}
                                        {editingUser.createdAt
                                            ? new Date(editingUser.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
                                            : "—"}
                                    </p>
                                </div>
                            </div>

                            {/* Editable fields */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <EditField
                                    icon={User}
                                    label="Full Name"
                                    value={editForm.fullName}
                                    onChange={(v) => handleEditFormChange("fullName", v)}
                                    onClear={() => clearField("fullName")}
                                    placeholder="John Doe"
                                    error={editErrors.fullName}
                                />
                                <EditField
                                    icon={Building2}
                                    label="Organization"
                                    value={editForm.organization}
                                    onChange={(v) => handleEditFormChange("organization", v)}
                                    onClear={() => clearField("organization")}
                                    placeholder="Google LLC"
                                    error={editErrors.organization}
                                />
                                <EditField
                                    icon={Briefcase}
                                    label="Job Title"
                                    value={editForm.jobTitle}
                                    onChange={(v) => handleEditFormChange("jobTitle", v)}
                                    onClear={() => clearField("jobTitle")}
                                    placeholder="Software Engineer"
                                    error={editErrors.jobTitle}
                                />
                                <EditField
                                    icon={MapPin}
                                    label="Location"
                                    value={editForm.location}
                                    onChange={(v) => handleEditFormChange("location", v)}
                                    onClear={() => clearField("location")}
                                    placeholder="Osijek, Croatia"
                                    error={editErrors.location}
                                />
                                <EditField
                                    icon={Globe}
                                    label="Website"
                                    value={editForm.website}
                                    onChange={(v) => handleEditFormChange("website", v)}
                                    onClear={() => clearField("website")}
                                    placeholder="https://example.com"
                                    error={editErrors.website}
                                />
                                <EditField
                                    icon={GraduationCap}
                                    label="Education"
                                    value={editForm.education}
                                    onChange={(v) => handleEditFormChange("education", v)}
                                    onClear={() => clearField("education")}
                                    placeholder="MIT — CS"
                                    error={editErrors.education}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-medium text-muted-foreground">Bio</label>
                                <div className="relative">
                                    <Textarea
                                        value={editForm.bio}
                                        onChange={(e) => handleEditFormChange("bio", e.target.value)}
                                        placeholder="User bio..."
                                        maxLength={300}
                                        className="min-h-16 resize-none pr-8"
                                    />
                                    {editForm.bio && (
                                        <button
                                            type="button"
                                            onClick={() => clearField("bio")}
                                            className="absolute top-2 right-2 p-1 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
                                            title="Clear bio"
                                        >
                                            <Eraser className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                </div>
                                <p className="text-[10px] text-muted-foreground text-right">{editForm.bio.length}/300</p>
                                {editErrors.bio && (
                                    <p className="text-destructive text-xs font-medium" role="alert">
                                        {editErrors.bio}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditUserId(null)}>
                            Cancel
                        </Button>
                        <Button onClick={saveEditUser}>
                            <Check className="h-4 w-4" />
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Grant Demo Dialog */}
            {grantDemoReq && (
                <GrantDemoDialog
                    open={!!grantDemoReq}
                    onOpenChange={(v) => !v && setGrantDemoReq(null)}
                    request={grantDemoReq}
                    users={users}
                    onConfirm={(userId) => {
                        grantDemo(grantDemoReq.id, userId);
                        useNotificationStore.getState().addNotification({
                            userId,
                            type: "demo_granted",
                            message: "Your demo project is ready! Open it from your dashboard.",
                            boardName: "",
                            detail: DEMO_GRANT_DETAIL,
                        });
                        setGrantDemoReq(null);
                    }}
                />
            )}
        </div>
    );
}

function GrantDemoDialog({ open, onOpenChange, request, users, onConfirm }) {
    const [selectedUserId, setSelectedUserId] = useState("");

    // Try to pre-select: prefer linked userId, then email match
    useEffect(() => {
        if (open && request) {
            if (request.userId) {
                const linked = users.find((u) => u.id === request.userId);
                setSelectedUserId(linked ? linked.id : "");
            } else {
                const match = users.find((u) => u.email.toLowerCase() === request.email.toLowerCase());
                setSelectedUserId(match ? match.id : "");
            }
        }
    }, [open, request, users]);

    if (!request) return null;

    const linkedUser = request.userId ? users.find((u) => u.id === request.userId) : null;
    const emailMatchUser = !request.userId ? users.find((u) => u.email.toLowerCase() === request.email.toLowerCase()) : null;
    const hasRegisteredAccount = !!(linkedUser || emailMatchUser);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Grant Demo Project</DialogTitle>
                    <DialogDescription>Create a pre-populated demo board for this user. This action cannot be undone.</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-3">
                    <div className="bg-muted p-3 rounded-md text-sm">
                        <p>
                            <strong>Requester:</strong> {request.name}
                        </p>
                        <p>
                            <strong>Email:</strong> {request.email}
                        </p>
                        <p>
                            <strong>Company:</strong> {request.company || "N/A"}
                        </p>
                    </div>

                    {!hasRegisteredAccount ? (
                        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
                            <p className="font-semibold mb-0.5">No registered account found</p>
                            <p className="text-xs text-amber-700">
                                This requester hasn't created an account yet. Ask them to register first, then return here to grant the demo.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Target user account</label>
                            {linkedUser ? (
                                <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm">
                                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                                    <div className="min-w-0">
                                        <p className="font-medium text-emerald-800">{linkedUser.fullName || linkedUser.username}</p>
                                        <p className="text-xs text-emerald-700">{linkedUser.email}</p>
                                    </div>
                                    <span className="ml-auto text-[10px] font-semibold text-emerald-600 bg-emerald-100 rounded-full px-2 py-0.5 shrink-0">
                                        Linked account
                                    </span>
                                </div>
                            ) : (
                                <select
                                    value={selectedUserId}
                                    onChange={(e) => setSelectedUserId(e.target.value)}
                                    className="w-full flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="" disabled>
                                        -- Select a registered user --
                                    </option>
                                    {users.map((u) => (
                                        <option key={u.id} value={u.id}>
                                            {u.fullName || u.username} ({u.email})
                                        </option>
                                    ))}
                                </select>
                            )}
                            <p className="text-xs text-muted-foreground">
                                {linkedUser
                                    ? "This user submitted the request while logged in — their account is automatically linked."
                                    : "A registered account was found by matching the request email."}
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        disabled={!hasRegisteredAccount || (!linkedUser && !selectedUserId)}
                        onClick={() => onConfirm(linkedUser ? linkedUser.id : selectedUserId)}
                        className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                    >
                        <Check className="w-4 h-4" /> Grant Demo
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/** Inline editable field with clear button for admin user editing */
function EditField({ icon: Icon, label, value, onChange, onClear, placeholder, error }) {
    return (
        <div className="space-y-1.5">
            <label className="block text-xs font-medium text-muted-foreground">{label}</label>
            <div className="relative">
                <Icon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="pl-8 pr-8 h-9 text-sm"
                    placeholder={placeholder}
                    aria-invalid={!!error}
                />
                {value && (
                    <button
                        type="button"
                        onClick={onClear}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
                        title={`Clear ${label.toLowerCase()}`}
                    >
                        <Eraser className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>
            {error && (
                <p className="text-destructive text-xs font-medium" role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}
