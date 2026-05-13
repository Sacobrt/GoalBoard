import { useCallback, useState } from "react";

export const VIEW_IDS = {
    GRID: "grid",
    LIST: "list",
    TABLE: "table",
    RECENT: "recent",
    TIMELINE: "timeline",
};

const VALID_VIEWS = Object.values(VIEW_IDS);
const STORAGE_KEY = "goalboard_board_view";
const DEFAULT_VIEW = VIEW_IDS.GRID;

export function useBoardView() {
    const [view, setViewState] = useState(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return VALID_VIEWS.includes(stored) ? stored : DEFAULT_VIEW;
        } catch {
            return DEFAULT_VIEW;
        }
    });

    const setView = useCallback((v) => {
        if (!VALID_VIEWS.includes(v)) return;
        setViewState(v);
        try {
            localStorage.setItem(STORAGE_KEY, v);
        } catch {
            /* ignore write failures (e.g. private browsing quota) */
        }
    }, []);

    return { view, setView };
}
