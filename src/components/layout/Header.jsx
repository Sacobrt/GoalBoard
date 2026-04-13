import { useNavigate } from "react-router-dom";
import { BarChart2, LogOut, Bell, Check, X, UserMinus, UserX, MailX, CheckCheck, Search, Menu, Settings } from "lucide-react";
import { UserAvatar } from "../../shared/components/UserAvatar";
import { useAuthStore } from "../../features/auth/store/authStore";
import { useBoardStore } from "../../features/board/store/boardStore";
import { useNotificationStore } from "../../features/notifications/store/notificationStore";
import { useSidebarStore } from "../../shared/hooks/useSidebarStore";
import { useCommandStore } from "../../shared/hooks/useCommandStore";
import { useMediaQuery } from "../../shared/hooks/useMediaQuery";
import { timeAgo } from "../../shared/utils/timeAgo";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "../ui/dropdown-menu";
import { Popover, PopoverTrigger, PopoverContent } from "../ui/popover";
import { Button } from "../ui/button";

export function Header() {
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);
    const invitations = useBoardStore((s) => s.invitations);
    const respondToInvitation = useBoardStore((s) => s.respondToInvitation);
    const allNotifications = useNotificationStore((s) => s.notifications);
    const markAsRead = useNotificationStore((s) => s.markAsRead);
    const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);
    const clearAll = useNotificationStore((s) => s.clearAll);
    const toggleSidebar = useSidebarStore((s) => s.toggle);
    const sidebarCollapsed = useSidebarStore((s) => s.collapsed);
    const toggleCommandPalette = useCommandStore((s) => s.toggle);
    const isDesktop = useMediaQuery("(min-width: 768px)");
    const navigate = useNavigate();

    const pendingInvitations = invitations.filter((i) => i.toEmail.toLowerCase() === (user?.email ?? "").toLowerCase() && i.status === "pending");
    const userNotifications = allNotifications.filter((n) => n.userId === user?.id);
    const unreadNotifCount = userNotifications.filter((n) => !n.read).length;
    const totalBadge = pendingInvitations.length + unreadNotifCount;

    function handleLogout() {
        logout();
        navigate("/");
    }

    return (
        <header className="sticky top-0 z-40 border-b border-border shrink-0 bg-background/92 backdrop-blur-sm">
            <div className="h-14 flex items-center justify-between gap-4 px-4 sm:px-6">
                {/* Left: sidebar toggle (mobile) + search hint */}
                <div className="flex items-center gap-2">
                    {(!isDesktop || sidebarCollapsed) && (
                        <button onClick={toggleSidebar} className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors hover:bg-muted">
                            <Menu className="h-4 w-4 text-muted-foreground" />
                        </button>
                    )}
                    <button
                        className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-xs transition-colors hover:bg-muted text-muted-foreground"
                        onClick={toggleCommandPalette}
                    >
                        <Search className="h-3.5 w-3.5" />
                        <span>Search...</span>
                        <kbd className="ml-4 px-1.5 py-0.5 rounded text-[10px] font-mono border border-border bg-card">⌘K</kbd>
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    {/* Notification bell */}
                    <Popover>
                        <PopoverTrigger className="relative flex items-center justify-center w-8 h-8 rounded-lg transition-colors hover:bg-muted">
                            <Bell className="h-4 w-4 text-muted-foreground" />
                            {totalBadge > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold text-white bg-red-500">
                                    {totalBadge > 9 ? "9+" : totalBadge}
                                </span>
                            )}
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-80 p-0">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                                <h3 className="font-semibold text-sm text-foreground">Notifications</h3>
                                {(unreadNotifCount > 0 || userNotifications.length > 0) && (
                                    <div className="flex items-center gap-1">
                                        {unreadNotifCount > 0 && (
                                            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => markAllAsRead(user.id)}>
                                                <CheckCheck className="h-3 w-3 mr-1" /> Read all
                                            </Button>
                                        )}
                                        {userNotifications.length > 0 && (
                                            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-red-500" onClick={() => clearAll(user.id)}>
                                                Clear
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="max-h-80 overflow-y-auto">
                                {/* Pending invitations */}
                                {pendingInvitations.map((inv) => (
                                    <div key={inv.id} className="px-4 py-3 border-b border-border last:border-b-0" style={{ background: "rgba(99,102,241,0.04)" }}>
                                        <p className="text-sm text-foreground">
                                            <span className="font-semibold">{inv.fromUsername}</span> invited you to{" "}
                                            <span className="font-semibold">{inv.boardName}</span>
                                        </p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <Button size="sm" className="h-7 text-xs" onClick={() => respondToInvitation(inv.id, true, user.id)}>
                                                <Check className="h-3 w-3" /> Accept
                                            </Button>
                                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => respondToInvitation(inv.id, false, user.id)}>
                                                <X className="h-3 w-3" /> Decline
                                            </Button>
                                        </div>
                                    </div>
                                ))}

                                {/* Notifications */}
                                {userNotifications.map((notif) => {
                                    const icon =
                                        notif.type === "member_kicked"
                                            ? UserX
                                            : notif.type === "member_left"
                                              ? UserMinus
                                              : notif.type === "invitation_declined"
                                                ? MailX
                                                : Bell;
                                    const Icon = icon;
                                    return (
                                        <div
                                            key={notif.id}
                                            className="flex items-start gap-3 px-4 py-3 border-b border-border last:border-b-0 cursor-pointer hover:bg-muted transition-colors"
                                            style={{ background: notif.read ? "transparent" : "rgba(99,102,241,0.04)" }}
                                            onClick={() => !notif.read && markAsRead(notif.id)}
                                        >
                                            <Icon
                                                className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground"
                                                style={{ color: notif.type === "member_kicked" ? "#ef4444" : undefined }}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-foreground">{notif.message}</p>
                                                <p className="text-xs mt-0.5 text-muted-foreground">{timeAgo(notif.createdAt)}</p>
                                            </div>
                                            {!notif.read && <span className="mt-1.5 w-2 h-2 rounded-full bg-primary shrink-0" />}
                                        </div>
                                    );
                                })}

                                {pendingInvitations.length === 0 && userNotifications.length === 0 && (
                                    <div className="px-4 py-8 text-center">
                                        <p className="text-sm text-muted-foreground">No notifications</p>
                                    </div>
                                )}
                            </div>
                        </PopoverContent>
                    </Popover>

                    {/* User menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring">
                            <UserAvatar user={user} size="md" />
                            <span className="hidden sm:block text-sm font-medium text-foreground">{user?.username}</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                            <div className="px-2 py-2">
                                <p className="text-sm font-semibold text-foreground">{user?.username}</p>
                                <p className="text-xs truncate text-muted-foreground">{user?.email}</p>
                            </div>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/dashboard")}>
                                <BarChart2 className="h-3.5 w-3.5" />
                                Dashboard
                            </DropdownMenuItem>
                            <DropdownMenuItem className="flex items-center gap-2 cursor-pointer" onClick={() => navigate(`/settings`)}>
                                <Settings className="h-3.5 w-3.5" />
                                Settings
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-500 hover:bg-red-400/80! cursor-pointer" onClick={handleLogout}>
                                <LogOut className="mr-2 h-3.5 w-3.5" />
                                Sign out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
