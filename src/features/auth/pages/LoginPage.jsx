import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowLeft } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "../../../components/ui/form";
import { loginSchema } from "../schemas/authSchemas";

export function LoginPage() {
    const login = useAuthStore((s) => s.login);
    const user = useAuthStore((s) => s.user);
    const navigate = useNavigate();

    const [showPassword, setShowPassword] = useState(false);
    const [serverError, setServerError] = useState("");
    const [loading, setLoading] = useState(false);

    const form = useForm({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: "", password: "" },
        mode: "onTouched",
    });

    // Redirect if already logged in
    if (user) {
        navigate("/dashboard", { replace: true });
        return null;
    }

    async function onSubmit(data) {
        setServerError("");
        setLoading(true);
        const result = await login(data.email, data.password);
        setLoading(false);
        if (!result.ok) {
            setServerError(result.error);
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
                <Button variant="outline" size="sm" className="my-4">
                    <ArrowLeft className="size-3.5" />
                    <Link to="/dashboard">Back to Home</Link>
                </Button>

                {/* Card */}
                <div className="rounded-2xl border border-border bg-card/90 backdrop-blur-xl p-8 shadow-2xl">
                    {/* Logo */}
                    <div className="flex flex-col items-center mb-8">
                        <img src="/logo.png" width={24} height={24} alt="Logo" />
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome back</h1>
                        <p className="text-sm mt-1 text-muted-foreground">Sign in to your Goal Board account</p>
                    </div>

                    {/* Error */}
                    {serverError && (
                        <div className="animate-slide-up flex items-center gap-2.5 rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 mb-5 text-sm text-red-400">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            {serverError}
                        </div>
                    )}

                    {/* Test accounts */}
                    <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 mb-4 text-xs text-muted-foreground space-y-1.5">
                        <p className="font-medium text-foreground/70">Test accounts</p>
                        <div className="flex items-center justify-between">
                            <span>
                                <span className="text-foreground/80">Admin:</span> admin@example.com / admin
                            </span>
                            <button
                                type="button"
                                onClick={() => {
                                    form.setValue("email", "admin@example.com");
                                    form.setValue("password", "admin");
                                }}
                                className="text-primary hover:underline"
                            >
                                Fill
                            </button>
                        </div>
                        <div className="flex items-center justify-between">
                            <span>
                                <span className="text-foreground/80">Demo:</span> demo@example.com / demo
                            </span>
                            <button
                                type="button"
                                onClick={() => {
                                    form.setValue("email", "demo@example.com");
                                    form.setValue("password", "demo");
                                }}
                                className="text-primary hover:underline"
                            >
                                Fill
                            </button>
                        </div>
                    </div>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs text-muted-foreground">Email address</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    {...field}
                                                    type="email"
                                                    placeholder="you@example.com"
                                                    className="pl-9"
                                                    autoComplete="email"
                                                    autoFocus
                                                    aria-invalid={!!form.formState.errors.email}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs text-muted-foreground">Password</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    {...field}
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="••••••••"
                                                    className="pl-9 pr-10"
                                                    autoComplete="current-password"
                                                    aria-invalid={!!form.formState.errors.password}
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
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

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
                    </Form>

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
