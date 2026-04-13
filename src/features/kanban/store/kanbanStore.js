import { create } from "zustand";
import { persist } from "zustand/middleware";
import { computeMoveTask, computeArchive, computeRestore } from "../domain/logic/taskLogic";

export const useKanbanStore = create(
    persist(
        (set) => ({
            tasks: [],

            addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),

            updateTask: (id, patch) =>
                set((state) => ({
                    tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
                })),

            // Move task to a different column; delegates completedAt logic to domain
            moveTask: (taskId, newColumnId, isDoneColumn) =>
                set((state) => ({
                    tasks: state.tasks.map((t) => {
                        if (t.id !== taskId) return t;
                        return { ...t, ...computeMoveTask(t, newColumnId, isDoneColumn) };
                    }),
                })),

            reorderTasks: (activeId, overId) =>
                set((state) => {
                    const oldIndex = state.tasks.findIndex((t) => t.id === activeId);
                    const newIndex = state.tasks.findIndex((t) => t.id === overId);
                    if (oldIndex !== -1 && newIndex !== -1) {
                        const newTasks = [...state.tasks];
                        const [moved] = newTasks.splice(oldIndex, 1);
                        newTasks.splice(newIndex, 0, moved);
                        return { tasks: newTasks };
                    }
                    return state;
                }),

            // Soft-delete: archive instead of removing
            archiveTask: (id) =>
                set((state) => ({
                    tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...computeArchive(t) } : t)),
                })),

            restoreTask: (id) =>
                set((state) => ({
                    tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...computeRestore(t) } : t)),
                })),

            // Archive all tasks in a column (bulk archive)
            archiveColumnTasks: (boardId, columnId) =>
                set((state) => ({
                    tasks: state.tasks.map((t) => (t.boardId === boardId && t.columnId === columnId && !t.archived ? { ...t, ...computeArchive(t) } : t)),
                })),

            // Permanent delete (only for archived tasks)
            deleteTask: (id) =>
                set((state) => ({
                    tasks: state.tasks.filter((t) => t.id !== id),
                })),
        }),
        { name: "goalboard_tasks" },
    ),
);
