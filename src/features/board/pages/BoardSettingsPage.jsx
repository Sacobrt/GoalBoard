import { useParams, Link, useNavigate } from "react-router-dom";
import { useBoardStore } from "../store/boardStore";
import { useAuthStore } from "../../auth/store/authStore";
import { BoardSettings } from "../components/BoardSettings";
import { Button } from "../../../components/ui/button";
import { ArrowLeft } from "lucide-react";

export function BoardSettingsPage() {
    const { boardId } = useParams();
    const userId = useAuthStore((s) => s.user?.id);
    const board = useBoardStore((s) => s.boards.find((b) => b.id === boardId));
    const navigate = useNavigate();

    if (!board) {
        return (
            <section className="py-20 text-center">
                <p className="text-sm text-muted-foreground">Board not found.</p>
                <Button variant="outline" size="sm" render={<Link to="/" />} className="mt-4">
                    Back to overview
                </Button>
            </section>
        );
    }

    const isMember = board.members.some((m) => m.userId === userId);
    if (!isMember) {
        return (
            <section className="py-20 text-center">
                <p className="text-sm text-muted-foreground">You don't have access to this board.</p>
            </section>
        );
    }

    return (
        <section className="py-6">
            <div className="flex items-center gap-3 mb-2">
                <Button variant="ghost" size="sm" onClick={() => navigate(`/board/${boardId}`)}>
                    <ArrowLeft className="size-4" /> Back to board
                </Button>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-1">Board Settings</h1>
            <p className="text-sm mb-4 text-muted-foreground">Customize columns, priorities, and manage team members.</p>
            <BoardSettings board={board} />
        </section>
    );
}
