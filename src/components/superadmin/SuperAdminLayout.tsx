import React, { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { getMe } from '../../services/api';
import ThemeToggle from '../ThemeToggle';

interface Props {
    children: ReactNode;
    title?: string;
}

export default function SuperAdminLayout({ children, title = 'Super Admin' }: Props) {
    const router = useRouter();

    useEffect(() => {
        const verifyAuth = async () => {
            const token = localStorage.getItem('token');
            const userStr = localStorage.getItem('user');
            if (!token || !userStr) {
                router.push('/superadmin/login');
                return;
            }
            try {
                const user = JSON.parse(userStr);
                if (user.role === 'affiliate') {
                    router.push('/affiliate/dashboard');
                    return;
                }
                await getMe();
            } catch (err) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                router.push('/superadmin/login');
            }
        };
        verifyAuth();
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/superadmin/login');
    };

    const navItems = [
        { label: 'Dashboard', path: '/superadmin/dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
        { label: 'Tenants', path: '/superadmin/tenants', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
        { label: 'Users', path: '/superadmin/users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
        { label: 'Inquiries', path: '/superadmin/inquiries', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
        { label: 'Support Tickets', path: '/superadmin/tickets', icon: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z' },
    ];

    return (
        <div className="min-h-screen bg-background font-sans text-foreground transition-colors duration-300">
            <Head>
                <title>{title} | WA Flow</title>
            </Head>
            {/* Sidebar */}
            <aside style={{ width: 256 }} className="fixed inset-y-0 left-0 bg-card border-r border-border flex flex-col z-50 transition-all">
                <div className="h-16 flex items-center px-6 border-b border-border">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-green-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-green-500/20 mr-3">
                        <span className="font-bold text-white text-xs">WA</span>
                    </div>
                    <span className="font-semibold text-lg text-foreground tracking-tight">SuperAdmin</span>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-1">
                    {navItems.map((item) => (
                        <button
                            key={item.path}
                            onClick={() => router.push(item.path)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${router.pathname === item.path
                                ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400'
                                : 'text-neutral-500 hover:text-foreground dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                                }`}
                        >
                            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                            </svg>
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-border">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-500 hover:text-foreground dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content Wrapper */}
            <div style={{ paddingLeft: 256 }} className="flex flex-col min-h-screen">
                {/* Header */}
                <header className="h-16 bg-card/50 backdrop-blur-md border-b border-border sticky top-0 z-40 flex items-center justify-between px-8">
                    <div className="flex items-center gap-4">
                        <h2 className="text-lg font-medium text-foreground">{title}</h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-border flex items-center justify-center">
                                <svg className="w-4 h-4 text-neutral-500 dark:text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                            </div>
                            <span className="text-sm font-medium text-foreground">Admin</span>
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
