import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, BarChart2, KanbanSquare, Plus, Settings, Shield, CheckSquare, X, ArrowLeft } from "lucide-react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { useAuthStore } from "../../features/auth/store/authStore";
import { useBoardStore } from "../../features/board/store/boardStore";
import { useKanbanStore } from "../../features/kanban/store/kanbanStore";
import { can } from "../../shared/auth/permissions";
import { useCommandStore } from "../../shared/hooks/useCommandStore";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

export function CommandPalette() {
    const open = useCommandStore((s) => s.isOpen);
    const setOpen = useCommandStore((s) => s.setIsOpen);
    const toggleCommandPalette = useCommandStore((s) => s.toggle);
    const pendingMode = useCommandStore((s) => s.pendingMode);
    const clearPendingMode = useCommandStore((s) => s.clearPendingMode);
    const [query, setQuery] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [mode, setMode] = useState("search"); // "search" | "create-board"
    const [newBoardName, setNewBoardName] = useState("");
    const [creating, setCreating] = useState(false);
    const inputRef = useRef(null);
    const newBoardInputRef = useRef(null);
    const listRef = useRef(null);
    const navigate = useNavigate();

    const user = useAuthStore((s) => s.user);
    const boards = useBoardStore((s) => s.boards);
    const createBoard = useBoardStore((s) => s.createBoard);
    const allTasks = useKanbanStore((s) => s.tasks);
    const userBoards = boards.filter((b) => b.members.some((m) => m.userId === user?.id));

    // Global keyboard shortcut
    useEffect(() => {
        function handler(e) {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                toggleCommandPalette();
            }
        }
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [toggleCommandPalette]);

    // Reset and focus when opened
    useEffect(() => {
        if (open) {
            setQuery("");
            setSelectedIndex(0);
            const initialMode = pendingMode ?? "search";
            setMode(initialMode);
            setNewBoardName("");
            clearPendingMode();
            if (initialMode === "create-board") {
                setTimeout(() => newBoardInputRef.current?.focus(), 50);
            } else {
                setTimeout(() => inputRef.current?.focus(), 50);
            }
        }
    }, [open]);

    // Focus the board name input when switching to create mode
    useEffect(() => {
        if (mode === "create-board") {
            setTimeout(() => newBoardInputRef.current?.focus(), 50);
        }
    }, [mode]);

    const BOARDS_VISIBLE_DEFAULT = 5;
    const [showAllBoards, setShowAllBoards] = useState(false);

    // Reset "show all" when palette closes or mode changes
    useEffect(() => {
        if (!open) setShowAllBoards(false);
    }, [open]);

    useEffect(() => {
        setShowAllBoards(false);
    }, [mode]);

    // Static navigation commands (no boards here — boards handled separately)
    const commands = useMemo(() => {
        const items = [
            { id: "dashboard", label: "Go to Dashboard", icon: BarChart2, action: () => navigate("/dashboard"), group: "Navigation" },
            { id: "settings", label: "Settings", icon: Settings, action: () => navigate("/settings"), group: "Navigation" },
        ];

        if (can(user, "canAccessAdminPanel")) {
            items.push({ id: "admin", label: "Admin Panel", icon: Shield, action: () => navigate("/admin"), group: "Navigation" });
        }

        items.push({ id: "new-board", label: "Create New Board", icon: Plus, action: () => setMode("create-board"), group: "Actions" });

        return items;
    }, [user, navigate]);

    // Board commands — sorted newest first, with task count subtitle
    const boardCommands = useMemo(() => {
        const sorted = [...userBoards].sort((a, b) => new Date(b.updatedAt ?? b.createdAt) - new Date(a.updatedAt ?? a.createdAt));
        return sorted.map((board) => {
            const taskCount = allTasks.filter((t) => t.boardId === board.id && !t.archived).length;
            const memberCount = board.members.length;
            return {
                id: `board-${board.id}`,
                label: board.name,
                subtitle: `${taskCount} task${taskCount !== 1 ? "s" : ""} · ${memberCount} member${memberCount !== 1 ? "s" : ""}`,
                icon: KanbanSquare,
                action: () => navigate(`/board/${board.id}`),
                group: "Boards",
            };
        });
    }, [userBoards, allTasks, navigate]);

    // Live task search — only active when query has ≥2 characters
    const taskResults = useMemo(() => {
        if (!query || query.length < 2) return [];
        const q = query.toLowerCase();
        return allTasks
            .filter(
                (t) => !t.archived && userBoards.some((b) => b.id === t.boardId) && (t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q)),
            )
            .slice(0, 6)
            .map((t) => {
                const board = userBoards.find((b) => b.id === t.boardId);
                const column = board?.columns.find((c) => c.id === t.columnId);
                return {
                    id: `task-${t.id}`,
                    label: t.title,
                    subtitle: board ? `${board.name}${column ? ` · ${column.title}` : ""}` : "",
                    icon: CheckSquare,
                    action: () => navigate(`/board/${t.boardId}`),
                    group: "Tasks",
                };
            });
    }, [query, allTasks, userBoards, navigate]);

    // Filter static commands against query
    const filteredCommands = useMemo(() => {
        if (!query) return commands;
        const q = query.toLowerCase();
        return commands.filter((c) => c.label.toLowerCase().includes(q));
    }, [commands, query]);

    // Filter boards separately so we can cap them
    const filteredBoards = useMemo(() => {
        if (!query) return boardCommands;
        const q = query.toLowerCase();
        return boardCommands.filter((c) => c.label.toLowerCase().includes(q));
    }, [boardCommands, query]);

    const visibleBoards = useMemo(() => {
        if (query || showAllBoards) return filteredBoards;
        return filteredBoards.slice(0, BOARDS_VISIBLE_DEFAULT);
    }, [filteredBoards, query, showAllBoards]);

    const hiddenBoardCount = !query && !showAllBoards ? Math.max(0, filteredBoards.length - BOARDS_VISIBLE_DEFAULT) : 0;

    const filtered = useMemo(() => [...filteredCommands, ...visibleBoards, ...taskResults], [filteredCommands, visibleBoards, taskResults]);

    // Group results
    const grouped = useMemo(() => {
        const groups = {};
        filtered.forEach((c) => {
            if (!groups[c.group]) groups[c.group] = [];
            groups[c.group].push(c);
        });
        return groups;
    }, [filtered]);

    // Keyboard navigation inside the input
    const handleKeyDown = useCallback(
        (e) => {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter" && filtered[selectedIndex]) {
                e.preventDefault();
                filtered[selectedIndex].action();
                if (filtered[selectedIndex].id !== "new-board") setOpen(false);
            }
        },
        [filtered, selectedIndex, setOpen],
    );

    // Reset selection when query changes
    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    // Scroll selected item into view
    useEffect(() => {
        const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
        if (el) el.scrollIntoView({ block: "nearest" });
    }, [selectedIndex]);

    function handleCreateBoard(e) {
        e?.preventDefault();
        const name = newBoardName.trim();
        if (!name || creating) return;
        setCreating(true);
        const board = createBoard(name, user.id);
        setCreating(false);
        setOpen(false);
        navigate(`/board/${board.id}`);
    }

    let flatIndex = 0;

    return (
        <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
            <DialogPrimitive.Portal>
                {/* Backdrop — matches Dialog overlay style */}
                <DialogPrimitive.Backdrop className="fixed inset-0 isolate z-50 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />

                {/* Popup — positioned at top-center, matches Dialog content style */}
                <DialogPrimitive.Popup className="fixed top-[15vh] left-1/2 z-50 w-full max-w-[calc(100%-2rem)] sm:max-w-lg -translate-x-1/2 rounded-xl border border-border shadow-2xl overflow-hidden bg-popover text-popover-foreground ring-1 ring-foreground/10 duration-100 outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
                    {mode === "create-board" ? (
                        /* Create New Board view */
                        <form onSubmit={handleCreateBoard}>
                            <div className="flex items-center gap-2 px-3 py-3 border-b border-border">
                                <button
                                    type="button"
                                    onClick={() => setMode("search")}
                                    className="flex items-center justify-center w-7 h-7 rounded-md transition-colors hover:bg-accent shrink-0"
                                    aria-label="Back"
                                >
                                    <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                                </button>
                                <span className="text-sm font-medium text-foreground">Create New Board</span>
                            </div>

                            <div className="px-4 py-4 space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-muted-foreground" htmlFor="new-board-name">
                                        Board name
                                    </label>
                                    <Input
                                        id="new-board-name"
                                        ref={newBoardInputRef}
                                        value={newBoardName}
                                        onChange={(e) => setNewBoardName(e.target.value)}
                                        placeholder="e.g. Product Roadmap"
                                        maxLength={60}
                                        autoComplete="off"
                                    />
                                </div>
                                <div className="flex items-center justify-end gap-2">
                                    <Button type="button" variant="ghost" size="sm" onClick={() => setMode("search")}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" size="sm" disabled={!newBoardName.trim() || creating}>
                                        <Plus className="h-3.5 w-3.5" />
                                        Create Board
                                    </Button>
                                </div>
                            </div>
                        </form>
                    ) : (
                        /* Search / command list view */
                        <>
                            {/* Search input */}
                            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                                <input
                                    ref={inputRef}
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Search commands, boards, tasks..."
                                    className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground text-foreground"
                                />
                                {query ? (
                                    <button
                                        onClick={() => setQuery("")}
                                        className="flex items-center justify-center w-5 h-5 rounded transition-colors hover:bg-muted"
                                        aria-label="Clear search"
                                    >
                                        <X className="h-3 w-3 text-muted-foreground" />
                                    </button>
                                ) : (
                                    <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono border border-border bg-muted text-muted-foreground">
                                        Esc
                                    </kbd>
                                )}
                            </div>

                            {/* Results */}
                            <div ref={listRef} className="max-h-72 overflow-y-auto py-1.5">
                                {filtered.length === 0 ? (
                                    <div className="px-4 py-8 text-center">
                                        <p className="text-sm text-muted-foreground">
                                            {query ? `No results for "${query.slice(0, 48)}..."` : "No commands available"}
                                        </p>
                                    </div>
                                ) : (
                                    Object.entries(grouped).map(([group, items]) => (
                                        <div key={group}>
                                            <div className="px-3 pt-2 pb-1">
                                                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{group}</span>
                                            </div>
                                            {items.map((cmd) => {
                                                const idx = flatIndex++;
                                                const isSelected = idx === selectedIndex;
                                                return (
                                                    <button
                                                        key={cmd.id}
                                                        data-index={idx}
                                                        onClick={() => {
                                                            cmd.action();
                                                            if (cmd.id !== "new-board") setOpen(false);
                                                        }}
                                                        onMouseEnter={() => setSelectedIndex(idx)}
                                                        className={cn(
                                                            "flex items-center gap-3 w-full px-3 py-2 text-left text-sm transition-colors",
                                                            isSelected ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-accent/50",
                                                        )}
                                                    >
                                                        <cmd.icon className={cn("h-4 w-4 shrink-0", isSelected ? "text-primary" : "text-muted-foreground")} />
                                                        <div className="flex-1 min-w-0">
                                                            <span className="truncate block">{cmd.label}</span>
                                                            {cmd.subtitle && <span className="text-xs text-muted-foreground truncate block">{cmd.subtitle}</span>}
                                                        </div>
                                                        {isSelected && (
                                                            <span className="text-[10px] px-1.5 py-0.5 rounded border border-border font-mono text-muted-foreground bg-muted shrink-0">
                                                                ↵
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                            {group === "Boards" && hiddenBoardCount > 0 && (
                                                <button
                                                    onClick={() => setShowAllBoards(true)}
                                                    className="flex items-center gap-2 w-full px-3 py-2 text-left text-xs text-primary hover:bg-accent/50 transition-colors"
                                                >
                                                    <KanbanSquare className="h-3.5 w-3.5 shrink-0" />
                                                    Show {hiddenBoardCount} more board{hiddenBoardCount !== 1 ? "s" : ""}
                                                </button>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Footer */}
                            <div className="flex items-center gap-4 px-4 py-2 border-t border-border text-[10px] font-medium text-muted-foreground">
                                <span>↑↓ Navigate</span>
                                <span>↵ Open</span>
                                <span>Esc Close</span>
                            </div>
                        </>
                    )}
                </DialogPrimitive.Popup>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}
