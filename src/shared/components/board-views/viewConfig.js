import { LayoutGrid, List, Table2, Star, Clock, CalendarDays } from "lucide-react";

export const VIEWS = [
    {
        id: "grid",
        label: "Grid",
        icon: LayoutGrid,
        primary: true,
        description: "Rich card layout",
    },
    {
        id: "list",
        label: "List",
        icon: List,
        primary: true,
        description: "Compact vertical list",
    },
    {
        id: "table",
        label: "Table",
        icon: Table2,
        primary: true,
        description: "Sortable data table",
    },
    {
        id: "recent",
        label: "Recent",
        icon: Clock,
        primary: false,
        description: "Sorted by last activity",
    },
    {
        id: "timeline",
        label: "Timeline",
        icon: CalendarDays,
        primary: false,
        description: "Chronological board history",
    },
];

export const PRIMARY_VIEWS = VIEWS.filter((v) => v.primary);
export const SECONDARY_VIEWS = VIEWS.filter((v) => !v.primary);

export function getView(id) {
    return VIEWS.find((v) => v.id === id) ?? VIEWS[0];
}
