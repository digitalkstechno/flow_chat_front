import React, { useRef } from 'react';
import { ChevronDown, Upload, CheckCircle2, Video, FileText, Image, AlertCircle, HelpCircle, Link, Plus, Type, Loader2 } from 'lucide-react';
import LivePreview from './LivePreview';

function StepHeader({ step, title, desc }: { step: string; title: string; desc: string }) {
    return (
        <div className="flex items-center gap-3.5 mb-5 border-b border-border pb-3">
            <span className="flex items-center justify-center w-7 h-7 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold rounded-lg text-xs shrink-0 select-none">
                {step}
            </span>
            <div>
                <h3 className="font-bold text-sm text-foreground">{title}</h3>
                <p className="text-[11px] text-neutral-450 mt-0.5 font-medium">{desc}</p>
            </div>
        </div>
    );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400">{label}</label>
            {children}
            {hint && <p className="text-[10px] text-neutral-400 leading-snug">{hint}</p>}
        </div>
    );
}

function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input {...props}
            className={`w-full px-3.5 py-2.5 text-sm bg-white dark:bg-neutral-950 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/25 text-foreground transition-shadow ${className || ''}`} />
    );
}

function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
    return (
        <div className="relative">
            <select {...props}
                className={`w-full appearance-none px-3.5 py-2.5 text-sm bg-white dark:bg-neutral-950 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/25 text-foreground pr-9 ${className || ''}`}>
                {children}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
        </div>
    );
}

interface CreateTemplateTabProps {
    createLoading: boolean;
    createError: string | null;
    templateName: string; setTemplateName: (v: string) => void;
    language: string; setLanguage: (v: string) => void;
    category: string; setCategory: (v: string) => void;
    headerFormat: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'NONE'; setHeaderFormat: (v: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'NONE') => void;
    headerText: string; setHeaderText: (v: string) => void;
    bodyText: string; setBodyText: (v: string) => void;
    footerText: string; setFooterText: (v: string) => void;
    btnType: 'NONE' | 'QUICK_REPLY' | 'URL'; setBtnType: (v: 'NONE' | 'QUICK_REPLY' | 'URL') => void;
    quickReplies: string[]; setQuickReplies: (v: string[]) => void;
    ctaLabel: string; setCtaLabel: (v: string) => void;
    ctaUrl: string; setCtaUrl: (v: string) => void;
    mediaSourceType: 'upload' | 'url'; setMediaSourceType: (v: 'upload' | 'url') => void;
    mediaUrl: string; setMediaUrl: (v: string) => void;
    mediaFile: File | null; setMediaFile: (v: File | null) => void;
    uploadProgress: 'idle' | 'uploading' | 'done'; setUploadProgress: (v: 'idle' | 'uploading' | 'done') => void;
    uploadError: string | null; setUploadError: (v: string | null) => void;
    mediaHandle: string; setMediaHandle: (v: string) => void;
    handleUploadMedia: () => Promise<void>;
    handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleCreateTemplate: (e: React.FormEvent) => void;
    setActiveTab: (tab: 'templates' | 'create' | 'reminder' | 'keywords' | 'settings' | 'sandbox') => void;
}

const MIME_ACCEPT = {
    IMAGE: 'image/jpeg, image/png',
    VIDEO: 'video/mp4',
    DOCUMENT: 'application/pdf',
    TEXT: '',
    NONE: ''
};

const HEADER_ICON = {
    IMAGE: <Image className="w-6 h-6 text-emerald-500" />,
    VIDEO: <Video className="w-6 h-6 text-emerald-500" />,
    DOCUMENT: <FileText className="w-6 h-6 text-emerald-500" />,
    TEXT: null,
    NONE: null
};

export default function CreateTemplateTab({
    createLoading,
    createError,
    templateName, setTemplateName,
    language, setLanguage,
    category, setCategory,
    headerFormat, setHeaderFormat,
    headerText, setHeaderText,
    bodyText, setBodyText,
    footerText, setFooterText,
    btnType, setBtnType,
    quickReplies, setQuickReplies,
    ctaLabel, setCtaLabel,
    ctaUrl, setCtaUrl,
    mediaSourceType, setMediaSourceType,
    mediaUrl, setMediaUrl,
    mediaFile, setMediaFile,
    uploadProgress, setUploadProgress,
    uploadError, setUploadError,
    mediaHandle, setMediaHandle,
    handleUploadMedia,
    handleFileSelect,
    handleCreateTemplate,
    setActiveTab
}: CreateTemplateTabProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const bodyVarCount = (() => {
        const m = bodyText.match(/\{\{\d+\}\}/g);
        return m ? Math.max(...m.map((v: string) => parseInt(v.replace(/\D/g, '')))) : 0;
    })();

    const previewParams = Array.from({ length: bodyVarCount }, (_, i) => `[Variable ${i + 1}]`);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <form onSubmit={handleCreateTemplate} className="space-y-6">
                    <div>
                        <h2 className="text-lg font-bold text-foreground">Create Message Template</h2>
                        <p className="text-xs text-neutral-500 mt-0.5">Submit custom messaging components to Meta developers panel for bulk campaigns review.</p>
                    </div>

                    {createError && (
                        <div className="flex items-start gap-2.5 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-2xl text-red-800 dark:text-red-400 text-xs">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                            <div><strong>Failed to submit template:</strong> {createError}</div>
                        </div>
                    )}

                    {/* Step 1: Meta Profile */}
                    <div className="bg-card border border-border rounded-2xl p-6 shadow-xs">
                        <StepHeader step="1" title="Template Settings" desc="Assign template name identifiers and target user context categories." />
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Field label="Template ID / Identifier Name *" hint="Lowercase, letters, numbers, underscores.">
                                <Input required value={templateName} onChange={e => setTemplateName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} placeholder="e.g. itr_reminder" />
                            </Field>
                            <Field label="Language Code *" hint="WABA ISO Code: en_US, gu, hi.">
                                <Input required value={language} onChange={e => setLanguage(e.target.value.trim())} placeholder="en_US" className="font-mono text-xs text-center" />
                            </Field>
                            <Field label="Meta Category *">
                                <Select value={category} onChange={e => setCategory(e.target.value)}>
                                    <option value="UTILITY">Utility Alerts &amp; Messages</option>
                                    <option value="MARKETING">Marketing &amp; Promotions</option>
                                </Select>
                            </Field>
                        </div>
                    </div>

                    {/* Step 2: Header formatting */}
                    <div className="bg-card border border-border rounded-2xl p-6 shadow-xs">
                        <StepHeader step="2" title="Header Configuration" desc="Optional header options, including text headings or document files." />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <Field label="Header Format" hint="Choose header format style.">
                                <Select value={headerFormat} onChange={e => { setHeaderFormat(e.target.value as any); setMediaFile(null); setMediaUrl(''); setMediaHandle(''); setUploadProgress('idle'); }}>
                                    <option value="NONE">No Header</option>
                                    <option value="TEXT">Text Header Title</option>
                                    <option value="IMAGE">📷 Image Header Banner</option>
                                    <option value="VIDEO">🎥 Video Header Clip</option>
                                    <option value="DOCUMENT">📄 Document PDF Attachment</option>
                                </Select>
                            </Field>

                            {headerFormat === 'TEXT' && (
                                <Field label="Header Title Text" hint="Max 60 chars. Variables allowed, e.g. {{1}}.">
                                    <Input value={headerText} onChange={e => setHeaderText(e.target.value)} placeholder="e.g. Document Request" maxLength={60} />
                                </Field>
                            )}
                        </div>

                        {(headerFormat === 'IMAGE' || headerFormat === 'VIDEO' || headerFormat === 'DOCUMENT') && (
                            <div className="space-y-4 border-t border-border/60 pt-4.5 mt-4.5">
                                <div className="flex gap-1.5 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl max-w-xs border border-border">
                                    <button type="button" onClick={() => { setMediaSourceType('upload'); setMediaUrl(''); setMediaFile(null); setUploadProgress('idle'); }}
                                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                            mediaSourceType === 'upload' ? 'bg-white dark:bg-neutral-900 shadow text-emerald-600 dark:text-emerald-450' : 'text-neutral-500 hover:text-foreground'
                                        }`}>
                                        Upload File
                                    </button>
                                    <button type="button" onClick={() => { setMediaSourceType('url'); setMediaUrl(''); setMediaFile(null); setUploadProgress('idle'); }}
                                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                            mediaSourceType === 'url' ? 'bg-white dark:bg-neutral-900 shadow text-emerald-600 dark:text-emerald-450' : 'text-neutral-500 hover:text-foreground'
                                        }`}>
                                        Paste Link
                                    </button>
                                </div>

                                {mediaSourceType === 'upload' ? (
                                    <div className="space-y-3.5">
                                        <div onClick={() => fileInputRef.current?.click()}
                                            className={`relative flex flex-col items-center justify-center gap-3.5 p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                                                mediaFile ? 'border-emerald-450 bg-emerald-50/10 dark:bg-emerald-950/10' : 'border-border hover:border-emerald-400 hover:bg-neutral-50 dark:hover:bg-neutral-900/20'
                                            }`}>
                                            <input ref={fileInputRef} type="file" accept={MIME_ACCEPT[headerFormat]} onChange={handleFileSelect} className="sr-only" />
                                            {mediaFile ? (
                                                <>
                                                    {HEADER_ICON[headerFormat]}
                                                    <div className="text-center">
                                                        <p className="text-xs font-bold text-foreground truncate max-w-xs">{mediaFile.name}</p>
                                                        <p className="text-[10px] text-neutral-400">{(mediaFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
                                                        <Upload className="w-5 h-5 text-neutral-400" />
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-xs font-bold text-foreground">Click to select {headerFormat.toLowerCase()}</p>
                                                        <p className="text-[10px] text-neutral-400 mt-0.5">
                                                            {headerFormat === 'IMAGE' && 'JPEG/PNG, max 5 MB'}
                                                            {headerFormat === 'VIDEO' && 'MP4, max 15 MB'}
                                                            {headerFormat === 'DOCUMENT' && 'PDF, max 15 MB'}
                                                        </p>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        {mediaFile && uploadProgress !== 'done' && (
                                            <button type="button" onClick={handleUploadMedia} disabled={uploadProgress === 'uploading'}
                                                className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl transition-all shadow-sm">
                                                {uploadProgress === 'uploading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                                {uploadProgress === 'uploading' ? 'Uploading to Meta...' : 'Upload File Attachment'}
                                            </button>
                                        )}
                                        {uploadError && <p className="text-xs text-red-500 flex items-center gap-1.5 mt-1.5"><AlertCircle className="w-4 h-4" /> {uploadError}</p>}
                                        {uploadProgress === 'done' && (
                                            <div className="flex items-center gap-2 text-xs text-emerald-805 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-4 py-3 rounded-xl border border-emerald-200 dark:border-emerald-900/30">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-505" />
                                                <span>Metadata attachment linked successfully.</span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <Field label={`${headerFormat.charAt(0) + headerFormat.slice(1).toLowerCase()} Web URL *`}>
                                        <div className="relative">
                                            <Link className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                                            <Input required type="url" value={mediaUrl} onChange={e => setMediaUrl(e.target.value)} placeholder="https://example.com/file.jpg" className="pl-10 font-mono text-xs" />
                                        </div>
                                    </Field>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Step 3: Message Body */}
                    <div className="bg-card border border-border rounded-2xl p-6 shadow-xs">
                        <StepHeader step="3" title="Message Content Body" desc="Standard text body copy. Place {{1}}, {{2}} to mark fields mapped to clients dynamically." />
                        <div className="space-y-4">
                            <textarea required rows={5} value={bodyText} onChange={e => setBodyText(e.target.value)} maxLength={1024}
                                placeholder={`Dear {{1}},\n\nThis is a notification regarding your ITR filings for {{2}}.\n\nBest Regards,\nTeam`}
                                className="w-full px-4 py-3 text-sm bg-white dark:bg-neutral-950 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/25 text-foreground resize-none leading-relaxed" />
                            
                            {bodyVarCount > 0 && (
                                <div className="flex items-center gap-2 text-xs text-emerald-850 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-4 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900/30">
                                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-505" />
                                    <span>Detected <strong>{bodyVarCount}</strong> custom parameters mapping placeholder{bodyVarCount > 1 ? 's' : ''}.</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Step 4: Footer and buttons */}
                    <div className="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-5">
                        <StepHeader step="4" title="Footer &amp; Interaction Buttons" desc="Configure message footers and optional interactive link CTAs." />
                        
                        <Field label="Footer Disclaimer Label (Optional)" hint="Disclaimers or copyright tags. Max 60 chars.">
                            <Input value={footerText} onChange={e => setFooterText(e.target.value)} placeholder="e.g. Reply STOP to unsubscribe" maxLength={60} />
                        </Field>

                        <div className="space-y-4.5 border-t border-border/60 pt-4.5">
                            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-450">Select Button Type</label>
                            <div className="flex flex-wrap gap-2.5">
                                {(['NONE', 'QUICK_REPLY', 'URL'] as const).map(bt => (
                                    <button key={bt} type="button" onClick={() => setBtnType(bt)}
                                        className={`px-4.5 py-2.5 text-xs font-bold rounded-xl border transition-all ${
                                            btnType === bt
                                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 font-bold'
                                                : 'border-border bg-white dark:bg-neutral-900 text-neutral-500 hover:border-neutral-350 hover:bg-neutral-50'
                                        }`}>
                                        {bt === 'NONE' ? 'No Buttons' : bt === 'QUICK_REPLY' ? 'Quick Reply' : 'CTA Call-to-Action Link'}
                                    </button>
                                ))}
                            </div>

                            {btnType === 'QUICK_REPLY' && (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {quickReplies.map((v, i) => (
                                        <Field key={i} label={`Button Label ${i + 1}`}>
                                            <Input value={v} onChange={e => { const u = [...quickReplies]; u[i] = e.target.value; setQuickReplies(u); }} placeholder={`Quick reply text`} maxLength={25} />
                                        </Field>
                                    ))}
                                </div>
                            )}

                            {btnType === 'URL' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4.5">
                                    <Field label="Button Display Label">
                                        <Input value={ctaLabel} onChange={e => setCtaLabel(e.target.value)} placeholder="e.g. View Portal" maxLength={25} />
                                    </Field>
                                    <Field label="Redirect Link URL *">
                                        <Input value={ctaUrl} onChange={e => setCtaUrl(e.target.value)} placeholder="https://yourportal.com" type="url" className="font-mono text-xs" />
                                    </Field>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Submissions */}
                    <div className="flex items-center gap-3.5 pt-1.5">
                        <button type="submit" disabled={createLoading}
                            className="flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl transition-all shadow-md shadow-emerald-650/10">
                            {createLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            {createLoading ? 'Submitting to Meta...' : 'Submit and Approve Template'}
                        </button>
                        <button type="button" onClick={() => setActiveTab('templates')}
                            className="text-sm font-semibold text-neutral-500 hover:text-foreground dark:hover:text-white transition-colors">
                            Cancel
                        </button>
                    </div>

                </form>
            </div>

            {/* Live Preview Side Column */}
            <div className="lg:col-span-1">
                <div className="sticky top-24">
                    <LivePreview
                        headerFormat={headerFormat}
                        headerText={headerText}
                        bodyText={bodyText}
                        footerText={footerText}
                        btnType={btnType}
                        quickReplies={quickReplies}
                        ctaLabel={ctaLabel}
                        ctaUrl={ctaUrl}
                        previewParams={previewParams}
                    />
                </div>
            </div>
        </div>
    );
}
