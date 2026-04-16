import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, useDroppable, useDraggable, closestCorners } from "@dnd-kit/core";
import { Star, Trash2, Users, GripVertical, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "../../../components/ui/progress";
import { BOARD_STAGES, deriveStage } from "../../config/boardStages";

export const KANBAN_STAGES = BOARD_STAGES;

export function KanbanView({ boards, allTasks, user, pinnedBoardIds, onTogglePin, onDelete, boardStages = {}, onStageChange }) {
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
    const [activeId, setActiveId] = useState(null);
    const [contextMenu, setContextMenu] = useState(null);

    // Close context menu on any click or right-click outside
    useEffect(() => {
        if (!contextMenu) return;
        function close() {
            setContextMenu(null);
        }
        window.addEventListener("click", close);
        window.addEventListener("contextmenu", close);
        return () => {
            window.removeEventListener("click", close);
            window.removeEventListener("contextmenu", close);
        };
    }, [contextMenu]);

    // Collect all unique stages across all visible boards (union, order by first appearance)
    const allStages = useMemo(() => {
        const seen = new Map();
        boards.forEach((board) => {
            const stages = board.stages ?? BOARD_STAGES;
            stages.forEach((s) => {
                if (!seen.has(s.id)) seen.set(s.id, s);
            });
        });
        return seen.size > 0 ? Array.from(seen.values()) : BOARD_STAGES;
    }, [boards]);

    // Enrich boards with their effective stage and task stats
    const enriched = useMemo(
        () =>
            boards.map((board) => {
                const tasks = allTasks.filter((t) => t.boardId === board.id && !t.archived);
                const doneIds = new Set(board.columns.filter((c) => c.isDone).map((c) => c.id));
                const done = tasks.filter((t) => doneIds.has(t.columnId)).length;
                const pct = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;
                const stage = boardStages[board.id] ?? deriveStage(board, allTasks);
                const isManual = Boolean(boardStages[board.id]);
                return { board, total: tasks.length, pct, stage, isManual };
            }),
        [boards, allTasks, boardStages, allStages],
    );

    // Group enriched boards by stage
    const columns = useMemo(() => {
        const map = Object.fromEntries(allStages.map((s) => [s.id, []]));
        enriched.forEach((item) => {
            if (map[item.stage] !== undefined) {
                map[item.stage].push(item);
            } else {
                // Stage not in union (edge case after deletion) — put in first column
                const firstKey = allStages[0]?.id;
                if (firstKey) map[firstKey].push(item);
            }
        });
        return map;
    }, [enriched, allStages]);

    const activeBoardItem = enriched.find((e) => e.board.id === activeId);

    function handleDragStart({ active }) {
        setActiveId(String(active.id));
    }

    function handleDragEnd({ active, over }) {
        setActiveId(null);
        if (!over) return;
        const draggedBoardId = String(active.id);
        const overId = String(over.id); // `overId` is either a stage column id or another board's id (drop-on-card).
        const isStageId = allStages.some((s) => s.id === overId);
        const targetStage = isStageId ? overId : (enriched.find((e) => e.board.id === overId)?.stage ?? null);

        if (targetStage) onStageChange(draggedBoardId, targetStage);
    }

    function handleCardContextMenu(x, y, boardId) {
        setContextMenu({ x, y, boardId });
    }

    return (
        <div className="animate-fade-in">
            <p className="text-xs text-muted-foreground mb-3">Drag cards between columns or right-click a card to move it to a stage.</p>
            <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${allStages.length}, minmax(0, 1fr))` }}>
                    {allStages.map((stage) => (
                        <KanbanColumn
                            key={stage.id}
                            stage={stage}
                            items={columns[stage.id] ?? []}
                            user={user}
                            pinnedBoardIds={pinnedBoardIds}
                            onTogglePin={onTogglePin}
                            onDelete={onDelete}
                            onResetStage={(boardId) => onStageChange(boardId, null)}
                            onCardContextMenu={handleCardContextMenu}
                            activeId={activeId}
                        />
                    ))}
                </div>

                <DragOverlay dropAnimation={null}>
                    {activeBoardItem ? (
                        <KanbanCard
                            item={activeBoardItem}
                            user={user}
                            isPinned={pinnedBoardIds.has(activeBoardItem.board.id)}
                            onTogglePin={onTogglePin}
                            onDelete={onDelete}
                            onResetStage={() => {}}
                            onCardContextMenu={() => {}}
                            isDragging
                        />
                    ) : null}
                </DragOverlay>
            </DndContext>

            {/* Right-click context menu */}
            {contextMenu &&
                (() => {
                    const ctxItem = enriched.find((e) => e.board.id === contextMenu.boardId);
                    const isOwner = ctxItem?.board.ownerId === user?.id;
                    const isPinned = pinnedBoardIds.has(contextMenu.boardId);
                    return (
                        <div
                            className="fixed z-50 rounded-xl border border-border bg-popover shadow-xl py-1.5 min-w-47.5 animate-fade-in"
                            style={{ top: contextMenu.y, left: contextMenu.x }}
                            onClick={(e) => e.stopPropagation()}
                            onContextMenu={(e) => e.preventDefault()}
                        >
                            {/* Quick actions */}
                            <button
                                onClick={() => {
                                    onTogglePin(contextMenu.boardId);
                                    setContextMenu(null);
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted/40 transition-colors"
                            >
                                <Star className={cn("w-3.5 h-3.5", isPinned && "fill-current text-amber-400")} />
                                {isPinned ? "Unpin from favorites" : "Pin to favorites"}
                            </button>
                            {isOwner && (
                                <button
                                    onClick={() => {
                                        onDelete(contextMenu.boardId);
                                        setContextMenu(null);
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Delete board
                                </button>
                            )}
                            <div className="mx-3 my-1 h-px bg-border" />
                            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest px-3 pb-1.5">Move to stage</p>
                            {(ctxItem?.board.stages ?? BOARD_STAGES).map((stage) => {
                                const isCurrent = ctxItem?.stage === stage.id;
                                return (
                                    <button
                                        key={stage.id}
                                        onClick={() => {
                                            onStageChange(contextMenu.boardId, stage.id);
                                            setContextMenu(null);
                                        }}
                                        className={cn(
                                            "w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors",
                                            isCurrent ? "bg-muted/50 font-medium" : "hover:bg-muted/40",
                                        )}
                                    >
                                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: stage.color }} />
                                        <span className="flex-1 text-left" style={{ color: isCurrent ? stage.color : undefined }}>
                                            {stage.label}
                                        </span>
                                        {isCurrent && <span className="text-[10px] text-muted-foreground">current</span>}
                                    </button>
                                );
                            })}
                            {ctxItem?.isManual && (
                                <>
                                    <div className="mx-3 my-1 h-px bg-border" />
                                    <button
                                        onClick={() => {
                                            onStageChange(contextMenu.boardId, null);
                                            setContextMenu(null);
                                        }}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-muted-foreground hover:bg-muted/40 transition-colors"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                        Reset to auto
                                    </button>
                                </>
                            )}
                        </div>
                    );
                })()}
        </div>
    );
}

function KanbanColumn({ stage, items, user, pinnedBoardIds, onTogglePin, onDelete, onResetStage, onCardContextMenu, activeId }) {
    const { setNodeRef, isOver } = useDroppable({ id: stage.id });

    return (
        <div
            ref={setNodeRef}
            className={cn("rounded-xl border transition-colors duration-150 p-3 min-h-30", isOver ? "border-primary/50 bg-primary/5" : "border-border bg-card")}
        >
            {/* Column header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-full" style={{ background: stage.color }} />
                    <span className="text-xs font-semibold" style={{ color: stage.color }}>
                        {stage.label}
                    </span>
                </div>
                <span className="text-xs font-medium px-1.5 py-0.5 rounded-full" style={{ background: stage.bg, color: stage.color }}>
                    {items.length}
                </span>
            </div>

            {/* Cards */}
            <div className="space-y-2">
                {items.map((item) => (
                    <KanbanCard
                        key={item.board.id}
                        item={item}
                        user={user}
                        isPinned={pinnedBoardIds.has(item.board.id)}
                        onTogglePin={onTogglePin}
                        onDelete={onDelete}
                        onResetStage={onResetStage}
                        onCardContextMenu={onCardContextMenu}
                        isDragging={activeId === item.board.id}
                    />
                ))}

                {items.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4 border border-dashed border-border rounded-lg">Drop boards here</p>
                )}
            </div>
        </div>
    );
}

function KanbanCard({ item, user, isPinned, onTogglePin, onDelete, onResetStage, onCardContextMenu, isDragging }) {
    const { board, total, pct, isManual } = item;
    const { attributes, listeners, setNodeRef, transform, isDragging: isCurrentlyDragging } = useDraggable({ id: board.id });

    const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onCardContextMenu(e.clientX, e.clientY, board.id);
            }}
            className={cn(
                "group relative rounded-lg border bg-background p-2.5 transition-shadow select-none cursor-grab active:cursor-grabbing",
                isCurrentlyDragging && !isDragging ? "opacity-40 shadow-none" : "shadow-sm hover:shadow-md",
                isDragging && "rotate-1 shadow-xl opacity-95",
            )}
        >
            {/* Visual drag handle indicator */}
            <div className="absolute left-1.5 top-1/2 -translate-y-1/2 text-muted-foreground/30 pointer-events-none" aria-hidden="true">
                <GripVertical className="h-3.5 w-3.5" />
            </div>

            <div className="ml-4">
                <div className="flex items-start justify-between gap-1 mb-1.5">
                    <Link
                        to={`/board/${board.id}`}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="text-xs font-semibold text-foreground hover:text-primary transition-colors line-clamp-2 leading-snug cursor-pointer"
                    >
                        {board.name}
                    </Link>

                    {/* Action buttons */}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                                e.stopPropagation();
                                onTogglePin(board.id);
                            }}
                            className={cn(
                                "flex items-center justify-center w-5 h-5 rounded transition-colors",
                                isPinned ? "text-amber-400" : "text-muted-foreground hover:text-amber-400",
                            )}
                            aria-label={isPinned ? "Unpin" : "Pin"}
                        >
                            <Star className={cn("h-3 w-3", isPinned && "fill-current")} />
                        </button>

                        {isManual && (
                            <button
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onResetStage(board.id);
                                }}
                                className="flex items-center justify-center w-5 h-5 rounded text-muted-foreground hover:text-primary transition-colors"
                                aria-label="Reset to auto stage"
                                title="Reset to auto-detected stage"
                            >
                                <RotateCcw className="h-3 w-3" />
                            </button>
                        )}

                        {board.ownerId === user?.id && (
                            <button
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(board.id);
                                }}
                                className="flex items-center justify-center w-5 h-5 rounded text-red-400 hover:text-red-600 transition-colors"
                                aria-label="Delete"
                            >
                                <Trash2 className="h-3 w-3" />
                            </button>
                        )}
                    </div>
                </div>

                <Progress value={pct} className="h-1 mb-1.5" />

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                        {total} task{total !== 1 && "s"}
                    </span>
                    <div className="flex items-center gap-1">
                        <Users className="h-2.5 w-2.5" />
                        <span>{board.members.length}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
