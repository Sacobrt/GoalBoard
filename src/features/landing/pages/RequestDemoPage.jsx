import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, User, Building2, MessageSquare, CheckCircle2, ArrowRight, Send, KanbanSquare, BarChart3, Users } from "lucide-react";
import { useAuthStore } from "../../auth/store/authStore";
import { useNotificationStore } from "../../notifications/store/notificationStore";
import { useDemoRequestStore } from "../../admin/store/demoRequestStore";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";

const features = [
    { icon: KanbanSquare, title: "Unlimited boards & tasks", desc: "Organize every project with drag-and-drop Kanban boards." },
    { icon: Users, title: "Team collaboration", desc: "Invite members, assign tasks, and manage roles seamlessly." },
    { icon: BarChart3, title: "Insights & analytics", desc: "Track progress with real-time analytics and dashboards." },
];

const stripEmoji = (str) => str.replace(/\p{Extended_Pictographic}/gu, "");

export function RequestDemoPage() {
    const user = useAuthStore((s) => s.user);
    const navigate = useNavigate();
    const addRequest = useDemoRequestStore((s) => s.addRequest);
    const addNotification = useNotificationStore((s) => s.addNotification);

    const [form, setForm] = useState({ name: "", email: "", company: "", message: "" });
    const [submitted, setSubmitted] = useState(false);
    const [nameError, setNameError] = useState("");

    if (user) {
        navigate("/dashboard", { replace: true });
        return null;
    }

    function set(field, value) {
        setForm((f) => ({ ...f, [field]: value }));
    }

    function handleSubmit(e) {
        e.preventDefault();
        if (!form.name.trim()) {
            setNameError("Full name is required.");
            return;
        }
        setNameError("");

        addRequest({ ...form, name: form.name.trim() });

        // Notify all admin users
        const allUsers = JSON.parse(localStorage.getItem("goalboard_users") ?? "[]");
        const admins = allUsers.filter((u) => u.role === "admin" || !u.role);
        for (const admin of admins) {
            addNotification({
                userId: admin.id,
                type: "demo_request",
                message: `New demo request from ${form.name} (${form.email})${form.company ? ` at ${form.company}` : ""}`,
                boardName: "",
            });
        }

        setSubmitted(true);
    }

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
                <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2.5">
                        <img src="/logo.png" width={24} height={24} alt="Logo" />
                        <span className="font-bold text-base tracking-tight">Goal Board</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link to="/register" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                            Or get started free →
                        </Link>
                    </div>
                </div>
            </header>

            <main className="flex-1 flex items-center justify-center py-16 px-4 sm:px-6">
                <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    {/* Left — value prop */}
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 border border-cyan-100 px-4 py-1.5 text-sm font-medium text-cyan-600">
                                <MessageSquare className="h-3.5 w-3.5" /> Talk to our team
                            </div>
                            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 leading-[1.1]">
                                See Goal Board
                                <br />
                                <span className="text-transparent bg-clip-text bg-linear-to-r from-cyan-500 to-indigo-500">in action.</span>
                            </h1>
                            <p className="text-lg text-slate-600 leading-relaxed max-w-lg">
                                Get a personalized walkthrough of Goal Board. We'll show you how teams use it to ship 2x faster and keep everyone aligned.
                            </p>
                        </div>

                        <div className="space-y-4">
                            {features.map((f) => (
                                <div key={f.title} className="flex items-start gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-cyan-50 border border-cyan-100 flex items-center justify-center shrink-0 mt-0.5">
                                        <f.icon className="h-4 w-4 text-cyan-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">{f.title}</p>
                                        <p className="text-sm text-slate-500">{f.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <blockquote className="border-l-2 border-indigo-200 pl-4 py-2">
                            <p className="text-sm text-slate-600 italic leading-relaxed">
                                "Goal Board replaced three tools for us. Our team went from chaos to clarity in the first week."
                            </p>
                            <p className="text-xs text-slate-400 mt-2 font-medium">— Engineering Lead, Startup</p>
                        </blockquote>
                    </div>

                    {/* Right — form */}
                    <div className="w-full max-w-md mx-auto lg:mx-0">
                        <div className="rounded-2xl border border-border bg-white shadow-2xl shadow-slate-200/50 p-8">
                            {submitted ? (
                                <div className="flex flex-col items-center text-center py-12 space-y-4">
                                    <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                                        <CheckCircle2 className="h-7 w-7 text-emerald-500" />
                                    </div>
                                    <h2 className="text-xl font-bold text-slate-900">Request received!</h2>
                                    <p className="text-sm text-slate-500 max-w-xs">
                                        We'll reach out within 24 hours to schedule your personalized demo. In the meantime, you can get started for free.
                                    </p>
                                    <Button className="mt-4" onClick={() => navigate(`/register`)}>
                                        Get started free <ArrowRight className="size-4" />
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <div className="text-center mb-6">
                                        <h2 className="text-xl font-bold text-slate-900">Request a demo</h2>
                                        <p className="text-sm text-slate-500 mt-1">We'll get back to you within 24 hours</p>
                                    </div>

                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-medium mb-1.5 text-slate-600">Full name</label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                                                <Input
                                                    value={form.name}
                                                    onChange={(e) => {
                                                        set("name", stripEmoji(e.target.value));
                                                        if (nameError) setNameError("");
                                                    }}
                                                    placeholder="Jane Smith"
                                                    className={`pl-9${nameError ? " border-red-400 focus-visible:ring-red-400" : ""}`}
                                                    autoFocus
                                                />
                                                {nameError && <p className="mt-1 text-xs text-red-500">{nameError}</p>}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium mb-1.5 text-slate-600">Work email</label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                <Input
                                                    type="email"
                                                    value={form.email}
                                                    onChange={(e) => set("email", e.target.value)}
                                                    placeholder="jane@company.com"
                                                    className="pl-9"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium mb-1.5 text-slate-600">Company</label>
                                            <div className="relative">
                                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                <Input
                                                    value={form.company}
                                                    onChange={(e) => set("company", e.target.value)}
                                                    placeholder="Google LLC"
                                                    className="pl-9"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium mb-1.5 text-slate-600">
                                                What are you looking to solve? <span className="text-slate-400">(optional)</span>
                                            </label>
                                            <Textarea
                                                value={form.message}
                                                onChange={(e) => set("message", e.target.value)}
                                                placeholder="Tell us about your team and workflow..."
                                                rows={3}
                                            />
                                        </div>

                                        <Button type="submit" className="w-full mt-2 h-11 text-sm">
                                            <span className="flex items-center gap-2">
                                                <Send className="h-4 w-4" /> Request a demo
                                            </span>
                                        </Button>
                                    </form>

                                    <p className="mt-5 text-center text-xs text-slate-400">
                                        Or{" "}
                                        <Link to="/register" className="font-medium text-indigo-500 hover:underline">
                                            get started free
                                        </Link>{" "}
                                        — no demo needed.
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
