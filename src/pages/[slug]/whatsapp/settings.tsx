'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import TenantLayout from '@/components/tenant/TenantLayout';
import { Loader2, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { getWhatsappSettings, updateWhatsappSettings } from '@/services/tenantService';
import SettingsTab from '@/components/whatsapp/SettingsTab';

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

export default function SettingsPage() {
    const router = useRouter();
    const { slug } = router.query as { slug: string };
    const { toast, show } = useToast();

    const [settingsForm, setSettingsForm] = useState({ whatsappApiBaseUrl: '', whatsappPhoneNumberId: '', whatsappAccessToken: '', whatsappWabaId: '', crmApiDomain: '', crmApiAccessToken: '' });
    const [whatsappKeywordRules, setWhatsappKeywordRules] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const [saveLoading, setSaveLoading] = useState(false);
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

    // Verify role
    useEffect(() => {
        if (!slug) return;
        const userStr = localStorage.getItem(`staff_user_${slug}`);
        if (userStr) {
            try {
                const u = JSON.parse(userStr);
                setIsAdmin(u.role === 'admin');
            } catch (e) {
                setIsAdmin(false);
            }
        } else {
            setIsAdmin(false);
        }
    }, [slug]);

    useEffect(() => {
        if (!slug || isAdmin === false) return;
        setLoading(true);
        getWhatsappSettings(slug)
            .then(res => {
                if (res.success && res.data) {
                    const d = res.data;
                    setSettingsForm({
                        whatsappApiBaseUrl: d.whatsappApiBaseUrl || '',
                        whatsappPhoneNumberId: d.whatsappPhoneNumberId || '',
                        whatsappAccessToken: d.whatsappAccessToken || '',
                        whatsappWabaId: d.whatsappWabaId || '',
                        crmApiDomain: d.crmApiDomain || '',
                        crmApiAccessToken: d.crmApiAccessToken || '',
                    });
                    setWhatsappKeywordRules(d.whatsappKeywordRules || {});
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [slug, isAdmin]);

    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!slug) return;
        setSaveLoading(true);
        try {
            const payload = {
                whatsappApiBaseUrl: settingsForm.whatsappApiBaseUrl,
                whatsappPhoneNumberId: settingsForm.whatsappPhoneNumberId,
                whatsappWabaId: settingsForm.whatsappWabaId,
                whatsappAccessToken: settingsForm.whatsappAccessToken,
                whatsappKeywordRules: whatsappKeywordRules,
                crmApiDomain: settingsForm.crmApiDomain,
                crmApiAccessToken: settingsForm.crmApiAccessToken,
            };
            const res = await updateWhatsappSettings(slug, payload);
            if (res.success) {
                show('API credentials saved successfully!', 'success');
            }
        } catch (err: any) {
            show(err.response?.data?.message || 'Failed to save settings.', 'error');
        } finally {
            setSaveLoading(false);
        }
    };

    if (isAdmin === false) {
        return (
            <TenantLayout title="Access Denied">
                <div className="max-w-7xl mx-auto space-y-6">
                    <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-white dark:bg-[#0f0f1c] border border-slate-100 dark:border-zinc-800/80 rounded-2xl shadow-sm space-y-4">
                        <div className="w-14 h-14 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-full flex items-center justify-center text-red-500">
                            <ShieldAlert className="w-6 h-6 animate-bounce" />
                        </div>
                        <div className="space-y-1.5 max-w-sm">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">Access Restricted</h3>
                            <p className="text-xs text-slate-500 dark:text-neutral-450 leading-relaxed font-normal">Only administrator accounts are permitted to configure WhatsApp access tokens and gateway settings.</p>
                        </div>
                        <button
                            onClick={() => router.push(`/${slug}/whatsapp/chats`)}
                            className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-neutral-800 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-md"
                        >
                            Back to Chats
                        </button>
                    </div>
                </div>
            </TenantLayout>
        );
    }

    return (
        <TenantLayout title="API Settings">
            {toast && <Toast msg={toast.msg} type={toast.type} />}

            <div className="max-w-7xl mx-auto space-y-6">
                <div className="pt-2">
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">API Settings</h1>
                    <p className="text-slate-400 text-sm mt-1.5 font-medium">Configure your Meta Developer Account and WhatsApp Business Cloud API access credentials.</p>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white dark:bg-[#0f0f1c] border border-slate-100 dark:border-zinc-800/80 rounded-2xl shadow-sm animate-pulse">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                        <span className="text-xs text-slate-400 dark:text-zinc-550 uppercase font-black tracking-widest">Loading settings...</span>
                    </div>
                ) : (
                    <SettingsTab
                        saveLoading={saveLoading}
                        settingsForm={settingsForm}
                        setSettingsForm={setSettingsForm}
                        handleSaveSettings={handleSaveSettings}
                    />
                )}
            </div>
        </TenantLayout>
    );
}
