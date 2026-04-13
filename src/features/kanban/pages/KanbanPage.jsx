import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useBoardStore } from "../../board/store/boardStore";
import { useAuthStore } from "../../auth/store/authStore";
import { Board } from "../components/Board";
import { Button } from "../../../components/ui/button";
import { Settings, LogOut, Check, X } from "lucide-react";
import { Input } from "../../../components/ui/input";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from "../../../components/ui/alert-dialog";
import { can } from "../../../shared/auth/permissions";

export function KanbanPage() {
    const { boardId } = useParams();
    const user = useAuthStore((s) => s.user);
    const userId = user?.id;
    const { updateBoard, removeMember } = useBoardStore();
    const board = useBoardStore((s) => s.boards.find((b) => b.id === boardId));
    const navigate = useNavigate();

    const [editingTitle, setEditingTitle] = useState(false);
    const [draftTitle, setDraftTitle] = useState("");
    const [leaveOpen, setLeaveOpen] = useState(false);

    if (!board) {
        return (
            <section className="py-20 text-center">
                <p className="text-sm text-muted-foreground">Board not found.</p>
                <Button variant="outline" size="sm" asChild className="mt-4">
                    <Link to="/dashboard">Back to overview</Link>
                </Button>
            </section>
        );
    }

    const memberObj = board.members.find((m) => m.userId === userId);
    const isMember = !!memberObj;
    const hasAdminAccess = can(user, "canViewAllBoards");

    const userRole = memberObj?.role || (hasAdminAccess ? "viewer" : "viewer");
    if (!isMember && !hasAdminAccess) {
        return (
            <section className="py-20 text-center">
                <p className="text-sm text-muted-foreground">You don't have access to this board.</p>
                <Button variant="outline" size="sm" asChild className="mt-4">
                    <Link to="/dashboard">Back to overview</Link>
                </Button>
            </section>
        );
    }

    const isOwner = board.ownerId === userId;

    function saveTitle() {
        if (draftTitle.trim() && draftTitle.trim() !== board.name) {
            updateBoard(board.id, { name: draftTitle.trim() });
        }
        setEditingTitle(false);
    }

    return (
        <section className="py-6 animate-fade-in relative">
            <div className="flex items-center justify-between mb-6 group">
                <div className="flex items-center gap-3 relative">
                    {editingTitle ? (
                        <div className="flex items-center gap-2">
                            <Input
                                value={draftTitle}
                                onChange={(e) => setDraftTitle(e.target.value)}
                                autoFocus
                                className="h-9 w-64 text-lg font-bold"
                                onKeyDown={(e) => e.key === "Enter" && saveTitle()}
                            />
                            <Button size="sm" onClick={saveTitle}>
                                <Check className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingTitle(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                        <h1
                            className={`text-2xl font-bold text-foreground ${userRole !== "viewer" ? "cursor-pointer hover:text-primary transition-colors" : ""}`}
                            onClick={() => {
                                if (userRole !== "viewer") {
                                    setDraftTitle(board.name);
                                    setEditingTitle(true);
                                }
                            }}
                        >
                            {board.name}
                        </h1>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => navigate(`/board/${boardId}/settings`)}>
                        <Settings className="h-4 w-4" />
                        <span className="hidden sm:inline">Settings</span>
                    </Button>
                </div>
            </div>

            <AlertDialog open={leaveOpen} onOpenChange={setLeaveOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Leave &ldquo;{board.name}&rdquo;?</AlertDialogTitle>
                        <AlertDialogDescription>Are you sure you want to leave this board? You will lose access immediately.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                removeMember(board.id, userId, userId);
                                navigate("/dashboard", { replace: true });
                            }}
                            className="bg-red-500 hover:bg-red-600"
                        >
                            Leave Board
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Board board={board} userRole={userRole} />
        </section>
    );
}
