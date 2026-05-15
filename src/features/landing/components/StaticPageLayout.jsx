import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export function StaticPageLayout({ children }) {
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
                <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2.5">
                        <img src="/logo.png" width={24} height={24} alt="Logo" />
                        <span className="font-bold text-base tracking-tight">Goal Board</span>
                    </Link>
                    <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Back to home
                    </Link>
                </div>
            </header>

            {/* Content */}
            <main className="flex-1 container mx-auto px-4 sm:px-6 py-16 sm:py-24 max-w-3xl">{children}</main>

            {/* Footer */}
            <footer className="border-t border-border bg-slate-50/50">
                <div className="container mx-auto px-4 sm:px-6 py-8 text-center text-sm text-slate-500">
                    <p>&copy; {new Date().getFullYear()} Goal Board. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
