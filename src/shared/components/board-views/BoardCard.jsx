import { Link } from "react-router-dom";
import { Trash2, Star, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "../../../components/ui/progress";
import { timeAgo } from "../../utils/timeAgo";

export function BoardCard({ board, allTasks, user, isPinned, onTogglePin, onDelete, compact = false }) {
    const boardTasks = allTasks.filter((t) => t.boardId === board.id && !t.archived);
    const doneIds = new Set(board.columns.filter((c) => c.isDone).map((c) => c.id));
    const completed = boardTasks.filter((t) => doneIds.has(t.columnId)).length;
    const total = boardTasks.length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

    return (
        <div className="group relative rounded-xl border border-border transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md bg-card">
            {/* Pin button — always visible when pinned, hover-revealed otherwise */}
            <button
                onClick={(e) => {
                    e.preventDefault();
                    onTogglePin(board.id);
                }}
                className={cn(
                    "absolute top-3 right-3 flex items-center justify-center w-7 h-7 rounded-lg transition-all z-10",
                    isPinned
                        ? "opacity-100 text-amber-400 hover:text-amber-500 bg-amber-50"
                        : "opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-amber-400 hover:bg-amber-50/80",
                )}
                title={isPinned ? "Unpin board" : "Pin board"}
                aria-label={isPinned ? "Unpin board" : "Pin board"}
                aria-pressed={isPinned}
            >
                <Star className={cn("h-3.5 w-3.5", isPinned && "fill-current")} />
            </button>

            {/* Delete (owner only) — hover-revealed, offset left of pin */}
            {board.ownerId === user?.id && (
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        onDelete(board.id);
                    }}
                    className="absolute top-3 right-10 flex items-center justify-center w-7 h-7 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600 hover:bg-red-50 z-10"
                    title="Delete board"
                    aria-label="Delete board"
                >
                    <Trash2 className="h-3.5 w-3.5" />
                </button>
            )}

            <Link to={`/board/${board.id}`} className={cn("block", compact ? "p-3" : "p-5")}>
                <div className="flex items-start justify-between mb-2">
                    <h3
                        className={cn(
                            "font-semibold text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-1",
                            compact ? "text-xs pr-8" : "pr-16",
                        )}
                    >
                        {board.name}
                    </h3>
                </div>

                {/* Column colour dots — skipped in compact mode */}
                {!compact && (
                    <div className="flex items-center gap-1.5 mb-3">
                        {board.columns
                            .slice()
                            .sort((a, b) => a.order - b.order)
                            .map((col) => (
                                <span key={col.id} aria-hidden="true" className="inline-block w-2 h-2 rounded-full" style={{ background: col.color }} title={col.title} />
                            ))}
                    </div>
                )}

                <Progress aria-label="Board completion progress" value={pct} className={cn("mb-1.5", compact ? "h-1" : "h-1.5")} />

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                        {total} task{total !== 1 && "s"}
                    </span>
                    <span className="font-medium">{pct}%</span>
                </div>

                {!compact && (
                    <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                                {board.members.length} member{board.members.length !== 1 && "s"}
                            </span>
                        </div>
                        <span className="text-xs text-muted-foreground">{timeAgo(board.updatedAt ?? board.createdAt)}</span>
                    </div>
                )}
            </Link>
        </div>
    );
}
