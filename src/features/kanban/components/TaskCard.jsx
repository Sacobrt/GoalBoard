import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MoreHorizontal, Pencil, Archive, CalendarClock, User, Euro } from "lucide-react";
import { cn } from "../../../lib/utils";
import { Button } from "../../../components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "../../../components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from "../../../components/ui/alert-dialog";

export function TaskCard({ task, priorityMap = {}, onEdit, onClick, onArchive, onContextMenu, isOverlay = false, userRole }) {
    const isViewer = userRole === "viewer";
    const [archiveOpen, setArchiveOpen] = useState(false);
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: task.id,
        disabled: isOverlay || isViewer,
    });

    // Support both legacy single-value and new array fields
    const priorityIds = task.priorityIds ?? (task.priorityId ? [task.priorityId] : []);
    const assigneeIds = task.assigneeIds ?? (task.assigneeId ? [task.assigneeId] : []);

    const today = new Date().toISOString().split("T")[0];
    const dueDateDay = task.dueDate?.split("T")[0];
    const isDone = !!task.completedAt;
    const isOverdue = dueDateDay && !isDone && dueDateDay < today;
    const isDueToday = dueDateDay && !isDone && dueDateDay === today;

    const style = isOverlay
        ? { transform: "rotate(2deg) scale(1.02)", pointerEvents: "none", zIndex: 50 }
        : {
              transform: CSS.Translate.toString(transform),
              transition: transition || (isDragging ? undefined : "opacity 0.15s, box-shadow 0.15s"),
              opacity: isDragging ? 0.4 : 1,
          };

    return (
        <div
            ref={isOverlay ? undefined : setNodeRef}
            style={style}
            {...(isOverlay ? {} : attributes)}
            {...(isOverlay ? {} : listeners)}
            className="outline-none touch-manipulation cursor-grab active:cursor-grabbing"
            onContextMenu={(e) => {
                if (!isOverlay && !isViewer && onContextMenu) {
                    e.preventDefault();
                    e.stopPropagation();
                    onContextMenu(e.clientX, e.clientY, task.id);
                }
            }}
            onClick={(e) => {
                // Only open detail if not dragging and not clicking menu
                if (!isDragging && !isOverlay && onClick && e.target.closest("[data-no-click]") === null) {
                    onClick(task);
                }
            }}
        >
            <div
                className={cn(
                    "group rounded-lg border bg-white transition-shadow duration-150 relative overflow-hidden",
                    isOverlay ? "shadow-xl border-slate-300" : "shadow-sm border-slate-100 hover:shadow hover:border-slate-200",
                )}
            >
                {/* Card header */}
                <div className="flex items-start gap-1.5 px-3 pt-3 pb-1">
                    <p className="flex-1 text-sm font-semibold leading-snug text-slate-800 select-none">{task.title}</p>

                    {!isOverlay && !isViewer && (
                        <>
                            <DropdownMenu>
                                <DropdownMenuTrigger
                                    render={
                                        <Button
                                            data-no-click
                                            variant="ghost"
                                            size="icon"
                                            aria-label={`Options for ${task.title}`}
                                            className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100"
                                        />
                                    }
                                >
                                    <MoreHorizontal className="h-4 w-4" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenuItem onClick={() => onEdit(task)}>
                                        <Pencil className="mr-2 h-3.5 w-3.5" />
                                        Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        className="text-amber-600 hover:text-amber-700!"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setArchiveOpen(true);
                                        }}
                                    >
                                        <Archive className="mr-2 h-3.5 w-3.5" />
                                        Archive
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <AlertDialog open={archiveOpen} onOpenChange={setArchiveOpen}>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Archive task?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            &ldquo;{task.title}&rdquo; will be moved to the archive. You can restore it later.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => onArchive(task.id)} className="bg-amber-600 text-white hover:bg-amber-700">
                                            Archive
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </>
                    )}
                </div>

                <div className="flex items-center flex-wrap gap-1 px-3 pb-3 pt-1">
                    {/* Priority badges — show first 2, then overflow count */}
                    {priorityIds.slice(0, 2).map((pid) => {
                        const p = priorityMap[pid];
                        return p ? (
                            <span
                                key={pid}
                                className="inline-flex items-center rounded px-2 py-0.5 text-[10px] font-medium"
                                style={{ background: `${p.color}25`, color: "#1e293b" }}
                            >
                                {p.label}
                            </span>
                        ) : null;
                    })}
                    {priorityIds.length > 2 && (
                        <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-500">
                            +{priorityIds.length - 2}
                        </span>
                    )}

                    {task.dueDate && (
                        <span
                            className="flex items-center gap-1 text-[10px] rounded px-1.5 py-0.5 font-medium"
                            style={{
                                background: isOverdue ? "rgba(239,68,68,0.1)" : isDueToday ? "rgba(245,158,11,0.1)" : "transparent",
                                color: isOverdue ? "#b91c1c" : isDueToday ? "#b45309" : "#475569",
                            }}
                        >
                            <CalendarClock className="h-3 w-3" />
                            {isOverdue ? "Overdue" : isDueToday ? "Today" : dueDateDay}
                        </span>
                    )}

                    {/* Cost badge */}
                    {task.cost > 0 && (
                        <span className="flex items-center gap-0.5 text-[10px] rounded px-1.5 py-0.5 font-medium bg-emerald-50 text-emerald-700">
                            <Euro className="h-3 w-3" />
                            {task.cost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                        </span>
                    )}

                    {/* Assignee avatars — stack up to 3 */}
                    {assigneeIds.length > 0 && (
                        <div className="flex items-center ml-auto">
                            {assigneeIds.slice(0, 3).map((id, i) => (
                                <span
                                    key={id}
                                    className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 shrink-0 ring-1 ring-white"
                                    style={{ marginLeft: i > 0 ? "-4px" : 0 }}
                                    title={`Assigned (${assigneeIds.length})`}
                                >
                                    <User className="h-2.5 w-2.5" />
                                </span>
                            ))}
                            {assigneeIds.length > 3 && (
                                <span
                                    className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-slate-500 text-[9px] font-bold ring-1 ring-white"
                                    style={{ marginLeft: "-4px" }}
                                >
                                    +{assigneeIds.length - 3}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
