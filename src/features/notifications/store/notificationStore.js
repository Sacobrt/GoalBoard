import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useNotificationStore = create(
    persist(
        (set, get) => ({
            notifications: [],

            addNotification({ userId, type, message, boardName }) {
                const notification = {
                    id: crypto.randomUUID(),
                    userId,
                    type,
                    message,
                    boardName: boardName ?? "",
                    createdAt: new Date().toISOString(),
                    read: false,
                };
                set((s) => ({ notifications: [notification, ...s.notifications] }));
            },

            markAsRead(notificationId) {
                set((s) => ({
                    notifications: s.notifications.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
                }));
            },

            markAllAsRead(userId) {
                set((s) => ({
                    notifications: s.notifications.map((n) => (n.userId === userId && !n.read ? { ...n, read: true } : n)),
                }));
            },

            clearAll(userId) {
                set((s) => ({
                    notifications: s.notifications.filter((n) => n.userId !== userId),
                }));
            },

            getForUser(userId) {
                return get().notifications.filter((n) => n.userId === userId);
            },

            getUnreadCount(userId) {
                return get().notifications.filter((n) => n.userId === userId && !n.read).length;
            },
        }),
        { name: "goalboard_notifications" },
    ),
);
