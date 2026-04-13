import { useState, useEffect } from "react";
import { cn } from "../../lib/utils";

const SIZES = {
    sm: "w-6 h-6 text-[10px]",
    md: "w-8 h-8 text-xs",
    lg: "w-10 h-10 text-sm",
    xl: "w-20 h-20 text-2xl",
};

export function UserAvatar({ user, size = "md", className, onClick }) {
    const storageKey = user?.id ? `goalboard_avatar_${user.id}` : null;
    const [avatar, setAvatar] = useState(() => (storageKey ? localStorage.getItem(storageKey) : null));

    useEffect(() => {
        if (!storageKey) return;
        setAvatar(localStorage.getItem(storageKey));

        function handleAvatarUpdate(e) {
            if (e.detail?.userId === user?.id) {
                setAvatar(localStorage.getItem(storageKey));
            }
        }

        // Listen to actual storage events to sync across tabs
        function handleStorage(e) {
            if (e.key === storageKey) setAvatar(e.newValue);
        }

        window.addEventListener("avatar-updated", handleAvatarUpdate);
        window.addEventListener("storage", handleStorage);
        return () => {
            window.removeEventListener("avatar-updated", handleAvatarUpdate);
            window.removeEventListener("storage", handleStorage);
        };
    }, [storageKey, user?.id]);

    const displayName = user?.fullName || user?.username;
    const initials = displayName
        ? displayName.includes(" ")
            ? displayName
                  .split(" ")
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()
            : displayName.slice(0, 2).toUpperCase()
        : "?";
    const sizeClass = SIZES[size] || SIZES.md;
    const Comp = onClick ? "button" : "div";

    return (
        <Comp
            onClick={onClick}
            className={cn(
                "flex items-center justify-center rounded-full font-bold text-white overflow-hidden shrink-0 transition-all duration-150",
                onClick && "cursor-pointer hover:ring-2 hover:ring-ring hover:ring-offset-1 focus:outline-none focus:ring-2 focus:ring-ring",
                avatar ? "bg-transparent" : "bg-primary",
                sizeClass,
                className,
            )}
            title={user?.fullName || user?.username}
        >
            {avatar ? <img src={avatar} alt={user?.fullName || user?.username || "Avatar"} className="w-full h-full object-cover" /> : initials}
        </Comp>
    );
}
