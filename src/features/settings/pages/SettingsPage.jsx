import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "../../auth/store/authStore";
import { PageHeader } from "../../../components/patterns/PageHeader";
import { AvatarUploader } from "../../../shared/components/AvatarUploader";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { Button } from "../../../components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "../../../components/ui/form";
import { Check, User, Mail, Globe, MapPin, Building2, Briefcase, GraduationCap } from "lucide-react";
import { ROLE_LABELS } from "../../../shared/auth/roles";
import { profileSchema } from "../schemas/profileSchema";

export function SettingsPage() {
    const user = useAuthStore((s) => s.user);
    const updateProfile = useAuthStore((s) => s.updateProfile);

    const form = useForm({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            username: user?.username ?? "",
            fullName: user?.fullName ?? "",
            bio: user?.bio ?? "",
            website: user?.website ?? "",
            location: user?.location ?? "",
            organization: user?.organization ?? "",
            jobTitle: user?.jobTitle ?? "",
            education: user?.education ?? "",
        },
        mode: "onTouched",
    });

    const [saved, setSaved] = useState(false);
    const [usernameError, setUsernameError] = useState("");
    const [, forceRender] = useState(0);

    const watchedBio = form.watch("bio");

    function handleAvatarChange() {
        forceRender((n) => n + 1);
    }

    function onSubmit(data) {
        setUsernameError("");

        // Check if username changed and is taken
        if (data.username !== user?.username) {
            const users = JSON.parse(localStorage.getItem("goalboard_users") ?? "[]");
            const taken = users.find((u) => u.id !== user.id && u.username.toLowerCase() === data.username.toLowerCase());
            if (taken) {
                form.setError("username", { message: "That username is already taken" });
                return;
            }
        }

        updateProfile({
            username: data.username,
            fullName: data.fullName,
            bio: data.bio,
            website: data.website ?? "",
            location: data.location,
            organization: data.organization,
            jobTitle: data.jobTitle,
            education: data.education,
        });

        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    }

    return (
        <div className="pb-8 animate-fade-in">
            <PageHeader title="Settings" description="Manage your profile and preferences" />

            {/* Profile Photo */}
            <div className="rounded-xl border border-border p-6 mb-6 bg-card max-w-2xl">
                <h2 className="font-semibold text-sm text-foreground mb-5">Profile Photo</h2>
                <AvatarUploader user={user} onAvatarChange={handleAvatarChange} />
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
                    {/* Two-column layout for Account Info + Personal Details */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        {/* Account Information */}
                        <div className="rounded-xl border border-border p-6 bg-card">
                            <h2 className="font-semibold text-sm text-foreground mb-5">Account Information</h2>
                            <div className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="fullName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs text-muted-foreground">Full Name</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    <Input {...field} className="pl-9" placeholder="John Doe" autoComplete="name" />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="username"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs text-muted-foreground">Username</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="your_username"
                                                    autoComplete="username"
                                                    aria-invalid={!!form.formState.errors.username}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="space-y-1.5">
                                    <label className="block text-xs font-medium text-muted-foreground">Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input value={user?.email ?? ""} disabled className="pl-9 opacity-60" />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">Email cannot be changed</p>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-xs font-medium text-muted-foreground">Role</label>
                                    <div className="pt-0.5">
                                        <span
                                            className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full"
                                            style={{
                                                background: user?.role === "admin" ? "rgba(217,119,6,0.1)" : "rgba(99,102,241,0.08)",
                                                color: user?.role === "admin" ? "#d97706" : "#6366f1",
                                            }}
                                        >
                                            {ROLE_LABELS[user?.role] ?? "User"}
                                        </span>
                                    </div>
                                </div>

                                <FormField
                                    control={form.control}
                                    name="bio"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs text-muted-foreground">Bio</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    {...field}
                                                    placeholder="Tell us a little about yourself..."
                                                    maxLength={300}
                                                    className="min-h-20 resize-none"
                                                />
                                            </FormControl>
                                            <div className="flex items-center justify-between">
                                                <FormMessage />
                                                <p className="text-[10px] text-muted-foreground ml-auto">{watchedBio.length}/300</p>
                                            </div>
                                        </FormItem>
                                    )}
                                />

                                <div className="space-y-1.5">
                                    <label className="block text-xs font-medium text-muted-foreground">Member since</label>
                                    <p className="text-sm text-muted-foreground">
                                        {user?.createdAt
                                            ? new Date(user.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
                                            : "—"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Personal Details */}
                        <div className="rounded-xl border border-border p-6 bg-card h-fit">
                            <h2 className="font-semibold text-sm text-foreground mb-5">Personal Details</h2>
                            <div className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="website"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs text-muted-foreground">Website URL</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        {...field}
                                                        className="pl-9"
                                                        placeholder="https://yoursite.com"
                                                        autoComplete="url"
                                                        aria-invalid={!!form.formState.errors.website}
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="location"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs text-muted-foreground">Location</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    <Input {...field} className="pl-9" placeholder="Osijek, Croatia" />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="organization"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs text-muted-foreground">Organization</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    <Input {...field} className="pl-9" placeholder="Google LLC" />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="jobTitle"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs text-muted-foreground">Job Title</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    <Input {...field} className="pl-9" placeholder="Software Engineer" />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="education"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs text-muted-foreground">Education</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    <Input {...field} className="pl-9" placeholder="MIT — Computer Science" />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex items-center gap-3">
                        <Button type="submit">
                            <Check className="h-4 w-4" />
                            {saved ? "Saved!" : "Save Changes"}
                        </Button>
                        {saved && <span className="text-sm text-green-500 animate-fade-in">Profile updated successfully</span>}
                    </div>
                </form>
            </Form>
        </div>
    );
}
