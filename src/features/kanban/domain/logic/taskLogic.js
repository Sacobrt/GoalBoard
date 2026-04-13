export function computeMoveTask(task, newColumnId, isDoneColumn) {
    const wasDone = !!task.completedAt;

    return {
        columnId: newColumnId,
        completedAt: isDoneColumn && !wasDone ? new Date().toISOString() : !isDoneColumn && wasDone ? null : task.completedAt,
    };
}

export function computeArchive(task) {
    return {
        archived: true,
        archivedAt: new Date().toISOString(),
    };
}

export function computeRestore(task) {
    return {
        archived: false,
        archivedAt: null,
    };
}

export function isOverdue(task, today) {
    return !!task.dueDate && !task.completedAt && task.dueDate < today;
}

export function isDueToday(task, today) {
    return !!task.dueDate && !task.completedAt && task.dueDate === today;
}
