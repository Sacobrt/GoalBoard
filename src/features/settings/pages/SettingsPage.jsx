import { useState } from "react";
import { useAuthStore } from "../../auth/store/authStore";
import { PageHeader } from "../../../components/patterns/PageHeader";
import { AvatarUploader } from "../../../shared/components/AvatarUploader";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { Button } from "../../../components/ui/button";
import { Check, User, Mail, Globe, MapPin, Building2, Briefcase, GraduationCap } from "lucide-react";
import { ROLE_LABELS } from "../../../shared/auth/roles";

export function SettingsPage() {
    const user = useAuthStore((s) => s.user);
    const updateProfile = useAuthStore((s) => s.updateProfile);

    const [username, setUsername] = useState(user?.username ?? "");
    const [fullName, setFullName] = useState(user?.fullName ?? "");
    const [bio, setBio] = useState(user?.bio ?? "");
    const [website, setWebsite] = useState(user?.website ?? "");
    const [location, setLocation] = useState(user?.location ?? "");
    const [organization, setOrganization] = useState(user?.organization ?? "");
    const [jobTitle, setJobTitle] = useState(user?.jobTitle ?? "");
    const [education, setEducation] = useState(user?.education ?? "");

    const [saved, setSaved] = useState(false);
    const [usernameError, setUsernameError] = useState("");
    const [, forceRender] = useState(0);

    function handleAvatarChange() {
        forceRender((n) => n + 1);
    }

    function handleSave(e) {
        e.preventDefault();
        setUsernameError("");

        const trimmedUsername = username.trim();
        if (!trimmedUsername) return;

        // Check if username changed and is taken
        if (trimmedUsername !== user?.username) {
            const users = JSON.parse(localStorage.getItem("goalboard_users") ?? "[]");
            const taken = users.find((u) => u.id !== user.id && u.username.toLowerCase() === trimmedUsername.toLowerCase());
            if (taken) {
                setUsernameError("That username is already taken.");
                return;
            }
        }

        updateProfile({
            username: trimmedUsername,
            fullName: fullName.trim(),
            bio: bio.trim(),
            website: website.trim(),
            location: location.trim(),
            organization: organization.trim(),
            jobTitle: jobTitle.trim(),
            education: education.trim(),
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

            <form onSubmit={handleSave}>
                {/* Two-column layout for Account Info + Personal Details */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Account Information */}
                    <div className="rounded-xl border border-border p-6 bg-card">
                        <h2 className="font-semibold text-sm text-foreground mb-5">Account Information</h2>
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="block text-xs font-medium text-muted-foreground">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="pl-9"
                                        placeholder="John Doe"
                                        autoComplete="name"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-medium text-muted-foreground">Username</label>
                                <Input
                                    value={username}
                                    onChange={(e) => {
                                        setUsername(e.target.value);
                                        setUsernameError("");
                                    }}
                                    placeholder="your_username"
                                    autoComplete="username"
                                />
                                {usernameError && <p className="text-xs text-red-500">{usernameError}</p>}
                            </div>

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

                            <div className="space-y-1.5">
                                <label className="block text-xs font-medium text-muted-foreground">Bio</label>
                                <Textarea
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    placeholder="Tell us a little about yourself..."
                                    maxLength={300}
                                    className="min-h-20 resize-none"
                                />
                                <p className="text-[10px] text-muted-foreground text-right">{bio.length}/300</p>
                            </div>

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
                            <div className="space-y-1.5">
                                <label className="block text-xs font-medium text-muted-foreground">Website URL</label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        value={website}
                                        onChange={(e) => setWebsite(e.target.value)}
                                        className="pl-9"
                                        placeholder="https://yoursite.com"
                                        type="url"
                                        autoComplete="url"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-medium text-muted-foreground">Location</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input value={location} onChange={(e) => setLocation(e.target.value)} className="pl-9" placeholder="Osijek, Croatia" />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-medium text-muted-foreground">Organization</label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input value={organization} onChange={(e) => setOrganization(e.target.value)} className="pl-9" placeholder="Google LLC" />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-medium text-muted-foreground">Job Title</label>
                                <div className="relative">
                                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className="pl-9" placeholder="Software Engineer" />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-medium text-muted-foreground">Education</label>
                                <div className="relative">
                                    <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input value={education} onChange={(e) => setEducation(e.target.value)} className="pl-9" placeholder="MIT — Computer Science" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex items-center gap-3">
                    <Button type="submit" disabled={!username.trim()}>
                        <Check className="h-4 w-4" />
                        {saved ? "Saved!" : "Save Changes"}
                    </Button>
                    {saved && <span className="text-sm text-green-500 animate-fade-in">Profile updated successfully</span>}
                </div>
            </form>
        </div>
    );
}
