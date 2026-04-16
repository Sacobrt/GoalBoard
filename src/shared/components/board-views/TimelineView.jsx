import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Star, Trash2, Users, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "../../../components/ui/progress";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const GROUP_PAGE_SIZE = 5;

function shortMonth(iso) {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", year: "2-digit" });
}

function monthLabel(iso) {
    return new Date(iso).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export function TimelineView({ boards, allTasks, user, pinnedBoardIds, onTogglePin, onDelete }) {
    const [expanded, setExpanded] = useState({});

    function toggleExpand(label) {
        setExpanded((prev) => ({ ...prev, [label]: !prev[label] }));
    }

    // Groups: newest month first
    const groups = useMemo(() => {
        const sorted = [...boards].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const map = new Map();
        sorted.forEach((board) => {
            const key = monthLabel(board.createdAt);
            if (!map.has(key)) map.set(key, []);
            map.get(key).push(board);
        });
        return [...map.entries()].map(([label, items]) => ({ label, items }));
    }, [boards]);

    // Chart data: boards created per month (oldest → newest for left-to-right axis)
    const chartData = useMemo(() => {
        const sorted = [...boards].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        const map = new Map();
        sorted.forEach((board) => {
            const key = shortMonth(board.createdAt);
            map.set(key, (map.get(key) ?? 0) + 1);
        });

        // Running cumulative total
        let cum = 0;
        return [...map.entries()].map(([month, count]) => {
            cum += count;
            return { month, Boards: count, Total: cum };
        });
    }, [boards]);

    return (
        <div className="animate-fade-in space-y-5">
            {/* Recharts area chart */}
            {chartData.length > 0 && (
                <div className="rounded-xl border border-border p-5 bg-card">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">Board Creation Timeline</p>
                    <ResponsiveContainer width="100%" height={180}>
                        <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="tlGradBoards" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="tlGradTotal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
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
                            <Area
                                type="monotone"
                                dataKey="Boards"
                                stroke="#6366f1"
                                strokeWidth={2}
                                fill="url(#tlGradBoards)"
                                dot={{ r: 3, fill: "#6366f1" }}
                                activeDot={{ r: 5 }}
                                name="New boards"
                            />
                            <Area type="monotone" dataKey="Total" stroke="#10b981" strokeWidth={2} fill="url(#tlGradTotal)" dot={false} name="Cumulative" />
                        </AreaChart>
                    </ResponsiveContainer>
                    <div className="flex items-center gap-4 mt-2 text-xs">
                        <div className="flex items-center gap-1.5">
                            <span className="inline-block w-3 h-0.5 rounded-full bg-[#6366f1]" />
                            <span className="text-muted-foreground">New boards / month</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="inline-block w-3 h-0.5 rounded-full bg-[#10b981]" />
                            <span className="text-muted-foreground">Cumulative total</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Month-grouped timeline rows */}
            {groups.map(({ label, items }, gi) => {
                const isExpanded = expanded[label];
                const shown = isExpanded ? items : items.slice(0, GROUP_PAGE_SIZE);
                const remainder = items.length - GROUP_PAGE_SIZE;

                return (
                    <div key={label} className="relative pl-8 pb-2">
                        {gi < groups.length - 1 && <span className="absolute left-3 top-6 bottom-0 w-px bg-border" aria-hidden="true" />}

                        <div className="absolute left-0 top-0.5 flex items-center justify-center w-6 h-6 rounded-full border-2 border-primary bg-background z-10">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        </div>

                        <div className="flex items-center gap-2 mb-3 ml-1">
                            <p className="text-xs font-semibold text-primary tracking-wide">{label}</p>
                            <span className="text-xs text-muted-foreground">
                                {items.length} board{items.length !== 1 && "s"}
                            </span>
                        </div>

                        <div className="space-y-2">
                            {shown.map((board) => (
                                <TimelineRow
                                    key={board.id}
                                    board={board}
                                    allTasks={allTasks}
                                    user={user}
                                    isPinned={pinnedBoardIds.has(board.id)}
                                    onTogglePin={onTogglePin}
                                    onDelete={onDelete}
                                />
                            ))}
                        </div>

                        {items.length > GROUP_PAGE_SIZE && (
                            <button
                                onClick={() => toggleExpand(label)}
                                className="flex items-center gap-1.5 mt-2 ml-1 text-xs font-medium text-primary hover:underline"
                            >
                                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", isExpanded && "rotate-180")} />
                                {isExpanded ? "Show less" : `Show ${remainder} more`}
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

function TimelineRow({ board, allTasks, user, isPinned, onTogglePin, onDelete }) {
    const tasks = allTasks.filter((t) => t.boardId === board.id && !t.archived);
    const doneIds = new Set(board.columns.filter((c) => c.isDone).map((c) => c.id));
    const done = tasks.filter((t) => doneIds.has(t.columnId)).length;
    const pct = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;

    const createdDate = new Date(board.createdAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
    });

    return (
        <div className="group relative flex items-center gap-3 rounded-xl border border-border px-3 py-2.5 bg-card hover:shadow-sm hover:border-primary/20 transition-all">
            {/* Date stamp */}
            <span className="text-[11px] text-muted-foreground shrink-0 w-12 tabular-nums font-medium">{createdDate}</span>

            {/* Column colour strip */}
            <div className="flex gap-px shrink-0">
                {board.columns
                    .slice()
                    .sort((a, b) => a.order - b.order)
                    .slice(0, 5)
                    .map((col) => (
                        <span
                            key={col.id}
                            className="inline-block w-1.5 h-6 first:rounded-l-sm last:rounded-r-sm"
                            style={{ background: col.color }}
                            title={col.title}
                        />
                    ))}
            </div>

            {/* Board info */}
            <div className="flex-1 min-w-0">
                <Link to={`/board/${board.id}`} className="text-sm font-semibold text-foreground hover:text-primary transition-colors truncate block leading-snug">
                    {board.name}
                </Link>
                <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1.5">
                        <Progress value={pct} className="h-1 w-16" />
                        <span className="text-[11px] text-muted-foreground tabular-nums">{pct}%</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground">· {tasks.length}t</span>
                    <span className="hidden sm:flex items-center gap-0.5 text-[11px] text-muted-foreground">
                        <Users className="h-2.5 w-2.5" />
                        {board.members.length}
                    </span>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        onTogglePin(board.id);
                    }}
                    className={cn(
                        "flex items-center justify-center w-6 h-6 rounded-lg transition-colors",
                        isPinned ? "text-amber-400 hover:text-amber-500" : "text-muted-foreground hover:text-amber-400 hover:bg-amber-50/80",
                    )}
                    aria-label={isPinned ? "Unpin" : "Pin"}
                    aria-pressed={isPinned}
                >
                    <Star className={cn("h-3 w-3", isPinned && "fill-current")} />
                </button>

                {board.ownerId === user?.id && (
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            onDelete(board.id);
                        }}
                        className="flex items-center justify-center w-6 h-6 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        aria-label="Delete board"
                    >
                        <Trash2 className="h-3 w-3" />
                    </button>
                )}
            </div>
        </div>
    );
}
