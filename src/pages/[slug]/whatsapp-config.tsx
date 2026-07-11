'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import TenantLayout from '@/components/tenant/TenantLayout';
import {
    LayoutTemplate, Plus, Send, Zap, Settings, HelpCircle, Loader2, AlertCircle, CheckCircle2
} from 'lucide-react';
import {
    getWhatsappSettings, updateWhatsappSettings, getWhatsappTemplates,
    createWhatsappTemplate, deleteWhatsappTemplate, uploadWhatsappMedia
} from '@/services/tenantService';
import { useConfirm } from '@/context/ConfirmContext';

// Subcomponents
import TemplatesTab from '@/components/whatsapp/TemplatesTab';
import CreateTemplateTab from '@/components/whatsapp/CreateTemplateTab';
import SendReminderTab from '@/components/whatsapp/SendReminderTab';
import KeywordRulesTab from '@/components/whatsapp/KeywordRulesTab';
import SettingsTab from '@/components/whatsapp/SettingsTab';
import ApiSandboxTab from '@/components/whatsapp/ApiSandboxTab';

type Tab = 'templates' | 'create' | 'reminder' | 'keywords' | 'settings' | 'sandbox';

interface WaSettings {
    whatsappApiBaseUrl: string;
    whatsappPhoneNumberId: string;
    whatsappAccessToken: string;
    whatsappWabaId: string;
    crmApiDomain: string;
    crmApiAccessToken: string;
}

// ─── Toast ────────────────────────────────────────────────────────────────────
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

export default function WhatsappConfig() {
    const router = useRouter();
    const { slug } = router.query as { slug: string };
    const { toast, show } = useToast();
    const confirm = useConfirm();

    const [activeTab, setActiveTab] = useState<Tab>('templates');
    const [pageLoading, setPageLoading] = useState(true);

    // ── API Sandbox State ─────────────────────────────────────────────────────
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const [testPhone] = useState('919974401999');
    const [testPerson] = useState('VIPULBHAI MORADIYA');
    const [testDoc] = useState('GST Certificate');
    const [apiUrl, setApiUrl] = useState('');
    const [displayImageHost, setDisplayImageHost] = useState('');
    const [currentUser, setCurrentUser] = useState<any>(null);

    // ── Shared ────────────────────────────────────────────────────────────────
    const [templates, setTemplates] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [templatesLoading, setTemplatesLoading] = useState(false);
    const [templatesError, setTemplatesError] = useState('');
    const [configMissing, setConfigMissing] = useState(false);

    // ── Settings ──────────────────────────────────────────────────────────────
    const [settingsForm, setSettingsForm] = useState<WaSettings>({ whatsappApiBaseUrl: '', whatsappPhoneNumberId: '', whatsappAccessToken: '', whatsappWabaId: '', crmApiDomain: '', crmApiAccessToken: '' });
    const [saveLoading, setSaveLoading] = useState(false);
    const [whatsappKeywordRules, setWhatsappKeywordRules] = useState<Record<string, any>>({});

    // ── Create template ───────────────────────────────────────────────────────
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

    // ─── Fetch templates ──────────────────────────────────────────────────────
    const fetchTemplates = useCallback(async () => {
        if (!slug) return;
        setTemplatesLoading(true);
        setTemplatesError('');
        setConfigMissing(false);
        try {
            const res = await getWhatsappTemplates(slug);
            if (res.success) setTemplates(res.data || []);
        } catch (err: any) {
            const msg: string = err.response?.data?.message || err.message || 'Failed to load templates.';
            if (msg.toLowerCase().includes('not fully configured') || msg.toLowerCase().includes('not configured')) {
                setConfigMissing(true);
            } else {
                setTemplatesError(msg);
            }
        } finally {
            setTemplatesLoading(false);
        }
    }, [slug]);

    // ─── Init ─────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!slug) return;
        const init = async () => {
            setPageLoading(true);
            try {
                const settingsRes = await getWhatsappSettings(slug);
                if (settingsRes.success && settingsRes.data) {
                    const d = settingsRes.data;
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
            } finally {
                setPageLoading(false);
            }
        };
        init();
        fetchTemplates();
    }, [slug, fetchTemplates]);

    useEffect(() => {
        if (!slug) return;
        const userStr = localStorage.getItem(`staff_user_${slug}`);
        if (userStr) {
            try {
                const u = JSON.parse(userStr);
                setCurrentUser(u);
                if (u.role === 'staff' && !router.query.tab) {
                    setActiveTab('reminder');
                }
            } catch (e) {}
        }
    }, [slug, router.query.tab]);

    useEffect(() => {
        if (router.query.tab) {
            setActiveTab(router.query.tab as Tab);
        }
    }, [router.query.tab]);

    useEffect(() => {
        const publicApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/v1/api';
        const cleanApiUrl = publicApiUrl.endsWith('/') ? publicApiUrl.slice(0, -1) : publicApiUrl;
        setApiUrl(`${cleanApiUrl}/automation`);

        const publicImageUrl = process.env.IMAGE_URL || 'http://localhost:5000';
        let cleanImageUrl = publicImageUrl.endsWith('/') ? publicImageUrl.slice(0, -1) : publicImageUrl;
        if (!cleanImageUrl.endsWith('/api')) {
            cleanImageUrl = `${cleanImageUrl}/api`;
        }
        setDisplayImageHost(cleanImageUrl);
    }, []);

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
                setMediaUrl(res.handle);
                setUploadProgress('done');
                show('File uploaded successfully! Ready to submit.', 'success');
            } else {
                throw new Error(res.message || 'No handle returned from upload');
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || 'Upload failed';
            setUploadError(msg);
            setUploadProgress('idle');
            show(msg, 'error');
        }
    };

    // ─── Create template ──────────────────────────────────────────────────────
    const handleCreateTemplate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!slug) return;
        setCreateError(null);

        const cleanName = tplName.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
        if (!cleanName) { setCreateError('Template name is required.'); return; }
        if (!bodyText.trim()) { setCreateError('Body text is required.'); return; }
        
        if (headerFormat === 'IMAGE' || headerFormat === 'VIDEO' || headerFormat === 'DOCUMENT') {
            if (mediaSourceType === 'upload' && uploadProgress !== 'done') {
                setCreateError('Please upload the media file first before submitting.');
                return;
            }
            if (mediaSourceType === 'url' && !mediaUrl.trim()) {
                setCreateError(`Please paste a public ${headerFormat.toLowerCase()} URL for the header.`);
                return;
            }
        }

        setCreateLoading(true);
        try {
            const components: any[] = [];

            // --- Header ---
            if (headerFormat === 'TEXT' && headerText.trim()) {
                const hc: any = { type: 'HEADER', format: 'TEXT', text: headerText.trim() };
                if (/\{\{\d+\}\}/.test(headerText)) {
                    hc.example = { header_text: ['Sample Header Value'] };
                }
                components.push(hc);
            } else if (headerFormat !== 'NONE' && headerFormat !== 'TEXT') {
                components.push({
                    type: 'HEADER',
                    format: headerFormat,
                    example: { header_handle: [mediaUrl.trim()] },
                });
            }

            // --- Body ---
            const bodyComp: any = { type: 'BODY', text: bodyText.trim() };
            const vars = bodyText.match(/\{\{\d+\}\}/g);
            if (vars) {
                const maxIdx = Math.max(...vars.map(v => parseInt(v.replace(/\D/g, ''))));
                bodyComp.example = { body_text: [Array(maxIdx).fill('Sample')] };
            }
            components.push(bodyComp);

            // --- Footer ---
            if (footerText.trim()) {
                components.push({ type: 'FOOTER', text: footerText.trim() });
            }

            // --- Buttons ---
            if (btnType === 'QUICK_REPLY') {
                const btns = quickReplies.filter(b => b.trim()).map(b => ({ type: 'QUICK_REPLY', text: b.trim() }));
                if (btns.length) components.push({ type: 'BUTTONS', buttons: btns });
            } else if (btnType === 'URL' && ctaLabel.trim() && ctaUrl.trim()) {
                components.push({ type: 'BUTTONS', buttons: [{ type: 'URL', text: ctaLabel.trim(), url: ctaUrl.trim() }] });
            }

            await createWhatsappTemplate(slug, { name: cleanName, category: tplCategory, language: tplLang, components });
            show('Template submitted to Meta for review! It will appear in Templates once approved.', 'success');

            // Reset form
            setTplName(''); setBodyText(''); setHeaderText(''); setFooterText('');
            setHeaderFormat('NONE'); setBtnType('NONE'); setQuickReplies(['', '', '']);
            setCtaLabel(''); setCtaUrl(''); setMediaUrl(''); setMediaFile(null);
            setMediaSourceType('upload'); setUploadProgress('idle'); setUploadError(null);
            fetchTemplates();
            handleTabChange('templates');
        } catch (err: any) {
            const metaMsg = err.response?.data?.message || err.response?.data?.error?.error?.message || err.message;
            setCreateError(metaMsg || 'Failed to create template.');
            show(metaMsg || 'Failed to create template.', 'error');
        } finally {
            setCreateLoading(false);
        }
    };

    // ─── Delete template ──────────────────────────────────────────────────────
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

    // ─── Keyword rules ────────────────────────────────────────────────────────
    const handleSaveRules = async (updatedRules: Record<string, any>) => {
        if (!slug) return;
        try {
            await updateWhatsappSettings(slug, { whatsappKeywordRules: updatedRules });
            setWhatsappKeywordRules(updatedRules);
            show('Keyword rules saved!', 'success');
        } catch {
            show('Failed to save rules.', 'error');
        }
    };

    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!slug) return;
        setSaveLoading(true);
        try {
            await updateWhatsappSettings(slug, settingsForm);
            show('Settings saved! Refreshing templates...', 'success');
            fetchTemplates();
        } catch (err: any) {
            show(err.response?.data?.message || 'Failed to save settings.', 'error');
        } finally {
            setSaveLoading(false);
        }
    };

    const handleTabChange = (tabId: Tab) => {
        setActiveTab(tabId);
        router.replace(
            {
                pathname: `/[slug]/whatsapp-config`,
                query: { slug, tab: tabId }
            },
            undefined,
            { shallow: true }
        );
    };

    const copyToClipboard = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    // ─── Tab bar ──────────────────────────────────────────────────────────────
    const tabs = ([
        { id: 'templates', label: 'Templates', icon: <LayoutTemplate className="w-4 h-4" /> },
        { id: 'create', label: 'Create Template', icon: <Plus className="w-4 h-4" /> },
        { id: 'reminder', label: 'Send Reminder', icon: <Send className="w-4 h-4" /> },
        { id: 'keywords', label: 'Keyword Rules', icon: <Zap className="w-4 h-4" /> },
        { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
        { id: 'sandbox', label: 'API Sandbox', icon: <HelpCircle className="w-4 h-4" /> },
    ] as { id: Tab; label: string; icon: React.ReactNode }[]).filter(tab => {
        if (currentUser?.role === 'staff') {
            return tab.id === 'reminder' || tab.id === 'sandbox';
        }
        return true;
    });

    return (
        <TenantLayout title="WhatsApp Automation">
            {toast && <Toast msg={toast.msg} type={toast.type} />}

            <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-5">

                {/* Hero Banner */}
                <div className="relative overflow-hidden bg-gradient-to-br from-[#075e54] via-[#128c7e] to-[#25d366] rounded-2xl p-6 text-white shadow-xl shadow-emerald-900/20">
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 70% 30%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
                    <div className="relative flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <p className="text-emerald-100/80 text-xs font-semibold uppercase tracking-widest mb-1">WhatsApp Business Cloud API</p>
                            <h1 className="text-2xl md:text-3xl font-black tracking-tight">WhatsApp Automation Hub</h1>
                            <p className="text-emerald-100/70 text-sm mt-1 max-w-md">Templates · Auto-reminders · Keyword replies · API config</p>
                        </div>
                        <div className="text-right">
                            <p className="text-emerald-100/70 text-xs">Templates ready</p>
                            <p className="text-4xl font-black">{templates.filter(t => t.status === 'APPROVED').length}<span className="text-xl text-white/50">/{templates.length}</span></p>
                        </div>
                    </div>
                </div>

                {/* Config Missing Banner */}
                {configMissing && !pageLoading && (
                    <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-900/40 rounded-2xl text-amber-900 dark:text-amber-400 text-sm animate-fade-in">
                        <div className="flex items-center gap-2.5">
                            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                            <span><strong>WhatsApp not configured.</strong> Add your API credentials to enable messaging features.</span>
                        </div>
                        <button onClick={() => handleTabChange('settings')}
                            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-amber-100 hover:bg-amber-200 dark:bg-neutral-800 text-amber-900 dark:text-neutral-300 rounded-xl border border-amber-300 dark:border-neutral-700 transition-all">
                            <Settings className="w-3.5 h-3.5" /> Go to Settings
                        </button>
                    </div>
                )}

                {/* Tab Container */}
                <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                    {/* Tab bar */}
                    <div className="flex overflow-x-auto scrollbar-none border-b border-border bg-neutral-50/60 dark:bg-neutral-900/60">
                        {tabs.map(tab => (
                            <button key={tab.id} onClick={() => handleTabChange(tab.id)}
                                className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold whitespace-nowrap transition-all border-b-2 ${
                                    activeTab === tab.id
                                        ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-neutral-900 shadow-sm'
                                        : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-foreground dark:hover:text-neutral-200 hover:bg-white/60 dark:hover:bg-neutral-800/40'
                                }`}>
                                {tab.icon}{tab.label}
                            </button>
                        ))}
                    </div>

                    {pageLoading ? (
                        <div className="flex items-center justify-center gap-3 py-24 text-neutral-400">
                            <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                            <span className="text-sm font-medium">Loading configuration...</span>
                        </div>
                    ) : (
                        <div className="p-5 md:p-6 animate-fade-in">
                            {activeTab === 'templates' && currentUser?.role !== 'staff' && (
                                <TemplatesTab
                                    templates={templates}
                                    templatesLoading={templatesLoading}
                                    templatesError={templatesError}
                                    fetchTemplates={fetchTemplates}
                                    handleDeleteTemplate={handleDeleteTemplate}
                                    setActiveTab={handleTabChange}
                                />
                            )}

                            {activeTab === 'create' && currentUser?.role !== 'staff' && (
                                <CreateTemplateTab
                                    createLoading={createLoading}
                                    createError={createError}
                                    templateName={tplName} setTemplateName={setTplName}
                                    language={tplLang} setLanguage={setTplLang}
                                    category={tplCategory} setCategory={setTplCategory}
                                    headerFormat={headerFormat} setHeaderFormat={setHeaderFormat}
                                    headerText={headerText} setHeaderText={setHeaderText}
                                    bodyText={bodyText} setBodyText={setBodyText}
                                    footerText={footerText} setFooterText={setFooterText}
                                    btnType={btnType} setBtnType={setBtnType}
                                    quickReplies={quickReplies} setQuickReplies={setQuickReplies}
                                    ctaLabel={ctaLabel} setCtaLabel={setCtaLabel}
                                    ctaUrl={ctaUrl} setCtaUrl={setCtaUrl}
                                    mediaSourceType={mediaSourceType} setMediaSourceType={setMediaSourceType}
                                    mediaUrl={mediaUrl} setMediaUrl={setMediaUrl}
                                    mediaFile={mediaFile} setMediaFile={setMediaFile}
                                    uploadProgress={uploadProgress} setUploadProgress={setUploadProgress}
                                    uploadError={uploadError} setUploadError={setUploadError}
                                    mediaHandle={mediaHandle} setMediaHandle={setMediaHandle}
                                    handleUploadMedia={handleUploadMedia}
                                    handleFileSelect={handleFileSelect}
                                    handleCreateTemplate={handleCreateTemplate}
                                    setActiveTab={handleTabChange}
                                />
                            )}

                            {activeTab === 'reminder' && (
                                <SendReminderTab
                                    clients={clients}
                                    templates={templates}
                                    slug={slug}
                                    show={show}
                                />
                            )}

                            {activeTab === 'keywords' && currentUser?.role !== 'staff' && (
                                <KeywordRulesTab
                                    rulesLoading={saveLoading}
                                    templates={templates}
                                    whatsappKeywordRules={whatsappKeywordRules}
                                    handleSaveRules={handleSaveRules}
                                />
                            )}

                            {activeTab === 'settings' && currentUser?.role !== 'staff' && (
                                <SettingsTab
                                    saveLoading={saveLoading}
                                    settingsForm={settingsForm}
                                    setSettingsForm={setSettingsForm}
                                    handleSaveSettings={handleSaveSettings}
                                />
                            )}

                            {activeTab === 'sandbox' && (
                                <ApiSandboxTab
                                    slug={slug}
                                    apiUrl={apiUrl}
                                    displayImageHost={displayImageHost}
                                    testPhone={testPhone}
                                    testPerson={testPerson}
                                    testDoc={testDoc}
                                    copiedIndex={copiedIndex}
                                    copyToClipboard={copyToClipboard}
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>
        </TenantLayout>
    );
}
