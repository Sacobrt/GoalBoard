import { create } from "zustand";
import { persist } from "zustand/middleware";

import { seedDemoProject } from "../../board/store/demoData";

export const useDemoRequestStore = create(
    persist(
        (set, get) => ({
            requests: [],

            addRequest({ name, email, company, message, userId = null }) {
                const req = {
                    id: crypto.randomUUID(),
                    name,
                    email,
                    company: company || "",
                    message: message || "",
                    userId,
                    createdAt: new Date().toISOString(),
                    status: "new",
                    grantedAt: null,
                    grantedUserId: null,
                };
                set((s) => ({ requests: [req, ...s.requests] }));
                return req;
            },

            grantDemo(id, userId) {
                // Generates demo project in boardStore/kanbanStore
                seedDemoProject(userId);

                // Update request entry to show we granted it
                set((s) => ({
                    requests: s.requests.map((r) => (r.id === id ? { ...r, status: "contacted", grantedAt: new Date().toISOString(), grantedUserId: userId } : r)),
                }));
            },

            updateStatus(id, status) {
                set((s) => ({
                    requests: s.requests.map((r) => (r.id === id ? { ...r, status } : r)),
                }));
            },

            deleteRequest(id) {
                set((s) => ({ requests: s.requests.filter((r) => r.id !== id) }));
            },

            getNewCount() {
                return get().requests.filter((r) => r.status === "new").length;
            },
        }),
        { name: "goalboard_demo_requests" },
    ),
);
