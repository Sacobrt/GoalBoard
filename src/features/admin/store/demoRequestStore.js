import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useDemoRequestStore = create(
    persist(
        (set, get) => ({
            requests: [],

            addRequest({ name, email, company, message }) {
                const req = {
                    id: crypto.randomUUID(),
                    name,
                    email,
                    company: company || "",
                    message: message || "",
                    createdAt: new Date().toISOString(),
                    status: "new",
                };
                set((s) => ({ requests: [req, ...s.requests] }));
                return req;
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
