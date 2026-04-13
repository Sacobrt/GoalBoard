import { cn } from "../../lib/utils";

/**
 * Reusable empty state pattern with icon, title, description, and optional CTA.
 * Used when lists/boards/tables have no data.
 */
export function EmptyState({ icon: Icon, title, description, action, className }) {
    return (
        <div className={cn("flex flex-col items-center justify-center text-center py-16", className)}>
            {Icon && (
                <div className="animate-float inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 bg-primary/10 border border-primary/20">
                    <Icon className="h-8 w-8 text-primary" />
                </div>
            )}
            <h2 className="text-xl font-semibold text-foreground mb-2">{title}</h2>
            {description && <p className="text-sm mb-6 max-w-sm text-muted-foreground">{description}</p>}
            {action && <div>{action}</div>}
        </div>
    );
}
