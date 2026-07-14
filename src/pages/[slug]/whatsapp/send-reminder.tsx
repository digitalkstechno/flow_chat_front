'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import TenantLayout from '@/components/tenant/TenantLayout';
import { Loader2, AlertCircle, CheckCircle2, Plus } from 'lucide-react';
import { getWhatsappTemplates, getClients } from '@/services/tenantService';
import SendReminderTab from '@/components/whatsapp/SendReminderTab';

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

export default function SendReminderPage() {
    const router = useRouter();
    const { slug } = router.query as { slug: string };
    const { toast, show } = useToast();

    const [templates, setTemplates] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [configMissing, setConfigMissing] = useState(false);
    const [showModal, setShowModal] = useState(false);

    const init = useCallback(async () => {
        if (!slug) return;
        setLoading(true);
        setError('');
        setConfigMissing(false);
        try {
            const [settingsRes, clientsRes] = await Promise.allSettled([
                getWhatsappTemplates(slug).catch(err => {
                    const msg = err.response?.data?.message || err.message || '';
                    if (msg.toLowerCase().includes('not fully configured') || msg.toLowerCase().includes('not configured')) {
                        setConfigMissing(true);
                    }
                    throw err;
                }),
                getClients(slug).catch(() => ({ success: false, data: [] }))
            ]);

            if (settingsRes.status === 'fulfilled' && settingsRes.value?.success) {
                setTemplates(settingsRes.value.data || []);
            }
            if (clientsRes.status === 'fulfilled' && clientsRes.value?.success) {
                setClients(clientsRes.value.data || []);
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || 'Failed to initialize page.';
            if (!msg.toLowerCase().includes('not fully configured') && !msg.toLowerCase().includes('not configured')) {
                setError(msg);
            }
        } finally {
            setLoading(false);
        }
    }, [slug]);

    useEffect(() => {
        if (slug) init();
    }, [slug, init]);

    return (
        <TenantLayout title="Schedule Campaigns">
            {toast && <Toast msg={toast.msg} type={toast.type} />}

            <div className="max-w-7xl mx-auto space-y-6">
                <div className="pt-2 flex items-start justify-between">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Scheduled Reminder Campaigns</h1>
                        <p className="text-slate-400 text-sm mt-1.5 font-medium">Configure template broadcast triggers and track campaign delivery states.</p>
                    </div>
                    {!configMissing && !loading && (
                        <button
                            onClick={() => setShowModal(true)}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl text-sm font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95 leading-none mt-1 shrink-0 animate-in fade-in"
                        >
                            <Plus size={18} /> Schedule New Reminder
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white dark:bg-[#0f0f1c] border border-slate-100 dark:border-zinc-800/80 rounded-2xl shadow-sm animate-pulse">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                        <span className="text-xs text-slate-400 dark:text-zinc-550 uppercase font-black tracking-widest">Loading campaign wizard...</span>
                    </div>
                ) : configMissing ? (
                    <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-white dark:bg-[#0f0f1c] border border-slate-100 dark:border-zinc-800/80 rounded-2xl shadow-sm space-y-4">
                        <div className="w-14 h-14 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-full flex items-center justify-center text-amber-500">
                            <AlertCircle className="w-6 h-6 animate-pulse" />
                        </div>
                        <div className="space-y-1.5 max-w-sm">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">WhatsApp API Settings Incomplete</h3>
                            <p className="text-xs text-slate-400 dark:text-zinc-500 leading-relaxed font-normal">To launch scheduled reminder campaigns, you must first configure your WABA API settings.</p>
                        </div>
                        <button
                            onClick={() => router.push(`/${slug}/whatsapp/settings`)}
                            className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-neutral-800 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-md"
                        >
                            Go to API Settings
                        </button>
                    </div>
                ) : error ? (
                    <div className="p-5 border border-red-200 dark:border-red-950/40 bg-red-50/50 dark:bg-red-950/10 rounded-2xl text-xs text-red-655 dark:text-red-450 shadow-sm font-medium">
                        {error}
                    </div>
                ) : (
                    <SendReminderTab
                        clients={clients}
                        templates={templates}
                        slug={slug}
                        show={show}
                        showModal={showModal}
                        setShowModal={setShowModal}
                    />
                )}
            </div>
        </TenantLayout>
    );
}
