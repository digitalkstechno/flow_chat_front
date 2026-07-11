'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import TenantLayout from '@/components/tenant/TenantLayout';
import { AlertCircle, CheckCircle2, ChevronLeft, ShieldAlert } from 'lucide-react';
import { createWhatsappTemplate, uploadWhatsappMedia } from '@/services/tenantService';
import CreateTemplateTab from '@/components/whatsapp/CreateTemplateTab';

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

export default function CreateTemplatePage() {
    const router = useRouter();
    const { slug } = router.query as { slug: string };
    const { toast, show } = useToast();

    // ── Form States ───────────────────────────────────────────────────────────
    const [tplName, setTplName] = useState('');
    const [tplCategory, setTplCategory] = useState('MARKETING');
    const [tplLang, setTplLang] = useState('en');
    const [headerFormat, setHeaderFormat] = useState<'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'NONE'>('NONE');
    const [headerText, setHeaderText] = useState('');
    const [mediaSourceType, setMediaSourceType] = useState<'upload' | 'url'>('upload');
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [mediaUrl, setMediaUrl] = useState('');
    const [uploadProgress, setUploadProgress] = useState<'idle' | 'uploading' | 'done'>('idle');
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [mediaHandle, setMediaHandle] = useState('');
    const [bodyText, setBodyText] = useState('');
    const [footerText, setFooterText] = useState('');
    const [btnType, setBtnType] = useState<'NONE' | 'QUICK_REPLY' | 'URL'>('NONE');
    const [quickReplies, setQuickReplies] = useState(['', '', '']);
    const [ctaLabel, setCtaLabel] = useState('');
    const [ctaUrl, setCtaUrl] = useState('');
    const [createLoading, setCreateLoading] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);
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

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setMediaFile(f);
        setMediaUrl('');
        setUploadProgress('idle');
        setUploadError(null);
    };

    const handleUploadMedia = async () => {
        if (!mediaFile || !slug) return;
        setUploadProgress('uploading');
        setUploadError(null);
        try {
            const res = await uploadWhatsappMedia(slug, mediaFile);
            if (res.success && res.handle) {
                setMediaHandle(res.handle);
                setUploadProgress('done');
                show('Media uploaded to Meta successfully', 'success');
            } else {
                throw new Error('Failed to retrieve upload handle');
            }
        } catch (err: any) {
            setUploadProgress('idle');
            setUploadError(err.response?.data?.message || err.message);
            show('Media upload failed', 'error');
        }
    };

    const handleCreateTemplate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!slug) return;
        setCreateLoading(true);
        setCreateError(null);

        try {
            const comps: any[] = [];

            // 1. Header
            if (headerFormat !== 'NONE') {
                const header: any = { type: 'HEADER', format: headerFormat };
                if (headerFormat === 'TEXT') {
                    header.text = headerText;
                } else {
                    header.example = {
                        header_handle: [mediaHandle || '']
                    };
                }
                comps.push(header);
            }

            // 2. Body
            comps.push({
                type: 'BODY',
                text: bodyText
            });

            // 3. Footer
            if (footerText.trim()) {
                comps.push({
                    type: 'FOOTER',
                    text: footerText
                });
            }

            // 4. Buttons
            if (btnType === 'QUICK_REPLY') {
                const activeReplies = quickReplies.filter(r => r.trim());
                if (activeReplies.length > 0) {
                    comps.push({
                        type: 'BUTTONS',
                        buttons: activeReplies.map(text => ({
                            type: 'QUICK_REPLY',
                            text
                        }))
                    });
                }
            } else if (btnType === 'URL') {
                comps.push({
                    type: 'BUTTONS',
                    buttons: [{
                        type: 'URL',
                        text: ctaLabel,
                        url: ctaUrl
                    }]
                });
            }

            const payload = {
                name: tplName.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
                category: tplCategory,
                language: tplLang,
                components: comps
            };

            await createWhatsappTemplate(slug, payload);
            show('Template created successfully!', 'success');
            router.push(`/${slug}/whatsapp/templates`);
        } catch (err: any) {
            const metaMsg = err.response?.data?.message || err.response?.data?.error?.error?.message || err.message;
            setCreateError(metaMsg || 'Failed to create template.');
            show(metaMsg || 'Failed to create template.', 'error');
        } finally {
            setCreateLoading(false);
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
                            <p className="text-xs text-slate-500 dark:text-neutral-450 leading-relaxed font-normal">Only administrator accounts are permitted to build and register new WhatsApp Cloud templates.</p>
                        </div>
                        <button
                            onClick={() => router.push(`/${slug}/whatsapp/templates`)}
                            className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-neutral-800 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
                        >
                            Back to Templates
                        </button>
                    </div>
                </div>
            </TenantLayout>
        );
    }

    return (
        <TenantLayout title="Create Message Template">
            {toast && <Toast msg={toast.msg} type={toast.type} />}

            <div className="max-w-7xl mx-auto space-y-6">
                <div className="pt-2">
                    <button
                        onClick={() => router.push(`/${slug}/whatsapp/templates`)}
                        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 dark:hover:text-neutral-300 font-bold tracking-wide uppercase mb-3 transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" /> Back to Templates
                    </button>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Create WABA Template</h1>
                    <p className="text-slate-400 text-sm mt-1.5 font-medium">Build message body, interactive buttons, and media headers matching Meta Cloud Guidelines.</p>
                </div>

                <CreateTemplateTab
                    templateName={tplName}
                    setTemplateName={setTplName}
                    category={tplCategory}
                    setCategory={setTplCategory}
                    language={tplLang}
                    setLanguage={setTplLang}
                    headerFormat={headerFormat}
                    setHeaderFormat={setHeaderFormat}
                    headerText={headerText}
                    setHeaderText={setHeaderText}
                    mediaSourceType={mediaSourceType}
                    setMediaSourceType={setMediaSourceType}
                    mediaUrl={mediaUrl}
                    setMediaUrl={setMediaUrl}
                    mediaFile={mediaFile}
                    setMediaFile={setMediaFile}
                    uploadProgress={uploadProgress}
                    setUploadProgress={setUploadProgress}
                    uploadError={uploadError}
                    setUploadError={setUploadError}
                    mediaHandle={mediaHandle}
                    setMediaHandle={setMediaHandle}
                    bodyText={bodyText}
                    setBodyText={setBodyText}
                    footerText={footerText}
                    setFooterText={setFooterText}
                    btnType={btnType}
                    setBtnType={setBtnType}
                    quickReplies={quickReplies}
                    setQuickReplies={setQuickReplies}
                    ctaLabel={ctaLabel}
                    setCtaLabel={setCtaLabel}
                    ctaUrl={ctaUrl}
                    setCtaUrl={setCtaUrl}
                    createLoading={createLoading}
                    createError={createError}
                    handleFileSelect={handleFileSelect}
                    handleUploadMedia={handleUploadMedia}
                    handleCreateTemplate={handleCreateTemplate}
                    setActiveTab={() => router.push(`/${slug}/whatsapp/templates`)}
                />
            </div>
        </TenantLayout>
    );
}
