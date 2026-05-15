import { useState, useMemo, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { BoardCard } from "./BoardCard";

const PAGE_SIZE = 6;

export function GridView({ boards, allTasks, user, pinnedBoardIds, onTogglePin, onDelete }) {
    const [page, setPage] = useState(1);

    // Reset to page 1 whenever the board list changes (e.g. search)
    useEffect(() => setPage(1), [boards]);

    const totalPages = Math.max(1, Math.ceil(boards.length / PAGE_SIZE));
    const paginated = useMemo(() => boards.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [boards, page]);
    const pageRange = useMemo(() => buildPageRange(page, totalPages), [page, totalPages]);

    return (
        <div className="animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginated.map((board) => (
                    <BoardCard
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

            {totalPages > 1 && <Pagination page={page} totalPages={totalPages} total={boards.length} pageSize={PAGE_SIZE} pageRange={pageRange} onPage={setPage} />}
        </div>
    );
}

function Pagination({ page, totalPages, total, pageSize, pageRange, onPage }) {
    return (
        <nav aria-label="Board pagination" className="flex items-center justify-between mt-4">
            <span className="text-xs text-muted-foreground">
                {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total} board{total !== 1 && "s"}
            </span>
            <div className="flex items-center gap-1">
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => onPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    aria-label="Previous page"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>

                {pageRange.map((p, i) =>
                    p === "..." ? (
                        <span key={`ellipsis-${i}`} className="px-1.5 text-xs text-muted-foreground select-none">
                            ...
                        </span>
                    ) : (
                        <Button
                            key={p}
                            variant={page === p ? "default" : "outline"}
                            size="sm"
                            className="h-8 w-8 p-0 text-xs"
                            onClick={() => onPage(p)}
                            aria-label={`Page ${p}`}
                            aria-current={page === p ? "page" : undefined}
                        >
                            {p}
                        </Button>
                    ),
                )}

                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => onPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    aria-label="Next page"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </nav>
    );
}

function buildPageRange(page, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (page <= 4) return [1, 2, 3, 4, 5, "...", total];
    if (page >= total - 3) return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
    return [1, "...", page - 1, page, page + 1, "...", total];
}
