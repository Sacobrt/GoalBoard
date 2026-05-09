import { useParams, Link, useNavigate } from "react-router-dom";
import { useBoardStore } from "../store/boardStore";
import { useAuthStore } from "../../auth/store/authStore";
import { useKanbanStore } from "../../kanban/store/kanbanStore";
import { useMemo } from "react";
import { WorkloadTracker } from "../components/WorkloadTracker";
import { Button } from "../../../components/ui/button";
import { ArrowLeft, Users, Lock } from "lucide-react";

export function WorkloadPage() {
    const { boardId } = useParams();
    const userId = useAuthStore((s) => s.user?.id);
    const board = useBoardStore((s) => s.boards.find((b) => b.id === boardId));
    const navigate = useNavigate();
    const allTasks = useKanbanStore((s) => s.tasks);
    const boardTasks = useMemo(() => (board ? allTasks.filter((t) => t.boardId === board.id && !t.archived) : []), [allTasks, board]);

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

    const memberEntry = board.members.find((m) => m.userId === userId);
    const isMember = !!memberEntry;

    if (!isMember) {
        return (
            <section className="py-20 text-center">
                <p className="text-sm text-muted-foreground">You don't have access to this board.</p>
            </section>
        );
    }

    const isOwner = board.ownerId === userId;
    const hasWorkloadAccess = isOwner || memberEntry?.canViewWorkload === true;

    if (!hasWorkloadAccess) {
        return (
            <section className="py-6 animate-fade-in">
                <div className="flex items-center gap-3 mb-6">
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/board/${boardId}`)}>
                        <ArrowLeft className="size-4" /> Back to board
                    </Button>
                </div>
                <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
                    <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-muted">
                        <Lock className="h-7 w-7 text-muted-foreground" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-foreground mb-1">Access Restricted</h2>
                        <p className="text-sm text-muted-foreground max-w-sm">
                            You don't have permission to view the Member Workload page. Ask the board owner to grant you workload access.
                        </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => navigate(`/board/${boardId}`)}>
                        Back to board
                    </Button>
                </div>
            </section>
        );
    }

    return (
        <section className="py-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-2">
                <Button variant="ghost" size="sm" onClick={() => navigate(`/board/${boardId}`)}>
                    <ArrowLeft className="size-4" /> Back to board
                </Button>
            </div>

            <div className="flex items-center gap-3 mb-1">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-foreground leading-tight">Member Workload</h1>
                    <p className="text-sm text-muted-foreground">{board.name}</p>
                </div>
            </div>

            <p className="text-sm text-muted-foreground mb-6 ml-12">
                Track who is doing what and when — monitor active tasks, deadlines, and team activity across all members.
            </p>

            <WorkloadTracker board={board} tasks={boardTasks} />
        </section>
    );
}
