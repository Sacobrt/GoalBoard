import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Check, X, Mail, Users, Columns3, Flame, Crown, UserMinus } from "lucide-react";
import { useBoardStore } from "../store/boardStore";
import { useAuthStore } from "../../auth/store/authStore";
import { Button } from "../../../components/ui/button";
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
import { UserAvatar } from "@/shared/components/UserAvatar";

export function BoardSettings({ board }) {
    const user = useAuthStore((s) => s.user);
    const { updateBoard, deleteBoard, addColumn, updateColumn, removeColumn, addPriority, updatePriority, removePriority, removeMember, updateMemberRole } =
        useBoardStore();
    const navigate = useNavigate();
    const [deleteOpen, setDeleteOpen] = useState(false);

    const isOwner = board.ownerId === user?.id;
    const currentMember = board.members.find((m) => m.userId === user?.id);
    const isViewer = !isOwner && currentMember?.role === "viewer";

    function handleDeleteBoard() {
        deleteBoard(board.id);
        navigate("/");
    }

    return (
        <div className="space-y-8 pb-6 animate-fade-in">
            {/* Viewer notice */}
            {isViewer && (
                <div className="rounded-lg border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
                    You have <strong>read-only</strong> access to this board. Contact the owner to make changes.
                </div>
            )}

            {/* Board Name */}
            <Section title="Board Name">
                {isViewer ? (
                    <span className="text-lg font-bold text-foreground">{board.name}</span>
                ) : (
                    <EditableNameField value={board.name} onSave={(name) => updateBoard(board.id, { name })} />
                )}
            </Section>

            {/* Columns */}
            <Section title="Columns" icon={Columns3}>
                <div className="space-y-2">
                    {[...board.columns]
                        .sort((a, b) => a.order - b.order)
                        .map((col) => (
                            <ColumnRow
                                key={col.id}
                                column={col}
                                onUpdate={(patch) => updateColumn(board.id, col.id, patch)}
                                onRemove={() => removeColumn(board.id, col.id)}
                                canRemove={board.columns.length > 1}
                                isViewer={isViewer}
                            />
                        ))}
                </div>
                {!isViewer && <AddItemForm placeholder="New column name..." hasColor onAdd={(title, color) => addColumn(board.id, title, color)} />}
            </Section>

            {/* Priorities */}
            <Section title="Priorities" icon={Flame}>
                <div className="space-y-2">
                    {[...board.priorities]
                        .sort((a, b) => a.order - b.order)
                        .map((pri) => (
                            <PriorityRow
                                key={pri.id}
                                priority={pri}
                                onUpdate={(patch) => updatePriority(board.id, pri.id, patch)}
                                onRemove={() => removePriority(board.id, pri.id)}
                                canRemove={board.priorities.length > 1}
                                isViewer={isViewer}
                            />
                        ))}
                </div>
                {!isViewer && <AddItemForm placeholder="New priority name..." hasColor onAdd={(label, color) => addPriority(board.id, label, color)} />}
            </Section>

            {/* Members */}
            <Section title="Members" icon={Users}>
                <div className="space-y-2">
                    {board.members.map((m) => (
                        <MemberRow
                            key={m.userId}
                            member={m}
                            boardOwnerId={board.ownerId}
                            isOwner={isOwner}
                            onRemove={() => removeMember(board.id, m.userId, user.id)}
                            onUpdateRole={(role) => updateMemberRole(board.id, m.userId, role)}
                        />
                    ))}
                </div>
                {isOwner && <InviteForm boardId={board.id} userId={user.id} username={user.username} />}
            </Section>

            {/* Danger Zone */}
            {isOwner && (
                <div className="rounded-xl border border-red-200 p-5" style={{ background: "rgba(239,68,68,0.03)" }}>
                    <div className="flex items-center gap-2 mb-2">
                        <Trash2 className="h-4 w-4 text-red-500" />
                        <h2 className="font-semibold text-sm text-red-600">Danger Zone</h2>
                    </div>
                    <p className="text-sm mb-4 text-muted-foreground">Permanently delete this board, all its tasks, and remove all members.</p>
                    <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
                        <Trash2 className="h-3.5 w-3.5" /> Delete Board
                    </Button>
                    <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete &ldquo;{board.name}&rdquo;?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will permanently delete the board, all its tasks, and remove all members. This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteBoard}>Delete Board</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            )}
            {!isOwner && (
                <div className="rounded-xl border border-red-200 p-5" style={{ background: "rgba(239,68,68,0.03)" }}>
                    <div className="flex items-center gap-2 mb-2">
                        <UserMinus className="h-4 w-4 text-red-500" />
                        <h2 className="font-semibold text-sm text-red-600">Leave Board</h2>
                    </div>
                    <p className="text-sm mb-4 text-muted-foreground">Leave this board. You will no longer access its tasks unless invited again.</p>
                    <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
                        <UserMinus className="h-3.5 w-3.5 mr-2" /> Leave Board
                    </Button>
                    <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Leave &ldquo;{board.name}&rdquo;?</AlertDialogTitle>
                                <AlertDialogDescription>Are you sure you want to leave this board?</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={() => {
                                        removeMember(board.id, user.id, user.id);
                                        navigate("/dashboard", { replace: true });
                                    }}
                                >
                                    Leave Board
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            )}
        </div>
    );
}

function Section({ title, icon: Icon, children }) {
    return (
        <div className="rounded-xl border border-border p-5 bg-card">
            <div className="flex items-center gap-2 mb-4">
                {Icon && <Icon className="h-4 w-4 text-primary" />}
                <h2 className="font-semibold text-sm text-foreground">{title}</h2>
            </div>
            {children}
        </div>
    );
}

function EditableNameField({ value, onSave }) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value);

    function save() {
        if (draft.trim() && draft.trim() !== value) onSave(draft.trim());
        setEditing(false);
    }

    if (!editing) {
        return (
            <button
                onClick={() => {
                    setDraft(value);
                    setEditing(true);
                }}
                className="text-left text-lg font-bold text-foreground hover:text-primary transition-colors"
            >
                {value}
            </button>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <Input value={draft} onChange={(e) => setDraft(e.target.value)} autoFocus onKeyDown={(e) => e.key === "Enter" && save()} />
            <Button size="sm" onClick={save}>
                <Check className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                <X className="h-3.5 w-3.5" />
            </Button>
        </div>
    );
}

function ColumnRow({ column, onUpdate, onRemove, canRemove, isViewer }) {
    const [editing, setEditing] = useState(false);
    const safeTitle = typeof column.title === "string" ? column.title : column.title?.title || "New Column";
    const [title, setTitle] = useState(safeTitle);
    const [color, setColor] = useState(column.color);
    const [deleteOpen, setDeleteOpen] = useState(false);

    function save() {
        onUpdate({ title: title.trim() || safeTitle, color });
        setEditing(false);
    }

    return (
        <div className="flex items-center gap-2 rounded-lg px-3 py-2 bg-muted">
            {editing ? (
                <>
                    <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer border-0 p-0" />
                    <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="flex-1 h-8 text-sm"
                        autoFocus
                        onKeyDown={(e) => e.key === "Enter" && save()}
                    />
                    <label className="flex items-center gap-1.5 text-xs cursor-pointer text-muted-foreground">
                        <input type="checkbox" checked={column.isDone} onChange={(e) => onUpdate({ isDone: e.target.checked })} className="rounded" />
                        Done
                    </label>
                    <Button size="sm" variant="ghost" onClick={save}>
                        <Check className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                        <X className="h-3.5 w-3.5" />
                    </Button>
                </>
            ) : (
                <>
                    <span className="inline-block w-3 h-3 rounded-full shrink-0" style={{ background: column.color }} />
                    <span className="flex-1 text-sm font-medium text-foreground">{safeTitle}</span>
                    {column.isDone && <span className="text-xs rounded-full px-2 py-0.5 bg-emerald-50 text-emerald-600 font-medium">Done</span>}
                    {!isViewer && (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                                setTitle(safeTitle);
                                setColor(column.color);
                                setEditing(true);
                            }}
                            className="h-7 px-2 text-xs"
                        >
                            Edit
                        </Button>
                    )}
                    {!isViewer && canRemove && (
                        <>
                            <Button size="sm" variant="ghost" onClick={() => setDeleteOpen(true)} className="h-7 px-2 text-red-500 hover:text-red-600">
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Delete column?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Delete &ldquo;{safeTitle}&rdquo;? Tasks in this column will not be deleted but will lose their column assignment.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={onRemove}>Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </>
                    )}
                </>
            )}
        </div>
    );
}

function PriorityRow({ priority, onUpdate, onRemove, canRemove, isViewer }) {
    const [editing, setEditing] = useState(false);
    const [label, setLabel] = useState(priority.label);
    const [color, setColor] = useState(priority.color);
    const [deleteOpen, setDeleteOpen] = useState(false);

    function save() {
        onUpdate({ label: label.trim() || priority.label, color });
        setEditing(false);
    }

    return (
        <div className="flex items-center gap-2 rounded-lg px-3 py-2 bg-muted">
            {editing ? (
                <>
                    <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer border-0 p-0" />
                    <Input
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        className="flex-1 h-8 text-sm"
                        autoFocus
                        onKeyDown={(e) => e.key === "Enter" && save()}
                    />
                    <Button size="sm" variant="ghost" onClick={save}>
                        <Check className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                        <X className="h-3.5 w-3.5" />
                    </Button>
                </>
            ) : (
                <>
                    <span className="inline-block w-3 h-3 rounded-full shrink-0" style={{ background: priority.color }} />
                    <span className="flex-1 text-sm font-medium text-foreground">{priority.label}</span>
                    {!isViewer && (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                                setLabel(priority.label);
                                setColor(priority.color);
                                setEditing(true);
                            }}
                            className="h-7 px-2 text-xs"
                        >
                            Edit
                        </Button>
                    )}
                    {!isViewer && canRemove && (
                        <>
                            <Button size="sm" variant="ghost" onClick={() => setDeleteOpen(true)} className="h-7 px-2 text-red-500 hover:text-red-600">
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Delete priority?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Delete &ldquo;{priority.label}&rdquo;? Tasks using this priority will have their priority removed.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={onRemove}>Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </>
                    )}
                </>
            )}
        </div>
    );
}

function AddItemForm({ placeholder, hasColor, onAdd }) {
    const [adding, setAdding] = useState(false);
    const [value, setValue] = useState("");
    const [color, setColor] = useState("#6366f1");

    function submit() {
        if (!value.trim()) return;
        onAdd(value.trim(), hasColor ? color : undefined);
        setValue("");
        setColor("#6366f1");
        setAdding(false);
    }

    if (!adding) {
        return (
            <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 text-xs font-medium mt-3 px-1 transition-colors text-primary">
                <Plus className="h-3.5 w-3.5" /> Add new
            </button>
        );
    }

    return (
        <div className="flex items-center gap-2 mt-3">
            {hasColor && <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer border-0 p-0" />}
            <Input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={placeholder}
                className="flex-1 h-8 text-sm"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && submit()}
            />
            <Button size="sm" onClick={submit}>
                <Check className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
                <X className="h-3.5 w-3.5" />
            </Button>
        </div>
    );
}

function MemberRow({ member, boardOwnerId, isOwner, onRemove, onUpdateRole }) {
    const users = JSON.parse(localStorage.getItem("goalboard_users") ?? "[]");
    const memberUser = users.find((u) => u.id === member.userId);
    const isOwnRow = member.userId === boardOwnerId;
    const [removeOpen, setRemoveOpen] = useState(false);

    return (
        <div className="flex items-center gap-3 rounded-lg px-3 py-2 bg-muted">
            <UserAvatar user={memberUser} size="md" />

            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{memberUser?.username ?? "Unknown"}</p>
                <p className="text-xs truncate text-muted-foreground">{memberUser?.email}</p>
            </div>

            {isOwnRow ? (
                <span className="flex items-center gap-1 text-xs font-medium text-amber-600">
                    <Crown className="h-3 w-3" /> Owner
                </span>
            ) : isOwner ? (
                <select
                    value={member.role || "contributor"}
                    onChange={(e) => onUpdateRole(e.target.value)}
                    className="text-xs rounded border border-border px-2 py-1 bg-transparent cursor-pointer hover:border-border transition-colors focus:outline-none text-foreground"
                >
                    <option value="contributor">Contributor</option>
                    <option value="viewer">Viewer (Read-only)</option>
                </select>
            ) : (
                <span className="text-xs font-medium capitalize text-muted-foreground">{member.role || "contributor"}</span>
            )}

            {isOwner && !isOwnRow && (
                <>
                    <Button size="sm" variant="ghost" onClick={() => setRemoveOpen(true)} className="h-7 px-2 text-red-500 hover:text-red-600">
                        <UserMinus className="h-3.5 w-3.5" />
                    </Button>
                    <AlertDialog open={removeOpen} onOpenChange={setRemoveOpen}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Remove member?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Remove <strong>{memberUser?.username ?? "this member"}</strong> from the board? They will lose access and be notified.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={onRemove}>Remove</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </>
            )}
        </div>
    );
}

function InviteForm({ boardId, userId, username }) {
    const inviteContributor = useBoardStore((s) => s.inviteContributor);
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    function handleInvite(e) {
        e.preventDefault();
        setError("");
        setSuccess("");
        if (!email.trim()) return;
        const result = inviteContributor(boardId, userId, username, email.trim());
        if (!result.ok) {
            setError(result.error);
        } else {
            setSuccess(`Invitation sent to ${email.trim()}`);
            setEmail("");
            setTimeout(() => setSuccess(""), 3000);
        }
    }

    return (
        <div className="mt-4">
            <form onSubmit={handleInvite} className="flex items-center gap-2">
                <div className="relative flex-1">
                    <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        type="email"
                        placeholder="Invite by email..."
                        className="pl-8 h-8 text-sm"
                        required
                    />
                </div>
                <Button size="sm" type="submit">
                    Invite
                </Button>
            </form>
            {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
            {success && <p className="text-xs text-emerald-600 mt-1.5">{success}</p>}
        </div>
    );
}
