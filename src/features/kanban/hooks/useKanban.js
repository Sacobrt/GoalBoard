import { useKanbanStore } from "../store/kanbanStore";
import { useAuthStore } from "../../auth/store/authStore";
import { useNotificationStore } from "../../notifications/store/notificationStore";

export function useKanban(boardId) {
    const userId = useAuthStore((s) => s.user?.id);
    const username = useAuthStore((s) => s.user?.username);

    const allTasks = useKanbanStore((s) => s.tasks);
    const _addTask = useKanbanStore((s) => s.addTask);
    const _updateTask = useKanbanStore((s) => s.updateTask);
    const archiveTask = useKanbanStore((s) => s.archiveTask);
    const restoreTask = useKanbanStore((s) => s.restoreTask);
    const deleteTask = useKanbanStore((s) => s.deleteTask);
    const archiveColumnTasks = useKanbanStore((s) => s.archiveColumnTasks);
    const moveTask = useKanbanStore((s) => s.moveTask);
    const reorderTasks = useKanbanStore((s) => s.reorderTasks);
    const addNotification = useNotificationStore((s) => s.addNotification);

    // Active (non-archived) tasks for this board
    const tasks = allTasks.filter((t) => t.boardId === boardId && !t.archived);

    // Archived tasks for this board
    const archivedTasks = allTasks.filter((t) => t.boardId === boardId && t.archived);

    // All tasks for this board (for stats)
    const allBoardTasks = allTasks.filter((t) => t.boardId === boardId);

    // Inject boardId + userId on every new task, and notify all assignees
    function addTask(taskData) {
        const task = { ...taskData, boardId, userId };
        _addTask(task);

        // Notify each assignee (supports both legacy assigneeId and new assigneeIds)
        const assigneeIds = task.assigneeIds ?? (task.assigneeId ? [task.assigneeId] : []);
        for (const aid of assigneeIds) {
            if (aid !== userId) {
                addNotification({
                    userId: aid,
                    type: "task_assigned",
                    message: `${username} assigned you to "${task.title}"`,
                    boardName: "",
                });
            }
        }
    }

    // Update task and notify on assignee array changes
    function updateTask(id, patch) {
        const existingTask = allTasks.find((t) => t.id === id);
        _updateTask(id, patch);

        if (existingTask && patch.assigneeIds !== undefined) {
            const oldIds = existingTask.assigneeIds ?? (existingTask.assigneeId ? [existingTask.assigneeId] : []);
            const newIds = patch.assigneeIds ?? [];
            const taskTitle = patch.title || existingTask.title;

            // Notify newly added assignees
            for (const aid of newIds) {
                if (!oldIds.includes(aid) && aid !== userId) {
                    addNotification({
                        userId: aid,
                        type: "task_assigned",
                        message: `${username} assigned you to "${taskTitle}"`,
                        boardName: "",
                    });
                }
            }

            // Notify removed assignees
            for (const aid of oldIds) {
                if (!newIds.includes(aid) && aid !== userId) {
                    addNotification({
                        userId: aid,
                        type: "task_unassigned",
                        message: `${username} removed you from "${taskTitle}"`,
                        boardName: "",
                    });
                }
            }
        }
    }

    return { tasks, archivedTasks, allBoardTasks, addTask, updateTask, archiveTask, restoreTask, deleteTask, archiveColumnTasks, moveTask, reorderTasks };
}
