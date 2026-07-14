import React, { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { LayoutDashboard, Users, Database, DatabaseZap, Settings, LogOut, MessageSquare, LifeBuoy, Send, HelpCircle, LayoutTemplate, Zap } from 'lucide-react';
import { getTenantBySlug } from '../../services/api';
import ThemeToggle from '../ThemeToggle';

interface Props {
    children: ReactNode;
    title?: string;
}

export default function TenantLayout({ children, title = 'Tenant Portal' }: Props) {
    const router = useRouter();
    const { slug } = router.query as { slug: string };

    const [currentUser, setCurrentUser] = useState<any>(null);
    const [tenantName, setTenantName] = useState('');
    const [isAuth, setIsAuth] = useState(false);
    const [daysLeft, setDaysLeft] = useState<number | null>(null);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    useEffect(() => {
        setMobileSidebarOpen(false);
    }, [router.asPath]);

    useEffect(() => {
        if (!slug) return;
        const token = localStorage.getItem(`staff_token_${slug}`);
        if (!token) { router.replace(`/${slug}/login`); return; }
        const user = localStorage.getItem(`staff_user_${slug}`);
        if (user) { try { setCurrentUser(JSON.parse(user)); } catch (e) {} }
        const name = localStorage.getItem(`tenant_name_${slug}`);
        setTenantName(name || slug);
        setIsAuth(true);

        getTenantBySlug(slug)
            .then(res => {
                if (res.success && res.data && res.data.planEndDate) {
                    const expiry = new Date(res.data.planEndDate).getTime();
                    const now = new Date().setHours(0, 0, 0, 0);
                    const diffTime = expiry - now;
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    setDaysLeft(diffDays);
                }
            })
            .catch(err => {
                console.error("Failed to fetch tenant plan details:", err);
            });
    }, [slug, router]);

    const handleLogout = () => {
        if (!slug) return;
        localStorage.removeItem(`staff_token_${slug}`);
        localStorage.removeItem(`staff_user_${slug}`);
        router.push(`/${slug}/login`);
    };

    interface NavItem {
        label: string;
        path: string;
        matchPath: string;
        icon: React.ReactNode;
        allowedRoles?: string[];
    }

    interface NavGroup {
        groupName: string;
        items: NavItem[];
    }

    const navItems: NavGroup[] = [
        {
            groupName: 'WHATSAPP',
            items: [
                {
                    label: 'Chats',
                    path: `/${slug}/whatsapp/chats`,
                    matchPath: '/[slug]/whatsapp/chats',
                    icon: <MessageSquare size={20} />,
                    allowedRoles: ['admin', 'manager', 'staff']
                },
                {
                    label: 'Templates',
                    path: `/${slug}/whatsapp/templates`,
                    matchPath: '/[slug]/whatsapp/templates',
                    icon: <LayoutTemplate size={20} />,
                    allowedRoles: ['admin', 'manager']
                },
                {
                    label: 'Send Reminder',
                    path: `/${slug}/whatsapp/send-reminder`,
                    matchPath: '/[slug]/whatsapp/send-reminder',
                    icon: <Send size={20} />,
                    allowedRoles: ['admin', 'manager']
                },
                {
                    label: 'Keyword Auto-Reply',
                    path: `/${slug}/whatsapp/keyword-rules`,
                    matchPath: '/[slug]/whatsapp/keyword-rules',
                    icon: <Zap size={20} />,
                    allowedRoles: ['admin', 'manager']
                },
                {
                    label: 'API Sandbox',
                    path: `/${slug}/whatsapp/sandbox`,
                    matchPath: '/[slug]/whatsapp/sandbox',
                    icon: <HelpCircle size={20} />,
                    allowedRoles: ['admin', 'manager']
                },
                {
                    label: 'API Settings',
                    path: `/${slug}/whatsapp/settings`,
                    matchPath: '/[slug]/whatsapp/settings',
                    icon: <Settings size={20} />,
                    allowedRoles: ['admin']
                }
            ]
        },
        {
            groupName: 'CLIENTS',
            items: [
                {
                    label: 'Clients',
                    path: `/${slug}/clients`,
                    matchPath: '/[slug]/clients',
                    icon: <Users size={20} />,
                    allowedRoles: ['admin', 'manager']
                }
            ]
        },
        {
            groupName: 'ADMINISTRATION',
            items: [
                {
                    label: 'Staff Management',
                    path: `/${slug}/staff`,
                    matchPath: '/[slug]/staff',
                    icon: <Settings size={20} />,
                    allowedRoles: ['admin']
                }
            ]
        }
    ];

    const getInitials = (name: string) => {
        if (!name) return 'AU';
        const parts = name.trim().split(' ');
        return parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
    };

    if (!slug || !isAuth) {
        return (
            <div className="min-h-screen bg-[#F8F9FB] dark:bg-[#0b0b14] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <span className="animate-spin w-8 h-8 border-[3px] border-blue-200 border-t-blue-600 rounded-full" />
                    <span className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8F9FB] dark:bg-[#0b0b14] font-sans text-foreground" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
            <Head>
                <title>{title} | {tenantName}</title>
            </Head>

            {/* Backdrop overlay for mobile sidebar */}
            {mobileSidebarOpen && (
                <div 
                    onClick={() => setMobileSidebarOpen(false)}
                    className="fixed inset-0 bg-black/45 backdrop-blur-sm z-40 md:hidden animate-fade-in"
                />
            )}

            {/* ── Sidebar ────────────────────────────────────────────────── */}
            <aside className={`fixed left-0 top-0 h-screen bg-white dark:bg-[#0f0f1c] border-r border-slate-100/80 dark:border-zinc-800/80 flex flex-col z-50 shadow-sm transition-transform duration-300 w-[240px] md:translate-x-0 ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                {/* Logo */}
                <div className="px-6 py-5 flex items-center justify-start border-b border-slate-50 dark:border-zinc-800/40">
                    <img src="/logo.png" alt="WA Flow Logo" className="h-8 w-auto object-contain dark:invert shrink-0" />
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
                    {navItems.filter(group => {
                        const visibleItems = group.items.filter(item => {
                            if (item.allowedRoles) {
                                return item.allowedRoles.includes(currentUser?.role || 'staff');
                            }
                            return true;
                        });
                        return visibleItems.length > 0;
                    }).map((group) => (
                        <div key={group.groupName} className="space-y-0.5">
                            <p className="px-3 py-1 text-[9px] uppercase tracking-[0.18em] text-slate-400 dark:text-zinc-500 font-black mb-1">
                                {group.groupName}
                            </p>
                            {group.items.filter(item => {
                                 if (item.allowedRoles) {
                                     return item.allowedRoles.includes(currentUser?.role || 'staff');
                                 }
                                 return true;
                             }).map((item) => {
                                const isActive = item.path.includes('?')
                                    ? router.asPath === item.path
                                    : (router.pathname === item.matchPath || (item.matchPath !== '/[slug]/dashboard' && router.pathname.startsWith(item.matchPath)))
                                      && !router.asPath.includes('tab=');

                                return (
                                    <button
                                        key={item.label}
                                        onClick={() => router.push(item.path)}
                                        className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-all duration-300 group relative overflow-hidden text-sm font-semibold ${
                                            isActive
                                                ? 'bg-blue-600/5 text-blue-600 dark:bg-blue-650/10 shadow-sm'
                                                : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/50 hover:text-slate-900 dark:hover:text-white'
                                        }`}
                                    >
                                        <span className={`shrink-0 transition-all duration-300 ${
                                            isActive
                                                ? 'text-blue-600 scale-110'
                                                : 'text-slate-400 dark:text-zinc-500 group-hover:text-slate-900 dark:group-hover:text-white group-hover:scale-110'
                                        }`}>
                                            {item.icon}
                                        </span>
                                        <span className={`text-left leading-tight transition-transform duration-300 ${
                                            isActive ? 'translate-x-1' : 'group-hover:translate-x-1'
                                        }`}>
                                            {item.label}
                                        </span>
                                        {isActive && (
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-blue-600 rounded-r-full animate-in fade-in duration-300" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </nav>

                {/* Plan Expiry Notice */}
                {daysLeft !== null && daysLeft <= 15 && (
                    <div className={`mx-3 mb-4 p-3.5 rounded-xl border-y border-r border-slate-100 dark:border-zinc-800/80 bg-gradient-to-r shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                        daysLeft <= 0 
                            ? 'border-l-4 border-l-rose-500 from-rose-500/5 to-rose-500/[0.01] dark:from-rose-950/15 dark:to-rose-950/5'
                            : 'border-l-4 border-l-amber-500 from-amber-500/5 to-amber-500/[0.01] dark:from-amber-950/15 dark:to-amber-950/5'
                    }`}>
                        <div className="flex gap-2.5 items-start">
                            <span className="relative flex h-2 w-2 mt-1 shrink-0">
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${daysLeft <= 0 ? 'bg-rose-450' : 'bg-amber-450'}`}></span>
                                <span className={`relative inline-flex rounded-full h-2 w-2 ${daysLeft <= 0 ? 'bg-rose-500' : 'bg-amber-500'}`}></span>
                            </span>
                            <div className="flex flex-col min-w-0">
                                <p className="text-[11px] font-bold tracking-wider uppercase leading-none text-slate-500 dark:text-zinc-400">Subscription Status</p>
                                <p className="text-[11px] font-semibold mt-1.5 leading-normal text-slate-800 dark:text-zinc-300">
                                    {daysLeft <= 0 ? (
                                        <span className="text-rose-600 dark:text-rose-400 font-bold">Your plan has expired</span>
                                    ) : (
                                        <span>Plan expires in <strong className="font-bold text-amber-600 dark:text-amber-400">{daysLeft} days</strong></span>
                                    )}
                                </p>
                                <p className="text-[9px] text-neutral-400 dark:text-neutral-500 mt-1 uppercase tracking-wider font-semibold">Contact admin to renew</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Logout */}
                <div className="px-3 py-4 border-t border-slate-50 dark:border-zinc-800/40">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-slate-500 dark:text-zinc-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-600 transition-all duration-300 group text-sm font-semibold"
                    >
                        <LogOut className="w-5 h-5 text-slate-400 group-hover:text-rose-600 transition-all duration-300 group-hover:-translate-x-1 shrink-0" />
                        <span className="transition-transform duration-300 group-hover:translate-x-1">Logout</span>
                    </button>
                </div>
            </aside>

            {/* ── Main ───────────────────────────────────────────────────── */}
            <div className="transition-all duration-300 pl-0 md:pl-[240px] w-full min-w-0">
                {/* Top Header */}
                <header className="h-[70px] bg-white/95 dark:bg-[#0f0f1c]/95 backdrop-blur-md border-b border-slate-100/80 dark:border-zinc-800/80 sticky top-0 z-40 px-4 md:px-8 flex items-center justify-between gap-4">
                    {/* Hamburger menu button for mobile */}
                    <button
                        onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                        className="md:hidden p-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                        title="Toggle menu"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>

                    {/* Quick Search */}
                    <div className="flex-1 max-w-md">
                        <div className="relative group">
                            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Quick search (name, phone, email)..."
                                className="w-full bg-slate-50 dark:bg-zinc-900 border border-transparent dark:border-zinc-800 rounded-2xl py-2.5 pl-10 pr-4 text-sm focus:bg-white dark:focus:bg-zinc-950 focus:ring-4 focus:ring-blue-50 focus:border-blue-200 transition-all duration-200 outline-none placeholder:text-slate-400 dark:placeholder:text-zinc-500 font-medium text-foreground"
                            />
                        </div>
                    </div>

                    {/* Help & User */}
                    <div className="flex items-center gap-4 ml-4">
                        <ThemeToggle />
                        {currentUser && (
                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <p className="text-[13px] font-bold text-slate-800 dark:text-zinc-200 leading-none">
                                        {currentUser.fullName || 'Admin User'}
                                    </p>
                                    <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mt-0.5">
                                        {currentUser.role === 'admin' ? 'Super Admin' : currentUser.role}
                                    </p>
                                </div>
                                <div className="w-9 h-9 rounded-xl bg-slate-800 dark:bg-zinc-700 flex items-center justify-center text-white font-black text-xs shadow-sm">
                                    {getInitials(currentUser.fullName)}
                                </div>
                            </div>
                        )}
                        {!currentUser && (
                            <div className="w-9 h-9 rounded-xl bg-slate-800 dark:bg-zinc-700 flex items-center justify-center text-white font-black text-xs">AU</div>
                        )}
                    </div>
                </header>

                <main className="p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
