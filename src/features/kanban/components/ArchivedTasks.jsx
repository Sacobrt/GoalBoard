import { useState } from "react";
import { ArchiveRestore, Trash2, X } from "lucide-react";
import { Button } from "../../../components/ui/button";
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

export function ArchivedTasks({ tasks, priorityMap, onRestore, onDelete, onClose }) {
    const [deleteId, setDeleteId] = useState(null);
    const taskToDelete = tasks.find((t) => t.id === deleteId);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div
                className="relative w-full max-w-lg max-h-[80vh] rounded-2xl border border-border bg-card p-6 shadow-2xl overflow-hidden animate-scale-in"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-lg text-foreground">Archived Tasks</h2>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <div className="overflow-y-auto max-h-[calc(80vh-100px)] space-y-2 pr-1">
                    {tasks.length === 0 && <p className="text-sm text-center py-8 text-muted-foreground">No archived tasks</p>}
                    {tasks.map((task) => {
                        const priority = priorityMap[task.priorityId];
                        return (
                            <div key={task.id} className="flex items-center gap-3 rounded-lg border border-border bg-muted px-4 py-3">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        {priority && (
                                            <span
                                                className="text-xs rounded-full px-2 py-0.5 font-semibold"
                                                style={{ background: `${priority.color}12`, color: priority.color }}
                                            >
                                                {priority.label}
                                            </span>
                                        )}
                                        {task.archivedAt && (
                                            <span className="text-xs text-muted-foreground">Archived {new Date(task.archivedAt).toLocaleDateString()}</span>
                                        )}
                                    </div>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => onRestore(task.id)} title="Restore">
                                    <ArchiveRestore className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setDeleteId(task.id)}
                                    className="text-red-500 hover:text-red-600"
                                    title="Delete permanently"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        );
                    })}
                </div>
            </div>

            <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete permanently?</AlertDialogTitle>
                        <AlertDialogDescription>
                            &ldquo;{taskToDelete?.title}&rdquo; will be permanently deleted. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                onDelete(deleteId);
                                setDeleteId(null);
                            }}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
