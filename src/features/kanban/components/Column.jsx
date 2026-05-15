import { useState } from "react";
import { useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "../../../lib/utils";
import { Input } from "../../../components/ui/input";
import { MoreHorizontal, Archive, Plus, Trash2, GripVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "../../../components/ui/dropdown-menu";

export function Column({
    column,
    taskCount,
    children,
    taskIds = [],
    userRole,
    isDragging = false,
    isOverlay = false,
    onUpdateTitle,
    onAddTask,
    onArchiveColumn,
    onRemoveColumn,
}) {
    const {
        isOver,
        setNodeRef,
        attributes,
        listeners,
        transform,
        transition,
        isDragging: isColDragging,
    } = useSortable({
        id: column.id,
        data: { type: "Column", column },
        disabled: userRole === "viewer" || isOverlay,
    });

    const style = isOverlay
        ? { transform: "rotate(2deg) scale(1.02)", pointerEvents: "none", zIndex: 50, opacity: 1 }
        : {
              transform: CSS.Translate.toString(transform),
              transition: transition || (isColDragging ? undefined : "opacity 0.15s, box-shadow 0.15s"),
              opacity: isColDragging ? 0.4 : 1,
          };

    const [editing, setEditing] = useState(false);
    const safeTitle = typeof column.title === "string" ? column.title : column.title?.title || "New Column";
    const [draftTitle, setDraftTitle] = useState(safeTitle);

    function saveTitle() {
        if (draftTitle.trim() && draftTitle.trim() !== safeTitle) {
            onUpdateTitle(draftTitle.trim());
        }
        setEditing(false);
    }

    const canEditColumn = userRole === "owner";
    const canAddTask = userRole !== "viewer";

    return (
        <div className="flex flex-col min-h-0 bg-slate-100/50 rounded-xl p-3" ref={isOverlay ? undefined : setNodeRef} style={style}>
            {/* Header */}
            <div className="flex items-center justify-between mb-3 px-1 group">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    {!isOverlay && userRole !== "viewer" && (
                        <div
                            {...attributes}
                            {...listeners}
                            aria-label={`Drag to reorder ${safeTitle} column`}
                            className="cursor-grab hover:bg-slate-200/60 rounded p-0.5 -ml-1 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <GripVertical className="h-4 w-4" />
                        </div>
                    )}
                    <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ background: column.color }} />
                    {editing ? (
                        <Input
                            value={draftTitle}
                            onChange={(e) => setDraftTitle(e.target.value)}
                            autoFocus
                            className="h-6 text-xs font-semibold tracking-wide px-1 py-0 w-full"
                            onKeyDown={(e) => e.key === "Enter" && saveTitle()}
                            onBlur={saveTitle}
                        />
                    ) : (
                        <h2
                            className={`text-xs font-semibold tracking-wide truncate text-muted-foreground ${canEditColumn ? "cursor-pointer hover:text-slate-900 transition-colors" : ""}`}
                            onClick={() => {
                                if (canEditColumn) {
                                    setDraftTitle(safeTitle);
                                    setEditing(true);
                                }
                            }}
                        >
                            {safeTitle}
                        </h2>
                    )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    <span className="text-xs rounded-full px-2 py-0.5 font-semibold tabular-nums" style={{ background: `${column.color}18`, color: column.color }}>
                        {taskCount}
                    </span>
                    {canEditColumn && (
                        <DropdownMenu>
                            <DropdownMenuTrigger
                                aria-label={`Options for ${safeTitle} column`}
                                className="flex items-center justify-center w-5 h-5 rounded hover:bg-slate-200 text-muted-foreground"
                            >
                                <MoreHorizontal className="h-3.5 w-3.5" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                                {taskCount > 0 && (
                                    <DropdownMenuItem onClick={onArchiveColumn} className="text-amber-600 focus:text-amber-700 focus:bg-amber-50">
                                        <Archive className="mr-2 h-3.5 w-3.5" />
                                        Archive all tasks
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={onRemoveColumn} className="text-red-500 focus:text-red-600 focus:bg-red-50">
                                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                                    Delete column
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>

            {/* Drop zone */}
            <div
                className={cn(
                    "flex-1 min-h-80 transition-all duration-150 rounded-lg flex flex-col gap-3 outline-none",
                    isOver && isDragging ? "bg-primary/5 ring-dashed" : isOver ? "bg-slate-200/50 ring-1 ring-slate-200" : "bg-transparent",
                )}
            >
                <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
                    {children}
                </SortableContext>

                {/* Drop indicator — only visible during drag */}
                {isDragging && taskIds.length === 0 && (
                    <div
                        className={cn(
                            "flex flex-col items-center justify-center py-8 text-center rounded-lg border-2 border-dashed transition-all",
                            isOver ? "border-primary/40 bg-primary/5 text-primary" : "border-slate-200 text-muted-foreground",
                        )}
                    >
                        <p className="text-xs font-medium animate-pulse">Drop tasks here</p>
                    </div>
                )}

                {canAddTask && (
                    <button
                        onClick={onAddTask}
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed border-slate-300 text-slate-500 hover:text-slate-700 hover:border-slate-400 hover:bg-slate-50 transition-colors text-sm font-medium mt-auto"
                    >
                        <Plus className="h-4 w-4" /> Add Task
                    </button>
                )}
            </div>
        </div>
    );
}
