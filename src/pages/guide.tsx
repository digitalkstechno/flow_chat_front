import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
    BookOpen,
    ArrowLeft,
    MessageSquare,
    LayoutTemplate,
    Send,
    Zap,
    UserCheck,
    ChevronRight,
    X,
    CheckCircle,
    Info,
    Maximize2,
    Settings,
    ArrowUpRight
} from 'lucide-react';

export default function UserGuide() {
    const router = useRouter();
    const [activeSection, setActiveSection] = useState('getting-started');
    const [activeScreenshot, setActiveScreenshot] = useState<string | null>(null);

    const sections = [
        { id: 'getting-started', label: 'Getting Started', icon: BookOpen },
        { id: 'chat-panel', label: '1. Chats & Live Messaging', icon: MessageSquare },
        { id: 'templates', label: '2. WhatsApp Templates', icon: LayoutTemplate },
        { id: 'campaigns-reminders', label: '3. Campaigns & Reminders', icon: Send },
        { id: 'keyword-rules', label: '4. Auto-Reply Rules', icon: Zap },
        { id: 'staff-management', label: 'Staff Configuration', icon: UserCheck },
    ];

    useEffect(() => {
        const sectionIds = sections.map(s => s.id);
        const observerOptions = {
            root: null,
            rootMargin: '-20% 0px -60% 0px',
            threshold: 0
        };

        const observerCallback = (entries: IntersectionObserverEntry[]) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setActiveSection(entry.target.id);
                }
            });
        };

        const observer = new IntersectionObserver(observerCallback, observerOptions);
        sectionIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, []);

    const scrollToSection = (id: string) => {
        setActiveSection(id);
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    // Helper component for zoomable screenshots (Apple Spec: borderless, 28px corners, no shadows)
    const Screenshot = ({ src, alt, caption }: { src: string; alt: string; caption: string }) => (
        <div className="space-y-3 mt-4 mb-6">
            <div
                onClick={() => setActiveScreenshot(src)}
                className="group relative border border-slate-100 dark:border-zinc-800/80 rounded-[28px] overflow-hidden bg-slate-50 dark:bg-zinc-900 cursor-zoom-in transition-all duration-300 hover:border-[#00a884] dark:hover:border-[#00a884]"
            >
                <div className="absolute inset-0 bg-neutral-950/0 group-hover:bg-neutral-950/20 transition-colors duration-300 flex items-center justify-center z-10">
                    <span className="bg-[#00a884] text-white font-semibold text-xs px-4 py-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 shadow-lg flex items-center gap-1.5 backdrop-blur-sm">
                        <Maximize2 size={12} /> View Full Screen
                    </span>
                </div>
                <img
                    src={src}
                    alt={alt}
                    className="w-full object-cover transition-transform duration-500 group-hover:scale-[1.005] rounded-[28px]"
                />
            </div>
            <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium px-2 flex items-center gap-1.5">
                <Info size={11} className="text-[#00a884] shrink-0" />
                <span>{caption}</span>
            </p>
        </div>
    );

    return (
        <div className="min-h-screen bg-white dark:bg-[#0b0b14] text-slate-900 dark:text-zinc-150 transition-colors duration-300 font-sans selection:bg-[#00a884]/20">
            <Head>
                <title>WA Flow User Manual — WhatsApp Automation</title>
                <meta name="description" content="Step-by-step user guide for operating the WA Flow WhatsApp Automation platform, configuring templates, keyword rules, and scheduling campaigns." />
            </Head>

            {/* Header navbar (Apple Spec: Sticky, 48px height, frosted wash, no border) */}
            <header className="sticky top-0 z-45 w-full bg-white/80 dark:bg-[#0b0b14]/80 backdrop-blur-md border-b border-slate-100 dark:border-zinc-900/60 px-6 md:px-8 py-3.5 flex items-center justify-between">
                <button
                    onClick={() => router.push('/')}
                    className="flex items-center gap-1.5 text-slate-550 hover:text-[#00a884] dark:text-zinc-400 dark:hover:text-[#00a884] text-xs font-semibold transition-colors group"
                >
                    <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                    Back to Home
                </button>
                
                <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => router.push('/')}>
                    <img src="/logo.png" alt="WA Flow Logo" className="h-7 w-auto object-contain dark:invert" />
                    <span className="font-bold tracking-tight text-sm text-slate-900 dark:text-white border-l border-slate-200 dark:border-zinc-800 pl-2.5">
                        Guide
                    </span>
                </div>
                <button
                    onClick={() => router.push('/digitalks/whatsapp/chats')}
                    className="flex items-center gap-1 text-[11px] font-bold text-white bg-[#00a884] hover:opacity-90 rounded-full px-3 py-1.5 transition-all shadow-sm"
                >
                    Chats Console <ArrowUpRight size={12} />
                </button>
            </header>

            {/* Main Content Body */}
            <div className="max-w-6xl mx-auto px-6 py-14 grid grid-cols-1 lg:grid-cols-4 gap-12">
                {/* Navigation Sidebar */}
                <aside className="lg:col-span-1 sticky top-24 self-start">
                    <div className="space-y-1">
                        <h3 className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest px-3 mb-3">
                            Operator Manual
                        </h3>
                        {sections.map((sec) => {
                          const Icon = sec.icon;
                          const isActive = activeSection === sec.id;
                          return (
                            <button
                              key={sec.id}
                              onClick={() => scrollToSection(sec.id)}
                              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-xs font-semibold transition-all text-left ${
                                isActive
                                  ? 'bg-[#f4fbf3] dark:bg-[#00a884]/10 text-[#00a884] font-bold'
                                  : 'text-slate-550 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-900/40 hover:text-[#00a884] dark:hover:text-[#00a884]'
                              }`}
                            >
                              <Icon size={14} className={isActive ? 'text-[#00a884]' : 'text-slate-400 dark:text-zinc-500'} />
                              <span>{sec.label}</span>
                            </button>
                          );
                        })}
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="lg:col-span-3 space-y-20">
                    {/* Hero Header */}
                    <div className="space-y-4">
                        <span className="text-[10px] font-bold text-[#00a884] dark:text-[#00a884] uppercase tracking-widest bg-[#f4fbf3] dark:bg-[#00a884]/10 px-3 py-1.5 rounded-full">
                            Official Guide
                        </span>
                        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                            WA Flow Operator Manual
                        </h1>
                        <p className="text-slate-550 dark:text-zinc-400 text-sm max-w-2xl leading-relaxed">
                            Welcome to the WA Flow operator manual. This guide takes you step-by-step through configuring and using your WhatsApp Business console. Learn to monitor chats, submit templates, trigger broadcasts, configure auto-reply matrices, and manage team members.
                        </p>
                    </div>

                    {/* Section: Getting Started */}
                    <section id="getting-started" className="space-y-6 scroll-mt-20">
                        <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-zinc-800 pb-3">
                            <BookOpen className="text-[#00a884] w-5 h-5 shrink-0" />
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Getting Started &amp; Authentication</h2>
                        </div>
                        <div className="space-y-5 text-slate-650 dark:text-zinc-400 leading-relaxed text-xs sm:text-sm">
                            <p>
                                To login to your tenant workspace dashboard, navigate to your workspace URL (e.g. <code>/digitalks/login</code>) and enter your staff credentials. Ensure your system administrator has granted you the necessary role permissions.
                            </p>
                            
                            <Screenshot 
                                src="/images/guide/login.png" 
                                alt="WA Flow Login Interface Screenshot" 
                                caption="Figure 1.1: Workspace login page. Type your registered email address and password."
                            />

                            <div className="bg-[#f4fbf3] dark:bg-[#00a884]/5 p-6 rounded-[28px] space-y-2">
                                <h4 className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm flex items-center gap-1.5">
                                    <Settings className="w-4 h-4 text-[#00a884]" /> 1.1 First-Time API Setup
                                </h4>
                                <p className="text-xs leading-relaxed text-slate-550 dark:text-zinc-400">
                                    If this is a new workspace, log in and immediately navigate to <strong>API Settings</strong>. You must configure your CRM API Gateway Credentials, domain endpoints, and security access tokens to connect WA Flow to your database slots.
                                </p>
                            </div>

                            <Screenshot 
                                src="/images/guide/settings.png" 
                                alt="API Settings Console Screenshot" 
                                caption="Figure 1.2: API configuration page. Save your CRM domain and access token parameters here."
                            />
                        </div>
                    </section>

                    {/* Section: Chat Panel */}
                    <section id="chat-panel" className="space-y-6 scroll-mt-20">
                        <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-zinc-800 pb-3">
                            <MessageSquare className="text-[#00a884] w-5 h-5 shrink-0" />
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">1. Chats &amp; Live Messaging</h2>
                        </div>
                        <div className="space-y-5 text-slate-650 dark:text-zinc-400 leading-relaxed text-xs sm:text-sm">
                            <p>
                                The Chats panel links operators directly to incoming WhatsApp messages. Review customer lists, inspect read/unread counts, check verification parameters, and send media attachments or quick responses.
                            </p>
                            
                            <Screenshot 
                                src="/images/guide/chats.png" 
                                alt="Chats Panel Workspace Screenshot" 
                                caption="Figure 2.1: Chats Interface. Features multi-contact listings, active message timelines, and status ticks."
                            />

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
                                <div className="bg-[#f4fbf3] dark:bg-zinc-900/50 p-5 rounded-[28px]">
                                    <strong className="text-slate-900 dark:text-white text-xs block mb-1">Session Limit Timer</strong>
                                    <span className="text-[11px] text-slate-450 dark:text-zinc-550 leading-relaxed block">Meta guidelines restrict outgoing free replies to 24 hours from the last incoming message. The timer indicator displays the remaining hours.</span>
                                </div>
                                <div className="bg-[#f4fbf3] dark:bg-zinc-900/50 p-5 rounded-[28px]">
                                    <strong className="text-slate-900 dark:text-white text-xs block mb-1">Keyboard Shortcuts</strong>
                                    <span className="text-[11px] text-slate-450 dark:text-zinc-550 leading-relaxed block">Press <strong>Escape</strong> to clear the active conversation view or exit fullscreen. Press <strong>/</strong> to focus search input. Press <strong>Alt + C</strong> to toggle full-width panel.</span>
                                </div>
                                <div className="bg-[#f4fbf3] dark:bg-zinc-900/50 p-5 rounded-[28px]">
                                    <strong className="text-slate-900 dark:text-white text-xs block mb-1">Attachments &amp; Templates</strong>
                                    <span className="text-[11px] text-slate-450 dark:text-zinc-550 leading-relaxed block">Send PDFs, audio logs, or template structures using the action buttons placed inside the message writebar.</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section: Templates */}
                    <section id="templates" className="space-y-6 scroll-mt-20">
                        <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-zinc-800 pb-3">
                            <LayoutTemplate className="text-[#00a884] w-5 h-5 shrink-0" />
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">2. WhatsApp Templates</h2>
                        </div>
                        <div className="space-y-5 text-slate-650 dark:text-zinc-400 leading-relaxed text-xs sm:text-sm">
                            <p>
                                WhatsApp WABA message templates are registered and approved via Meta before they can be sent outside the active 24-hour window. View, monitor, and submit new templates directly from the Templates tab.
                            </p>

                            <Screenshot 
                                src="/images/guide/templates.png" 
                                alt="WhatsApp Message Templates Panel Screenshot" 
                                caption="Figure 3.1: Message templates dashboard. Verify status (PENDING, APPROVED, REJECTED) and create new templates."
                            />
                        </div>
                    </section>

                    {/* Section: Campaigns */}
                    <section id="campaigns-reminders" className="space-y-6 scroll-mt-20">
                        <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-zinc-800 pb-3">
                            <Send className="text-[#00a884] w-5 h-5 shrink-0" />
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">3. Campaigns &amp; Reminders</h2>
                        </div>
                        <div className="space-y-5 text-slate-650 dark:text-zinc-400 leading-relaxed text-xs sm:text-sm">
                            <p>
                                Trigger manual template broadcasts or queue reminder alerts for multiple clients. Broadcast campaigns are perfect for delivering system notifications, payment alerts, and document copies.
                            </p>
                            <div className="border border-slate-100 dark:border-zinc-800/80 rounded-[28px] p-6 space-y-3">
                                <h4 className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm">To Send a Reminder Notification:</h4>
                                <ol className="list-decimal pl-5 space-y-2 text-xs text-slate-550 dark:text-zinc-400">
                                    <li>Navigate to <strong>Send Reminder</strong> in the sidebar.</li>
                                    <li>Select target customer accounts.</li>
                                    <li>Choose an approved Meta template structure.</li>
                                    <li>Populate variable parameters (e.g. customer name, invoice amount).</li>
                                    <li>Click <strong>Send Notification</strong> to trigger dispatch immediately.</li>
                                </ol>
                            </div>
                        </div>
                    </section>

                    {/* Section: Keyword Rules */}
                    <section id="keyword-rules" className="space-y-6 scroll-mt-20">
                        <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-zinc-800 pb-3">
                            <Zap className="text-[#00a884] w-5 h-5 shrink-0" />
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">4. Auto-Reply Keyword Rules</h2>
                        </div>
                        <div className="space-y-5 text-slate-650 dark:text-zinc-400 leading-relaxed text-xs sm:text-sm">
                            <p>
                                Configure keywords (such as <code>invoice</code>, <code>recibo</code>, <code>catalogo</code>) that automatically match incoming customer texts. Auto-replies verify the user number and deliver pre-mapped files instantly without operator intervention.
                            </p>

                            <Screenshot 
                                src="/images/guide/keyword-rules.png" 
                                alt="Keyword Rules Configuration Panel Screenshot" 
                                caption="Figure 5.1: Keyword rules dashboard. Click 'Add New Rule' to link new trigger tags with database slots."
                            />
                        </div>
                    </section>

                    {/* Section: Staff Configuration */}
                    <section id="staff-management" className="space-y-6 scroll-mt-20">
                        <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-zinc-800 pb-3">
                            <UserCheck className="text-[#00a884] w-5 h-5 shrink-0" />
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Staff Configuration &amp; Roles</h2>
                        </div>
                        <div className="space-y-5 text-slate-650 dark:text-zinc-400 leading-relaxed text-xs sm:text-sm">
                            <p>
                                Workspace administrators can create operator logins, audit active logs, and configure access permissions based on corporate roles (Admin, Manager, Staff).
                            </p>

                            <Screenshot 
                                src="/images/guide/staff.png" 
                                alt="Staff Directory Management Panel Screenshot" 
                                caption="Figure 6.1: Staff directory grid. Create workspace roles and change authorization levels."
                            />
                        </div>
                    </section>
                </main>
            </div>

            {/* Lightbox full-screen zoom Modal (Apple Spec: frosted backdrop blur, no border margins) */}
            {activeScreenshot && (
                <div 
                    onClick={() => setActiveScreenshot(null)}
                    className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-black/80 backdrop-blur-md cursor-zoom-out animate-in fade-in duration-200"
                >
                    <button 
                        onClick={() => setActiveScreenshot(null)}
                        className="absolute top-6 right-6 p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-50 cursor-pointer"
                        title="Close zoom"
                    >
                        <X size={20} />
                    </button>
                    <div className="relative max-w-5xl max-h-[85vh] w-full flex items-center justify-center">
                        <img 
                            src={activeScreenshot} 
                            alt="Enlarged screenshot preview" 
                            className="max-w-full max-h-[85vh] rounded-3xl object-contain shadow-2xl border border-white/10"
                            onClick={(e) => e.stopPropagation()} 
                        />
                    </div>
                    <p className="text-white/60 text-xs font-medium mt-4 tracking-wider uppercase">Click anywhere to close full screen</p>
                </div>
            )}
        </div>
    );
}
