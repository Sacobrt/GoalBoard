export const BOARD_STAGES = [
    { id: "backlog", label: "Backlog", color: "#94a3b8", bg: "rgba(148,163,184,0.08)" },
    { id: "active", label: "Active", color: "#6366f1", bg: "rgba(99,102,241,0.08)" },
    { id: "on-hold", label: "On Hold", color: "#f59e0b", bg: "rgba(245,158,11,0.08)" },
    { id: "completed", label: "Completed", color: "#10b981", bg: "rgba(16,185,129,0.08)" },
];

export function deriveStage(board, allTasks) {
    const stages = board.stages ?? BOARD_STAGES;
    const tasks = allTasks.filter((t) => t.boardId === board.id && !t.archived);
    if (tasks.length === 0) return stages[0]?.id ?? "backlog";
    const doneIds = new Set(board.columns.filter((c) => c.isDone).map((c) => c.id));
    const done = tasks.filter((t) => doneIds.has(t.columnId)).length;
    const pct = Math.round((done / tasks.length) * 100);
    if (pct === 0) return stages[0]?.id ?? "backlog";
    return stages[1]?.id ?? stages[0]?.id ?? "active";
}
