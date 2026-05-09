import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Popover, PopoverTrigger, PopoverContent } from "../../../components/ui/popover";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "../../../components/ui/form";
import { MarkdownEditor } from "./MarkdownEditor";
import { DateTimePicker } from "./DateTimePicker";
import { taskSchema } from "../domain/schemas/taskSchema";

export function AddTaskDialog({ open, onOpenChange, onAdd, priorities = [], defaultColumnId, members = [], hasBudget = false }) {
    const [calendarOpen, setCalendarOpen] = useState(false);
    const titleRef = useRef(null);

    const form = useForm({
        resolver: zodResolver(taskSchema),
        defaultValues: {
            title: "",
            description: "",
            priorityIds: [],
            assigneeIds: [],
            dueDate: null,
            cost: "",
        },
    });

    const { reset, handleSubmit, watch, setValue, setFocus } = form;
    const watchedPriorityIds = watch("priorityIds");
    const watchedAssigneeIds = watch("assigneeIds");
    const watchedDueDate = watch("dueDate");

    useEffect(() => {
        if (open) {
            reset({ title: "", description: "", priorityIds: [], assigneeIds: [], dueDate: null, cost: "" });
            // Focus the title field after dialog animation
            setTimeout(() => titleRef.current?.focus(), 50);
        }
    }, [open, reset]);

    function handleOpenChange(next) {
        if (!next) reset();
        onOpenChange(next);
    }

    function togglePriority(id) {
        const current = watchedPriorityIds;
        setValue("priorityIds", current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
    }

    function addAssignee(userId) {
        if (userId && !watchedAssigneeIds.includes(userId)) {
            setValue("assigneeIds", [...watchedAssigneeIds, userId]);
        }
    }

    function removeAssignee(userId) {
        setValue(
            "assigneeIds",
            watchedAssigneeIds.filter((id) => id !== userId),
        );
    }

    function getUserName(userId) {
        const users = JSON.parse(localStorage.getItem("goalboard_users") ?? "[]");
        return users.find((u) => u.id === userId)?.username ?? "Unknown";
    }

    function onSubmit(data) {
        onAdd({
            id: crypto.randomUUID(),
            title: data.title,
            description: data.description ?? "",
            priorityIds: data.priorityIds,
            assigneeIds: data.assigneeIds,
            columnId: defaultColumnId,
            dueDate: data.dueDate ? format(data.dueDate, "yyyy-MM-dd'T'HH:mm") : null,
            cost: data.cost ? parseFloat(data.cost) : 0,
            completedAt: null,
            archived: false,
            archivedAt: null,
            createdAt: new Date().toISOString(),
        });
        reset();
        onOpenChange(false);
    }

    const unassignedMembers = members.filter((m) => !watchedAssigneeIds.includes(m.userId));

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent showCloseButton={false} className="sm:max-w-xl md:max-w-2xl lg:max-w-3xl max-h-[90dvh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add New Task</DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={handleSubmit(onSubmit)} noValidate>
                        <div className="space-y-4">
                            {/* Title */}
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs text-muted-foreground">
                                            Title <span className="text-red-500">*</span>
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                ref={(el) => {
                                                    field.ref(el);
                                                    titleRef.current = el;
                                                }}
                                                placeholder="What needs to be done?"
                                                aria-invalid={!!form.formState.errors.title}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Description */}
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs text-muted-foreground">
                                            Description <span className="text-muted-foreground font-normal">(optional — supports Markdown)</span>
                                        </FormLabel>
                                        <FormControl>
                                            <MarkdownEditor value={field.value} onChange={field.onChange} placeholder="Add more context using Markdown..." />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Priorities — toggle chips */}
                            {priorities.length > 0 && (
                                <FormField
                                    control={form.control}
                                    name="priorityIds"
                                    render={() => (
                                        <FormItem>
                                            <FormLabel className="text-xs text-muted-foreground">
                                                Priority <span className="text-muted-foreground font-normal">(select multiple)</span>
                                            </FormLabel>
                                            <FormControl>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {priorities.map((p) => {
                                                        const selected = watchedPriorityIds.includes(p.id);
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
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            {/* Due date — DateTimePicker */}
                            <FormField
                                control={form.control}
                                name="dueDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs text-muted-foreground">
                                            Due date & time <span className="text-muted-foreground font-normal">(optional)</span>
                                        </FormLabel>
                                        <FormControl>
                                            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                                                <PopoverTrigger asChild>
                                                    <Button type="button" variant="outline" className="w-full justify-start text-left font-normal h-9">
                                                        <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                                                        {field.value ? (
                                                            format(field.value, "MMM d, yyyy 'at' HH:mm")
                                                        ) : (
                                                            <span className="text-muted-foreground">Pick a date & time</span>
                                                        )}
                                                        {field.value && (
                                                            <X
                                                                className="ml-auto h-3.5 w-3.5 opacity-50 hover:opacity-100"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    field.onChange(null);
                                                                }}
                                                            />
                                                        )}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <DateTimePicker selected={field.value} onSelect={(date) => field.onChange(date)} />
                                                </PopoverContent>
                                            </Popover>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Cost */}
                            {hasBudget && (
                                <FormField
                                    control={form.control}
                                    name="cost"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs text-muted-foreground">
                                                Cost (€) <span className="text-muted-foreground font-normal">(optional)</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    {...field}
                                                    placeholder="0.00"
                                                    aria-invalid={!!form.formState.errors.cost}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            {/* Assignees — multi-chip */}
                            {members.length > 0 && (
                                <FormField
                                    control={form.control}
                                    name="assigneeIds"
                                    render={() => (
                                        <FormItem>
                                            <FormLabel className="text-xs text-muted-foreground">
                                                Assignees <span className="text-muted-foreground font-normal">(optional)</span>
                                            </FormLabel>
                                            <FormControl>
                                                <div>
                                                    {watchedAssigneeIds.length > 0 && (
                                                        <div className="flex flex-wrap gap-1.5 mb-2">
                                                            {watchedAssigneeIds.map((id) => (
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
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
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
                </Form>
            </DialogContent>
        </Dialog>
    );
}
