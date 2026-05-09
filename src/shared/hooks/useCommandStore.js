import { create } from "zustand";

export const useCommandStore = create((set) => ({
    isOpen: false,
    pendingMode: null,
    setIsOpen: (isOpen) => set({ isOpen }),
    toggle: () => set((state) => ({ isOpen: !state.isOpen })),
    openCreateBoard: () => set({ isOpen: true, pendingMode: "create-board" }),
    clearPendingMode: () => set({ pendingMode: null }),
}));
