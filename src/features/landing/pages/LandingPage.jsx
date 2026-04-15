import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    KanbanSquare,
    CheckCircle2,
    Shield,
    Users,
    Zap,
    Globe,
    ArrowRight,
    Sparkles,
    Clock,
    Target,
    BarChart3,
    Layers,
    MousePointerClick,
    Star,
    BarChart2,
    Settings,
    LogOut,
} from "lucide-react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { Button } from "../../../components/ui/button";
import { useAuthStore } from "../../auth/store/authStore";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/shared/components/UserAvatar";

const initialColumns = [
    { id: "todo", items: [{ id: "1" }, { id: "2" }] },
    { id: "progress", items: [{ id: "3" }] },
    { id: "done", items: [{ id: "4" }] },
];

function AnimatedSection({ children, className = "" }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-80px" });
    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

export function LandingPage() {
    const navigate = useNavigate();
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);

    const [columns, setColumns] = useState(initialColumns);

    // Simulate Kanban flow (drag between columns)
    useEffect(() => {
        const interval = setInterval(() => {
            setColumns((prev) => {
                const newCols = prev.map((c) => ({ ...c, items: [...c.items] }));

                // Move from Todo -> Progress -> Done
                if (newCols[0].items.length > 0) {
                    const item = newCols[0].items.shift();
                    newCols[1].items.push(item);
                } else if (newCols[1].items.length > 0) {
                    const item = newCols[1].items.shift();
                    newCols[2].items.push(item);
                } else {
                    // reset loop
                    return initialColumns;
                }

                return newCols;
            });
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    function handleLogout() {
        logout();
        navigate("/");
    }

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/10 selection:text-primary animate-fade-in">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border pointer-events-auto">
                <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <img src="/logo.png" width={24} height={24} alt="Logo" />
                        <span className="font-bold text-base tracking-tight">Goal Board</span>
                    </div>
                    <div className="flex items-center gap-4">
                        {user ? (
                            <>
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
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                                    Log in
                                </Link>
                                <Button onClick={() => navigate("/register")} size="sm" className="hidden sm:inline-flex">
                                    Get Goal Board free
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center pt-24 pb-40 px-4 sm:px-6 text-center">
                {/* Hero */}
                <div className="max-w-4xl mx-auto space-y-8 relative">
                    {/* Background glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />

                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-sm text-indigo-600 font-medium mb-4">
                        <Sparkles className="h-3.5 w-3.5" />
                        Free forever for individuals
                    </div>

                    <h1 className="text-5xl sm:text-7xl font-bold tracking-tight text-slate-900 leading-[1.1]">
                        Your workspace for <br />
                        <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-500 to-cyan-500">everything.</span>
                    </h1>

                    <p className="text-lg sm:text-xl text-slate-600 max-w-md mx-auto leading-relaxed">
                        Goal Board is the connected workspace where better, faster work happens.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-6">
                        <Button
                            size="lg"
                            className="w-full sm:w-auto text-base h-12 px-8 cursor-pointer shadow-xl hover:bg-indigo-400 shadow-indigo-500/20 rounded-full transition-colors duration-300"
                            onClick={() => navigate(`/register`)}
                        >
                            Get started free <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            className="w-full sm:w-auto text-base h-12 cursor-pointer bg-white/50 border-slate-200 hover:bg-slate-100/60 shadow-sm rounded-full px-8 transition-colors duration-300"
                            onClick={() => navigate(`/request-demo`)}
                        >
                            Request a demo
                        </Button>
                    </div>
                    <p className="text-sm text-slate-500 mt-4">No credit card required. Free forever exactly for you.</p>
                </div>

                {/* Hero App Mockup */}
                <div className="w-full max-w-5xl mx-auto mt-24">
                    <div className="rounded-2xl border border-border bg-white shadow-2xl p-2 sm:p-4 rotate-1 hover:rotate-0 transition-transform duration-500 overflow-hidden relative">
                        {/* Mac dots */}
                        <div className="absolute top-6 left-6 flex gap-1.5 z-10">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                        </div>

                        <div className="rounded-xl border border-border overflow-hidden bg-white shadow-inner aspect-video sm:aspect-21/9 flex items-center justify-center relative bg-linear-to-br from-slate-50 to-indigo-50/30">
                            <div className="absolute inset-0 px-4 py-12 flex gap-4 overflow-hidden">
                                {columns.map((col, colIndex) => (
                                    <div key={col.id} className="w-64 shrink-0 rounded-xl bg-slate-100/50 p-3 h-full flex flex-col gap-3">
                                        {/* Column header skeleton */}
                                        <div className={`h-6 ${colIndex === 0 ? "w-24" : colIndex === 1 ? "w-32" : "w-20"} bg-slate-200 rounded-md`} />

                                        <AnimatePresence>
                                            {col.items.map((item, idx) => (
                                                <motion.div
                                                    key={item.id}
                                                    layout
                                                    layoutId={item.id}
                                                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.9 }}
                                                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                                                    className="h-20 bg-white rounded-lg shadow-sm border border-slate-100 p-3 flex flex-col justify-between"
                                                >
                                                    {/* fake title */}
                                                    <div className={`h-4 rounded bg-slate-200 ${idx % 3 === 0 ? "w-3/4" : idx % 3 === 1 ? "w-1/2" : "w-2/3"}`} />

                                                    {/* fake tag */}
                                                    <div
                                                        className={`h-3 rounded ${
                                                            idx % 5 === 0
                                                                ? "bg-red-100 w-1/4"
                                                                : idx % 5 === 1
                                                                  ? "bg-blue-100 w-1/3"
                                                                  : idx % 5 === 2
                                                                    ? "bg-amber-100 w-1/2"
                                                                    : idx % 5 === 3
                                                                      ? "bg-emerald-100 w-1/4"
                                                                      : "bg-purple-100 w-1/4"
                                                        }`}
                                                    />
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Features */}
                <AnimatedSection className="max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-6 mt-32 text-left">
                    <div className="p-6 rounded-2xl bg-white border border-border shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-4">
                            <KanbanSquare className="h-6 w-6 text-indigo-500" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Beautiful Kanban</h3>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            Organize tasks effortlessly with an intuitive, drag-and-drop board interface that stays completely out of your way.
                        </p>
                    </div>
                    <div className="p-6 rounded-2xl bg-white border border-border shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-4">
                            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Instant Sync</h3>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            Every change is saved locally in your active edge cache, ensuring your workspace is exactly how you left it.
                        </p>
                    </div>
                    <div className="p-6 rounded-2xl bg-white border border-border shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center mb-4">
                            <Shield className="h-6 w-6 text-amber-500" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Role-based Access</h3>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            Administrators possess fine-grain oversight to enforce security boundaries across every workspace and board.
                        </p>
                    </div>
                </AnimatedSection>

                {/* How it Works */}
                <AnimatedSection className="max-w-5xl mx-auto w-full mt-40">
                    <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500 mb-3">How it works</p>
                    <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 mb-4">
                        From idea to done,
                        <br />
                        in three steps.
                    </h2>
                    <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-16">
                        No setup wizards. No complex onboarding. Create a board, add your tasks, and start moving.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                        {[
                            {
                                step: "01",
                                icon: <MousePointerClick className="h-5 w-5 text-indigo-500" />,
                                title: "Create a board",
                                desc: "Spin up a new workspace in seconds. Name it, pick your columns, and you're ready to go.",
                            },
                            {
                                step: "02",
                                icon: <Layers className="h-5 w-5 text-indigo-500" />,
                                title: "Add your tasks",
                                desc: "Drop in tasks with rich descriptions, due dates, priorities, and labels. Everything lives in one card.",
                            },
                            {
                                step: "03",
                                icon: <Target className="h-5 w-5 text-indigo-500" />,
                                title: "Track progress",
                                desc: "Drag cards across columns as work moves forward. See exactly where every task stands at a glance.",
                            },
                        ].map((item) => (
                            <div key={item.step} className="relative p-6 rounded-2xl bg-white border border-border shadow-sm">
                                <span className="text-5xl font-black text-slate-100 absolute top-4 right-5 select-none">{item.step}</span>
                                <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-4">{item.icon}</div>
                                <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                                <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </AnimatedSection>

                {/* Bento Feature Grid */}
                <AnimatedSection className="max-w-6xl mx-auto w-full mt-40">
                    <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500 mb-3">Everything you need</p>
                    <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 mb-4">Simple and powerful.</h2>
                    <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-16">
                        All the tools to keep your team aligned without the bloat. Built for focus, designed for speed.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                        {/* Large card */}
                        <div className="md:row-span-2 p-8 rounded-2xl bg-linear-to-br from-indigo-50 to-white border border-indigo-100 flex flex-col justify-between">
                            <div>
                                <div className="w-12 h-12 rounded-xl bg-white border border-indigo-100 flex items-center justify-center mb-6 shadow-sm">
                                    <KanbanSquare className="h-6 w-6 text-indigo-500" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-3">Drag-and-drop boards</h3>
                                <p className="text-slate-600 leading-relaxed">
                                    Move tasks between columns with a natural drag-and-drop experience. Columns are fully customizable — rename, reorder, or add as
                                    many as you need.
                                </p>
                            </div>
                            <div className="mt-8 rounded-xl bg-white border border-slate-100 shadow-sm p-4 flex gap-3">
                                {["To Do", "In Progress", "Done"].map((col) => (
                                    <div key={col} className="flex-1 rounded-lg bg-slate-50 p-2.5">
                                        <div className="text-xs font-semibold text-slate-400 mb-2">{col}</div>
                                        <div className="space-y-2">
                                            <div className="h-6 bg-slate-100 rounded" />
                                            {col === "To Do" && <div className="h-6 bg-slate-100 rounded" />}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Smaller cards */}
                        <div className="p-6 rounded-2xl bg-white border border-border shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-4">
                                <Clock className="h-5 w-5 text-emerald-500" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Due dates & reminders</h3>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                Set deadlines with a visual date picker. Never miss a deadline with at-a-glance overdue indicators on every card.
                            </p>
                        </div>
                        <div className="p-6 rounded-2xl bg-white border border-border shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-10 h-10 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center mb-4">
                                <BarChart3 className="h-5 w-5 text-purple-500" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Progress tracking</h3>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                Visual progress bars across boards give you an instant snapshot of how close your team is to hitting every milestone.
                            </p>
                        </div>
                    </div>
                </AnimatedSection>

                {/* Built for Teams Section */}
                <AnimatedSection className="max-w-6xl mx-auto w-full mt-40">
                    <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500 mb-3">Built for everyone</p>
                    <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 mb-4">One tool. Every team.</h2>
                    <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-16">
                        Whether you're a solo founder or a growing team, Goal Board adapts to how you work — not the other way around.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
                        {[
                            {
                                icon: <Zap className="h-5 w-5 text-amber-500" />,
                                bg: "bg-amber-50",
                                border: "border-amber-100",
                                title: "Lightning fast",
                                desc: "Built on modern edge infrastructure. Every interaction feels instant.",
                            },
                            {
                                icon: <Users className="h-5 w-5 text-blue-500" />,
                                bg: "bg-blue-50",
                                border: "border-blue-100",
                                title: "Team collaboration",
                                desc: "Invite members, assign roles, and work together on shared boards.",
                            },
                            {
                                icon: <Globe className="h-5 w-5 text-cyan-500" />,
                                bg: "bg-cyan-50",
                                border: "border-cyan-100",
                                title: "Access anywhere",
                                desc: "Fully responsive. Your boards work beautifully on any device or screen size.",
                            },
                            {
                                icon: <Shield className="h-5 w-5 text-rose-500" />,
                                bg: "bg-rose-50",
                                border: "border-rose-100",
                                title: "Secure by design",
                                desc: "Role-based permissions ensure the right people see the right things.",
                            },
                        ].map((item) => (
                            <div key={item.title} className="p-5 rounded-2xl bg-white border border-border shadow-sm hover:shadow-md transition-shadow">
                                <div className={`w-10 h-10 rounded-lg ${item.bg} ${item.border} border flex items-center justify-center mb-4`}>{item.icon}</div>
                                <h3 className="font-bold text-slate-900 mb-1.5">{item.title}</h3>
                                <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </AnimatedSection>

                {/* Stats */}
                <AnimatedSection className="max-w-4xl mx-auto w-full mt-40">
                    <div className="md:row-span-2 p-8 rounded-2xl bg-linear-to-br from-indigo-50 to-white border border-indigo-100 flex flex-col justify-between">
                        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">More productivity. Fewer tools.</h2>
                        <p className="text-slate-400 mb-12 max-w-xl mx-auto">
                            Stop juggling multiple apps. Goal Board brings boards, tasks, and team management into one clean interface.
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
                            {[
                                { value: "10x", label: "Faster setup" },
                                { value: "100%", label: "Free to start" },
                                { value: "0", label: "Learning curve" },
                                { value: "∞", label: "Boards & tasks" },
                            ].map((stat) => (
                                <div key={stat.label} className="text-center">
                                    <div className="text-3xl sm:text-4xl font-black text-slate-900 mb-1">{stat.value}</div>
                                    <div className="text-sm text-slate-400">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </AnimatedSection>
            </main>

            {/* Footer */}
            <footer className="border-t border-border bg-slate-50/50">
                <div className="container mx-auto px-4 sm:px-6 py-12">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10 text-left">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <img src="/logo.png" width={20} height={20} alt="Logo" />
                                <span className="font-bold text-sm tracking-tight text-slate-900">Goal Board</span>
                            </div>
                            <p className="text-sm text-slate-500 leading-relaxed">The connected workspace where better, faster work happens.</p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-sm text-slate-900 mb-3">Product</h4>
                            <ul className="space-y-2 text-sm text-slate-500">
                                <li>
                                    <Link to="/register" className="hover:text-slate-900 transition-colors">
                                        Get started
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/request-demo" className="hover:text-slate-900 transition-colors">
                                        Request a demo
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/login" className="hover:text-slate-900 transition-colors">
                                        Log in
                                    </Link>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-sm text-slate-900 mb-3">Resources</h4>
                            <ul className="space-y-2 text-sm text-slate-500">
                                <li>
                                    <Link to="/help" className="hover:text-slate-900 transition-colors">
                                        Help center
                                    </Link>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-sm text-slate-900 mb-3">Company</h4>
                            <ul className="space-y-2 text-sm text-slate-500">
                                <li>
                                    <Link to="/terms" className="hover:text-slate-900 transition-colors">
                                        Terms & Privacy
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-border pt-6 text-center text-sm text-slate-400">
                        <p>&copy; {new Date().getFullYear()} Goal Board. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
