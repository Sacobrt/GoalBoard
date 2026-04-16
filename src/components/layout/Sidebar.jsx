import { NavLink, useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { BarChart2, KanbanSquare, Plus, ChevronLeft, ChevronRight, X, Check, Shield, Home, Search } from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuthStore } from "../../features/auth/store/authStore";
import { useBoardStore } from "../../features/board/store/boardStore";
import { useSidebarStore } from "../../shared/hooks/useSidebarStore";
import { can } from "../../shared/auth/permissions";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

const sidebarLinkClass = (isActive, collapsed) =>
    cn(
        "flex items-center gap-2.5 text-sm font-medium rounded-lg transition-all duration-150",
        collapsed ? "justify-center w-9 h-9 mx-auto" : "px-3 py-2",
        isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted",
    );

export function Sidebar() {
    const collapsed = useSidebarStore((s) => s.collapsed);
    const toggle = useSidebarStore((s) => s.toggle);
    const user = useAuthStore((s) => s.user);
    const allBoards = useBoardStore((s) => s.boards);
    const createBoard = useBoardStore((s) => s.createBoard);
    const { boardId } = useParams();
    const navigate = useNavigate();

    const boards = allBoards
        .filter((b) => b.members.some((m) => m.userId === user?.id))
        .sort((a, b) => new Date(b.updatedAt ?? b.createdAt) - new Date(a.updatedAt ?? a.createdAt));

    const [showNewBoard, setShowNewBoard] = useState(false);
    const [newBoardName, setNewBoardName] = useState("");
    const [boardSearch, setBoardSearch] = useState("");

    const filteredSidebarBoards = collapsed || !boardSearch ? boards : boards.filter((b) => b.name.toLowerCase().includes(boardSearch.toLowerCase()));

    function handleCreateBoard(e) {
        e.preventDefault();
        if (!newBoardName.trim()) return;
        const board = createBoard(newBoardName.trim(), user.id);
        setNewBoardName("");
        setShowNewBoard(false);
        navigate(`/board/${board.id}`);
    }

    return (
        <aside className={cn("flex flex-col h-full border-r border-border transition-all duration-200 ease-in-out shrink-0 bg-card", collapsed ? "w-13" : "w-65")}>
            {/* Logo + Collapse */}
            <div className={cn("flex items-center h-14 border-b border-border shrink-0", collapsed ? "justify-center px-2" : "justify-between px-4")}>
                {!collapsed && (
                    <div className="flex items-center gap-2.5">
                        <img src="/logo.png" width={24} height={24} alt="Logo" />
                        <span className="font-bold text-sm tracking-tight text-foreground">Goal Board</span>
                    </div>
                )}
                <button
                    onClick={toggle}
                    className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors hover:bg-muted"
                    title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    {collapsed ? <ChevronRight className="h-4 w-4 text-muted-foreground" /> : <ChevronLeft className="h-4 w-4 text-muted-foreground" />}
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
                {/* Home */}
                <NavLink to="/" end className={({ isActive }) => sidebarLinkClass(isActive, collapsed)} title="Home">
                    <Home className="h-4 w-4 shrink-0" />
                    {!collapsed && <span>Home</span>}
                </NavLink>

                {/* Dashboard */}
                <NavLink to="/dashboard" end className={({ isActive }) => sidebarLinkClass(isActive, collapsed)} title="Dashboard">
                    <BarChart2 className="h-4 w-4 shrink-0" />
                    {!collapsed && <span>Dashboard</span>}
                </NavLink>

                {/* Admin (conditional) */}
                {can(user, "canAccessAdminPanel") && (
                    <NavLink to="/admin" className={({ isActive }) => sidebarLinkClass(isActive, collapsed)} title="Admin">
                        <Shield className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>Admin</span>}
                    </NavLink>
                )}

                {/* Boards section */}
                {!collapsed && (
                    <>
                        <div className="flex items-center justify-between pt-5 pb-1.5 px-1">
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Boards</span>
                            <button
                                onClick={() => setShowNewBoard(true)}
                                className="flex items-center justify-center w-5 h-5 rounded transition-colors hover:bg-muted"
                                title="New board"
                            >
                                <Plus className="h-3 w-3 text-muted-foreground" />
                            </button>
                        </div>
                        {boards.length > 0 && (
                            <div className="relative px-1 pb-1">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
                                <Input
                                    value={boardSearch}
                                    onChange={(e) => setBoardSearch(e.target.value)}
                                    placeholder="Search boards..."
                                    className="h-7 text-xs pl-7 pr-6"
                                />
                                {boardSearch && (
                                    <button onClick={() => setBoardSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 hover:bg-black/5">
                                        <X className="h-3 w-3 text-muted-foreground" />
                                    </button>
                                )}
                            </div>
                        )}
                    </>
                )}

                {collapsed && (
                    <div className="pt-3 pb-1 flex justify-center">
                        <div className="w-5 h-px bg-border" />
                    </div>
                )}

                {/* Board list */}
                <div>
                    {filteredSidebarBoards.map((board) => (
                        <NavLink
                            key={board.id}
                            to={`/board/${board.id}`}
                            end
                            className={({ isActive }) => sidebarLinkClass(isActive || boardId === board.id, collapsed)}
                            title={board.name}
                        >
                            <KanbanSquare className="h-4 w-4 shrink-0" />
                            {!collapsed && <span className="truncate">{board.name}</span>}
                        </NavLink>
                    ))}
                    {!collapsed && filteredSidebarBoards.length === 0 && boards.length > 0 && (
                        <p className="px-3 py-2 text-xs text-muted-foreground">No boards match</p>
                    )}
                </div>

                {/* Inline new board */}
                {showNewBoard && !collapsed && (
                    <form onSubmit={handleCreateBoard} className="flex items-center gap-1.5 px-1 pt-1">
                        <Input
                            value={newBoardName}
                            onChange={(e) => setNewBoardName(e.target.value)}
                            placeholder="Board name..."
                            autoFocus
                            className="h-8 text-xs flex-1"
                        />
                        <Button size="sm" type="submit" className="h-7 w-7 p-0">
                            <Check className="h-3 w-3" />
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            type="button"
                            onClick={() => {
                                setShowNewBoard(false);
                                setNewBoardName("");
                            }}
                            className="h-7 w-7 p-0"
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    </form>
                )}

                {/* Empty boards state */}
                {boards.length === 0 && !collapsed && (
                    <div className="px-3 py-4 text-center">
                        <p className="text-xs text-muted-foreground">No boards yet</p>
                        <button onClick={() => setShowNewBoard(true)} className="text-xs font-medium mt-1 transition-colors text-primary">
                            Create one
                        </button>
                    </div>
                )}
            </nav>

            {/* Bottom section */}
            <div className={cn("border-t border-border py-2 px-2 shrink-0", collapsed && "flex justify-center")}>
                {!collapsed ? (
                    <button
                        onClick={() => setShowNewBoard(true)}
                        className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-muted text-primary"
                    >
                        <Plus className="h-4 w-4" />
                        New Board
                    </button>
                ) : (
                    <button
                        onClick={() => {
                            useSidebarStore.getState().setCollapsed(false);
                            setTimeout(() => setShowNewBoard(true), 220);
                        }}
                        className="flex items-center justify-center w-9 h-9 rounded-lg transition-colors hover:bg-muted"
                        title="New board"
                    >
                        <Plus className="h-4 w-4 text-primary" />
                    </button>
                )}
            </div>
        </aside>
    );
}
