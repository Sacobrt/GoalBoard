import { create } from "zustand";
import { persist } from "zustand/middleware";
import bcrypt from "bcryptjs";
import { DEFAULT_ROLE, ROLES } from "../../../shared/auth/roles";

const SALT_ROUNDS = 10;

export const useAuthStore = create(
    persist(
        (set) => ({
            user: null,

            async register(username, email, password, fullName = "") {
                const users = JSON.parse(localStorage.getItem("goalboard_users") ?? "[]");

                if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
                    return { ok: false, error: "That email is already registered." };
                }
                if (users.find((u) => u.username.toLowerCase() === username.toLowerCase())) {
                    return { ok: false, error: "That username is already taken." };
                }

                const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

                // First user in the system gets admin role, everyone else gets default role
                const isFirstUser = users.length === 0;

                const newUser = {
                    id: crypto.randomUUID(),
                    username,
                    fullName,
                    email: email.toLowerCase(),
                    passwordHash,
                    role: isFirstUser ? ROLES.ADMIN : DEFAULT_ROLE,
                    bio: "",
                    website: "",
                    location: "",
                    organization: "",
                    jobTitle: "",
                    education: "",
                    createdAt: new Date().toISOString(),
                };

                localStorage.setItem("goalboard_users", JSON.stringify([...users, newUser]));
                const { passwordHash: _ph, ...session } = newUser;
                set({ user: session });

                return { ok: true };
            },

            async login(email, password) {
                const users = JSON.parse(localStorage.getItem("goalboard_users") ?? "[]");
                const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

                if (!found) return { ok: false, error: "Invalid email or password." };

                const match = await bcrypt.compare(password, found.passwordHash);
                if (!match) return { ok: false, error: "Invalid email or password." };

                const { passwordHash: _ph, ...session } = found;
                set({ user: session });
                return { ok: true };
            },

            logout() {
                set({ user: null });
            },

            // Update user profile fields (username, email, etc.)
            updateProfile(patch) {
                set((s) => {
                    if (!s.user) return s;
                    const updated = { ...s.user, ...patch };
                    // Also persist to users list in localStorage
                    const users = JSON.parse(localStorage.getItem("goalboard_users") ?? "[]");
                    const updatedUsers = users.map((u) => (u.id === updated.id ? { ...u, ...patch } : u));
                    localStorage.setItem("goalboard_users", JSON.stringify(updatedUsers));
                    return { user: updated };
                });
            },
        }),
        { name: "goalboard_session" },
    ),
);
