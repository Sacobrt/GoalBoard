import { cn } from "../../lib/utils";

/**
 * Consistent page header pattern used across all pages.
 * Renders title, optional description, and action buttons.
 */
export function PageHeader({ title, description, actions, className }) {
    return (
        <div className={cn("flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-6", className)}>
            <div className="min-w-0">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
                {description && <p className="text-sm mt-1 text-muted-foreground">{description}</p>}
            </div>
            {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
    );
}
