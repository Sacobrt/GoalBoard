import { useState, useEffect } from "react";
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCorners } from "@dnd-kit/core";
import { Search, X, Archive, Plus, Check, Pencil } from "lucide-react";
import { Column } from "./Column";
import { TaskCard } from "./TaskCard";
import { AddTaskDialog } from "./AddTaskDialog";
import { TaskDetailDialog } from "./TaskDetailDialog";
import { ArchivedTasks } from "./ArchivedTasks";
import { useKanban } from "../hooks/useKanban";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../../components/ui/dialog";
import { useBoardStore } from "../../board/store/boardStore";

const COL_COLORS = ["#94a3b8", "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899", "#f97316", "#f59e0b", "#10b981", "#ef4444"];

export function Board({ board, userRole }) {
    const columns = [...board.columns].sort((a, b) => a.order - b.order);
    const priorities = [...board.priorities].sort((a, b) => a.order - b.order);
    const members = board.members ?? [];

    const { tasks, archivedTasks, addTask, updateTask, archiveTask, restoreTask, deleteTask, archiveColumnTasks, moveTask, reorderTasks } = useKanban(board.id);
    const { updateColumn, addColumn, removeColumn } = useBoardStore();
    const [detailTaskId, setDetailTaskId] = useState(null);
    const [detailTaskEditing, setDetailTaskEditing] = useState(false);
    const [activeTaskId, setActiveTaskId] = useState(null);
    const [search, setSearch] = useState("");
    const [filterPriorityId, setFilterPriorityId] = useState("all");
    const [showArchived, setShowArchived] = useState(false);

    const [addTaskOpen, setAddTaskOpen] = useState(false);
    const [addTaskColumnId, setAddTaskColumnId] = useState(null);
    const [addColOpen, setAddColOpen] = useState(false);
    const [addColName, setAddColName] = useState("");
    const [addColColor, setAddColColor] = useState("#94a3b8");
    const [taskContextMenu, setTaskContextMenu] = useState(null); // { x, y, taskId }

    useEffect(() => {
        if (!taskContextMenu) return;
        function close() {
            setTaskContextMenu(null);
        }
        window.addEventListener("click", close);
        window.addEventListener("contextmenu", close);
        return () => {
            window.removeEventListener("click", close);
            window.removeEventListener("contextmenu", close);
        };
    }, [taskContextMenu]);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

    const activeTask = tasks.find((t) => t.id === activeTaskId) ?? null;
    const detailTask = tasks.find((t) => t.id === detailTaskId) ?? null;

    const filteredTasks = tasks.filter((t) => {
        const q = search.toLowerCase();
        const matchSearch = !q || t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q);
        const taskPriorityIds = t.priorityIds ?? (t.priorityId ? [t.priorityId] : []);
        const matchPriority = filterPriorityId === "all" || taskPriorityIds.includes(filterPriorityId);
        return matchSearch && matchPriority;
    });

    function handleDragStart({ active }) {
        setActiveTaskId(String(active.id));
    }

    function handleDragEnd({ active, over }) {
        setActiveTaskId(null);
        if (!over) return;

        const activeId = String(active.id);
        const overId = String(over.id);
        if (activeId === overId) return;

        const task = tasks.find((t) => t.id === activeId);
        if (!task) return;

        const overTask = tasks.find((t) => t.id === overId);
        const overColumn = columns.find((c) => c.id === overId);

        const newColumnId = overTask ? overTask.columnId : overColumn ? overColumn.id : task.columnId;
        const targetColumn = columns.find((c) => c.id === newColumnId);

        if (task.columnId !== newColumnId && targetColumn) {
            moveTask(activeId, newColumnId, targetColumn.isDone);
        }

        if (overTask && activeId !== overId) {
            reorderTasks(activeId, overId);
        }
    }

    // Build a lookup: priorityId → priority
    const priorityMap = Object.fromEntries(priorities.map((p) => [p.id, p]));

    return (
        <>
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tasks..." className="pl-9 pr-8" />
                    {search && (
                        <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 hover:bg-black/5">
                            <X className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                    )}
                </div>

                {/* Priority filter */}
                <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                        onClick={() => setFilterPriorityId("all")}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
                        style={{
                            background: filterPriorityId === "all" ? "#6366f1" : "#f8fafc",
                            color: filterPriorityId === "all" ? "#fff" : "#64748b",
                            border: `1px solid ${filterPriorityId === "all" ? "transparent" : "#e2e8f0"}`,
                        }}
                    >
                        All
                    </button>
                    {priorities.map((p) => (
                        <button
                            key={p.id}
                            onClick={() => setFilterPriorityId(p.id)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
                            style={{
                                background: filterPriorityId === p.id ? p.color : "#f8fafc",
                                color: filterPriorityId === p.id ? "#fff" : "#64748b",
                                border: `1px solid ${filterPriorityId === p.id ? "transparent" : "#e2e8f0"}`,
                            }}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3 sm:ml-auto">
                    {archivedTasks.length > 0 && (
                        <Button variant="outline" size="sm" onClick={() => setShowArchived(true)}>
                            <Archive className="h-4 w-4" />
                            Archived ({archivedTasks.length})
                        </Button>
                    )}
                    <p className="text-sm hidden sm:block text-muted-foreground">
                        {filteredTasks.length} task{filteredTasks.length !== 1 && "s"}
                    </p>
                </div>
            </div>

            {/* Board */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragCancel={() => setActiveTaskId(null)}
            >
                <div className="flex gap-4 overflow-x-auto pb-4 items-start min-h-125">
                    {columns.map((column) => {
                        const columnTasks = filteredTasks.filter((t) => t.columnId === column.id);
                        const totalInCol = tasks.filter((t) => t.columnId === column.id).length;
                        return (
                            <div key={column.id} className="w-72 shrink-0 h-full">
                                <Column
                                    column={column}
                                    taskCount={columnTasks.length}
                                    totalCount={totalInCol}
                                    taskIds={columnTasks.map((t) => t.id)}
                                    userRole={userRole}
                                    onUpdateTitle={(title) => updateColumn(column.id, { title })}
                                    onAddTask={() => {
                                        setAddTaskColumnId(column.id);
                                        setAddTaskOpen(true);
                                    }}
                                    onArchiveColumn={() => archiveColumnTasks(board.id, column.id)}
                                    onRemoveColumn={() => removeColumn(board.id, column.id)}
                                >
                                    {columnTasks.map((task, i) => (
                                        <div key={task.id} className="animate-slide-up" style={{ animationDelay: `${i * 30}ms` }}>
                                            <TaskCard
                                                task={task}
                                                priorityMap={priorityMap}
                                                onEdit={(t) => {
                                                    setDetailTaskId(t.id);
                                                    setDetailTaskEditing(true);
                                                }}
                                                onClick={(t) => {
                                                    setDetailTaskId(t.id);
                                                    setDetailTaskEditing(false);
                                                }}
                                                onArchive={archiveTask}
                                                onContextMenu={(x, y, taskId) => setTaskContextMenu({ x, y, taskId })}
                                                userRole={userRole}
                                            />
                                        </div>
                                    ))}
                                    {columnTasks.length === 0 && (
                                        <div className="flex flex-col items-center justify-center py-10 text-center">
                                            <p className="text-xs text-muted-foreground">
                                                {search || filterPriorityId !== "all" ? "No matching tasks" : "Drop tasks here"}
                                            </p>
                                        </div>
                                    )}
                                </Column>
                            </div>
                        );
                    })}

                    {userRole !== "viewer" && (
                        <div className="w-72 shrink-0 h-full flex flex-col">
                            <button
                                onClick={() => setAddColOpen(true)}
                                className="w-full flex items-center gap-2 py-4 rounded-xl border-2 border-dashed border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300 hover:bg-slate-50/50 transition-colors text-sm font-semibold justify-center"
                            >
                                <Plus className="h-4 w-4" /> Add Column
                            </button>
                        </div>
                    )}
                </div>

                <DragOverlay dropAnimation={{ duration: 140, easing: "ease-out" }}>
                    {activeTask ? (
                        <TaskCard
                            task={activeTask}
                            priorityMap={priorityMap}
                            onEdit={() => {}}
                            onClick={() => {}}
                            onArchive={() => {}}
                            isOverlay
                            userRole={userRole}
                        />
                    ) : null}
                </DragOverlay>
            </DndContext>

            <AddTaskDialog
                open={addTaskOpen}
                onOpenChange={setAddTaskOpen}
                onAdd={addTask}
                priorities={priorities}
                defaultColumnId={addTaskColumnId}
                members={members}
            />

            <TaskDetailDialog
                key={`${detailTaskId}-${detailTaskEditing}`}
                task={detailTask}
                open={detailTaskId !== null}
                onClose={() => {
                    setDetailTaskId(null);
                    setDetailTaskEditing(false);
                }}
                onSave={updateTask}
                onArchive={archiveTask}
                columns={columns}
                priorities={priorities}
                members={members}
                userRole={userRole}
                initialEditing={detailTaskEditing}
            />

            {showArchived && (
                <ArchivedTasks
                    tasks={archivedTasks}
                    priorityMap={priorityMap}
                    onRestore={restoreTask}
                    onDelete={deleteTask}
                    onClose={() => setShowArchived(false)}
                />
            )}

            {/* Task right-click context menu */}
            {taskContextMenu &&
                (() => {
                    return (
                        <div
                            className="fixed z-50 rounded-xl border border-border bg-popover shadow-xl py-1.5 min-w-[170px] animate-fade-in"
                            style={{ top: taskContextMenu.y, left: taskContextMenu.x }}
                            onClick={(e) => e.stopPropagation()}
                            onContextMenu={(e) => e.preventDefault()}
                        >
                            <button
                                onClick={() => {
                                    setDetailTaskId(taskContextMenu.taskId);
                                    setDetailTaskEditing(true);
                                    setTaskContextMenu(null);
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted/40 transition-colors"
                            >
                                <Pencil className="h-3.5 w-3.5" />
                                Edit task
                            </button>
                            <div className="mx-3 my-1 h-px bg-border" />
                            <button
                                onClick={() => {
                                    archiveTask(taskContextMenu.taskId);
                                    setTaskContextMenu(null);
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-amber-600 hover:bg-amber-50 transition-colors"
                            >
                                <Archive className="h-3.5 w-3.5" />
                                Archive task
                            </button>
                        </div>
                    );
                })()}

            {/* Add Column dialog */}
            <Dialog
                open={addColOpen}
                onOpenChange={(v) => {
                    setAddColOpen(v);
                    if (!v) {
                        setAddColName("");
                        setAddColColor("#94a3b8");
                    }
                }}
            >
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>New Column</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-1">
                        <div>
                            <label className="block text-xs font-medium mb-1.5 text-slate-600">
                                Column name <span className="text-red-500">*</span>
                            </label>
                            <Input
                                value={addColName}
                                onChange={(e) => setAddColName(e.target.value)}
                                placeholder="e.g. In Review"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && addColName.trim()) {
                                        addColumn(board.id, addColName.trim(), addColColor);
                                        setAddColOpen(false);
                                        setAddColName("");
                                        setAddColColor("#94a3b8");
                                    }
                                }}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-2 text-slate-600">Color</label>
                            <div className="flex items-center gap-2 flex-wrap">
                                {COL_COLORS.map((c) => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setAddColColor(c)}
                                        className="w-7 h-7 rounded-full transition-transform hover:scale-110 flex items-center justify-center"
                                        style={{ background: c, outline: addColColor === c ? `2px solid ${c}` : "none", outlineOffset: "2px" }}
                                    >
                                        {addColColor === c && <Check className="h-3.5 w-3.5 text-white drop-shadow" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setAddColOpen(false);
                                setAddColName("");
                                setAddColColor("#94a3b8");
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            disabled={!addColName.trim()}
                            onClick={() => {
                                addColumn(board.id, addColName.trim(), addColColor);
                                setAddColOpen(false);
                                setAddColName("");
                                setAddColColor("#94a3b8");
                            }}
                        >
                            Create Column
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
