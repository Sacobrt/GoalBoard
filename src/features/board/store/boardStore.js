import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useNotificationStore } from "../../notifications/store/notificationStore";

function uuid() {
    return crypto.randomUUID();
}

function defaultColumns() {
    return [
        { id: uuid(), title: "To Do", color: "#3b82f6", order: 0, isDone: false },
        { id: uuid(), title: "In Progress", color: "#f59e0b", order: 1, isDone: false },
        { id: uuid(), title: "Done", color: "#10b981", order: 2, isDone: true },
    ];
}

function defaultPriorities() {
    return [
        { id: uuid(), label: "Low", color: "#10b981", order: 0 },
        { id: uuid(), label: "Medium", color: "#f59e0b", order: 1 },
        { id: uuid(), label: "High", color: "#ef4444", order: 2 },
    ];
}

export const useBoardStore = create(
    persist(
        (set, get) => ({
            boards: [],
            invitations: [],

            createBoard(name, ownerId) {
                const now = new Date().toISOString();
                const board = {
                    id: uuid(),
                    name,
                    ownerId,
                    members: [{ userId: ownerId, role: "owner" }],
                    columns: defaultColumns(),
                    priorities: defaultPriorities(),
                    createdAt: now,
                    updatedAt: now,
                };
                set((s) => ({ boards: [...s.boards, board] }));
                return board;
            },

            updateBoard(boardId, patch) {
                set((s) => ({
                    boards: s.boards.map((b) => (b.id === boardId ? { ...b, ...patch, updatedAt: new Date().toISOString() } : b)),
                }));
            },

            deleteBoard(boardId) {
                set((s) => ({
                    boards: s.boards.filter((b) => b.id !== boardId),
                    invitations: s.invitations.filter((i) => i.boardId !== boardId),
                }));
            },

            addColumn(boardId, title, color) {
                set((s) => ({
                    boards: s.boards.map((b) => {
                        if (b.id !== boardId) return b;
                        const maxOrder = b.columns.reduce((m, c) => Math.max(m, c.order), -1);
                        return {
                            ...b,
                            updatedAt: new Date().toISOString(),
                            columns: [...b.columns, { id: uuid(), title, color, order: maxOrder + 1, isDone: false }],
                        };
                    }),
                }));
            },

            updateColumn(boardId, columnId, patch) {
                set((s) => ({
                    boards: s.boards.map((b) => {
                        if (b.id !== boardId) return b;
                        return { ...b, updatedAt: new Date().toISOString(), columns: b.columns.map((c) => (c.id === columnId ? { ...c, ...patch } : c)) };
                    }),
                }));
            },

            removeColumn(boardId, columnId) {
                set((s) => ({
                    boards: s.boards.map((b) => {
                        if (b.id !== boardId) return b;
                        return { ...b, updatedAt: new Date().toISOString(), columns: b.columns.filter((c) => c.id !== columnId) };
                    }),
                }));
            },

            addPriority(boardId, label, color) {
                set((s) => ({
                    boards: s.boards.map((b) => {
                        if (b.id !== boardId) return b;
                        const maxOrder = b.priorities.reduce((m, p) => Math.max(m, p.order), -1);
                        return { ...b, updatedAt: new Date().toISOString(), priorities: [...b.priorities, { id: uuid(), label, color, order: maxOrder + 1 }] };
                    }),
                }));
            },

            updatePriority(boardId, priorityId, patch) {
                set((s) => ({
                    boards: s.boards.map((b) => {
                        if (b.id !== boardId) return b;
                        return { ...b, updatedAt: new Date().toISOString(), priorities: b.priorities.map((p) => (p.id === priorityId ? { ...p, ...patch } : p)) };
                    }),
                }));
            },

            removePriority(boardId, priorityId) {
                set((s) => ({
                    boards: s.boards.map((b) => {
                        if (b.id !== boardId) return b;
                        return { ...b, updatedAt: new Date().toISOString(), priorities: b.priorities.filter((p) => p.id !== priorityId) };
                    }),
                }));
            },

            inviteContributor(boardId, fromUserId, fromUsername, toEmail) {
                const board = get().boards.find((b) => b.id === boardId);
                if (!board) return { ok: false, error: "Board not found." };

                const existing = get().invitations.find(
                    (i) => i.boardId === boardId && i.toEmail.toLowerCase() === toEmail.toLowerCase() && i.status === "pending",
                );
                if (existing) return { ok: false, error: "An invitation is already pending for this email." };

                const alreadyMember = board.members.some((m) => {
                    const users = JSON.parse(localStorage.getItem("goalboard_users") ?? "[]");
                    const memberUser = users.find((u) => u.id === m.userId);
                    return memberUser && memberUser.email.toLowerCase() === toEmail.toLowerCase();
                });
                if (alreadyMember) return { ok: false, error: "This user is already a member." };

                const invitation = {
                    id: uuid(),
                    boardId,
                    boardName: board.name,
                    fromUserId,
                    fromUsername,
                    toEmail: toEmail.toLowerCase(),
                    status: "pending",
                    createdAt: new Date().toISOString(),
                };
                set((s) => ({ invitations: [...s.invitations, invitation] }));
                return { ok: true };
            },

            respondToInvitation(invitationId, accept, userId) {
                const inv = get().invitations.find((i) => i.id === invitationId);
                if (!inv) return;

                // Find the invite's username for notifications
                const users = JSON.parse(localStorage.getItem("goalboard_users") ?? "[]");
                const inviteUser = users.find((u) => u.id === userId);
                const inviteName = inviteUser?.username ?? inv.toEmail;

                set((s) => ({
                    invitations: s.invitations.map((i) => (i.id === invitationId ? { ...i, status: accept ? "accepted" : "declined" } : i)),
                    boards: accept
                        ? s.boards.map((b) => {
                              if (b.id !== inv.boardId) return b;
                              if (b.members.some((m) => m.userId === userId)) return b;
                              return { ...b, updatedAt: new Date().toISOString(), members: [...b.members, { userId, role: "contributor" }] };
                          })
                        : s.boards,
                }));

                if (!accept) {
                    // Notify board owner that invitation was declined
                    useNotificationStore.getState().addNotification({
                        userId: inv.fromUserId,
                        type: "invitation_declined",
                        message: `${inviteName} declined your invitation to "${inv.boardName}"`,
                        boardName: inv.boardName,
                    });
                } else {
                    // Notify board owner that invitation was accepted
                    useNotificationStore.getState().addNotification({
                        userId: inv.fromUserId,
                        type: "invitation_accepted",
                        message: `${inviteName} joined "${inv.boardName}"`,
                        boardName: inv.boardName,
                    });
                }
            },

            removeMember(boardId, userId, removedByUserId) {
                const board = get().boards.find((b) => b.id === boardId);
                if (!board) return;

                const users = JSON.parse(localStorage.getItem("goalboard_users") ?? "[]");
                const removedUser = users.find((u) => u.id === userId);
                const removedName = removedUser?.username ?? "A user";

                const isSelfLeave = userId === removedByUserId;

                set((s) => ({
                    boards: s.boards.map((b) => {
                        if (b.id !== boardId) return b;
                        return { ...b, updatedAt: new Date().toISOString(), members: b.members.filter((m) => m.userId !== userId) };
                    }),
                }));

                if (isSelfLeave) {
                    // User left — notify the board owner
                    useNotificationStore.getState().addNotification({
                        userId: board.ownerId,
                        type: "member_left",
                        message: `${removedName} left "${board.name}"`,
                        boardName: board.name,
                    });
                } else {
                    // User was kicked — notify the removed user
                    useNotificationStore.getState().addNotification({
                        userId,
                        type: "member_kicked",
                        message: `You were removed from "${board.name}"`,
                        boardName: board.name,
                    });
                }
            },

            updateMemberRole(boardId, userId, role) {
                const board = get().boards.find((b) => b.id === boardId);
                if (!board) return;

                set((s) => ({
                    boards: s.boards.map((b) => {
                        if (b.id !== boardId) return b;
                        return {
                            ...b,
                            updatedAt: new Date().toISOString(),
                            members: b.members.map((m) => (m.userId === userId ? { ...m, role } : m)),
                        };
                    }),
                }));

                useNotificationStore.getState().addNotification({
                    userId,
                    type: "role_change",
                    message: `Your role in "${board.name}" was changed to ${role}`,
                    boardName: board.name,
                });
            },

            getBoardsForUser(userId) {
                return get().boards.filter((b) => b.members.some((m) => m.userId === userId));
            },

            getPendingInvitations(email) {
                return get().invitations.filter((i) => i.toEmail.toLowerCase() === email.toLowerCase() && i.status === "pending");
            },
        }),
        { name: "goalboard_boards" },
    ),
);
