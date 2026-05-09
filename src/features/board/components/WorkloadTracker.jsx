import { useState, useMemo } from "react";
import {
    Calendar as CalendarIcon,
    ChevronDown,
    ChevronRight,
    Activity,
    Clock,
    CheckCircle2,
    Archive,
    AlertTriangle,
    Target,
    GitCommit,
    Crown,
    ArrowRight,
    Users,
    ListTodo,
    TrendingUp,
    Layers,
} from "lucide-react";
import { format, subDays, isWithinInterval, startOfDay, endOfDay, isToday, differenceInDays } from "date-fns";
import { UserAvatar } from "../../../shared/components/UserAvatar";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "../../../components/ui/popover";
import { Calendar } from "../../../components/ui/calendar";
import { cn } from "../../../lib/utils";
import { useAuthStore } from "../../auth/store/authStore";
import { useKanbanStore } from "../../kanban/store/kanbanStore";

const PRESETS = [
    { label: "Last 7 days", getFn: () => ({ from: subDays(new Date(), 6), to: new Date() }) },
    { label: "Last 30 days", getFn: () => ({ from: subDays(new Date(), 29), to: new Date() }) },
    { label: "This year", getFn: () => ({ from: new Date(new Date().getFullYear(), 0, 1), to: new Date() }) },
    { label: "All time", getFn: () => ({ from: new Date(2000, 0, 1), to: new Date() }) },
];

export function WorkloadTracker({ board, tasks }) {
    const user = useAuthStore((s) => s.user);
    const allStoreTasks = useKanbanStore((s) => s.tasks);

    const isOwner = board.ownerId === user?.id || board.members.find((m) => m.userId === user?.id)?.role === "owner";

    const [dateRange, setDateRange] = useState(PRESETS[3].getFn());
    const [activeTab, setActiveTab] = useState("members");
    const [timelineMemberFilter, setTimelineMemberFilter] = useState("all");

    // All board tasks including archived (for timeline history)
    const allBoardTasks = useMemo(() => allStoreTasks.filter((t) => t.boardId === board.id), [allStoreTasks, board.id]);

    // Members of this board mapped to actual user objects
    const members = useMemo(() => {
        const allUsers = JSON.parse(localStorage.getItem("goalboard_users") ?? "[]");
        return board.members
            .map((m) => {
                const u = allUsers.find((u2) => u2.id === m.userId);
                return u ? { ...m, ...u } : null;
            })
            .filter(Boolean);
    }, [board.members]);

    // Derived interval from date range
    const interval = useMemo(() => ({ start: startOfDay(dateRange.from), end: endOfDay(dateRange.to || dateRange.from) }), [dateRange]);

    // Workload stats (allBoardTasks for accurate history including archived)
    const workloadData = useMemo(() => {
        const doneColumnIds = new Set(board.columns.filter((c) => c.isDone).map((c) => c.id));
        const today = startOfDay(new Date());

        const rangedTasks = allBoardTasks.filter((t) => t.createdAt && isWithinInterval(new Date(t.createdAt), interval));

        let maxLoad = 0;

        const data = members.map((m) => {
            const assigned = rangedTasks.filter((t) => t.assigneeIds?.includes(m.userId) || t.assigneeId === m.userId);
            const active = assigned.filter((t) => !t.archived && !doneColumnIds.has(t.columnId));
            const completed = assigned.filter((t) => t.completedAt || doneColumnIds.has(t.columnId));
            const overdue = active.filter((t) => t.dueDate && new Date(t.dueDate.split("T")[0]) < today);

            if (active.length > maxLoad) maxLoad = active.length;

            return {
                id: m.userId,
                username: m.username,
                fullName: m.fullName,
                avatarData: m.avatarData,
                color: m.color,
                total: assigned.length,
                active: active.length,
                completed: completed.length,
                overdue: overdue.length,
                tasks: active,
                completedTasks: completed,
                completionRate: assigned.length > 0 ? Math.round((completed.length / assigned.length) * 100) : 0,
            };
        });

        data.sort((a, b) => b.active - a.active);

        return {
            data,
            maxLoad,
            totalTasks: rangedTasks.length,
            totalActive: data.reduce((s, m) => s + m.active, 0),
            totalCompleted: data.reduce((s, m) => s + m.completed, 0),
            totalOverdue: data.reduce((s, m) => s + m.overdue, 0),
        };
    }, [allBoardTasks, members, interval, board.columns]);

    // Timeline events — derived from task metadata (owner only)
    const timelineEvents = useMemo(() => {
        if (!isOwner) return [];
        const memberMap = new Map(members.map((m) => [m.userId, m]));
        const events = [];

        allBoardTasks.forEach((task) => {
            const assigneeIds = task.assigneeIds ?? (task.assigneeId ? [task.assigneeId] : []);

            // Created: attribute to task creator
            if (task.createdAt && memberMap.has(task.userId)) {
                const d = new Date(task.createdAt);
                if (isWithinInterval(d, interval)) {
                    events.push({ type: "created", taskId: task.id, taskTitle: task.title, date: d, memberId: task.userId });
                }
            }

            // Completed: attribute to each assignee
            if (task.completedAt) {
                const d = new Date(task.completedAt);
                if (isWithinInterval(d, interval)) {
                    assigneeIds
                        .filter((id) => memberMap.has(id))
                        .forEach((id) => events.push({ type: "completed", taskId: task.id, taskTitle: task.title, date: d, memberId: id }));
                }
            }

            // Archived: attribute to assignees, or creator if no assignees
            if (task.archivedAt) {
                const d = new Date(task.archivedAt);
                if (isWithinInterval(d, interval)) {
                    const targets = assigneeIds.filter((id) => memberMap.has(id));
                    const ids = targets.length > 0 ? targets : memberMap.has(task.userId) ? [task.userId] : [];
                    ids.forEach((id) => events.push({ type: "archived", taskId: task.id, taskTitle: task.title, date: d, memberId: id }));
                }
            }
        });

        events.sort((a, b) => b.date - a.date);
        return events;
    }, [allBoardTasks, members, interval, isOwner]);

    // Deadlines — active non-done tasks with due dates
    const deadlineData = useMemo(() => {
        const today = startOfDay(new Date());
        const doneColumnIds = new Set(board.columns.filter((c) => c.isDone).map((c) => c.id));
        const memberMap = new Map(members.map((m) => [m.userId, m]));

        const enriched = tasks
            .filter((t) => !t.archived && !doneColumnIds.has(t.columnId) && t.dueDate)
            .map((t) => {
                const dueDate = new Date(t.dueDate.split("T")[0] + "T00:00:00");
                const daysDiff = differenceInDays(dueDate, today);
                const assignees = (t.assigneeIds ?? (t.assigneeId ? [t.assigneeId] : [])).map((id) => memberMap.get(id)).filter(Boolean);
                const column = board.columns.find((c) => c.id === t.columnId);
                const urgency = daysDiff < 0 ? "overdue" : daysDiff === 0 ? "today" : daysDiff <= 3 ? "soon" : daysDiff <= 7 ? "week" : "future";
                return { ...t, _dueDate: dueDate, _daysDiff: daysDiff, _assignees: assignees, _columnTitle: column?.title ?? "", _urgency: urgency };
            });

        enriched.sort((a, b) => a._dueDate - b._dueDate);
        return {
            overdue: enriched.filter((t) => t._urgency === "overdue"),
            today: enriched.filter((t) => t._urgency === "today"),
            soon: enriched.filter((t) => t._urgency === "soon"),
            week: enriched.filter((t) => t._urgency === "week"),
            future: enriched.filter((t) => t._urgency === "future"),
        };
    }, [tasks, members, board.columns]);

    const TABS = [
        { id: "members", label: "Members", icon: Users },
        ...(isOwner ? [{ id: "timeline", label: "Timeline", icon: Activity, ownerOnly: true }] : []),
        { id: "deadlines", label: "Deadlines", icon: Target },
    ];

    return (
        <div className="space-y-5">
            {/* Toolbar: tabs + date range */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-0.5 rounded-lg bg-muted/60 p-1 border border-border">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150",
                                    activeTab === tab.id
                                        ? "bg-background text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground hover:bg-background/50",
                                )}
                            >
                                <Icon className="h-3.5 w-3.5" />
                                {tab.label}
                                {tab.ownerOnly && <Crown className="h-3 w-3 text-amber-500" title="Board owner only" />}
                            </button>
                        );
                    })}
                </div>

                <Popover>
                    <PopoverTrigger render={<div className="inline-flex items-center gap-1.5 border border-input rounded-lg px-3 h-8 text-sm cursor-pointer bg-background hover:bg-accent transition-colors" />}>
                        <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        {dateRange?.from ? (
                            dateRange.to ? (
                                <span>
                                    {format(dateRange.from, "LLL dd, y")} – {format(dateRange.to, "LLL dd, y")}
                                </span>
                            ) : (
                                format(dateRange.from, "LLL dd, y")
                            )
                        ) : (
                            <span className="text-muted-foreground">Pick a date range</span>
                        )}
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 flex" align="end">
                        <div className="border-r border-border p-3 hidden sm:flex flex-col gap-1 w-36">
                            {PRESETS.map((preset) => (
                                <Button
                                    key={preset.label}
                                    variant="ghost"
                                    size="sm"
                                    className="justify-start text-xs h-8"
                                    onClick={() => setDateRange(preset.getFn())}
                                >
                                    {preset.label}
                                </Button>
                            ))}
                        </div>
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={dateRange?.from}
                            selected={dateRange}
                            onSelect={(v) => {
                                if (v) setDateRange(v);
                            }}
                            numberOfMonths={2}
                        />
                    </PopoverContent>
                </Popover>
            </div>

            {/* Stats summary — always visible */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Total Assigned" value={workloadData.totalTasks} />
                <StatCard label="Active" value={workloadData.totalActive} valueClassName="text-primary" />
                <StatCard label="Completed" value={workloadData.totalCompleted} valueClassName="text-emerald-600" />
                <StatCard
                    label="Overdue"
                    value={workloadData.totalOverdue}
                    valueClassName={workloadData.totalOverdue > 0 ? "text-destructive" : "text-emerald-600"}
                    alert={workloadData.totalOverdue > 0}
                />
            </div>

            {/* Tab content */}
            {activeTab === "members" && <MembersTab workloadData={workloadData} board={board} members={members} interval={interval} />}
            {isOwner && activeTab === "timeline" && (
                <TimelineTab events={timelineEvents} members={members} memberFilter={timelineMemberFilter} onFilterChange={setTimelineMemberFilter} />
            )}
            {activeTab === "deadlines" && <DeadlinesTab deadlineData={deadlineData} />}
        </div>
    );
}

function StatCard({ label, value, valueClassName, alert }) {
    return (
        <div
            className={cn(
                "rounded-xl border p-4 bg-card shadow-sm flex flex-col items-center justify-center text-center transition-colors",
                alert ? "border-red-200 bg-red-50/40" : "border-border",
            )}
        >
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
            <p className={cn("text-2xl font-bold", valueClassName ?? "text-foreground")}>{value}</p>
        </div>
    );
}

function MembersTab({ workloadData, board, members, interval }) {
    const [selectedMember, setSelectedMember] = useState(null);
    const today = startOfDay(new Date());
    const doneColumnIds = useMemo(() => new Set(board.columns.filter((c) => c.isDone).map((c) => c.id)), [board.columns]);

    const memberMap = useMemo(() => new Map(members.map((m) => [m.userId, m])), [members]);

    // Enrich member data with tasks for the members view
    const enrichedMembers = useMemo(
        () =>
            workloadData.data.map((m) => {
                const activeTasks = m.tasks
                    .map((t) => {
                        const dueDate = t.dueDate ? new Date(t.dueDate.split("T")[0] + "T00:00:00") : null;
                        const daysDiff = dueDate ? differenceInDays(dueDate, today) : null;
                        const urgency = !dueDate
                            ? "none"
                            : daysDiff < 0
                              ? "overdue"
                              : daysDiff === 0
                                ? "today"
                                : daysDiff <= 3
                                  ? "soon"
                                  : daysDiff <= 7
                                    ? "week"
                                    : "future";
                        const column = board.columns.find((c) => c.id === t.columnId);
                        const coAssignees = (t.assigneeIds ?? (t.assigneeId ? [t.assigneeId] : []))
                            .filter((id) => id !== m.id)
                            .map((id) => memberMap.get(id))
                            .filter(Boolean);
                        return {
                            ...t,
                            _dueDate: dueDate,
                            _daysDiff: daysDiff,
                            _urgency: urgency,
                            _columnTitle: column?.title ?? "",
                            _columnColor: column?.color ?? "",
                            _coAssignees: coAssignees,
                        };
                    })
                    .sort((a, b) => {
                        const order = { overdue: 0, today: 1, soon: 2, week: 3, future: 4, none: 5 };
                        return order[a._urgency] - order[b._urgency];
                    });

                const nextDeadline = activeTasks.find((t) => t._dueDate);

                return { ...m, activeTasks, nextDeadline };
            }),
        [workloadData.data, board.columns, memberMap, today],
    );

    const active = selectedMember ? enrichedMembers.find((m) => m.id === selectedMember) : null;

    if (members.length === 0) {
        return (
            <div className="rounded-xl border border-border bg-card shadow-sm flex flex-col items-center justify-center py-20 gap-3 text-center">
                <Users className="h-10 w-10 text-muted-foreground/30" />
                <p className="text-sm font-semibold text-foreground">No members yet</p>
                <p className="text-xs text-muted-foreground">Invite team members to start tracking workload.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left — member list */}
            <div className="lg:col-span-1 space-y-2">
                {enrichedMembers.map((m) => {
                    const isSelected = selectedMember === m.id;
                    const overdueCount = m.activeTasks.filter((t) => t._urgency === "overdue").length;

                    return (
                        <button
                            key={m.id}
                            onClick={() => setSelectedMember(isSelected ? null : m.id)}
                            className={cn(
                                "w-full text-left rounded-xl border p-3.5 transition-all duration-150 group",
                                isSelected ? "border-primary/40 bg-primary/5 shadow-sm" : "border-border bg-card hover:border-primary/20 hover:bg-muted/30",
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <div className="relative shrink-0">
                                    <UserAvatar user={{ id: m.id, username: m.username, fullName: m.fullName }} size="md" />
                                    {overdueCount > 0 && (
                                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-background">
                                            {overdueCount}
                                        </span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-sm font-semibold text-foreground truncate">{m.fullName || m.username}</span>
                                        {board.ownerId === m.id && <Crown className="h-3 w-3 text-amber-500 shrink-0" />}
                                    </div>
                                    <span className="text-[11px] text-muted-foreground">@{m.username}</span>
                                </div>
                                <ChevronRight
                                    className={cn("h-4 w-4 text-muted-foreground transition-transform shrink-0", isSelected && "rotate-90 text-primary")}
                                />
                            </div>

                            {/* Mini stats */}
                            <div className="mt-3 grid grid-cols-3 gap-1.5 text-center">
                                <MiniStat label="Active" value={m.active} color="text-primary" />
                                <MiniStat label="Done" value={m.completed} color="text-emerald-600" />
                                <MiniStat label="Overdue" value={m.overdue} color={m.overdue > 0 ? "text-red-500" : "text-muted-foreground"} />
                            </div>

                            {/* Workload bar */}
                            {workloadData.maxLoad > 0 && (
                                <div className="mt-2.5">
                                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-500"
                                            style={{ width: `${(m.active / workloadData.maxLoad) * 100}%`, backgroundColor: m.color || "#6366f1" }}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between mt-1">
                                        <span className="text-[10px] text-muted-foreground">Workload</span>
                                        <span className="text-[10px] font-semibold text-muted-foreground">{m.completionRate}% done</span>
                                    </div>
                                </div>
                            )}

                            {m.nextDeadline && (
                                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                    <Clock className="h-3 w-3 shrink-0" />
                                    <span className="truncate">
                                        Next:{" "}
                                        <span
                                            className={cn(
                                                "font-medium",
                                                m.nextDeadline._urgency === "overdue"
                                                    ? "text-red-500"
                                                    : m.nextDeadline._urgency === "today"
                                                      ? "text-orange-500"
                                                      : m.nextDeadline._urgency === "soon"
                                                        ? "text-amber-500"
                                                        : "text-foreground",
                                            )}
                                        >
                                            {m.nextDeadline._urgency === "overdue"
                                                ? `${Math.abs(m.nextDeadline._daysDiff)}d overdue`
                                                : m.nextDeadline._urgency === "today"
                                                  ? "due today"
                                                  : format(m.nextDeadline._dueDate, "MMM d")}
                                        </span>
                                    </span>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Right — detail panel */}
            <div className="lg:col-span-2">
                {active ? (
                    <MemberDetailPanel member={active} board={board} />
                ) : (
                    <div className="h-full rounded-xl border border-dashed border-border bg-card/50 flex flex-col items-center justify-center py-20 gap-3 text-center">
                        <ListTodo className="h-10 w-10 text-muted-foreground/20" />
                        <p className="text-sm font-medium text-muted-foreground">Select a member to see their tasks</p>
                        <p className="text-xs text-muted-foreground/70">Click any member card on the left to inspect their workload</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function MiniStat({ label, value, color }) {
    return (
        <div className="rounded-lg bg-muted/60 py-1.5 px-1">
            <p className={cn("text-base font-bold tabular-nums leading-tight", color)}>{value}</p>
            <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5">{label}</p>
        </div>
    );
}

function MemberDetailPanel({ member, board }) {
    const [taskTab, setTaskTab] = useState("active");
    const today = startOfDay(new Date());

    const TASK_URGENCY_COLORS = {
        overdue: { bg: "bg-red-50", text: "text-red-600", badge: "bg-red-100 text-red-700", dot: "bg-red-500", label: "Overdue" },
        today: { bg: "bg-orange-50", text: "text-orange-600", badge: "bg-orange-100 text-orange-700", dot: "bg-orange-500", label: "Due today" },
        soon: { bg: "bg-amber-50", text: "text-amber-600", badge: "bg-amber-100 text-amber-700", dot: "bg-amber-400", label: "Due soon" },
        week: { bg: "bg-blue-50", text: "text-blue-600", badge: "bg-blue-100 text-blue-700", dot: "bg-blue-400", label: "This week" },
        future: { bg: "", text: "text-muted-foreground", badge: "bg-slate-100 text-slate-600", dot: "bg-slate-300", label: "Upcoming" },
        none: { bg: "", text: "text-muted-foreground", badge: "bg-muted text-muted-foreground", dot: "bg-muted-foreground/30", label: "No date" },
    };

    const overdueCount = member.activeTasks.filter((t) => t._urgency === "overdue").length;

    const role = board.members.find((m) => m.userId === member.id)?.role;

    return (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-4 p-5 border-b border-border bg-linear-to-r from-muted/40 to-transparent">
                <UserAvatar user={{ id: member.id, username: member.username, fullName: member.fullName }} size="lg" />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-lg font-bold text-foreground leading-tight">{member.fullName || member.username}</h2>
                        {board.ownerId === member.id && (
                            <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 rounded-full px-2 py-0.5">
                                <Crown className="h-3 w-3" /> Owner
                            </span>
                        )}
                        {role && role !== "owner" && (
                            <span className="text-[11px] font-semibold text-muted-foreground bg-muted rounded-full px-2 py-0.5 capitalize">{role}</span>
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">@{member.username}</p>
                </div>
                {overdueCount > 0 && (
                    <div className="flex items-center gap-1.5 rounded-lg bg-red-50 border border-red-200 px-3 py-2 shrink-0">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <span className="text-sm font-bold text-red-600">{overdueCount}</span>
                        <span className="text-xs text-red-500">overdue</span>
                    </div>
                )}
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-4 divide-x divide-border border-b border-border">
                {[
                    { label: "Active", value: member.active, cls: "text-primary" },
                    { label: "Completed", value: member.completed, cls: "text-emerald-600" },
                    { label: "Overdue", value: member.overdue, cls: member.overdue > 0 ? "text-red-500" : "text-muted-foreground" },
                    {
                        label: "Completion",
                        value: `${member.completionRate}%`,
                        cls: member.completionRate >= 70 ? "text-emerald-600" : member.completionRate >= 40 ? "text-amber-500" : "text-foreground",
                    },
                ].map(({ label, value, cls }) => (
                    <div key={label} className="py-3 px-4 text-center">
                        <p className={cn("text-xl font-bold tabular-nums", cls)}>{value}</p>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mt-0.5">{label}</p>
                    </div>
                ))}
            </div>

            {/* Task tabs */}
            <div className="flex items-center gap-0.5 p-2 border-b border-border bg-muted/20">
                {[
                    { id: "active", label: `Active (${member.active})`, icon: ListTodo },
                    { id: "completed", label: `Completed (${member.completed})`, icon: CheckCircle2 },
                ].map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => setTaskTab(id)}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                            taskTab === id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-background/60",
                        )}
                    >
                        <Icon className="h-3.5 w-3.5" />
                        {label}
                    </button>
                ))}
            </div>

            {/* Task list */}
            <div className="flex-1 overflow-y-auto">
                {taskTab === "active" && (
                    <>
                        {member.activeTasks.length === 0 ? (
                            <EmptyTaskState
                                icon={<CheckCircle2 className="h-8 w-8 text-emerald-300" />}
                                message="No active tasks"
                                sub="This member has nothing in progress."
                            />
                        ) : (
                            <ul className="divide-y divide-border/50">
                                {member.activeTasks.map((task) => {
                                    const urg = TASK_URGENCY_COLORS[task._urgency];
                                    return (
                                        <li
                                            key={task.id}
                                            className={cn("px-5 py-3.5 hover:bg-muted/20 transition-colors", task._urgency === "overdue" && "bg-red-50/30")}
                                        >
                                            <div className="flex items-start gap-3">
                                                <span className={cn("mt-1.5 h-2 w-2 rounded-full shrink-0", urg.dot)} />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-foreground leading-snug">{task.title}</p>
                                                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                                        {/* Column / Status */}
                                                        {task._columnTitle && (
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-muted rounded-md px-1.5 py-0.5">
                                                                <Layers className="h-2.5 w-2.5" />
                                                                {task._columnTitle}
                                                            </span>
                                                        )}
                                                        {/* Urgency / due date badge */}
                                                        {task._dueDate ? (
                                                            <span
                                                                className={cn(
                                                                    "inline-flex items-center gap-1 text-[10px] font-semibold rounded-md px-1.5 py-0.5",
                                                                    urg.badge,
                                                                )}
                                                            >
                                                                <Clock className="h-2.5 w-2.5" />
                                                                {task._urgency === "overdue"
                                                                    ? `${Math.abs(task._daysDiff)}d overdue`
                                                                    : task._urgency === "today"
                                                                      ? "Due today"
                                                                      : format(task._dueDate, "MMM d")}
                                                            </span>
                                                        ) : (
                                                            <span className="text-[10px] text-muted-foreground/60">No due date</span>
                                                        )}
                                                    </div>
                                                </div>
                                                {/* Co-assignees */}
                                                {task._coAssignees.length > 0 && (
                                                    <div className="flex -space-x-1.5 shrink-0 mt-0.5" title="Also assigned to">
                                                        {task._coAssignees.slice(0, 3).map((co) => (
                                                            <UserAvatar
                                                                key={co.userId}
                                                                user={{ id: co.id, username: co.username, fullName: co.fullName }}
                                                                size="sm"
                                                                className="ring-2 ring-background"
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </>
                )}

                {taskTab === "completed" && (
                    <>
                        {member.completedTasks.length === 0 ? (
                            <EmptyTaskState
                                icon={<TrendingUp className="h-8 w-8 text-muted-foreground/30" />}
                                message="No completed tasks"
                                sub="No tasks finished in this date range."
                            />
                        ) : (
                            <ul className="divide-y divide-border/50">
                                {member.completedTasks.map((task) => (
                                    <li key={task.id} className="px-5 py-3 hover:bg-muted/20 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                            <p className="text-sm text-muted-foreground line-through truncate flex-1">{task.title}</p>
                                            {task.completedAt && (
                                                <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
                                                    {format(new Date(task.completedAt), "MMM d")}
                                                </span>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

function EmptyTaskState({ icon, message, sub }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
            {icon}
            <p className="text-sm font-medium text-foreground mt-1">{message}</p>
            <p className="text-xs text-muted-foreground">{sub}</p>
        </div>
    );
}

const EVENT_CONFIG = {
    created: { label: "Created task", Icon: GitCommit, iconColor: "text-blue-600", bgColor: "bg-blue-100" },
    completed: { label: "Completed task", Icon: CheckCircle2, iconColor: "text-emerald-600", bgColor: "bg-emerald-100" },
    archived: { label: "Archived task", Icon: Archive, iconColor: "text-slate-500", bgColor: "bg-slate-100" },
};

function TimelineTab({ events, members, memberFilter, onFilterChange }) {
    const memberMap = useMemo(() => new Map(members.map((m) => [m.userId, m])), [members]);

    const filtered = useMemo(() => (memberFilter === "all" ? events : events.filter((e) => e.memberId === memberFilter)), [events, memberFilter]);

    const grouped = useMemo(() => {
        const map = new Map();
        filtered.forEach((e) => {
            const key = format(e.date, "yyyy-MM-dd");
            if (!map.has(key)) map.set(key, { key, date: e.date, events: [] });
            map.get(key).events.push(e);
        });
        return [...map.values()].sort((a, b) => new Date(b.key) - new Date(a.key));
    }, [filtered]);

    return (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="flex items-center justify-between gap-3 flex-wrap px-4 py-3 border-b border-border bg-muted/10">
                <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold">Member Activity Timeline</h3>
                    <Crown className="h-3.5 w-3.5 text-amber-500" title="Board owner only" />
                </div>
                <span className="text-xs text-muted-foreground">{filtered.length} events</span>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 px-4 py-2 border-b border-border/50 bg-muted/5">
                {Object.entries(EVENT_CONFIG).map(([type, cfg]) => {
                    const { Icon } = cfg;
                    return (
                        <span key={type} className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Icon className={cn("h-3 w-3", cfg.iconColor)} /> {cfg.label}
                        </span>
                    );
                })}
            </div>

            {/* Member filter chips */}
            <div className="flex flex-wrap gap-2 px-4 py-2.5 border-b border-border/50">
                <FilterChip active={memberFilter === "all"} onClick={() => onFilterChange("all")}>
                    All members
                </FilterChip>
                {members.map((m) => (
                    <FilterChip key={m.userId} active={memberFilter === m.userId} color={m.color} onClick={() => onFilterChange(m.userId)}>
                        <UserAvatar user={{ id: m.id, username: m.username, fullName: m.fullName }} size="sm" className="w-4 h-4 text-[8px]" />
                        {m.fullName || m.username}
                    </FilterChip>
                ))}
            </div>

            {grouped.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
                    <Activity className="h-8 w-8 opacity-25" />
                    <p className="text-sm">No activity found in this date range.</p>
                </div>
            ) : (
                <div className="overflow-y-auto" style={{ maxHeight: 480 }}>
                    {grouped.map((group) => (
                        <div key={group.key}>
                            <div className="sticky top-0 z-10 bg-muted/90 backdrop-blur-sm px-4 py-1.5 border-b border-border/40">
                                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                                    {isToday(group.date) ? "Today" : format(group.date, "EEEE, MMMM d, yyyy")}
                                </span>
                            </div>
                            <ul className="px-4 py-2.5 space-y-3">
                                {group.events.map((event, idx) => {
                                    const member = memberMap.get(event.memberId);
                                    const cfg = EVENT_CONFIG[event.type] ?? EVENT_CONFIG.created;
                                    const { Icon } = cfg;
                                    return (
                                        <li key={`${event.taskId}-${event.type}-${event.memberId}-${idx}`} className="flex items-start gap-3">
                                            <div className={cn("mt-0.5 h-6 w-6 rounded-full flex items-center justify-center shrink-0", cfg.bgColor)}>
                                                <Icon className={cn("h-3.5 w-3.5", cfg.iconColor)} />
                                            </div>
                                            <div className="flex-1 min-w-0 pb-2.5 border-b border-border/30 last:border-0">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    {member && (
                                                        <UserAvatar
                                                            user={{ id: member.id, username: member.username, fullName: member.fullName }}
                                                            size="sm"
                                                            className="w-4 h-4 text-[8px]"
                                                        />
                                                    )}
                                                    <span className="text-xs font-semibold text-foreground">
                                                        {member?.fullName || member?.username || "Unknown"}
                                                    </span>
                                                    <span className={cn("text-xs", cfg.iconColor)}>{cfg.label}</span>
                                                    <time className="text-[10px] text-muted-foreground ml-auto tabular-nums">{format(event.date, "HH:mm")}</time>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-0.5 truncate" title={event.taskTitle}>
                                                    {event.taskTitle}
                                                </p>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function FilterChip({ active, color, onClick, children }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all border",
                active ? "text-white border-transparent shadow-sm" : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30",
            )}
            style={active ? { backgroundColor: color || "#1e293b", borderColor: color || "#1e293b" } : {}}
        >
            {children}
        </button>
    );
}

const URGENCY_CONFIG = {
    overdue: {
        label: "Overdue",
        headerClass: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100/70",
        dotClass: "bg-red-500",
        badgeClass: "bg-red-100 text-red-700",
        Icon: AlertTriangle,
        defaultOpen: true,
    },
    today: {
        label: "Due Today",
        headerClass: "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100/70",
        dotClass: "bg-orange-500",
        badgeClass: "bg-orange-100 text-orange-700",
        Icon: Clock,
        defaultOpen: true,
    },
    soon: {
        label: "Due in 1–3 Days",
        headerClass: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100/70",
        dotClass: "bg-amber-400",
        badgeClass: "bg-amber-100 text-amber-700",
        Icon: Target,
        defaultOpen: true,
    },
    week: {
        label: "Due This Week",
        headerClass: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100/70",
        dotClass: "bg-blue-400",
        badgeClass: "bg-blue-100 text-blue-700",
        Icon: CalendarIcon,
        defaultOpen: false,
    },
    future: {
        label: "Upcoming",
        headerClass: "bg-muted/60 text-muted-foreground border-border hover:bg-muted",
        dotClass: "bg-slate-400",
        badgeClass: "bg-slate-100 text-slate-600",
        Icon: ArrowRight,
        defaultOpen: false,
    },
};

function DeadlinesTab({ deadlineData }) {
    const SECTIONS = ["overdue", "today", "soon", "week", "future"];
    const hasAny = SECTIONS.some((k) => deadlineData[k]?.length > 0);

    if (!hasAny) {
        return (
            <div className="rounded-xl border border-border bg-card shadow-sm flex flex-col items-center justify-center py-20 gap-3 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                </div>
                <p className="text-sm font-semibold text-foreground">No upcoming deadlines</p>
                <p className="text-xs text-muted-foreground">All active tasks are on track or have no due date set.</p>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-muted/10 flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">Deadlines Overview</h3>
            </div>
            <div className="divide-y divide-border overflow-y-auto" style={{ maxHeight: 540 }}>
                {SECTIONS.map((urgency) => {
                    const ts = deadlineData[urgency];
                    if (!ts?.length) return null;
                    return <DeadlineSection key={urgency} cfg={URGENCY_CONFIG[urgency]} tasks={ts} />;
                })}
            </div>
        </div>
    );
}

function DeadlineSection({ cfg, tasks }) {
    const [collapsed, setCollapsed] = useState(!cfg.defaultOpen);
    const { Icon } = cfg;

    return (
        <div>
            <button
                onClick={() => setCollapsed((v) => !v)}
                className={cn("w-full flex items-center justify-between gap-2 px-4 py-2.5 border-b text-left transition-colors", cfg.headerClass)}
            >
                <div className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5" />
                    <span className="text-xs font-semibold">{cfg.label}</span>
                    <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full", cfg.badgeClass)}>{tasks.length}</span>
                </div>
                {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>

            {!collapsed && (
                <ul className="divide-y divide-border/40">
                    {tasks.map((task) => (
                        <DeadlineTaskRow key={task.id} task={task} cfg={cfg} />
                    ))}
                </ul>
            )}
        </div>
    );
}

function DeadlineTaskRow({ task, cfg }) {
    const { _daysDiff: diff, _urgency: urgency } = task;
    const dayLabel = urgency === "overdue" ? `${Math.abs(diff)}d overdue` : urgency === "today" ? "Due today" : `${diff}d left`;

    return (
        <li className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
            <span className={cn("mt-1.5 h-2 w-2 rounded-full shrink-0", cfg.dotClass)} />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                    <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full", cfg.badgeClass)}>{dayLabel}</span>
                    <span className="text-[10px] text-muted-foreground">{format(task._dueDate, "MMM d, yyyy")}</span>
                    {task._columnTitle && (
                        <span className="text-[10px] text-muted-foreground">
                            in <span className="font-medium text-foreground">{task._columnTitle}</span>
                        </span>
                    )}
                </div>
            </div>
            {task._assignees.length > 0 && (
                <div className="flex -space-x-2 shrink-0 mt-0.5">
                    {task._assignees.slice(0, 3).map((m) => (
                        <UserAvatar key={m.userId} user={{ id: m.id, username: m.username, fullName: m.fullName }} size="sm" className="ring-2 ring-background" />
                    ))}
                    {task._assignees.length > 3 && (
                        <div className="w-6 h-6 rounded-full bg-muted ring-2 ring-background flex items-center justify-center text-[9px] font-bold text-muted-foreground">
                            +{task._assignees.length - 3}
                        </div>
                    )}
                </div>
            )}
        </li>
    );
}
