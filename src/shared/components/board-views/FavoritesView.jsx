import { useState, useMemo, useEffect } from "react";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { BoardCard } from "./BoardCard";

const PAGE_SIZE = 6;

function buildPageRange(page, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (page <= 4) return [1, 2, 3, 4, 5, "...", total];
    if (page >= total - 3) return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
    return [1, "...", page - 1, page, page + 1, "...", total];
}

export function FavoritesView({ boards, allTasks, user, pinnedBoardIds, onTogglePin, onDelete, onSwitchView }) {
    const pinned = boards.filter((b) => pinnedBoardIds.has(b.id));
    const [page, setPage] = useState(1);

    useEffect(() => setPage(1), [pinned.length]);

    if (pinned.length === 0) {
        return (
            <div className="animate-fade-in rounded-xl border border-dashed border-border py-12 text-center bg-card">
                <div className="mx-auto flex items-center justify-center w-10 h-10 rounded-full bg-amber-50 mb-3">
                    <Star className="h-5 w-5 text-amber-400" />
                </div>
                <p className="text-sm font-medium text-foreground">No pinned boards yet</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                    Pin any board by hovering over its card and clicking the <Star className="inline h-3 w-3 text-amber-400 fill-amber-400 -mt-0.5" /> icon. Pinned
                    boards appear here for quick access.
                </p>
                {onSwitchView && (
                    <Button size="sm" variant="outline" className="mt-4" onClick={() => onSwitchView("grid")}>
                        Browse all boards
                    </Button>
                )}
            </div>
        );
    }

    const totalPages = Math.max(1, Math.ceil(pinned.length / PAGE_SIZE));
    const paginated = useMemo(() => pinned.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [pinned, page]);
    const pageRange = useMemo(() => buildPageRange(page, totalPages), [page, totalPages]);

    return (
        <div className="animate-fade-in">
            <p className="text-xs text-muted-foreground mb-3">
                {pinned.length} pinned board{pinned.length !== 1 && "s"}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginated.map((board) => (
                    <BoardCard key={board.id} board={board} allTasks={allTasks} user={user} isPinned onTogglePin={onTogglePin} onDelete={onDelete} />
                ))}
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                    <span className="text-xs text-muted-foreground">
                        {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, pinned.length)} of {pinned.length} boards
                    </span>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            aria-label="Previous page"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        {pageRange.map((p, i) =>
                            p === "..." ? (
                                <span key={`e-${i}`} className="px-1.5 text-xs text-muted-foreground select-none">
                                    ...
                                </span>
                            ) : (
                                <Button key={p} variant={page === p ? "default" : "outline"} size="sm" className="h-8 w-8 p-0 text-xs" onClick={() => setPage(p)}>
                                    {p}
                                </Button>
                            ),
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            aria-label="Next page"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
