import { useState, useMemo } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { useNavigate } from "react-router-dom";
import {
    AlertTriangle,
    ChevronRight,
    X,
    CheckCircle2,
    ArrowUpDown,
    ExternalLink,
    MoreHorizontal,
    Flag,
    Clock,
    CheckCheck,
    KanbanSquare,
    Flame,
    Users,
    LayoutList,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "../../../components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { UserAvatar } from "../../../shared/components/UserAvatar";
import { useKanbanStore } from "../../kanban/store/kanbanStore";
import { useBoardStore } from "../../board/store/boardStore";
import { useAuthStore } from "../../auth/store/authStore";

const URGENCY_CONFIG = {
    critical: {
        label: "Critical",
        icon: Flame,
        textColor: "text-red-600",
        numColor: "text-red-700",
        bgActive: "bg-red-50",
        borderActive: "border-red-200",
        badgeBg: "bg-red-100 text-red-700 ring-red-200",
        leftBorder: "border-l-red-500",
        rowBg: "hover:bg-red-50/40",
    },
    warning: {
        label: "Warning",
        icon: AlertTriangle,
        textColor: "text-orange-500",
        numColor: "text-orange-700",
        bgActive: "bg-orange-50",
        borderActive: "border-orange-200",
        badgeBg: "bg-orange-100 text-orange-700 ring-orange-200",
        leftBorder: "border-l-orange-500",
        rowBg: "hover:bg-orange-50/40",
    },
    atRisk: {
        label: "At Risk",
        icon: Clock,
        textColor: "text-amber-500",
        numColor: "text-amber-700",
        bgActive: "bg-amber-50",
        borderActive: "border-amber-200",
        badgeBg: "bg-amber-100 text-amber-700 ring-amber-200",
        leftBorder: "border-l-amber-400",
        rowBg: "hover:bg-amber-50/40",
    },
};

const SORT_FNS = {
    date: (a, b) => (a.dueDate < b.dueDate ? -1 : 1),
    priority: (a, b) => {
        const order = { high: 0, medium: 1, low: 2, none: 3 };
        const rank = (t) => order[t._topPriorityLevel ?? "none"] ?? 3;
        return rank(a) - rank(b);
    },
    board: (a, b) => (a._boardName ?? "").localeCompare(b._boardName ?? ""),
    overdue: (a, b) => b._daysOverdue - a._daysOverdue,
};

const TODAY = () => new Date().toISOString().split("T")[0];

function daysOverdue(dueDateStr) {
    const due = new Date(dueDateStr.split("T")[0]);
    const now = new Date(TODAY());
    return Math.round((now - due) / 86_400_000);
}

function formatDueDate(dueDateStr) {
    return new Date(dueDateStr.split("T")[0] + "T00:00:00").toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function getUrgencyKey(days) {
    if (days >= 7) return "critical";
    if (days >= 3) return "warning";
    return "atRisk";
}

function useOverdueTasks(boards, allTasks) {
    return useMemo(() => {
        const today = TODAY();
        const boardMap = new Map(boards.map((b) => [b.id, b]));
        const allUsers = JSON.parse(localStorage.getItem("goalboard_users") ?? "[]");

        const doneColumnIds = new Set();
        boards.forEach((b) => b.columns.filter((c) => c.isDone).forEach((c) => doneColumnIds.add(c.id)));

        return allTasks
            .filter(
                (t) => boardMap.has(t.boardId) && !t.archived && !t.completedAt && !doneColumnIds.has(t.columnId) && t.dueDate && t.dueDate.split("T")[0] < today,
            )
            .map((t) => {
                const board = boardMap.get(t.boardId);
                const priorityIds = t.priorityIds ?? (t.priorityId ? [t.priorityId] : []);
                const priorities = board?.priorities ?? [];
                const taskPriorities = priorityIds.map((id) => priorities.find((p) => p.id === id)).filter(Boolean);

                const levelOf = (label) => {
                    const l = label?.toLowerCase();
                    if (l === "high") return 0;
                    if (l === "medium") return 1;
                    if (l === "low") return 2;
                    return 3;
                };
                const topPriority = taskPriorities.sort((a, b) => levelOf(a.label) - levelOf(b.label))[0];

                const assigneeIds = t.assigneeIds ?? (t.assigneeId ? [t.assigneeId] : []);
                const assignees = assigneeIds.map((id) => allUsers.find((u) => u.id === id)).filter(Boolean);
                const column = board?.columns.find((c) => c.id === t.columnId);

                return {
                    ...t,
                    _boardName: board?.name ?? "Unknown Board",
                    _board: board,
                    _priorities: taskPriorities,
                    _topPriority: topPriority ?? null,
                    _topPriorityLevel: topPriority?.label?.toLowerCase() ?? null,
                    _daysOverdue: daysOverdue(t.dueDate),
                    _assignees: assignees,
                    _columnTitle: column?.title ?? null,
                };
            })
            .sort(SORT_FNS.date);
    }, [boards, allTasks]);
}

export function OverdueTasksBanner() {
    const [open, setOpen] = useState(false);

    const user = useAuthStore((s) => s.user);
    const allBoards = useBoardStore((s) => s.boards);
    const allTasks = useKanbanStore((s) => s.tasks);

    const boards = useMemo(() => allBoards.filter((b) => b.members.some((m) => m.userId === user?.id)), [allBoards, user]);
    const overdueTasks = useOverdueTasks(boards, allTasks);

    if (overdueTasks.length === 0) return null;

    const hasCritical = overdueTasks.some((t) => t._daysOverdue >= 7);
    const count = overdueTasks.length;

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                aria-label={`${count} overdue ${count === 1 ? "task" : "tasks"} — click to view`}
                className={cn(
                    "group relative flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-sm",
                    "cursor-pointer text-left transition-all duration-150",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
                    hasCritical
                        ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:border-red-300 hover:shadow-sm focus-visible:ring-red-400"
                        : "border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 hover:border-orange-300 hover:shadow-sm focus-visible:ring-orange-400",
                )}
            >
                {/* Pulsing urgency dot */}
                <span className="relative flex h-2 w-2 shrink-0">
                    <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", hasCritical ? "bg-red-400" : "bg-orange-400")} />
                    <span className={cn("relative inline-flex h-2 w-2 rounded-full", hasCritical ? "bg-red-500" : "bg-orange-500")} />
                </span>

                <AlertTriangle className="h-4 w-4 shrink-0" />

                <span className="flex-1 font-medium">
                    <strong className="font-bold">{count}</strong> overdue {count === 1 ? "task" : "tasks"}
                </span>

                <span className="hidden items-center gap-1 text-xs opacity-60 transition-opacity group-hover:opacity-100 md:flex">
                    View details
                    <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
                <ChevronRight className="h-3.5 w-3.5 opacity-50 md:hidden" />
            </button>

            <OverdueTasksSheet open={open} onClose={() => setOpen(false)} overdueTasks={overdueTasks} boards={boards} />
        </>
    );
}

function OverdueTasksSheet({ open, onClose, overdueTasks, boards }) {
    const [sortBy, setSortBy] = useState("date");
    const [filterBoardId, setFilterBoardId] = useState("all");
    const [groupByBoard, setGroupByBoard] = useState(true);

    const updateTask = useKanbanStore((s) => s.updateTask);
    const navigate = useNavigate();

    const stats = useMemo(
        () => ({
            critical: overdueTasks.filter((t) => t._daysOverdue >= 7).length,
            warning: overdueTasks.filter((t) => t._daysOverdue >= 3 && t._daysOverdue < 7).length,
            atRisk: overdueTasks.filter((t) => t._daysOverdue < 3).length,
        }),
        [overdueTasks],
    );

    const filtered = useMemo(() => {
        const tasks = filterBoardId === "all" ? overdueTasks : overdueTasks.filter((t) => t.boardId === filterBoardId);
        return [...tasks].sort(SORT_FNS[sortBy] ?? SORT_FNS.date);
    }, [overdueTasks, filterBoardId, sortBy]);

    const grouped = useMemo(() => {
        if (!groupByBoard) return [{ boardId: null, boardName: null, tasks: filtered }];
        const map = new Map();
        filtered.forEach((t) => {
            if (!map.has(t.boardId)) map.set(t.boardId, { boardId: t.boardId, boardName: t._boardName, tasks: [] });
            map.get(t.boardId).tasks.push(t);
        });
        return [...map.values()].sort((a, b) => a.boardName.localeCompare(b.boardName));
    }, [filtered, groupByBoard]);

    function handleMarkDone(task) {
        const board = task._board;
        if (!board) return;
        const doneColumn = board.columns.find((c) => c.isDone);
        if (!doneColumn) return;
        updateTask(task.id, { columnId: doneColumn.id, completedAt: new Date().toISOString() });
    }

    function handleGoToBoard(boardId) {
        navigate(`/board/${boardId}`);
        onClose();
    }

    const multipleBoards = boards.length > 1;

    return (
        <DialogPrimitive.Root open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Backdrop
                    className={cn(
                        "fixed inset-0 isolate z-50 bg-black/30 backdrop-blur-[2px] duration-200",
                        "data-open:animate-in data-open:fade-in-0",
                        "data-closed:animate-out data-closed:fade-out-0",
                    )}
                />

                <DialogPrimitive.Popup
                    aria-label="Overdue tasks"
                    className={cn(
                        "fixed top-0 right-0 bottom-0 z-50 flex flex-col w-full sm:max-w-110",
                        "bg-background text-foreground shadow-2xl outline-none",
                        "border-l border-border duration-300",
                        "data-open:animate-in data-open:slide-in-from-right-full data-open:fade-in-0",
                        "data-closed:animate-out data-closed:slide-out-to-right-full data-closed:fade-out-0",
                    )}
                >
                    {/* Header */}
                    <div className="shrink-0 space-y-4 border-b border-border px-5 pb-4 pt-5">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 ring-1 ring-red-200">
                                    <AlertTriangle className="h-5 w-5 text-red-600" />
                                </div>
                                <div className="min-w-0">
                                    <DialogPrimitive.Title className="font-bold text-base leading-tight text-foreground">Overdue Tasks</DialogPrimitive.Title>
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        {overdueTasks.length} {overdueTasks.length === 1 ? "task needs" : "tasks need"} your attention
                                    </p>
                                </div>
                            </div>
                            <DialogPrimitive.Close
                                render={<Button variant="ghost" size="icon-sm" aria-label="Close overdue tasks panel" className="mt-0.5 shrink-0" />}
                            >
                                <X className="h-4 w-4" />
                            </DialogPrimitive.Close>
                        </div>

                        {/* Urgency stats — always show all 3 */}
                        {overdueTasks.length > 0 && (
                            <div className="grid grid-cols-3 gap-2">
                                {Object.entries(URGENCY_CONFIG).map(([key, cfg]) => (
                                    <UrgencyStatCard key={key} cfg={cfg} value={stats[key]} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Toolbar */}
                    {overdueTasks.length > 0 && (
                        <div className="shrink-0 flex items-center gap-2 border-b border-border bg-muted/20 px-4 py-2.5">
                            {multipleBoards && (
                                <Select value={filterBoardId} onValueChange={setFilterBoardId}>
                                    <SelectTrigger size="sm" className="h-7 w-auto max-w-40 min-w-28 gap-1.5 text-xs">
                                        <KanbanSquare className="h-3 w-3 shrink-0 text-muted-foreground" />
                                        <SelectValue placeholder="All boards" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All boards</SelectItem>
                                        {boards.map((b) => (
                                            <SelectItem key={b.id} value={b.id}>
                                                {b.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}

                            <Select value={sortBy} onValueChange={setSortBy}>
                                <SelectTrigger size="sm" className="h-7 w-auto min-w-32 gap-1.5 text-xs">
                                    <ArrowUpDown className="h-3 w-3 shrink-0 text-muted-foreground" />
                                    <SelectValue placeholder="Sort" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="date">Oldest first</SelectItem>
                                    <SelectItem value="overdue">Most overdue</SelectItem>
                                    <SelectItem value="priority">Priority</SelectItem>
                                    {multipleBoards && <SelectItem value="board">Board name</SelectItem>}
                                </SelectContent>
                            </Select>

                            <Button
                                variant={groupByBoard ? "secondary" : "ghost"}
                                size="sm"
                                onClick={() => setGroupByBoard((v) => !v)}
                                aria-pressed={groupByBoard}
                                title={groupByBoard ? "Ungroup tasks" : "Group by board"}
                                className="ml-auto h-7 gap-1.5 text-xs"
                            >
                                <LayoutList className="h-3.5 w-3.5" />
                                Group
                            </Button>
                        </div>
                    )}

                    {/* Task list */}
                    <div className="flex-1 overflow-y-auto overscroll-contain">
                        {overdueTasks.length === 0 ? (
                            <SheetEmptyState />
                        ) : filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full gap-3 py-16 px-6 text-center">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                                    <KanbanSquare className="h-5 w-5 text-muted-foreground/60" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-foreground">No results</p>
                                    <p className="mt-0.5 text-xs text-muted-foreground">No overdue tasks on this board.</p>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => setFilterBoardId("all")}>
                                    Show all boards
                                </Button>
                            </div>
                        ) : (
                            <div className="p-3 space-y-3">
                                {grouped.map((group) => (
                                    <BoardGroup
                                        key={group.boardId ?? "__all__"}
                                        group={group}
                                        showHeader={groupByBoard}
                                        onMarkDone={handleMarkDone}
                                        onGoToBoard={handleGoToBoard}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {filtered.length > 0 && (
                        <div className="shrink-0 border-t border-border bg-muted/10 px-5 py-3">
                            <p className="text-center text-xs text-muted-foreground">
                                <strong className="font-semibold text-foreground">{filtered.length}</strong> {filtered.length === 1 ? "task" : "tasks"}
                                {filterBoardId !== "all" ? " on this board" : " across all your boards"}
                            </p>
                        </div>
                    )}
                </DialogPrimitive.Popup>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}

function UrgencyStatCard({ cfg, value }) {
    const Icon = cfg.icon;
    const isEmpty = value === 0;

    return (
        <div
            className={cn(
                "flex flex-col items-center gap-1 rounded-lg border px-3 py-2.5 transition-colors",
                isEmpty ? "border-border bg-muted/30" : cn(cfg.bgActive, cfg.borderActive),
            )}
        >
            <Icon className={cn("h-3.5 w-3.5", isEmpty ? "text-muted-foreground/40" : cfg.textColor)} />
            <span className={cn("text-xl font-bold tabular-nums leading-none", isEmpty ? "text-muted-foreground/50" : cfg.numColor)}>{value}</span>
            <span className="text-[10px] font-medium text-muted-foreground">{cfg.label}</span>
        </div>
    );
}

function BoardGroup({ group, showHeader, onMarkDone, onGoToBoard }) {
    return (
        <div className="space-y-1.5">
            {showHeader && group.boardName && (
                <div className="flex items-center justify-between gap-2 px-1 pb-0.5 pt-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <KanbanSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="text-xs font-semibold text-foreground truncate">{group.boardName}</span>
                        <Badge variant="secondary" className="h-4 shrink-0 px-1.5 text-[10px]">
                            {group.tasks.length}
                        </Badge>
                    </div>
                    <button
                        onClick={() => onGoToBoard(group.boardId)}
                        className="flex shrink-0 items-center gap-1 text-[10px] font-medium text-primary hover:underline"
                        aria-label={`Open board ${group.boardName}`}
                    >
                        Open <ExternalLink className="h-2.5 w-2.5" />
                    </button>
                </div>
            )}
            <div className="space-y-1.5">
                {group.tasks.map((task) => (
                    <OverdueTaskItem key={task.id} task={task} showBoard={!showHeader} onMarkDone={onMarkDone} onGoToBoard={onGoToBoard} />
                ))}
            </div>
        </div>
    );
}

function OverdueTaskItem({ task, showBoard, onMarkDone, onGoToBoard }) {
    const days = task._daysOverdue;
    const urgencyKey = getUrgencyKey(days);
    const cfg = URGENCY_CONFIG[urgencyKey];

    return (
        <div
            className={cn(
                "group relative flex gap-3 rounded-lg border border-border/70 bg-card px-3.5 py-3",
                "border-l-[3px] transition-all duration-150 hover:border-border hover:shadow-sm",
                cfg.leftBorder,
                cfg.rowBg,
            )}
        >
            {/* Priority dot */}
            <span
                className="mt-0.75 h-2 w-2 shrink-0 rounded-full ring-2 ring-background"
                style={{ background: task._topPriority?.color ?? "#94a3b8" }}
                aria-hidden="true"
            />

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-1.5">
                <p className="text-sm font-semibold leading-snug text-foreground line-clamp-2" title={task.title}>
                    {task.title}
                </p>

                {/* Metadata chips */}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span
                        className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1", cfg.badgeBg)}
                        title={`Due: ${formatDueDate(task.dueDate)}`}
                    >
                        <Clock className="h-2.5 w-2.5" />
                        {days === 1 ? "1 day overdue" : `${days} days overdue`}
                    </span>

                    {task._columnTitle && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                            <span className="h-1 w-1 rounded-full bg-muted-foreground/40" aria-hidden="true" />
                            {task._columnTitle}
                        </span>
                    )}

                    {showBoard && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                            <KanbanSquare className="h-2.5 w-2.5" />
                            {task._boardName}
                        </span>
                    )}

                    {task._topPriority && (
                        <span
                            className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                            style={{ color: task._topPriority.color, background: task._topPriority.color + "18" }}
                        >
                            <Flag className="h-2.5 w-2.5" />
                            {task._topPriority.label}
                        </span>
                    )}
                </div>

                {/* Assignees */}
                {task._assignees?.length > 0 && (
                    <div className="flex items-center gap-1.5">
                        <Users className="h-3 w-3 shrink-0 text-muted-foreground/50" />
                        <div className="flex -space-x-1.5">
                            {task._assignees.slice(0, 4).map((u) => (
                                <UserAvatar
                                    key={u.id}
                                    user={{ username: u.username, avatarData: u.avatarData, color: u.color, id: u.id }}
                                    size="sm"
                                    className="h-5 w-5 text-[9px] ring-1 ring-background"
                                />
                            ))}
                            {task._assignees.length > 4 && (
                                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[9px] font-bold text-muted-foreground ring-1 ring-background">
                                    +{task._assignees.length - 4}
                                </div>
                            )}
                        </div>
                        <span className="truncate text-[10px] text-muted-foreground">
                            {task._assignees
                                .slice(0, 2)
                                .map((u) => u.fullName || u.username)
                                .join(", ")}
                            {task._assignees.length > 2 ? ` +${task._assignees.length - 2} more` : ""}
                        </span>
                    </div>
                )}
            </div>

            {/* Hover actions */}
            <div className="shrink-0 flex flex-col items-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                    variant="ghost"
                    size="icon-xs"
                    title="Mark as done"
                    aria-label={`Mark "${task.title}" as done`}
                    onClick={() => onMarkDone(task)}
                    className="text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                >
                    <CheckCheck className="h-3.5 w-3.5" />
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-xs" aria-label={`More actions for "${task.title}"`}>
                            <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="left" align="start">
                        <DropdownMenuItem className="gap-2 text-emerald-700 focus:bg-emerald-50 focus:text-emerald-700" onClick={() => onMarkDone(task)}>
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Mark as done
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="gap-2" onClick={() => onGoToBoard(task.boardId)}>
                            <ExternalLink className="h-3.5 w-3.5" />
                            Go to board
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}

function SheetEmptyState() {
    return (
        <div className="flex h-full flex-col items-center justify-center gap-4 px-6 py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 ring-4 ring-emerald-100">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <div>
                <h3 className="text-sm font-semibold text-foreground">All caught up!</h3>
                <p className="mt-1 max-w-52 text-xs text-muted-foreground">No overdue tasks right now. Keep up the great work!</p>
            </div>
        </div>
    );
}
