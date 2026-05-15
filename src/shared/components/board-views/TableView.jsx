import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowUpDown, ArrowUp, ArrowDown, Star, Trash2, ArrowRight, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "../../../components/ui/progress";
import { timeAgo } from "../../utils/timeAgo";
import { Button } from "../../../components/ui/button";

const PAGE_SIZE = 12;

const SORT_KEYS = {
    NAME: "name",
    TASKS: "tasks",
    PCT: "pct",
    MEMBERS: "members",
    UPDATED: "updatedAt",
};

export function TableView({ boards, allTasks, user, pinnedBoardIds, onTogglePin, onDelete }) {
    const [sortKey, setSortKey] = useState(SORT_KEYS.UPDATED);
    const [sortDir, setSortDir] = useState("desc");
    const [page, setPage] = useState(1);

    function handleSort(key) {
        if (key === sortKey) {
            setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        } else {
            setSortKey(key);
            setSortDir("asc");
        }
    }

    const rows = useMemo(() => {
        const enriched = boards.map((board) => {
            const tasks = allTasks.filter((t) => t.boardId === board.id && !t.archived);
            const doneIds = new Set(board.columns.filter((c) => c.isDone).map((c) => c.id));
            const done = tasks.filter((t) => doneIds.has(t.columnId)).length;
            const pct = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;
            return { board, tasks: tasks.length, done, pct, members: board.members.length, updatedAt: board.updatedAt ?? board.createdAt };
        });

        return enriched.sort((a, b) => {
            let cmp = 0;
            switch (sortKey) {
                case SORT_KEYS.NAME:
                    cmp = a.board.name.localeCompare(b.board.name);
                    break;
                case SORT_KEYS.TASKS:
                    cmp = a.tasks - b.tasks;
                    break;
                case SORT_KEYS.PCT:
                    cmp = a.pct - b.pct;
                    break;
                case SORT_KEYS.MEMBERS:
                    cmp = a.members - b.members;
                    break;
                case SORT_KEYS.UPDATED:
                    cmp = new Date(a.updatedAt) - new Date(b.updatedAt);
                    break;
            }
            return sortDir === "asc" ? cmp : -cmp;
        });
    }, [boards, allTasks, sortKey, sortDir]);

    useEffect(() => setPage(1), [boards, sortKey, sortDir]);

    const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    const paginatedRows = useMemo(() => rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [rows, page]);
    const pageRange = useMemo(() => buildPageRange(page, totalPages), [page, totalPages]);

    return (
        <div className="animate-fade-in rounded-xl border border-border overflow-hidden bg-card">
            <div className="overflow-x-auto">
                <table className="w-full text-sm" role="table" aria-label="Boards table">
                    <thead>
                        <tr className="border-b border-border bg-muted/30">
                            <Th label="Name" sortKey={SORT_KEYS.NAME} current={sortKey} dir={sortDir} onSort={handleSort} className="min-w-45 pl-4" />
                            <Th label="Tasks" sortKey={SORT_KEYS.TASKS} current={sortKey} dir={sortDir} onSort={handleSort} className="w-24 text-right" />
                            <Th label="Progress" sortKey={SORT_KEYS.PCT} current={sortKey} dir={sortDir} onSort={handleSort} className="w-36" />
                            <Th label="Members" sortKey={SORT_KEYS.MEMBERS} current={sortKey} dir={sortDir} onSort={handleSort} className="w-24 text-right" />
                            <Th label="Updated" sortKey={SORT_KEYS.UPDATED} current={sortKey} dir={sortDir} onSort={handleSort} className="w-28 text-right" />
                            <th className="py-2 px-3 text-right text-xs font-medium text-muted-foreground w-24" scope="col">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedRows.map(({ board, tasks, pct, members, updatedAt }) => {
                            const isPinned = pinnedBoardIds.has(board.id);
                            return (
                                <tr key={board.id} className="group border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                                    {/* Name */}
                                    <td className="py-3 pl-4 pr-2">
                                        <Link
                                            to={`/board/${board.id}`}
                                            className="font-medium text-foreground hover:text-primary transition-colors truncate block max-w-55"
                                        >
                                            {board.name}
                                        </Link>
                                        {/* Column dots below the name */}
                                        <div className="flex items-center gap-1 mt-1">
                                            {board.columns
                                                .slice()
                                                .sort((a, b) => a.order - b.order)
                                                .map((col) => (
                                                    <span
                                                        key={col.id}
                                                        aria-hidden="true"
                                                        className="inline-block w-1.5 h-1.5 rounded-full"
                                                        style={{ background: col.color }}
                                                        title={col.title}
                                                    />
                                                ))}
                                        </div>
                                    </td>

                                    {/* Tasks */}
                                    <td className="py-3 px-2 text-right text-muted-foreground tabular-nums">{tasks}</td>

                                    {/* Progress */}
                                    <td className="py-3 px-2">
                                        <div className="flex items-center gap-2">
                                            <Progress aria-label="Board completion progress" value={pct} className="h-1.5 flex-1" />
                                            <span className="text-xs text-muted-foreground w-8 text-right tabular-nums">{pct}%</span>
                                        </div>
                                    </td>

                                    {/* Members */}
                                    <td className="py-3 px-2 text-right">
                                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                                            <Users className="h-3 w-3" />
                                            <span className="tabular-nums">{members}</span>
                                        </span>
                                    </td>

                                    {/* Updated */}
                                    <td className="py-3 px-2 text-right text-xs text-muted-foreground whitespace-nowrap">{timeAgo(updatedAt)}</td>

                                    {/* Actions */}
                                    <td className="py-3 pl-2 pr-4 text-right">
                                        <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => onTogglePin(board.id)}
                                                className={cn(
                                                    "flex items-center justify-center w-6 h-6 rounded transition-colors",
                                                    isPinned
                                                        ? "text-amber-400 hover:text-amber-500"
                                                        : "text-muted-foreground hover:text-amber-400 hover:bg-amber-50/80",
                                                )}
                                                aria-label={isPinned ? "Unpin" : "Pin"}
                                                aria-pressed={isPinned}
                                            >
                                                <Star className={cn("h-3.5 w-3.5", isPinned && "fill-current")} />
                                            </button>

                                            {board.ownerId === user?.id && (
                                                <button
                                                    onClick={() => onDelete(board.id)}
                                                    className="flex items-center justify-center w-6 h-6 rounded text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                    aria-label="Delete"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            )}

                                            <Link
                                                to={`/board/${board.id}`}
                                                className="flex items-center justify-center w-6 h-6 rounded text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
                                                aria-label={`Open ${board.name}`}
                                            >
                                                <ArrowRight className="h-3.5 w-3.5" />
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {totalPages > 1 && <Pagination page={page} totalPages={totalPages} total={rows.length} pageSize={PAGE_SIZE} pageRange={pageRange} onPage={setPage} />}
        </div>
    );
}

function Th({ label, sortKey, current, dir, onSort, className }) {
    const isActive = current === sortKey;
    const Icon = isActive ? (dir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
    return (
        <th scope="col" className={cn("py-2 px-2 text-left", className)} aria-sort={isActive ? (dir === "asc" ? "ascending" : "descending") : "none"}>
            <button
                onClick={() => onSort(sortKey)}
                className={cn(
                    "inline-flex items-center gap-1 text-xs font-medium rounded px-1 py-0.5 -mx-1 transition-colors",
                    isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
            >
                {label}
                <Icon className={cn("h-3 w-3", isActive ? "text-primary" : "opacity-40")} />
            </button>
        </th>
    );
}

function buildPageRange(page, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (page <= 4) return [1, 2, 3, 4, 5, "...", total];
    if (page >= total - 3) return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
    return [1, "...", page - 1, page, page + 1, "...", total];
}

function Pagination({ page, totalPages, total, pageSize, pageRange, onPage }) {
    return (
        <nav aria-label="Board table pagination" className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-xs text-muted-foreground">
                {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total} board{total !== 1 && "s"}
            </span>
            <div className="flex items-center gap-1">
                <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => onPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    aria-label="Previous page"
                >
                    <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                {pageRange.map((p, i) =>
                    p === "..." ? (
                        <span key={`e-${i}`} className="px-1 text-xs text-muted-foreground select-none">
                            ...
                        </span>
                    ) : (
                        <Button key={p} variant={page === p ? "default" : "outline"} size="sm" className="h-7 w-7 p-0 text-xs" onClick={() => onPage(p)} aria-label={`Page ${p}`} aria-current={page === p ? "page" : undefined}>
                            {p}
                        </Button>
                    ),
                )}
                <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => onPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    aria-label="Next page"
                >
                    <ChevronRight className="h-3.5 w-3.5" />
                </Button>
            </div>
        </nav>
    );
}
