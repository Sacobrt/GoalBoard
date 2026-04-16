import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { BoardCard } from "./BoardCard";

const GROUP_PAGE_SIZE = 6;

const MS_DAY = 86_400_000;

function bucket(iso) {
    const diff = Date.now() - new Date(iso).getTime();
    if (diff < MS_DAY) return "Today";
    if (diff < 2 * MS_DAY) return "Yesterday";
    if (diff < 7 * MS_DAY) return "This week";
    if (diff < 30 * MS_DAY) return "This month";
    return "Older";
}

const BUCKET_ORDER = ["Today", "Yesterday", "This week", "This month", "Older"];

export function RecentView({ boards, allTasks, user, pinnedBoardIds, onTogglePin, onDelete }) {
    const [expanded, setExpanded] = useState({});

    function toggleExpand(label) {
        setExpanded((prev) => ({ ...prev, [label]: !prev[label] }));
    }

    const groups = useMemo(() => {
        const sorted = [...boards].sort((a, b) => new Date(b.updatedAt ?? b.createdAt) - new Date(a.updatedAt ?? a.createdAt));

        const map = {};
        sorted.forEach((board) => {
            const key = bucket(board.updatedAt ?? board.createdAt);
            if (!map[key]) map[key] = [];
            map[key].push(board);
        });

        return BUCKET_ORDER.filter((k) => map[k]).map((k) => ({ label: k, boards: map[k] }));
    }, [boards]);

    return (
        <div className="animate-fade-in space-y-6">
            {groups.map(({ label, boards: groupBoards }) => {
                const isExpanded = expanded[label];
                const shown = isExpanded ? groupBoards : groupBoards.slice(0, GROUP_PAGE_SIZE);
                const remainder = groupBoards.length - GROUP_PAGE_SIZE;

                return (
                    <div key={label}>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{label}</span>
                            <span className="flex-1 h-px bg-border" />
                            <span className="text-xs text-muted-foreground">{groupBoards.length}</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {shown.map((board) => (
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

                        {groupBoards.length > GROUP_PAGE_SIZE && (
                            <button onClick={() => toggleExpand(label)} className="flex items-center gap-1.5 mt-3 text-xs font-medium text-primary hover:underline">
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
