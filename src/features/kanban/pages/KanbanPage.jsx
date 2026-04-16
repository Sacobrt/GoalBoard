import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useBoardStore } from "../../board/store/boardStore";
import { useAuthStore } from "../../auth/store/authStore";
import { Board } from "../components/Board";
import { Button } from "../../../components/ui/button";
import { Settings, Check, X, Lock, PlayCircle } from "lucide-react";
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
    const { updateBoard, removeMember, boardStages, setBoardStage } = useBoardStore();
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

    const boardStage = boardStages?.[board.id] ?? null;
    const isCompleted = boardStage === "completed";
    const effectiveRole = isCompleted && !isOwner ? "viewer" : userRole;

    function saveTitle() {
        if (draftTitle.trim() && draftTitle.trim() !== board.name) {
            updateBoard(board.id, { name: draftTitle.trim() });
        }
        setEditingTitle(false);
    }

    return (
        <section className="py-6 animate-fade-in relative">
            {/* Completed lock banner */}
            {isCompleted && (
                <div
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 mb-4 text-sm ${
                        isOwner ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"
                    }`}
                >
                    <Lock className="h-4 w-4 shrink-0" />
                    <span className="flex-1">
                        {isOwner ? (
                            <>
                                This board is marked as <strong>Completed</strong>. Members cannot edit or add tasks. You can reactivate it via Board Settings.
                            </>
                        ) : (
                            <>
                                This board is <strong>completed</strong> and locked. Only the board owner can make changes.
                            </>
                        )}
                    </span>
                </div>
            )}

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
                            className={`text-2xl font-bold text-foreground ${effectiveRole !== "viewer" ? "cursor-pointer hover:text-primary transition-colors" : ""}`}
                            onClick={() => {
                                if (effectiveRole !== "viewer") {
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
                        <span className="hidden sm:inline">Board Settings</span>
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

            <Board board={board} userRole={effectiveRole} />
        </section>
    );
}
