import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuGroup,
} from "../../components/ui/dropdown-menu";
import { PRIMARY_VIEWS, SECONDARY_VIEWS, getView } from "./board-views/viewConfig";

export function ViewSwitcher({ view, onViewChange, disabled = false }) {
    const activeIsSecondary = SECONDARY_VIEWS.some((v) => v.id === view);
    const activeView = getView(view);
    const ActiveIcon = activeView.icon;

    return (
        <div className={cn("flex items-center gap-1", disabled && "pointer-events-none opacity-50")}>
            {/* Mobile: single dropdown for all views */}
            <div className="flex sm:hidden">
                <AllViewsDropdown view={view} onViewChange={onViewChange} />
            </div>

            {/* Desktop: segmented control + overflow dropdown */}
            <div className="hidden sm:flex items-center rounded-lg border border-border bg-muted/40 p-0.5 gap-0.5" role="tablist" aria-label="Board view">
                {PRIMARY_VIEWS.map((v) => {
                    const Icon = v.icon;
                    const isActive = view === v.id;
                    return (
                        <button
                            key={v.id}
                            role="tab"
                            aria-selected={isActive}
                            aria-label={`${v.label} view — ${v.description}`}
                            title={v.description}
                            onClick={() => onViewChange(v.id)}
                            className={cn(
                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                                isActive ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-background/60",
                            )}
                        >
                            <Icon className="h-3.5 w-3.5 shrink-0" />
                            <span>{v.label}</span>
                        </button>
                    );
                })}

                {/* Divider */}
                <span className="w-px h-4 bg-border mx-0.5" aria-hidden="true" />

                {/* More-views dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger
                        role="tab"
                        aria-selected={activeIsSecondary}
                        aria-label="More view options"
                        title="More views"
                        className={cn(
                            "inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                            activeIsSecondary ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-background/60",
                        )}
                    >
                        {activeIsSecondary ? (
                            <>
                                <ActiveIcon className="h-3.5 w-3.5 shrink-0" />
                                <span>{activeView.label}</span>
                            </>
                        ) : (
                            <span>More</span>
                        )}
                        <ChevronDown className="h-3 w-3 opacity-60" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-full">
                        <DropdownMenuGroup>
                            <DropdownMenuLabel>Views</DropdownMenuLabel>
                            {SECONDARY_VIEWS.map((v) => (
                                <ViewDropdownItem key={v.id} v={v} active={view === v.id} onSelect={onViewChange} />
                            ))}
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}

function ViewDropdownItem({ v, active, onSelect }) {
    const Icon = v.icon;
    return (
        <DropdownMenuItem onClick={() => onSelect(v.id)} className="flex items-center gap-2 cursor-pointer">
            <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-medium leading-none">{v.label}</span>
                <span className="text-xs text-muted-foreground mt-0.5 truncate">{v.description}</span>
            </div>
            {active && <Check className="h-3.5 w-3.5 text-primary ml-auto shrink-0" />}
        </DropdownMenuItem>
    );
}

/** Collapsed dropdown used on narrow screens. */
function AllViewsDropdown({ view, onViewChange }) {
    const activeView = getView(view);
    const ActiveIcon = activeView.icon;
    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                aria-label="Board view switcher"
                className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-border bg-background text-sm font-medium text-foreground hover:bg-muted transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
                <ActiveIcon className="h-3.5 w-3.5 shrink-0" />
                <span>{activeView.label}</span>
                <ChevronDown className="h-3 w-3 opacity-60" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
                {[...PRIMARY_VIEWS, ...SECONDARY_VIEWS].map((v) => (
                    <ViewDropdownItem key={v.id} v={v} active={view === v.id} onSelect={onViewChange} />
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
