import { useState } from "react";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Popover, PopoverTrigger, PopoverContent } from "../../../components/ui/popover";
import { MarkdownEditor } from "./MarkdownEditor";
import { DateTimePicker } from "./DateTimePicker";

export function AddTaskDialog({ open, onOpenChange, onAdd, priorities = [], defaultColumnId, members = [] }) {
    const [form, setForm] = useState({ title: "", description: "", priorityIds: [], assigneeIds: [], dueDate: null });
    const [calendarOpen, setCalendarOpen] = useState(false);

    function handleOpenChange(next) {
        if (!next) setForm({ title: "", description: "", priorityIds: [], assigneeIds: [], dueDate: null });
        onOpenChange(next);
    }

    function set(field, value) {
        setForm((f) => ({ ...f, [field]: value }));
    }

    function togglePriority(id) {
        setForm((f) => ({
            ...f,
            priorityIds: f.priorityIds.includes(id) ? f.priorityIds.filter((x) => x !== id) : [...f.priorityIds, id],
        }));
    }

    function addAssignee(userId) {
        if (userId && !form.assigneeIds.includes(userId)) {
            setForm((f) => ({ ...f, assigneeIds: [...f.assigneeIds, userId] }));
        }
    }

    function removeAssignee(userId) {
        setForm((f) => ({ ...f, assigneeIds: f.assigneeIds.filter((id) => id !== userId) }));
    }

    function getUserName(userId) {
        const users = JSON.parse(localStorage.getItem("goalboard_users") ?? "[]");
        return users.find((u) => u.id === userId)?.username ?? "Unknown";
    }

    function handleSubmit(e) {
        e.preventDefault();
        if (!form.title.trim()) return;
        onAdd({
            id: crypto.randomUUID(),
            title: form.title.trim(),
            description: form.description.trim(),
            priorityIds: form.priorityIds,
            assigneeIds: form.assigneeIds,
            columnId: defaultColumnId,
            dueDate: form.dueDate ? format(form.dueDate, "yyyy-MM-dd'T'HH:mm") : null,
            completedAt: null,
            archived: false,
            archivedAt: null,
            createdAt: new Date().toISOString(),
        });
        setForm({ title: "", description: "", priorityIds: [], assigneeIds: [], dueDate: null });
        onOpenChange(false);
    }

    const unassignedMembers = members.filter((m) => !form.assigneeIds.includes(m.userId));

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent showCloseButton={false} className="sm:max-w-xl md:max-w-2xl lg:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Add New Task</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium mb-1.5 text-muted-foreground">
                                Title <span className="text-red-500">*</span>
                            </label>
                            <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="What needs to be done?" required autoFocus />
                        </div>

                        <div>
                            <label className="block text-xs font-medium mb-1.5 text-muted-foreground">
                                Description <span className="text-muted-foreground">(optional — supports Markdown)</span>
                            </label>
                            <MarkdownEditor value={form.description} onChange={(v) => set("description", v)} placeholder="Add more context using Markdown..." />
                        </div>

                        {/* Priorities — toggle chips */}
                        {priorities.length > 0 && (
                            <div>
                                <label className="block text-xs font-medium mb-1.5 text-muted-foreground">
                                    Priority <span className="text-muted-foreground">(select multiple)</span>
                                </label>
                                <div className="flex flex-wrap gap-1.5">
                                    {priorities.map((p) => {
                                        const selected = form.priorityIds.includes(p.id);
                                        return (
                                            <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => togglePriority(p.id)}
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
                                </div>
                            </div>
                        )}

                        {/* Due date — DateTimePicker */}
                        <div>
                            <label className="block text-xs font-medium mb-1.5 text-muted-foreground">
                                Due date & time <span className="text-muted-foreground">(optional)</span>
                            </label>
                            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                                <PopoverTrigger asChild>
                                    <Button type="button" variant="outline" className="w-full justify-start text-left font-normal h-9">
                                        <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                                        {form.dueDate ? (
                                            format(form.dueDate, "MMM d, yyyy 'at' HH:mm")
                                        ) : (
                                            <span className="text-muted-foreground">Pick a date & time</span>
                                        )}
                                        {form.dueDate && (
                                            <X
                                                className="ml-auto h-3.5 w-3.5 opacity-50 hover:opacity-100"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    set("dueDate", null);
                                                }}
                                            />
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <DateTimePicker selected={form.dueDate} onSelect={(date) => set("dueDate", date)} />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Assignees — multi-chip */}
                        {members.length > 0 && (
                            <div>
                                <label className="block text-xs font-medium mb-1.5 text-muted-foreground">
                                    Assignees <span className="text-muted-foreground">(optional)</span>
                                </label>

                                {form.assigneeIds.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mb-2">
                                        {form.assigneeIds.map((id) => (
                                            <span
                                                key={id}
                                                className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-xs font-medium"
                                            >
                                                {getUserName(id)}
                                                <button
                                                    type="button"
                                                    onClick={() => removeAssignee(id)}
                                                    className="hover:bg-indigo-100 rounded p-0.5 transition-colors"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {unassignedMembers.length > 0 && (
                                    <select
                                        onChange={(e) => {
                                            addAssignee(e.target.value);
                                            e.target.value = "";
                                        }}
                                        className="w-full h-9 rounded-md border border-input bg-background px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring/50"
                                    >
                                        <option value="">+ Add assignee...</option>
                                        {unassignedMembers.map((m) => (
                                            <option key={m.userId} value={m.userId}>
                                                {getUserName(m.userId)} ({m.role})
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        )}
                    </div>

                    <DialogFooter className="mt-4">
                        <DialogClose asChild>
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button type="submit">Add Task</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
