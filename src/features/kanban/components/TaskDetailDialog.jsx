import { useState, useEffect } from "react";
import { CalendarIcon, X, User, Pencil, Archive, Clock, CheckCircle2, Euro, ChevronDown, ChevronUp } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Popover, PopoverTrigger, PopoverContent } from "../../../components/ui/popover";
import { MarkdownEditor, MarkdownPreview } from "./MarkdownEditor";
import { DateTimePicker } from "./DateTimePicker";
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
import { taskSchema } from "../domain/schemas/taskSchema";

export function TaskDetailDialog({
    task,
    open,
    onClose,
    onSave,
    onArchive,
    columns = [],
    priorities = [],
    members = [],
    userRole,
    initialEditing = false,
    hasBudget = false,
}) {
    const [editing, setEditing] = useState(initialEditing);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priorityIds, setPriorityIds] = useState([]);
    const [columnId, setColumnId] = useState("");
    const [assigneeIds, setAssigneeIds] = useState([]);
    const [dueDate, setDueDate] = useState(null);
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [archiveOpen, setArchiveOpen] = useState(false);
    const [cost, setCost] = useState("");
    const [descExpanded, setDescExpanded] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});

    const isViewer = userRole === "viewer";

    useEffect(() => {
        if (task) {
            setTitle(task.title);
            setDescription(task.description ?? "");
            setPriorityIds(task.priorityIds ?? (task.priorityId ? [task.priorityId] : []));
            setColumnId(task.columnId);
            setAssigneeIds(task.assigneeIds ?? (task.assigneeId ? [task.assigneeId] : []));
            setDueDate(task.dueDate ? parseISO(task.dueDate) : null);
            setCost(task.cost ?? "");
            setEditing(initialEditing);
        }
    }, [task, initialEditing]);

    if (!task) return null;

    const today = new Date().toISOString().split("T")[0];
    const dueDateDay = task.dueDate?.split("T")[0];
    const column = columns.find((c) => c.id === task.columnId);
    const taskPriorities = (task.priorityIds ?? (task.priorityId ? [task.priorityId] : [])).map((id) => priorities.find((p) => p.id === id)).filter(Boolean);
    const taskAssignees = task.assigneeIds ?? (task.assigneeId ? [task.assigneeId] : []);
    const isDone = !!task.completedAt;
    const isOverdue = dueDateDay && !isDone && dueDateDay < today;
    const isDueToday = dueDateDay && !isDone && dueDateDay === today;

    // Resolve username from localStorage users list
    function getUserName(userId) {
        if (!userId) return null;
        const member = members.find((m) => m.userId === userId);
        if (member?.username) return member.username;
        const users = JSON.parse(localStorage.getItem("goalboard_users") ?? "[]");
        return users.find((u) => u.id === userId)?.username ?? "Unknown";
    }

    function handleSave() {
        const result = taskSchema.safeParse({
            title,
            description,
            priorityIds,
            assigneeIds,
            dueDate,
            cost: String(cost),
        });

        if (!result.success) {
            const fieldErrors = {};
            for (const issue of result.error.issues) {
                const field = issue.path[0];
                if (!fieldErrors[field]) fieldErrors[field] = issue.message;
            }
            setValidationErrors(fieldErrors);
            return;
        }

        setValidationErrors({});

        const targetColumn = columns.find((c) => c.id === columnId);
        const wasDone = !!task.completedAt;
        const nowDone = targetColumn?.isDone ?? false;

        onSave(task.id, {
            title: result.data.title,
            description: result.data.description ?? "",
            priorityIds,
            columnId,
            assigneeIds,
            dueDate: dueDate ? format(dueDate, "yyyy-MM-dd'T'HH:mm") : null,
            cost: result.data.cost ? parseFloat(result.data.cost) : 0,
            completedAt: nowDone && !wasDone ? new Date().toISOString() : !nowDone && wasDone ? null : task.completedAt,
        });
        setEditing(false);
    }

    function handleCancel() {
        setTitle(task.title);
        setDescription(task.description ?? "");
        setPriorityIds(task.priorityIds ?? (task.priorityId ? [task.priorityId] : []));
        setColumnId(task.columnId);
        setAssigneeIds(task.assigneeIds ?? (task.assigneeId ? [task.assigneeId] : []));
        setDueDate(task.dueDate ? parseISO(task.dueDate) : null);
        setCost(task.cost ?? "");
        setEditing(false);
        setValidationErrors({});
    }

    return (
        <>
            <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
                <DialogContent
                    id="task-dialog-content"
                    showCloseButton={false}
                    aria-describedby={undefined}
                    className="sm:max-w-xl md:max-w-2xl lg:max-w-3xl max-h-[90dvh] overflow-y-auto"
                >
                    <DialogHeader>
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                                <DialogTitle className={editing ? "sr-only" : "text-lg font-bold text-slate-900 leading-snug"}>{task.title}</DialogTitle>
                                {editing && (
                                    <Input
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="text-lg font-bold"
                                        autoFocus
                                        aria-invalid={!!validationErrors.title}
                                    />
                                )}
                                {editing && validationErrors.title && (
                                    <p className="text-destructive text-xs font-medium mt-1" role="alert">
                                        {validationErrors.title}
                                    </p>
                                )}
                            </div>
                            {!isViewer && !editing && (
                                <div className="flex items-center gap-2 shrink-0">
                                    <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                                        <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit
                                    </Button>
                                </div>
                            )}
                        </div>
                    </DialogHeader>

                    <div className="space-y-6 mt-2">
                        {/* Status bar */}
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Column / status */}
                            {editing ? (
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-slate-500">Status:</span>
                                    <select
                                        value={columnId}
                                        onChange={(e) => setColumnId(e.target.value)}
                                        className="h-8 text-xs w-36 rounded-md border border-input bg-background px-2 focus:outline-none focus:ring-2 focus:ring-ring/50"
                                    >
                                        {columns.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                column && (
                                    <span
                                        className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium"
                                        style={{ background: `${column.color}15`, color: column.color }}
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: column.color }} />
                                        {column.title}
                                    </span>
                                )
                            )}

                            {/* Due date */}
                            {editing ? (
                                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                                    <PopoverTrigger render={<Button type="button" variant="outline" size="sm" className="h-8 text-xs" />}>
                                        <CalendarIcon className="mr-1.5 h-3.5 w-3.5 text-slate-400" />
                                        {dueDate ? format(dueDate, "MMM d, yyyy 'at' HH:mm") : "Set date & time"}
                                        {dueDate && (
                                            <X
                                                className="ml-1.5 h-3 w-3 opacity-50 hover:opacity-100"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDueDate(null);
                                                }}
                                            />
                                        )}
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <DateTimePicker selected={dueDate} onSelect={setDueDate} />
                                    </PopoverContent>
                                </Popover>
                            ) : (
                                task.dueDate && (
                                    <span
                                        className="flex items-center gap-1 text-xs font-medium rounded px-2 py-1"
                                        style={{
                                            background: isOverdue ? "rgba(239,68,68,0.1)" : isDueToday ? "rgba(245,158,11,0.1)" : "rgba(100,116,139,0.08)",
                                            color: isOverdue ? "#ef4444" : isDueToday ? "#f59e0b" : "#64748b",
                                        }}
                                    >
                                        <Clock className="h-3 w-3" />
                                        {isOverdue ? "Overdue" : isDueToday ? "Due today" : format(parseISO(task.dueDate), "MMM d, yyyy 'at' HH:mm")}
                                    </span>
                                )
                            )}

                            {isDone && (
                                <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 rounded px-2 py-1">
                                    <CheckCircle2 className="h-3 w-3" /> Completed
                                </span>
                            )}
                        </div>

                        {/* Priorities */}
                        <div className="flex items-start gap-3">
                            <span className="text-xs font-medium text-slate-500 w-16 shrink-0 pt-1">Priority</span>
                            {editing ? (
                                <div className="flex flex-wrap gap-1.5">
                                    {priorities.map((p) => {
                                        const selected = priorityIds.includes(p.id);
                                        return (
                                            <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => setPriorityIds(selected ? priorityIds.filter((x) => x !== p.id) : [...priorityIds, p.id])}
                                                className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium transition-all"
                                                style={{
                                                    background: selected ? p.color : `${p.color}18`,
                                                    color: selected ? "#fff" : p.color,
                                                    outline: selected ? `2px solid ${p.color}` : "none",
                                                    outlineOffset: "1px",
                                                }}
                                            >
                                                {p.label}
                                            </button>
                                        );
                                    })}
                                    {priorities.length === 0 && <span className="text-xs text-slate-400">No priorities defined</span>}
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-1.5 pt-0.5">
                                    {taskPriorities.length > 0 ? (
                                        taskPriorities.map((p) => (
                                            <span
                                                key={p.id}
                                                className="inline-flex items-center rounded px-2.5 py-1 text-xs font-medium"
                                                style={{ background: `${p.color}15`, color: p.color }}
                                            >
                                                {p.label}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-sm text-slate-400">None</span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Assignees */}
                        <div className="flex items-start gap-3">
                            <span className="text-xs font-medium text-slate-500 w-16 shrink-0 pt-1">Assignees</span>
                            {editing ? (
                                <div className="flex-1 space-y-2">
                                    {assigneeIds.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5">
                                            {assigneeIds.map((id) => (
                                                <span
                                                    key={id}
                                                    className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-xs font-medium"
                                                >
                                                    {getUserName(id)}
                                                    <button
                                                        type="button"
                                                        onClick={() => setAssigneeIds(assigneeIds.filter((i) => i !== id))}
                                                        className="hover:bg-indigo-100 rounded p-0.5 transition-colors"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    {members.filter((m) => !assigneeIds.includes(m.userId)).length > 0 ? (
                                        <select
                                            onChange={(e) => {
                                                if (e.target.value) {
                                                    setAssigneeIds([...assigneeIds, e.target.value]);
                                                    e.target.value = "";
                                                }
                                            }}
                                            className="w-full h-8 rounded-md border border-input bg-background px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring/50"
                                        >
                                            <option value="">+ Add assignee...</option>
                                            {members
                                                .filter((m) => !assigneeIds.includes(m.userId))
                                                .map((m) => (
                                                    <option key={m.userId} value={m.userId}>
                                                        {getUserName(m.userId)} ({m.role})
                                                    </option>
                                                ))}
                                        </select>
                                    ) : (
                                        members.length === 0 && <span className="text-xs text-slate-400">No board members</span>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                                    {taskAssignees.length > 0 ? (
                                        taskAssignees.map((id) => (
                                            <div key={id} className="flex items-center gap-1.5">
                                                <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center">
                                                    <User className="h-3 w-3 text-indigo-600" />
                                                </div>
                                                <span className="text-sm text-slate-700">{getUserName(id)}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <span className="text-sm text-slate-400">Unassigned</span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Cost */}
                        {hasBudget && (
                            <div>
                                <span className="text-xs font-medium text-slate-500 mb-1.5 block">Cost (€)</span>
                                {editing ? (
                                    <div>
                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={cost}
                                            onChange={(e) => setCost(e.target.value)}
                                            placeholder="0.00"
                                            className="max-w-40"
                                            aria-invalid={!!validationErrors.cost}
                                        />
                                        {validationErrors.cost && (
                                            <p className="text-destructive text-xs font-medium mt-1" role="alert">
                                                {validationErrors.cost}
                                            </p>
                                        )}
                                    </div>
                                ) : task.cost > 0 ? (
                                    <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 bg-emerald-50 rounded-md px-2 py-1">
                                        <Euro className="h-3.5 w-3.5" />
                                        {task.cost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                    </span>
                                ) : (
                                    <span className="text-sm text-slate-400">No cost assigned</span>
                                )}
                            </div>
                        )}

                        {/* Description */}
                        <div>
                            <span className="text-xs font-medium text-slate-500 mb-2 block">Description</span>
                            {editing ? (
                                <div>
                                    <MarkdownEditor value={description} onChange={setDescription} placeholder="Add a detailed description using Markdown..." />
                                    {validationErrors.description && (
                                        <p className="text-destructive text-xs font-medium mt-1" role="alert">
                                            {validationErrors.description}
                                        </p>
                                    )}
                                </div>
                            ) : description ? (
                                <div>
                                    <div
                                        className={`rounded-lg border ${descExpanded ? "" : "h-48"} overflow-y-auto border-slate-100 bg-slate-50/50 p-4 transition-all`}
                                    >
                                        <MarkdownPreview content={description} />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setDescExpanded((v) => !v)}
                                        className="mt-1.5 flex items-center gap-1 text-xs text-primary hover:underline"
                                    >
                                        {descExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                        {descExpanded ? "Show less" : "Show more"}
                                    </button>
                                </div>
                            ) : (
                                <p className="text-sm text-slate-400 italic">No description provided.</p>
                            )}
                        </div>

                        {/* Meta info */}
                        <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                            <span>Created {format(parseISO(task.createdAt), "MMM d, yyyy 'at' h:mm a")}</span>
                            {task.completedAt && <span>Completed {format(parseISO(task.completedAt), "MMM d, yyyy")}</span>}
                        </div>

                        {/* Action buttons */}
                        {editing ? (
                            <div className="flex items-center gap-2 justify-end">
                                <Button type="button" variant="outline" size="sm" onClick={handleCancel}>
                                    Cancel
                                </Button>
                                <Button type="button" size="sm" onClick={handleSave}>
                                    Save Changes
                                </Button>
                            </div>
                        ) : (
                            !isViewer && (
                                <div className="flex items-center gap-2 justify-end">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="text-amber-600 border-amber-200 hover:bg-amber-50"
                                        onClick={() => setArchiveOpen(true)}
                                    >
                                        <Archive className="h-3.5 w-3.5 mr-1.5" /> Archive
                                    </Button>
                                </div>
                            )
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <AlertDialog open={archiveOpen} onOpenChange={setArchiveOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Archive task?</AlertDialogTitle>
                        <AlertDialogDescription>&ldquo;{task.title}&rdquo; will be moved to the archive. You can restore it later.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                onArchive(task.id);
                                setArchiveOpen(false);
                                onClose();
                            }}
                            className="bg-amber-600 text-white hover:bg-amber-700"
                        >
                            Archive
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
