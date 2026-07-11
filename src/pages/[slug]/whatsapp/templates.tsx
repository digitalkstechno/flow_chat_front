'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import TenantLayout from '@/components/tenant/TenantLayout';
import { Loader2, Plus, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { getWhatsappTemplates, deleteWhatsappTemplate } from '@/services/tenantService';
import TemplatesTab from '@/components/whatsapp/TemplatesTab';
import { useConfirm } from '@/context/ConfirmContext';

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

export default function TemplatesPage() {
    const router = useRouter();
    const { slug } = router.query as { slug: string };
    const { toast, show } = useToast();
    const confirm = useConfirm();

    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [configMissing, setConfigMissing] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    // Verify role on mount
    useEffect(() => {
        if (!slug) return;
        const userStr = localStorage.getItem(`staff_user_${slug}`);
        if (userStr) {
            try {
                const u = JSON.parse(userStr);
                setIsAdmin(u.role === 'admin');
            } catch (e) {}
        }
    }, [slug]);

    const fetchTemplates = useCallback(async () => {
        if (!slug) return;
        setLoading(true);
        setError('');
        setConfigMissing(false);
        try {
            const res = await getWhatsappTemplates(slug);
            if (res.success) setTemplates(res.data || []);
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || 'Failed to load templates.';
            if (msg.toLowerCase().includes('not fully configured') || msg.toLowerCase().includes('not configured')) {
                setConfigMissing(true);
            } else {
                setError(msg);
            }
        } finally {
            setLoading(false);
        }
    }, [slug]);

    useEffect(() => {
        if (slug) fetchTemplates();
    }, [slug, fetchTemplates]);

    const handleDeleteTemplate = async (name: string) => {
        if (!slug) return;
        const isConfirmed = await confirm({
            title: 'Delete WABA Template',
            message: `Are you sure you want to permanently delete template "${name}"? This action cannot be undone on Meta.`,
            confirmLabel: 'Delete Permanent',
            cancelLabel: 'Keep',
            variant: 'danger'
        });
        if (!isConfirmed) return;
        try {
            await deleteWhatsappTemplate(slug, name);
            show('Template deleted.', 'success');
            setTemplates(prev => prev.filter(t => t.name !== name));
        } catch (err: any) {
            show(err.response?.data?.message || 'Failed to delete template.', 'error');
        }
    };

    return (
        <TenantLayout title="Message Templates">
            {toast && <Toast msg={toast.msg} type={toast.type} />}

            <div className="max-w-7xl mx-auto space-y-6">
                <div className="pt-2 flex items-start justify-between">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Message Templates</h1>
                        <p className="text-slate-400 text-sm mt-1.5 font-medium font-normal">Synchronize and view approved Meta templates for campaign broadcast automation.</p>
                    </div>
                    {!configMissing && (
                        <div className="flex items-center gap-3 mt-1 shrink-0">
                            <button type="button" onClick={fetchTemplates} disabled={loading}
                                className="flex items-center justify-center p-2.5 rounded-xl border border-slate-200 bg-white dark:bg-neutral-900 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-neutral-800 disabled:opacity-50 transition-colors shadow-sm"
                                title="Refresh library">
                                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                            {isAdmin && (
                                <button
                                    onClick={() => router.push(`/${slug}/whatsapp/templates/create`)}
                                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl text-sm font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95 leading-none"
                                >
                                    <Plus className="w-4 h-4" /> Create Template
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white dark:bg-[#0f0f1c] border border-slate-100 dark:border-zinc-800/80 rounded-2xl shadow-sm">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                        <span className="text-xs text-slate-400 dark:text-zinc-550 uppercase font-black tracking-widest animate-pulse">Loading templates...</span>
                    </div>
                ) : configMissing ? (
                    <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-white dark:bg-[#0f0f1c] border border-slate-100 dark:border-zinc-800/80 rounded-2xl shadow-sm space-y-4">
                        <div className="w-14 h-14 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-full flex items-center justify-center text-amber-500">
                            <AlertCircle className="w-6 h-6 animate-pulse" />
                        </div>
                        <div className="space-y-1.5 max-w-sm">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">WhatsApp API Settings Incomplete</h3>
                            <p className="text-xs text-slate-400 dark:text-zinc-500 leading-relaxed font-normal">To load templates, you must first configure your WABA credentials and access token inside API Settings.</p>
                        </div>
                        {isAdmin && (
                            <button
                                onClick={() => router.push(`/${slug}/whatsapp/settings`)}
                                className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-neutral-800 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-md"
                            >
                                Go to API Settings
                            </button>
                        )}
                    </div>
                ) : error ? (
                    <div className="p-5 border border-red-200 dark:border-red-950/40 bg-red-50/50 dark:bg-red-950/10 rounded-2xl text-xs text-red-650 dark:text-red-400 shadow-sm font-medium">
                        {error}
                    </div>
                ) : (
                    <TemplatesTab
                        templates={templates}
                        templatesLoading={loading}
                        templatesError={error}
                        fetchTemplates={fetchTemplates}
                        handleDeleteTemplate={handleDeleteTemplate}
                        setActiveTab={() => router.push(`/${slug}/whatsapp/templates/create`)}
                        isAdmin={isAdmin}
                    />
                )}
            </div>
        </TenantLayout>
    );
}
