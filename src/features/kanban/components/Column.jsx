import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { cn } from "../../../lib/utils";
import { Input } from "../../../components/ui/input";
import { MoreHorizontal, Archive, Plus, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "../../../components/ui/dropdown-menu";

export function Column({ column, taskCount, children, taskIds = [], userRole, onUpdateTitle, onAddTask, onArchiveColumn, onRemoveColumn }) {
    const { isOver, setNodeRef } = useDroppable({ id: column.id });

    const [editing, setEditing] = useState(false);
    const safeTitle = typeof column.title === "string" ? column.title : column.title?.title || "New Column";
    const [draftTitle, setDraftTitle] = useState(safeTitle);

    function saveTitle() {
        if (draftTitle.trim() && draftTitle.trim() !== safeTitle) {
            onUpdateTitle(draftTitle.trim());
        }
        setEditing(false);
    }

    const canEdit = userRole !== "viewer";

    return (
        <div className="flex flex-col min-h-0 bg-slate-100/50 rounded-xl p-3">
            {/* Header */}
            <div className="flex items-center justify-between mb-3 px-1 group">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ background: column.color }} />
                    {editing ? (
                        <Input
                            value={draftTitle}
                            onChange={(e) => setDraftTitle(e.target.value)}
                            autoFocus
                            className="h-6 text-xs font-semibold uppercase tracking-widest px-1 py-0 w-full"
                            onKeyDown={(e) => e.key === "Enter" && saveTitle()}
                            onBlur={saveTitle}
                        />
                    ) : (
                        <h2
                            className={`text-xs font-semibold uppercase tracking-widest truncate text-muted-foreground ${canEdit ? "cursor-pointer hover:text-slate-900 transition-colors" : ""}`}
                            onClick={() => {
                                if (canEdit) {
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
                    {canEdit && (
                        <DropdownMenu>
                            <DropdownMenuTrigger className="flex items-center justify-center w-5 h-5 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-200 text-muted-foreground">
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
                ref={setNodeRef}
                className={cn(
                    "flex-1 min-h-80 transition-all duration-150 rounded-lg flex flex-col gap-3 outline-none",
                    isOver ? "bg-slate-200/50 ring-1 ring-slate-200" : "bg-transparent",
                )}
            >
                <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
                    {children}
                </SortableContext>

                {userRole !== "viewer" && (
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
