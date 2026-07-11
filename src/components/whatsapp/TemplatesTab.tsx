import React, { useState } from 'react';
import { LayoutTemplate, Plus, RefreshCw, AlertTriangle, Trash2, XCircle, Eye, X } from 'lucide-react';
import LivePreview from './LivePreview';

function Pill({ children, className }: { children: React.ReactNode; className?: string }) {
    return <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full border ${className}`}>{children}</span>;
}

interface TemplatesTabProps {
    templates: any[];
    templatesLoading: boolean;
    templatesError: string | null;
    fetchTemplates: () => void;
    handleDeleteTemplate: (name: string) => void;
    setActiveTab: (tab: any) => void;
    isAdmin?: boolean;
}

export default function TemplatesTab({
    templates,
    templatesLoading,
    templatesError,
    fetchTemplates,
    handleDeleteTemplate,
    setActiveTab,
    isAdmin = false
}: TemplatesTabProps) {
    const [previewTemplate, setPreviewTemplate] = useState<any | null>(null);

    return (
        <div className="space-y-5">

            {templatesError && (
                <div className="flex items-start gap-2.5 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-2xl text-red-800 dark:text-red-400 text-xs">
                    <XCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                    <div>
                        <strong>Error loading templates:</strong> {templatesError}
                        <br />
                        <span className="text-red-650 dark:text-red-300/80 mt-1 block">Check your WABA settings and credentials in the Settings tab.</span>
                    </div>
                </div>
            )}

            {templatesLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="border border-border bg-neutral-50/20 dark:bg-neutral-900/10 rounded-2xl p-5 animate-pulse space-y-4">
                            <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-2/3" />
                            <div className="space-y-2">
                                <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-full" />
                                <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-5/6" />
                            </div>
                            <div className="h-5 bg-neutral-200 dark:bg-neutral-800 rounded-full w-20" />
                        </div>
                    ))}
                </div>
            ) : templates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 text-center border border-dashed border-border rounded-2xl bg-neutral-50/20 dark:bg-neutral-900/10">
                    <div className="p-5 bg-neutral-100 dark:bg-neutral-800/60 rounded-2xl">
                        <LayoutTemplate className="w-10 h-10 text-neutral-400 dark:text-neutral-500" />
                    </div>
                    <div>
                        <p className="font-bold text-foreground">No templates found</p>
                        <p className="text-xs text-neutral-500 mt-1 max-w-xs leading-relaxed">
                            Ensure your WhatsApp Business Account is fully active, or click &quot;Create Template&quot; to build your first template message.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templates.map((t, i) => {
                        const statusColors =
                            t.status === 'APPROVED' ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-250 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400' :
                            t.status === 'PENDING' ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-250 dark:border-amber-900 text-amber-700 dark:text-amber-400' :
                            t.status === 'REJECTED' ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-250 dark:border-rose-900 text-rose-700 dark:text-rose-450' :
                            'bg-neutral-50 dark:bg-neutral-850 border-neutral-200 text-neutral-600 dark:text-neutral-400';

                        const bodyText = t.components?.find((c: any) => c.type === 'BODY')?.text || '';

                        return (
                            <div key={i} className="group flex flex-col bg-card border border-border rounded-2xl overflow-hidden hover:shadow-md hover:border-emerald-500/30 dark:hover:border-emerald-500/20 transition-all duration-200">
                                <div className="p-5 flex-1 space-y-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <h3 className="font-bold text-sm text-foreground truncate select-all" title={t.name}>{t.name}</h3>
                                        <Pill className={statusColors}>{t.status}</Pill>
                                    </div>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-3 leading-relaxed whitespace-pre-wrap">{bodyText}</p>
                                </div>
                                <div className="px-5 py-3 bg-neutral-50/40 dark:bg-[#151522] border-t border-border flex items-center justify-between text-[11px] font-bold text-neutral-500 dark:text-neutral-400">
                                    <span className="uppercase tracking-wider font-mono">{t.language}</span>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => setPreviewTemplate(t)}
                                            className="p-1.5 rounded-lg text-neutral-450 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all"
                                            title="Preview Template">
                                            <Eye className="w-3.5 h-3.5" />
                                        </button>
                                        {isAdmin && (
                                            <button onClick={() => handleDeleteTemplate(t.name)}
                                                className="p-1.5 rounded-lg text-neutral-450 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                                                title="Delete template">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Template Eye Preview Modal */}
            {previewTemplate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
                    onClick={(e) => { if (e.target === e.currentTarget) setPreviewTemplate(null); }}>
                    <div className="bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-border p-6 shadow-2xl w-full max-w-sm relative flex flex-col items-center max-h-[90vh]">
                        <button onClick={() => setPreviewTemplate(null)}
                            className="absolute top-6 right-6 p-2 text-neutral-400 hover:text-foreground dark:hover:text-white rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors z-20">
                            <X className="w-5 h-5" />
                        </button>
                        
                        <div className="w-full overflow-y-auto pr-1 scrollbar-none flex flex-col items-center">
                            <LivePreview
                                headerFormat={previewTemplate.components?.find((c: any) => c.type === 'HEADER')?.format || 'NONE'}
                                headerText={previewTemplate.components?.find((c: any) => c.type === 'HEADER')?.text || ''}
                                bodyText={previewTemplate.components?.find((c: any) => c.type === 'BODY')?.text || ''}
                                footerText={previewTemplate.components?.find((c: any) => c.type === 'FOOTER')?.text || ''}
                                btnType={previewTemplate.components?.find((c: any) => c.type === 'BUTTONS') ? (previewTemplate.components.find((c: any) => c.type === 'BUTTONS').buttons?.[0]?.type === 'QUICK_REPLY' ? 'QUICK_REPLY' : 'URL') : 'NONE'}
                                quickReplies={previewTemplate.components?.find((c: any) => c.type === 'BUTTONS')?.buttons?.map((b: any) => b.text) || []}
                                ctaLabel={previewTemplate.components?.find((c: any) => c.type === 'BUTTONS')?.buttons?.[0]?.text || ''}
                                ctaUrl={previewTemplate.components?.find((c: any) => c.type === 'BUTTONS')?.buttons?.[0]?.url || ''}
                                previewParams={[]}
                                compact={true}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
