'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import TenantLayout from '@/components/tenant/TenantLayout';
import { Loader2, AlertCircle, CheckCircle2, Settings } from 'lucide-react';
import { getWhatsappSettings } from '@/services/tenantService';
import ChatPanel, { WhatsAppSplashLoader } from '@/components/whatsapp/ChatPanel';

// ─── Toast ──────────────────────────────────────────────────────────────────

function Toast({ msg, type }: { msg: string; type: 'success' | 'error' | 'info' }) {
    const cls =
        type === 'success' ? 'bg-emerald-600 text-white shadow-emerald-600/30' :
        type === 'error' ? 'bg-red-600 text-white shadow-red-600/30' :
        'bg-sky-600 text-white shadow-sky-600/30';
    return (
        <div className={`fixed bottom-5 right-5 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-semibold max-w-sm animate-fade-in ${cls}`}>
            {type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
            <span>{msg}</span>
        </div>
    );
}

function useToast() {
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const show = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'success') => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setToast({ msg, type });
        timerRef.current = setTimeout(() => setToast(null), 4000);
    }, []);
    return { toast, show };
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function WhatsappChatsPage() {
    const router = useRouter();
    const { slug } = router.query as { slug: string };
    const { toast, show } = useToast();

    const [loading, setLoading] = useState(true);
    const [contactsLoading, setContactsLoading] = useState(true);
    const [crmNotConfigured, setCrmNotConfigured] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!slug) return;
        setLoading(true);
        setError('');
        setCrmNotConfigured(false);

        getWhatsappSettings(slug)
            .then(res => {
                if (res.success && res.data) {
                    const { crmApiDomain, crmApiAccessToken } = res.data;
                    if (!crmApiDomain || !crmApiAccessToken) {
                        setCrmNotConfigured(true);
                    }
                }
            })
            .catch(err => {
                const msg = err.response?.data?.message || err.message || '';
                if (msg.toLowerCase().includes('not fully configured') || msg.toLowerCase().includes('not configured')) {
                    setCrmNotConfigured(true);
                } else {
                    setError(msg);
                }
            })
            .finally(() => setLoading(false));
    }, [slug]);

    const showPanel = slug && !crmNotConfigured && !error;
    const isAppLoading = loading || (showPanel && contactsLoading);

    return (
        <TenantLayout title="WhatsApp Chats">
            {toast && <Toast msg={toast.msg} type={toast.type} />}

            <div className="flex flex-col h-full max-w-full" style={{ height: 'calc(100vh - 145px)' }}>

                {/* Content */}
                {isAppLoading ? (
                    <WhatsAppSplashLoader />
                ) : null}

                {crmNotConfigured && !loading && (
                    <div className="flex flex-col items-center justify-center flex-1 px-6 text-center bg-white dark:bg-[#0f0f1c] border border-slate-100 dark:border-zinc-800/80 rounded-2xl shadow-sm space-y-4">
                        <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 rounded-full flex items-center justify-center text-blue-500">
                            <Settings className="w-7 h-7" />
                        </div>
                        <div className="space-y-1.5 max-w-sm">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">CRM API Not Configured</h3>
                            <p className="text-xs text-slate-400 dark:text-zinc-500 leading-relaxed font-normal">
                                To use the WhatsApp Chats panel, please configure your <strong className="text-slate-600 dark:text-zinc-300">CRM API Domain</strong> and <strong className="text-slate-600 dark:text-zinc-300">CRM API Access Token</strong> in API Settings.
                            </p>
                        </div>
                        <button
                            id="go-to-settings-btn"
                            onClick={() => router.push(`/${slug}/whatsapp/settings`)}
                            className="px-5 py-2.5 rounded-xl bg-[#25d366] text-white text-xs font-bold hover:bg-[#1db954] transition-colors shadow-md"
                        >
                            Go to API Settings
                        </button>
                    </div>
                )}

                {error && !loading && (
                    <div className="flex flex-col items-center justify-center flex-1 px-6 text-center bg-white dark:bg-[#0f0f1c] border border-slate-100 dark:border-zinc-800/80 rounded-2xl shadow-sm space-y-4">
                        <AlertCircle className="w-8 h-8 text-red-400" />
                        <p className="text-xs text-red-400 dark:text-red-400">{error}</p>
                        <button
                            onClick={() => router.reload()}
                            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-neutral-800 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {showPanel && (
                    <div className="flex-1 min-h-0" style={{ display: isAppLoading ? 'none' : 'block' }}>
                        <ChatPanel slug={slug} onContactsLoaded={() => setContactsLoading(false)} />
                    </div>
                )}
            </div>
        </TenantLayout>
    );
}
