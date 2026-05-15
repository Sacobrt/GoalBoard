import { FileText } from "lucide-react";
import { StaticPageLayout } from "../components/StaticPageLayout";
import { useEffect } from "react";

export function TermsPage() {
    useEffect(() => {
        document.title = "Terms of Service — Goal Board";
    }, []);

    return (
        <StaticPageLayout>
            <div className="space-y-16">
                {/* Hero */}
                <div className="text-center">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-6">
                        <FileText className="h-7 w-7 text-indigo-500" />
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 mb-4">Terms & Privacy</h1>
                    <p className="text-lg text-slate-500 max-w-xl mx-auto">Last updated: April 12, 2026</p>
                </div>

                {/* Terms of Service */}
                <div className="p-8 rounded-2xl bg-white border border-border text-left">
                    <h2 className="text-xl font-bold text-slate-900 mb-6">Terms of Service</h2>
                    <div className="space-y-6 text-sm text-slate-600 leading-relaxed">
                        <section>
                            <h3 className="font-semibold text-slate-900 mb-2">1. Acceptance of Terms</h3>
                            <p>
                                By accessing or using Goal Board, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not
                                use the service.
                            </p>
                        </section>
                        <section>
                            <h3 className="font-semibold text-slate-900 mb-2">2. Description of Service</h3>
                            <p>
                                Goal Board provides a web-based Kanban project management tool. The service includes board creation, task management, team
                                collaboration, and related features. The free tier is available to all users with no time limit.
                            </p>
                        </section>
                        <section>
                            <h3 className="font-semibold text-slate-900 mb-2">3. User Accounts</h3>
                            <p>
                                You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. You
                                must provide accurate and complete information when creating an account.
                            </p>
                        </section>
                        <section>
                            <h3 className="font-semibold text-slate-900 mb-2">4. Acceptable Use</h3>
                            <p>
                                You agree not to use Goal Board for any unlawful purpose or in violation of any applicable laws. You may not attempt to gain
                                unauthorized access to any part of the service, other accounts, or computer systems.
                            </p>
                        </section>
                        <section>
                            <h3 className="font-semibold text-slate-900 mb-2">5. Content Ownership</h3>
                            <p>
                                You retain ownership of all content you create within Goal Board. We do not claim any intellectual property rights over your
                                workspace data, boards, or tasks.
                            </p>
                        </section>
                        <section>
                            <h3 className="font-semibold text-slate-900 mb-2">6. Termination</h3>
                            <p>
                                We may suspend or terminate your access to Goal Board at any time for violations of these terms. You may delete your account at any
                                time through the Settings page.
                            </p>
                        </section>
                    </div>
                </div>

                {/* Privacy Policy */}
                <div className="p-8 rounded-2xl bg-white border border-border text-left">
                    <h2 className="text-xl font-bold text-slate-900 mb-6">Privacy Policy</h2>
                    <div className="space-y-6 text-sm text-slate-600 leading-relaxed">
                        <section>
                            <h3 className="font-semibold text-slate-900 mb-2">Information We Collect</h3>
                            <p>
                                We collect only the information necessary to provide the service: your username, email address, and the content you create within
                                your workspace (boards, tasks, and settings).
                            </p>
                        </section>
                        <section>
                            <h3 className="font-semibold text-slate-900 mb-2">How We Use Your Information</h3>
                            <p>
                                Your information is used solely to provide and improve the Goal Board service. We do not sell, rent, or share your personal data
                                with third parties for marketing purposes.
                            </p>
                        </section>
                        <section>
                            <h3 className="font-semibold text-slate-900 mb-2">Data Storage & Security</h3>
                            <p>
                                Your data is stored securely with encryption at rest and in transit. Passwords are hashed using bcrypt and are never stored in plain
                                text. See our Security page for more details.
                            </p>
                        </section>
                        <section>
                            <h3 className="font-semibold text-slate-900 mb-2">Cookies</h3>
                            <p>
                                Goal Board uses essential cookies only for authentication and session management. We do not use tracking cookies or third-party
                                analytics.
                            </p>
                        </section>
                        <section>
                            <h3 className="font-semibold text-slate-900 mb-2">Your Rights</h3>
                            <p>
                                You may access, update, or delete your personal data at any time through the Settings page. You can also request a full export or
                                deletion of your data by contacting us.
                            </p>
                        </section>
                        <section>
                            <h3 className="font-semibold text-slate-900 mb-2">Contact</h3>
                            <p>
                                For questions about these terms or our privacy practices, contact us at{" "}
                                <span className="font-medium text-indigo-600">privacy@example.com</span>.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </StaticPageLayout>
    );
}
