import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, ArrowRight, Zap, Shield, Users, UserCircle } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";

const benefits = [
    { icon: Zap, title: "Instant setup", desc: "Create your first board in under 30 seconds." },
    { icon: Shield, title: "Free forever", desc: "No credit card. No trial limits. Just productivity." },
    { icon: Users, title: "Team ready", desc: "Invite contributors and manage roles from day one." },
];

const stripEmoji = (str) => str.replace(/\p{Extended_Pictographic}/gu, "");

export function GetStartedPage() {
    const register = useAuthStore((s) => s.register);
    const user = useAuthStore((s) => s.user);
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    if (user) {
        navigate("/dashboard", { replace: true });
        return null;
    }

    const passwordStrength = password.length === 0 ? null : password.length < 6 ? "weak" : password.length < 10 ? "fair" : "strong";
    const strengthColor = { weak: "#ef4444", fair: "#f59e0b", strong: "#10b981" };
    const strengthWidth = { weak: "33%", fair: "66%", strong: "100%" };

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        const trimmedUsername = username.trim();
        if (!trimmedUsername || trimmedUsername.length < 2) {
            setError("Username must be at least 2 characters.");
            return;
        }
        if (!/^[a-zA-Z0-9_.-]+$/.test(trimmedUsername)) {
            setError("Username can only contain letters, numbers, underscores, hyphens, and dots.");
            return;
        }
        if (password !== confirm) {
            setError("Passwords do not match.");
            return;
        }
        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }
        setLoading(true);
        const result = await register(trimmedUsername, email.trim(), password, fullName.trim());
        setLoading(false);

        if (!result.ok) {
            setError(result.error);
        } else {
            navigate("/dashboard", { replace: true });
        }
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
                        <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                            Already have an account? Log in
                        </Link>
                    </div>
                </div>
            </header>

            <main className="flex-1 flex items-center justify-center py-16 px-4 sm:px-6">
                <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    {/* Left — value prop */}
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 border border-indigo-100 px-4 py-1.5 text-sm font-medium text-indigo-600">
                                <Zap className="h-3.5 w-3.5" /> Free forever
                            </div>
                            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 leading-[1.1]">
                                Start building your
                                <br />
                                <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-500 to-cyan-500">workspace today.</span>
                            </h1>
                            <p className="text-lg text-slate-600 leading-relaxed max-w-lg">
                                Join thousands of teams who use Goal Board to track projects, manage tasks, and ship faster — all in one beautiful workspace.
                            </p>
                        </div>

                        <div className="space-y-4">
                            {benefits.map((b) => (
                                <div key={b.title} className="flex items-start gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
                                        <b.icon className="h-4 w-4 text-indigo-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">{b.title}</p>
                                        <p className="text-sm text-slate-500">{b.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <div className="flex -space-x-2">
                                {[...Array(4)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="w-8 h-8 rounded-full border-2 border-white"
                                        style={{ background: ["#6366f1", "#06b6d4", "#f59e0b", "#10b981"][i] }}
                                    />
                                ))}
                            </div>
                            <p className="text-sm text-slate-500">
                                <span className="font-semibold text-slate-700">2,000+</span> teams already on board
                            </p>
                        </div>
                    </div>

                    {/* Right — signup form */}
                    <div className="w-full max-w-md mx-auto lg:mx-0">
                        <div className="rounded-2xl border border-border bg-white shadow-2xl shadow-slate-200/50 p-8">
                            <div className="text-center mb-6">
                                <h2 className="text-xl font-bold text-slate-900">Create your free account</h2>
                                <p className="text-sm text-slate-500 mt-1">No credit card required</p>
                            </div>

                            {error && (
                                <div className="flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 mb-5 text-sm text-red-600">
                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium mb-1.5 text-slate-600">Username</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input
                                            value={username}
                                            onChange={(e) => setUsername(stripEmoji(e.target.value))}
                                            placeholder="your_name"
                                            className="pl-9"
                                            required
                                            minLength={2}
                                            autoFocus
                                            autoComplete="username"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium mb-1.5 text-slate-600">Full name</label>
                                    <div className="relative">
                                        <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            placeholder="John Doe"
                                            className="pl-9"
                                            autoComplete="name"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium mb-1.5 text-slate-600">Work email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="you@company.com"
                                            className="pl-9"
                                            required
                                            autoComplete="email"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium mb-1.5 text-slate-600">Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="At least 6 characters"
                                            className="pl-9 pr-10"
                                            required
                                            autoComplete="new-password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((v) => !v)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-400"
                                            tabIndex={-1}
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    {passwordStrength && (
                                        <div className="mt-2">
                                            <div className="h-1 w-full rounded-full bg-slate-100 overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-300"
                                                    style={{ width: strengthWidth[passwordStrength], background: strengthColor[passwordStrength] }}
                                                />
                                            </div>
                                            <p className="text-[10px] mt-1 capitalize font-medium" style={{ color: strengthColor[passwordStrength] }}>
                                                {passwordStrength}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-medium mb-1.5 text-slate-600">Confirm password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            value={confirm}
                                            onChange={(e) => setConfirm(e.target.value)}
                                            placeholder="Repeat password"
                                            className="pl-9"
                                            required
                                            autoComplete="new-password"
                                        />
                                    </div>
                                </div>

                                <Button type="submit" className="w-full mt-2 h-11 text-sm" disabled={loading}>
                                    {loading ? (
                                        <span className="flex items-center gap-2">
                                            <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Creating account...
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            Get started free <ArrowRight className="h-4 w-4" />
                                        </span>
                                    )}
                                </Button>
                            </form>

                            <p className="mt-5 text-center text-xs text-slate-400">By signing up, you agree to Goal Board's Terms of Service.</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
