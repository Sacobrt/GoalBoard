import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";

export function LoginPage() {
    const login = useAuthStore((s) => s.login);
    const user = useAuthStore((s) => s.user);
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // Redirect if already logged in
    if (user) {
        navigate("/dashboard", { replace: true });
        return null;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setLoading(true);
        const result = await login(email, password);
        setLoading(false);
        if (!result.ok) {
            setError(result.error);
        } else {
            navigate("/dashboard", { replace: true });
        }
    }

    return (
        <div className="auth-grid-bg min-h-screen flex items-center justify-center px-4">
            {/* Radial glow */}
            <div className="pointer-events-none fixed inset-0 flex items-center justify-center">
                <div className="h-150 w-150 rounded-full opacity-[0.06]" style={{ background: "radial-gradient(circle, #6366f1, transparent 70%)" }} />
            </div>

            <div className="animate-scale-in relative w-full max-w-md">
                {/* Card */}
                <div className="rounded-2xl border border-border bg-card/90 backdrop-blur-xl p-8 shadow-2xl">
                    {/* Logo */}
                    <div className="flex flex-col items-center mb-8">
                        <img src="/logo.png" width={24} height={24} alt="Logo" />
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome back</h1>
                        <p className="text-sm mt-1 text-muted-foreground">Sign in to your Goal Board account</p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="animate-slide-up flex items-center gap-2.5 rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 mb-5 text-sm text-red-400">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium mb-1.5 text-muted-foreground">Email address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="pl-9"
                                    required
                                    autoComplete="email"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium mb-1.5 text-muted-foreground">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="pl-9 pr-10"
                                    required
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded transition-colors text-muted-foreground"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <Button type="submit" className="w-full mt-2" disabled={loading}>
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Signing in...
                                </span>
                            ) : (
                                "Sign in"
                            )}
                        </Button>
                    </form>

                    <p className="mt-6 text-center text-sm text-muted-foreground">
                        Don't have an account?{" "}
                        <Link to="/register" className="font-medium hover:underline text-primary">
                            Create one
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
