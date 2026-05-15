import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Star, Trash2, Users, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "../../../components/ui/progress";
import { timeAgo } from "../../utils/timeAgo";

export function ListView({ boards, allTasks, user, pinnedBoardIds, onTogglePin, onDelete }) {
    const rows = useMemo(
        () =>
            boards.map((board) => {
                const tasks = allTasks.filter((t) => t.boardId === board.id && !t.archived);
                const doneIds = new Set(board.columns.filter((c) => c.isDone).map((c) => c.id));
                const done = tasks.filter((t) => doneIds.has(t.columnId)).length;
                const pct = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;
                return { board, total: tasks.length, done, pct };
            }),
        [boards, allTasks],
    );

    if (rows.length === 0) return null;

    return (
        <div role="list" aria-label="Boards list" className="animate-fade-in rounded-xl border border-border overflow-hidden bg-card divide-y divide-border">
            {rows.map(({ board, total, pct }) => {
                const isPinned = pinnedBoardIds.has(board.id);
                return (
                    <div role="listitem" key={board.id} className="group relative flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors">
                        {/* Column colour strip */}
                        <div className="flex flex-col gap-0.5 shrink-0">
                            {board.columns
                                .slice()
                                .sort((a, b) => a.order - b.order)
                                .map((col) => (
                                    <span key={col.id} aria-hidden="true" className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: col.color }} title={col.title} />
                                ))}
                        </div>

                        {/* Board info */}
                        <Link to={`/board/${board.id}`} className="flex-1 min-w-0 flex items-center gap-4">
                            <span className="font-medium text-sm text-foreground group-hover:text-primary transition-colors truncate min-w-0 max-w-55">
                                {board.name}
                            </span>

                            {/* Inline progress — grows to fill space */}
                            <div className="hidden sm:flex flex-1 items-center gap-2 min-w-0">
                                <Progress aria-label="Board completion progress" value={pct} className="h-1.5 flex-1" />
                                <span className="text-xs text-muted-foreground shrink-0 w-8 text-right">{pct}%</span>
                            </div>
                        </Link>

                        {/* Meta */}
                        <div className="hidden md:flex items-center gap-4 shrink-0 text-xs text-muted-foreground">
                            <span>
                                {total} task{total !== 1 && "s"}
                            </span>
                            <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                <span>{board.members.length}</span>
                            </div>
                            <span className="w-16 text-right">{timeAgo(board.updatedAt ?? board.createdAt)}</span>
                        </div>

                        {/* Action buttons — revealed on hover */}
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    onTogglePin(board.id);
                                }}
                                className={cn(
                                    "flex items-center justify-center w-7 h-7 rounded-lg transition-colors",
                                    isPinned ? "text-amber-400 hover:text-amber-500" : "text-muted-foreground hover:text-amber-400 hover:bg-amber-50/80",
                                )}
                                aria-label={isPinned ? "Unpin board" : "Pin board"}
                                aria-pressed={isPinned}
                            >
                                <Star className={cn("h-3.5 w-3.5", isPinned && "fill-current")} />
                            </button>

                            {board.ownerId === user?.id && (
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        onDelete(board.id);
                                    }}
                                    className="flex items-center justify-center w-7 h-7 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                    aria-label="Delete board"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            )}

                            <Link
                                to={`/board/${board.id}`}
                                className="flex items-center justify-center w-7 h-7 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
                                aria-label={`Open ${board.name}`}
                            >
                                <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
