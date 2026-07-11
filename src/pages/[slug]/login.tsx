import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { staffLogin, getTenantBySlug, forgotPassword } from '../../services/api';
import ThemeToggle from '@/components/ThemeToggle';
import { useTheme } from '@/context/ThemeContext';

type PageState = 'loading' | 'not_found' | 'inactive' | 'ready';

export default function TenantLoginPage() {
    const router = useRouter();
    const { slug } = router.query as { slug: string };
    const { theme } = useTheme();

    const [pageState, setPageState] = useState<PageState>('loading');
    const [tenantName, setTenantName] = useState('');
    const [tenantStatus, setTenantStatus] = useState('');
    const [form, setForm] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const [forgotView, setForgotView] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotSubmitting, setForgotSubmitting] = useState(false);
    const [forgotSuccess, setForgotSuccess] = useState('');
    const [forgotError, setForgotError] = useState('');

    // Step 1: Verify tenant exists in the DB
    useEffect(() => {
        if (!slug) return;

        // If already logged in for this slug, go straight to whatsapp/chats
        const existingToken = localStorage.getItem(`staff_token_${slug}`);
        if (existingToken) {
            router.replace(`/${slug}/whatsapp/chats`);
            return;
        }

        getTenantBySlug(slug)
            .then((res) => {
                if (!res.success) {
                    setPageState('not_found');
                    return;
                }
                const tenant = res.data;
                setTenantName(tenant.clientName);
                setTenantStatus(tenant.status);
                localStorage.setItem(`tenant_name_${slug}`, tenant.clientName);
                if (tenant.status !== 'active') {
                    setPageState('inactive');
                } else {
                    setPageState('ready');
                }
            })
            .catch(() => setPageState('not_found'));
    }, [slug, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);
        try {
            const res = await staffLogin(slug, form);
            if (res.status === 'Success') {
                localStorage.setItem(`staff_token_${slug}`, res.token);
                localStorage.setItem(`staff_user_${slug}`, JSON.stringify(res.data));
                localStorage.setItem(`tenant_name_${slug}`, res.tenant?.clientName || slug);
                router.push(`/${slug}/whatsapp/chats`);
            } else {
                setError(res.message || 'Login failed');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid email or password.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setForgotError('');
        setForgotSuccess('');
        setForgotSubmitting(true);
        try {
            const res = await forgotPassword(slug, { email: forgotEmail });
            if (res.status === 'Success' || res.message) {
                setForgotSuccess(res.message || 'A temporary password has been sent to your email.');
                setForgotEmail('');
            } else {
                setForgotError(res.message || 'Failed to request password reset');
            }
        } catch (err: any) {
            setForgotError(err.response?.data?.message || 'Invalid email address or recovery failed.');
        } finally {
            setForgotSubmitting(false);
        }
    };

    if (!slug || pageState === 'loading') {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center font-sans">
                <div className="text-center">
                    <div className="w-11 h-11 border-4 border-indigo-600/30 border-t-indigo-650 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-500 dark:text-zinc-400 text-sm font-semibold">Verifying workspace...</p>
                </div>
            </div>
        );
    }

    if (pageState === 'not_found') {
        return (
            <>
                <Head><title>404 — Workspace Not Found</title></Head>
                <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center font-sans px-4">
                    <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 rounded-3xl p-8 shadow-xl text-center">
                        <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/35 border border-rose-100 dark:border-rose-900/50 flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.07 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-black text-slate-800 dark:text-zinc-100 tracking-tight mb-2">Workspace Not Found</h1>
                        <p className="text-slate-500 dark:text-zinc-400 text-sm mb-4 leading-relaxed">No workspace exists for the URL suffix:</p>
                        <code className="inline-block bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-xl px-4 py-1.5 text-rose-600 dark:text-rose-450 font-mono text-sm mb-6">/{slug}</code>
                        <p className="text-xs text-slate-400 dark:text-zinc-550 leading-relaxed">Please check the spelling or contact your system administrator if you believe this is an error.</p>
                    </div>
                </div>
            </>
        );
    }

    if (pageState === 'inactive') {
        return (
            <>
                <Head><title>Workspace Unavailable — {tenantName}</title></Head>
                <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center font-sans px-4">
                    <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 rounded-3xl p-8 shadow-xl text-center">
                        <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/35 border border-amber-100 dark:border-amber-900/50 flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-black text-slate-800 dark:text-zinc-100 tracking-tight mb-2">{tenantName}</h1>
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border mb-4 uppercase tracking-wider ${
                            tenantStatus === 'pending'
                                ? 'bg-amber-50 dark:bg-amber-950/35 text-amber-600 dark:text-amber-450 border-amber-250/50'
                                : 'bg-rose-50 dark:bg-rose-950/35 text-rose-600 dark:text-rose-450 border-rose-250/50'
                        }`}>
                            {tenantStatus === 'pending' ? '⏳ Provisioning' : `⚠️ ${tenantStatus}`}
                        </span>
                        <p className="text-slate-500 dark:text-zinc-400 text-sm leading-relaxed">
                            {tenantStatus === 'pending'
                                ? 'Your workspace database environment is being set up. This takes a few minutes. Please reload this page in a moment.'
                                : 'This workspace has been suspended or deactivated. Please check with your supervisor.'}
                        </p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Head>
                <title>Sign In — {tenantName}</title>
                <meta name="description" content={`Staff login portal for ${tenantName}`} />
            </Head>

            <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col md:grid md:grid-cols-12 font-sans relative overflow-hidden transition-all duration-300">
                <div className="absolute top-4 right-4 z-50">
                    <ThemeToggle />
                </div>

                {/* Left side: Premium branding & marketing panel */}
                <div className="hidden md:flex md:col-span-5 lg:col-span-4 bg-gradient-to-tr from-slate-900 via-[#075e54] to-[#25d366]/20 text-white flex-col justify-between p-12 relative overflow-hidden shadow-2xl">
                    {/* Floating background blobs */}
                    <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
                    <div className="absolute bottom-[-20%] right-[-20%] w-[85%] h-[85%] rounded-full bg-indigo-500/10 blur-[130px] pointer-events-none" />

                    {/* Branding Header */}
                    <div className="flex items-center gap-3 relative z-10">
                        <img src="/logo.png" alt="WA Flow Logo" className="h-9 w-auto object-contain dark:invert" />
                    </div>

                    {/* Features highlights */}
                    <div className="space-y-8 my-auto relative z-10">
                        <div className="space-y-3">
                            <h2 className="text-3xl font-black tracking-tight leading-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                                WhatsApp Client Automation
                            </h2>
                            <p className="text-slate-350 text-sm leading-relaxed">
                                Streamlining communication, documents, and business workflows.
                            </p>
                        </div>

                        <div className="space-y-6">
                            {/* Feature 1 */}
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 text-blue-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </div>
                                <div className="flex flex-col justify-center">
                                    <h4 className="font-bold text-sm text-slate-100">Automatic WhatsApp messaging</h4>
                                    <p className="text-xs text-slate-400 mt-1">Seamless client updates, payment links, and alerts.</p>
                                </div>
                            </div>

                            {/* Feature 2 */}
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 text-blue-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div className="flex flex-col justify-center">
                                    <h4 className="font-bold text-sm text-slate-100">Instant Document Processing</h4>
                                    <p className="text-xs text-slate-400 mt-1">Classify, label, and download files with ease.</p>
                                </div>
                            </div>

                            {/* Feature 3 */}
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 text-blue-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <div className="flex flex-col justify-center">
                                    <h4 className="font-bold text-sm text-slate-100">Security First</h4>
                                    <p className="text-xs text-slate-400 mt-1">Multi-tenant isolation keeps documents and databases private.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer branding copyright */}
                    <div className="text-[10px] text-slate-500 font-semibold tracking-wider relative z-10">
                        &copy; 2026 WA FLOW PORTAL. ALL RIGHTS RESERVED.
                    </div>
                </div>

                {/* Right side: Login Form Pane */}
                <div className="flex-1 md:col-span-7 lg:col-span-8 flex items-center justify-center p-8 bg-slate-50 dark:bg-zinc-950">
                    <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-100 dark:shadow-none transition-all duration-300">
                        
                        {/* Logo header for small screens (hidden on md+) */}
                        <div className="flex md:hidden items-center justify-center mb-8">
                            <img src="/logo.png" alt="WA Flow Logo" className="h-8 w-auto object-contain dark:invert" />
                        </div>

                        {/* Title block */}
                        <div className="text-center md:text-left mb-8">
                            <h2 className="text-2xl font-black text-slate-900 dark:text-zinc-50 tracking-tight leading-none">
                                {forgotView ? 'Reset Password' : tenantName}
                            </h2>
                            <p className="text-slate-400 dark:text-zinc-400 text-xs font-semibold mt-2">
                                {forgotView ? 'Request a temporary password' : 'Staff portal — sign in to continue'}
                            </p>
                        </div>

                        {/* Error message card */}
                        {!forgotView && error && (
                            <div className="flex items-center gap-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/35 rounded-2xl p-4 mb-6 text-rose-600 dark:text-rose-450 text-xs">
                                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="font-semibold">{error}</span>
                            </div>
                        )}

                        {forgotView && forgotError && (
                            <div className="flex items-center gap-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/35 rounded-2xl p-4 mb-6 text-rose-600 dark:text-rose-450 text-xs">
                                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="font-semibold">{forgotError}</span>
                            </div>
                        )}
                        {forgotView && forgotSuccess && (
                            <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-950/25 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-4 mb-6 text-emerald-600 dark:text-emerald-400 text-xs">
                                <svg className="w-5 h-5 flex-shrink-0 text-emerald-550" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="font-semibold text-emerald-700 dark:text-emerald-350">{forgotSuccess}</span>
                            </div>
                        )}

                        {!forgotView ? (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Email field */}
                                <div>
                                    <label htmlFor="staff-email" className="block text-[10px] font-extrabold text-slate-400 dark:text-zinc-550 uppercase tracking-wider mb-2">
                                        Email Address
                                    </label>
                                    <input
                                        id="staff-email"
                                        type="email"
                                        required
                                        placeholder="admin@example.com"
                                        value={form.email}
                                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                        className="w-full px-4 py-3 bg-slate-50/50 focus:bg-white dark:bg-zinc-800/40 dark:focus:bg-zinc-900 border border-slate-200 dark:border-zinc-800 focus:border-blue-500 dark:focus:border-blue-550 focus:ring-4 focus:ring-blue-500/5 dark:focus:ring-blue-500/10 rounded-2xl text-slate-800 dark:text-zinc-200 text-sm focus:outline-none transition-all"
                                    />
                                </div>

                                {/* Password field */}
                                <div>
                                    <label htmlFor="staff-password" className="block text-[10px] font-extrabold text-slate-400 dark:text-zinc-550 uppercase tracking-wider mb-2">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="staff-password"
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            placeholder="••••••••"
                                            value={form.password}
                                            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                                            className="w-full px-4 py-3 bg-slate-50/50 focus:bg-white dark:bg-zinc-800/40 dark:focus:bg-zinc-900 border border-slate-200 dark:border-zinc-800 focus:border-blue-500 dark:focus:border-blue-550 focus:ring-4 focus:ring-blue-500/5 dark:focus:ring-blue-500/10 rounded-2xl text-slate-800 dark:text-zinc-200 text-sm focus:outline-none pr-12 transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(p => !p)}
                                            className="absolute right-4 top-3 text-slate-400 hover:text-slate-650 transition-colors"
                                        >
                                            {showPassword ? (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                                </svg>
                                            ) : (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                    <div className="flex justify-end mt-2.5">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setForgotView(true);
                                                setForgotEmail('');
                                                setForgotSuccess('');
                                                setForgotError('');
                                            }}
                                            className="text-xs font-semibold text-blue-600 dark:text-blue-500 hover:underline"
                                        >
                                            Forgot Password?
                                        </button>
                                    </div>
                                </div>

                                {/* Submit button */}
                                <button
                                    id="staff-login-btn"
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-bold py-3 px-4 rounded-2xl shadow-lg shadow-blue-500/10 active:scale-95 transition-all text-sm cursor-pointer disabled:cursor-not-allowed mt-8 leading-none"
                                >
                                    {submitting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Signing in...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                            </svg>
                                            Log In
                                        </>
                                    )}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleForgotPasswordSubmit} className="space-y-6">
                                {/* Email field */}
                                <div>
                                    <label htmlFor="forgot-email" className="block text-[10px] font-extrabold text-slate-400 dark:text-zinc-550 uppercase tracking-wider mb-2">
                                        Account Email Address
                                    </label>
                                    <input
                                        id="forgot-email"
                                        type="email"
                                        required
                                        placeholder="admin@example.com"
                                        value={forgotEmail}
                                        onChange={e => setForgotEmail(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50/50 focus:bg-white dark:bg-zinc-800/40 dark:focus:bg-zinc-900 border border-slate-200 dark:border-zinc-800 focus:border-blue-500 dark:focus:border-blue-550 focus:ring-4 focus:ring-blue-500/5 dark:focus:ring-blue-500/10 rounded-2xl text-slate-800 dark:text-zinc-200 text-sm focus:outline-none transition-all"
                                    />
                                </div>

                                {/* Back to Login link */}
                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setForgotView(false);
                                            setForgotError('');
                                            setForgotSuccess('');
                                        }}
                                        className="text-xs font-semibold text-blue-600 dark:text-blue-500 hover:underline"
                                    >
                                        Back to Sign In
                                    </button>
                                </div>
                                {/* Submit button */}
                                <button
                                    type="submit"
                                    disabled={forgotSubmitting}
                                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-bold py-3 px-4 rounded-2xl shadow-lg shadow-blue-500/10 active:scale-95 transition-all text-sm cursor-pointer disabled:cursor-not-allowed mt-8 leading-none"
                                >
                                    {forgotSubmitting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Requesting...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                            Send Reset Password
                                        </>
                                    )}
                                </button>
                            </form>
                        )}

                        {/* Restricted access footer notice */}
                        <div className="text-center mt-10">
                            <p className="text-[10px] text-slate-400 dark:text-zinc-550 leading-relaxed font-medium">
                                Authorized access only. Activities on this portal are logged.<br/>
                                In case of difficulty, contact <strong className="text-slate-650 dark:text-zinc-350">{tenantName}</strong> support.
                            </p>
                        </div>

                    </div>
                </div>
            </div>
        </>
    );
}
