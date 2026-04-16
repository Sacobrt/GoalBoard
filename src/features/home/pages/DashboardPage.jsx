import { useState, useMemo, lazy, Suspense } from "react";
import { CheckCircle2, ListTodo, TrendingUp, AlertTriangle, CalendarClock, Plus, KanbanSquare, Check, X, Users, Search } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area } from "recharts";
import { useAuthStore } from "../../auth/store/authStore";
import { useBoardStore } from "../../board/store/boardStore";
import { useKanbanStore } from "../../kanban/store/kanbanStore";
import { timeAgo } from "../../../shared/utils/timeAgo";
import { PageHeader } from "../../../components/patterns/PageHeader";
import { EmptyState } from "../../../components/patterns/EmptyState";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
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
import { ViewSwitcher } from "../../../shared/components/ViewSwitcher";
import { useBoardView } from "../../../shared/hooks/useBoardView";
import { GridView } from "../../../shared/components/board-views/GridView";
import { ListView } from "../../../shared/components/board-views/ListView";
import { TableView } from "../../../shared/components/board-views/TableView";
import { FavoritesView } from "../../../shared/components/board-views/FavoritesView";
import { RecentView } from "../../../shared/components/board-views/RecentView";
import { TimelineView } from "../../../shared/components/board-views/TimelineView";

// Heavy views are lazy-loaded to keep initial bundle lean
const KanbanView = lazy(() => import("../../../shared/components/board-views/KanbanView").then((m) => ({ default: m.KanbanView })));

function greeting() {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
}

export function DashboardPage() {
    const user = useAuthStore((s) => s.user);
    const allBoards = useBoardStore((s) => s.boards);
    const allInvitations = useBoardStore((s) => s.invitations);
    const pinnedBoards = useBoardStore((s) => s.pinnedBoards);
    const boardStages = useBoardStore((s) => s.boardStages);
    const respondToInvitation = useBoardStore((s) => s.respondToInvitation);
    const createBoard = useBoardStore((s) => s.createBoard);
    const deleteBoard = useBoardStore((s) => s.deleteBoard);
    const togglePin = useBoardStore((s) => s.togglePin);
    const setBoardStage = useBoardStore((s) => s.setBoardStage);
    const allTasks = useKanbanStore((s) => s.tasks);

    const boards = allBoards.filter((b) => b.members.some((m) => m.userId === user?.id));
    const pendingInvitations = allInvitations.filter((i) => i.toEmail.toLowerCase() === (user?.email ?? "").toLowerCase() && i.status === "pending");

    const pinnedBoardIds = useMemo(() => new Set(pinnedBoards), [pinnedBoards]);

    const [showNewBoard, setShowNewBoard] = useState(false);
    const [newBoardName, setNewBoardName] = useState("");
    const [deleteBoardId, setDeleteBoardId] = useState(null);
    const [boardSearch, setBoardSearch] = useState("");
    const { view: boardView, setView: setBoardView } = useBoardView();
    const boardToDelete = boards.find((b) => b.id === deleteBoardId);

    const today = new Date().toISOString().split("T")[0];

    // Aggregate stats across all user boards
    const stats = useMemo(() => {
        const boardIds = new Set(boards.map((b) => b.id));
        const tasks = allTasks.filter((t) => boardIds.has(t.boardId) && !t.archived);
        const total = tasks.length;

        // Find "done" columns across all boards
        const doneColumnIds = new Set();
        boards.forEach((b) => b.columns.filter((c) => c.isDone).forEach((c) => doneColumnIds.add(c.id)));

        const done = tasks.filter((t) => doneColumnIds.has(t.columnId)).length;
        const active = total - done;
        const rate = total > 0 ? Math.round((done / total) * 100) : 0;
        const overdue = tasks.filter((t) => t.dueDate && !doneColumnIds.has(t.columnId) && t.dueDate < today).length;
        const dueToday = tasks.filter((t) => t.dueDate && !doneColumnIds.has(t.columnId) && t.dueDate === today).length;

        const recentlyDone = tasks
            .filter((t) => t.completedAt)
            .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
            .slice(0, 5);

        return { total, done, active, rate, overdue, dueToday, recentlyDone };
    }, [boards, allTasks, today]);

    function handleCreateBoard(e) {
        e.preventDefault();
        if (!newBoardName.trim()) return;
        createBoard(newBoardName.trim(), user.id);
        setNewBoardName("");
        setShowNewBoard(false);
    }

    // Chart data: tasks per board (active vs done)
    const boardChartData = useMemo(
        () =>
            boards.map((board) => {
                const boardTasks = allTasks.filter((t) => t.boardId === board.id && !t.archived);
                const doneIds = new Set(board.columns.filter((c) => c.isDone).map((c) => c.id));
                const done = boardTasks.filter((t) => doneIds.has(t.columnId)).length;
                const active = boardTasks.length - done;
                return { name: board.name.length > 14 ? board.name.slice(0, 12) + "..." : board.name, Active: active, Done: done };
            }),
        [boards, allTasks],
    );

    // Chart data: status pie
    const statusPieData = useMemo(() => {
        if (stats.total === 0) return [];
        return [
            { name: "Completed", value: stats.done, color: "#10b981" },
            { name: "Active", value: stats.active, color: "#6366f1" },
        ];
    }, [stats]);

    // Chart data: tasks created per day (last 7 days)
    const activityData = useMemo(() => {
        const boardIds = new Set(boards.map((b) => b.id));
        const tasks = allTasks.filter((t) => boardIds.has(t.boardId));
        const days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return d.toISOString().split("T")[0];
        });
        return days.map((day) => ({
            date: new Date(day).toLocaleDateString(),
            Created: tasks.filter((t) => t.createdAt?.startsWith(day)).length,
            Completed: tasks.filter((t) => t.completedAt?.startsWith(day)).length,
        }));
    }, [boards, allTasks]);

    const filteredBoards = useMemo(() => {
        const sorted = [...boards].sort((a, b) => new Date(b.updatedAt ?? b.createdAt) - new Date(a.updatedAt ?? a.createdAt));
        return !boardSearch ? sorted : sorted.filter((b) => b.name.toLowerCase().includes(boardSearch.toLowerCase()));
    }, [boards, boardSearch]);

    const statCards = [
        {
            label: "Total Tasks",
            value: stats.total,
            icon: ListTodo,
            color: "#6366f1",
            bg: "rgba(99,102,241,0.08)",
        },
        { label: "Active", value: stats.active, icon: TrendingUp, color: "#f59e0b", bg: "rgba(245,158,11,0.08)" },
        { label: "Completed", value: stats.done, icon: CheckCircle2, color: "#10b981", bg: "rgba(16,185,129,0.08)" },
        { label: "Boards", value: boards.length, icon: KanbanSquare, color: "#3b82f6", bg: "rgba(59,130,246,0.08)" },
    ];

    return (
        <div className="pb-8 space-y-8 animate-fade-in">
            {/* Welcome */}
            <PageHeader
                title={
                    <>
                        {greeting()}, <span className="gradient-text">{user?.username}</span>!
                    </>
                }
                description={new Date().toLocaleDateString()}
            />

            {/* Pending invitations */}
            {pendingInvitations.length > 0 && (
                <div className="space-y-2">
                    <h2 className="font-semibold text-sm text-foreground flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        Pending Invitations
                    </h2>
                    {pendingInvitations.map((inv) => (
                        <div key={inv.id} className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3 bg-card">
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground">
                                    <span className="font-semibold">{inv.fromUsername}</span> invited you to <span className="font-semibold">{inv.boardName}</span>
                                </p>
                                <p className="text-xs text-muted-foreground">{timeAgo(inv.createdAt)}</p>
                            </div>
                            <div className="flex gap-2 shrink-0">
                                <Button size="sm" onClick={() => respondToInvitation(inv.id, true, user.id)}>
                                    <Check className="h-3.5 w-3.5" /> Accept
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => respondToInvitation(inv.id, false, user.id)}>
                                    <X className="h-3.5 w-3.5" /> Decline
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Alerts */}
            {(stats.overdue > 0 || stats.dueToday > 0) && (
                <div className="flex flex-wrap gap-3">
                    {stats.overdue > 0 && (
                        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
                            <AlertTriangle className="h-4 w-4" />
                            <span>
                                <strong>{stats.overdue}</strong> overdue {stats.overdue === 1 ? "task" : "tasks"}
                            </span>
                        </div>
                    )}
                    {stats.dueToday > 0 && (
                        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-600">
                            <CalendarClock className="h-4 w-4" />
                            <span>
                                <strong>{stats.dueToday}</strong> due today
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {statCards.map((s) => (
                    <div key={s.label} className="stat-card-glow rounded-xl border border-border p-4 bg-card">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-medium text-muted-foreground">{s.label}</span>
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg" style={{ background: s.bg }}>
                                <s.icon className="h-4 w-4" style={{ color: s.color }} />
                            </div>
                        </div>
                        <p className="text-3xl font-bold" style={{ color: s.color }}>
                            {s.value}
                        </p>
                    </div>
                ))}
            </div>

            {/* Boards */}
            <div>
                {/* Section header row */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <h2 className="font-semibold text-sm text-foreground shrink-0">Your Boards</h2>

                    {boards.length > 0 && (
                        <div className="relative max-w-55 flex-1 min-w-30">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                                value={boardSearch}
                                onChange={(e) => setBoardSearch(e.target.value)}
                                placeholder="Search boards..."
                                className="h-8 text-sm pl-8 pr-7"
                            />
                            {boardSearch && (
                                <button onClick={() => setBoardSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 hover:bg-black/5">
                                    <X className="h-3 w-3 text-muted-foreground" />
                                </button>
                            )}
                        </div>
                    )}

                    <div className="ml-auto flex items-center gap-2 shrink-0">
                        {boards.length > 0 && <ViewSwitcher view={boardView} onViewChange={setBoardView} />}
                        {!showNewBoard && (
                            <Button size="sm" variant="outline" onClick={() => setShowNewBoard(true)}>
                                <Plus className="h-4 w-4" /> New Board
                            </Button>
                        )}
                    </div>
                </div>

                {/* Inline new-board form */}
                {showNewBoard && (
                    <form onSubmit={handleCreateBoard} className="flex items-center gap-2 mb-4">
                        <Input value={newBoardName} onChange={(e) => setNewBoardName(e.target.value)} placeholder="Board name..." autoFocus className="max-w-xs" />
                        <Button size="sm" type="submit">
                            Create
                        </Button>
                        <Button size="sm" variant="ghost" type="button" onClick={() => setShowNewBoard(false)}>
                            <X className="h-3.5 w-3.5" />
                        </Button>
                    </form>
                )}

                {/* Empty states */}
                {boards.length === 0 ? (
                    <EmptyState
                        icon={KanbanSquare}
                        title="Create your first board"
                        description="Boards are flexible workspaces with custom columns and priorities."
                        action={
                            <Button onClick={() => setShowNewBoard(true)}>
                                <Plus className="h-4 w-4" /> New Board
                            </Button>
                        }
                    />
                ) : filteredBoards.length === 0 ? (
                    <div className="rounded-xl border border-border py-10 text-center bg-card">
                        <p className="text-sm text-muted-foreground">No boards match &ldquo;{boardSearch}&rdquo;</p>
                        <button onClick={() => setBoardSearch("")} className="text-xs font-medium mt-1.5 text-primary hover:underline">
                            Clear search
                        </button>
                    </div>
                ) : (
                    /* Active view */
                    <ActiveBoardView
                        view={boardView}
                        onViewChange={setBoardView}
                        boards={filteredBoards}
                        allTasks={allTasks}
                        user={user}
                        pinnedBoardIds={pinnedBoardIds}
                        onTogglePin={togglePin}
                        onDelete={(id) => setDeleteBoardId(id)}
                        boardStages={boardStages}
                        onStageChange={setBoardStage}
                    />
                )}
            </div>

            {/* Charts */}
            {stats.total > 0 && (
                <div className="space-y-4">
                    <h2 className="font-semibold text-sm text-foreground">Analytics</h2>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Activity over last 7 days */}
                        <div className="lg:col-span-2 rounded-xl border border-border p-5 bg-card">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">Activity — Last 7 Days</p>
                            <ResponsiveContainer width="100%" height={200}>
                                <AreaChart data={activityData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="gradCreated" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="gradCompleted" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{
                                            background: "#f8fafc",
                                            border: "1px solid #e2e8f0",
                                            borderRadius: 8,
                                            fontSize: 12,
                                        }}
                                        labelStyle={{ color: "#0f172a", fontWeight: 600 }}
                                    />
                                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                                    <Area type="monotone" dataKey="Created" stroke="#6366f1" strokeWidth={2} fill="url(#gradCreated)" dot={false} />
                                    <Area type="monotone" dataKey="Completed" stroke="#10b981" strokeWidth={2} fill="url(#gradCompleted)" dot={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Status pie */}
                        <div className="rounded-xl border border-border p-5 flex flex-col bg-card">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">Task Status</p>
                            <div className="flex-1 flex flex-col items-center justify-center">
                                <ResponsiveContainer width="100%" height={160}>
                                    <PieChart>
                                        <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                                            {statusPieData.map((entry, i) => (
                                                <Cell key={i} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                background: "#f8fafc",
                                                border: "1px solid #e2e8f0",
                                                borderRadius: 8,
                                                fontSize: 12,
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="flex items-center gap-4 text-xs">
                                    {statusPieData.map((d) => (
                                        <div key={d.name} className="flex items-center gap-1.5">
                                            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                                            <span className="text-muted-foreground">{d.name}</span>
                                            <span className="font-semibold text-foreground">{d.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tasks per board */}
                    {boardChartData.length > 0 && (
                        <div className="rounded-xl border border-border p-5 bg-card">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">Tasks per Board</p>
                            <ResponsiveContainer width="100%" height={180}>
                                <BarChart data={boardChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={20} barCategoryGap="30%">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{
                                            background: "#f8fafc",
                                            border: "1px solid #e2e8f0",
                                            borderRadius: 8,
                                            fontSize: 12,
                                        }}
                                        labelStyle={{ color: "#0f172a", fontWeight: 600 }}
                                    />
                                    <Legend iconType="square" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                                    <Bar dataKey="Active" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="Done" fill="#10b981" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            )}

            {/* Recently completed */}
            {stats.recentlyDone.length > 0 && (
                <div className="rounded-xl border border-border p-5 bg-card">
                    <h2 className="font-semibold text-sm text-foreground mb-4">Recently Completed</h2>
                    <ul className="space-y-3">
                        {stats.recentlyDone.map((t) => (
                            <li key={t.id} className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-2.5 min-w-0">
                                    <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-emerald-500" />
                                    <span className="text-sm truncate text-muted-foreground">{t.title}</span>
                                </div>
                                <span className="text-xs shrink-0 text-muted-foreground">{timeAgo(t.completedAt)}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <AlertDialog open={deleteBoardId !== null} onOpenChange={(open) => !open && setDeleteBoardId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete &ldquo;{boardToDelete?.name}&rdquo;?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete the board and all its tasks. This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
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
        </div>
    );
}

const SHARED_PROPS = ["boards", "allTasks", "user", "pinnedBoardIds", "onTogglePin", "onDelete"];

function ActiveBoardView({ view, onViewChange, boards, allTasks, user, pinnedBoardIds, onTogglePin, onDelete, boardStages, onStageChange }) {
    const shared = { boards, allTasks, user, pinnedBoardIds, onTogglePin, onDelete };

    switch (view) {
        case "grid":
            return <GridView {...shared} />;
        case "list":
            return <ListView {...shared} />;
        case "table":
            return <TableView {...shared} />;
        case "kanban":
            return (
                <Suspense fallback={<div className="py-8 text-center text-sm text-muted-foreground">Loading Kanban view...</div>}>
                    <KanbanView {...shared} boardStages={boardStages} onStageChange={onStageChange} />
                </Suspense>
            );
        case "favorites":
            return <FavoritesView {...shared} onSwitchView={onViewChange} />;
        case "recent":
            return <RecentView {...shared} />;
        case "timeline":
            return <TimelineView {...shared} />;
        default:
            return <GridView {...shared} />;
    }
}
