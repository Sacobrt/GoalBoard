import { BookOpen, MessageCircle, FileText, ExternalLink } from "lucide-react";
import { StaticPageLayout } from "../components/StaticPageLayout";
import { useEffect } from "react";

const articles = [
    { title: "Getting started with Goal Board", desc: "Learn how to create your first board, add tasks, and invite team members.", icon: BookOpen },
    { title: "Managing columns and workflows", desc: "Customize your board columns to match your team's unique process.", icon: FileText },
    { title: "Using drag-and-drop", desc: "Move tasks between columns with a natural drag-and-drop experience.", icon: FileText },
    { title: "Setting due dates and priorities", desc: "Keep your team on track with deadlines and priority labels on every card.", icon: FileText },
    { title: "Role-based access control", desc: "Understand how to assign roles and manage permissions across your workspace.", icon: FileText },
    { title: "Board settings and customization", desc: "Rename boards, change backgrounds, and configure board-level preferences.", icon: FileText },
];

const faqs = [
    { q: "Is Goal Board really free?", a: "Yes — Goal Board is free forever for individuals. No credit card required, no trial limits." },
    { q: "Can I invite my team?", a: "Absolutely. Invite team members by email and assign them roles with specific permissions." },
    { q: "How do I reset my password?", a: "Go to Settings > Account and use the password reset option. You'll receive a confirmation email." },
    { q: "Is my data secure?", a: "Your data is stored securely with role-based access controls. See our Security page for more details." },
];

export function HelpCenterPage() {
    useEffect(() => {
        document.title = "Help Center — Goal Board";
    }, []);

    return (
        <StaticPageLayout>
            <div className="space-y-16">
                {/* Hero */}
                <div className="text-center">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-6">
                        <BookOpen className="h-7 w-7 text-indigo-500" />
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 mb-4">Help Center</h1>
                    <p className="text-lg text-slate-500 max-w-xl mx-auto">
                        Everything you need to get the most out of Goal Board. Browse articles or check the FAQs below.
                    </p>
                </div>

                {/* Articles */}
                <div>
                    <h2 className="text-xl font-bold text-slate-900 mb-6">Popular articles</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {articles.map((a) => (
                            <div key={a.title} className="p-5 rounded-xl border border-border bg-white hover:shadow-md transition-shadow cursor-default">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                                        <a.icon className="h-4 w-4 text-slate-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900 text-sm mb-1">{a.title}</h3>
                                        <p className="text-sm text-slate-500 leading-relaxed">{a.desc}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* FAQs */}
                <div>
                    <h2 className="text-xl font-bold text-slate-900 mb-6">Frequently asked questions</h2>
                    <div className="space-y-4">
                        {faqs.map((faq) => (
                            <div key={faq.q} className="p-5 rounded-xl border border-border bg-white">
                                <h3 className="font-semibold text-slate-900 mb-2">{faq.q}</h3>
                                <p className="text-sm text-slate-600 leading-relaxed">{faq.a}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Contact */}
                <div className="text-center p-8 rounded-2xl bg-slate-50 border border-border">
                    <MessageCircle className="h-6 w-6 text-indigo-500 mx-auto mb-3" />
                    <h3 className="font-bold text-slate-900 mb-2">Still need help?</h3>
                    <p className="text-sm text-slate-500">
                        Reach out to our team at <span className="font-medium text-indigo-600">support@example.com</span> and we'll get back to you within 24 hours.
                    </p>
                </div>
            </div>
        </StaticPageLayout>
    );
}
