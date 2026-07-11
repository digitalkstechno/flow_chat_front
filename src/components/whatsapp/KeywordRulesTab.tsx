import React, { useState, useEffect } from 'react';
import { Zap, Plus, Pencil, Trash2, ChevronDown, Check, Loader2, Play } from 'lucide-react';
import { useConfirm } from '@/context/ConfirmContext';

function SectionCard({ title, children, dot }: { title: string; dot?: string; children: React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-border bg-neutral-50/50 dark:bg-neutral-900/30 p-5 space-y-4">
            <div className="flex items-center gap-2">
                {dot && <span className={`w-2 h-2 rounded-full ${dot}`} />}
                <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-450 uppercase tracking-widest">{title}</span>
            </div>
            {children}
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

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
    return (
        <button type="button" onClick={onChange} aria-pressed={on}
            className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors duration-200 focus:outline-none ${on ? 'bg-emerald-500' : 'bg-neutral-300 dark:bg-neutral-600'}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${on ? 'translate-x-5' : 'translate-x-1'}`} />
        </button>
    );
}

interface KwRule {
    keyword: string;
    template: string;
    lang: string;
    parameters: string[];
    sendTemplate: boolean;
}

interface KeywordRulesTabProps {
    rulesLoading: boolean;
    templates: any[];
    whatsappKeywordRules: Record<string, any>;
    handleSaveRules: (updatedRules: Record<string, any>) => Promise<void>;
}

export default function KeywordRulesTab({
    rulesLoading,
    templates,
    whatsappKeywordRules,
    handleSaveRules
}: KeywordRulesTabProps) {
    const confirm = useConfirm();
    const [editingIdx, setEditingIdx] = useState<number | null>(null);
    const [kwForm, setKwForm] = useState({
        keyword: '',
        template: '',
        lang: 'en',
        parametersRaw: '',
        sendTemplate: true
    });

    const [rules, setRules] = useState<KwRule[]>([]);

    // Load keyword rules on mount / rules updates
    useEffect(() => {
        const rulesList: KwRule[] = [];
        if (whatsappKeywordRules) {
            Object.keys(whatsappKeywordRules).forEach(kw => {
                const item = whatsappKeywordRules[kw];
                rulesList.push({
                    keyword: kw,
                    template: item.template || '',
                    lang: item.lang || 'en',
                    parameters: item.parameters || [],
                    sendTemplate: item.sendTemplate !== false
                });
            });
        }
        setRules(rulesList);
    }, [whatsappKeywordRules]);

    const handleFormSubmit = async () => {
        const kw = kwForm.keyword.trim().toLowerCase();
        const tpl = kwForm.template.trim();
        if (!kw || !tpl) return;

        const newRule: KwRule = {
            keyword: kw,
            template: tpl,
            lang: kwForm.lang || 'en',
            parameters: kwForm.parametersRaw.split(',').map(s => s.trim()).filter(Boolean),
            sendTemplate: kwForm.sendTemplate
        };

        let updated: KwRule[];
        if (editingIdx !== null) {
            updated = [...rules];
            updated[editingIdx] = newRule;
        } else {
            // Guard duplicate keyword
            if (rules.some(r => r.keyword === kw)) {
                alert(`Keyword "${kw}" already exists.`);
                return;
            }
            updated = [...rules, newRule];
        }

        // Convert back to Record<string, any>
        const rulesObject: Record<string, any> = {};
        updated.forEach(r => {
            rulesObject[r.keyword] = {
                template: r.template,
                lang: r.lang,
                parameters: r.parameters,
                sendTemplate: r.sendTemplate
            };
        });

        await handleSaveRules(rulesObject);
        setEditingIdx(null);
        setKwForm({ keyword: '', template: '', lang: 'en', parametersRaw: '', sendTemplate: true });
    };

    const handleEditRule = (idx: number) => {
        const r = rules[idx];
        setEditingIdx(idx);
        setKwForm({
            keyword: r.keyword,
            template: r.template,
            lang: r.lang,
            parametersRaw: r.parameters.join(', '),
            sendTemplate: r.sendTemplate
        });
    };

    const handleDeleteRule = async (idx: number) => {
        const isConfirmed = await confirm({
            title: 'Delete Rule',
            message: 'Are you sure you want to delete this auto-reply keyword rule?',
            confirmLabel: 'Delete',
            cancelLabel: 'Keep',
            variant: 'danger'
        });
        if (!isConfirmed) return;
        const updated = rules.filter((_, i) => i !== idx);

        const rulesObject: Record<string, any> = {};
        updated.forEach(r => {
            rulesObject[r.keyword] = {
                template: r.template,
                lang: r.lang,
                parameters: r.parameters,
                sendTemplate: r.sendTemplate
            };
        });

        await handleSaveRules(rulesObject);
    };

    return (
        <div className="space-y-5">

            <SectionCard title={editingIdx !== null ? '✏️ Edit Auto-Reply Rule' : '➕ Add New Rule'} dot={editingIdx !== null ? 'bg-amber-450' : 'bg-emerald-500'}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Trigger Keyword *" hint="Case-insensitive keyword. e.g. 'price' triggers this rule.">
                        <Input value={kwForm.keyword} onChange={e => setKwForm(f => ({ ...f, keyword: e.target.value }))} placeholder="e.g. price, hello, confirm" />
                    </Field>
                    <Field label="Template Name *" hint="Select which Meta template is sent as the reply.">
                        <Select value={kwForm.template} onChange={e => {
                            const tpl = templates.find(t => t.name === e.target.value);
                            setKwForm(f => ({ ...f, template: e.target.value, lang: tpl?.language || f.lang }));
                        }}>
                            <option value="">— Select Template —</option>
                            {templates.map((t, i) => (
                                <option key={i} value={t.name}>{t.name} ({t.language}) {t.status !== 'APPROVED' ? `[${t.status}]` : ''}</option>
                            ))}
                        </Select>
                    </Field>
                    <Field label="Language Code">
                        <Input value={kwForm.lang} onChange={e => setKwForm(f => ({ ...f, lang: e.target.value }))} placeholder="en" className="font-mono text-xs" />
                    </Field>
                    <Field label="Parameters (comma separated)" hint="Dynamic variables to fill like {{1}}, {{2}}. e.g. {{clientName}}">
                        <Input value={kwForm.parametersRaw} onChange={e => setKwForm(f => ({ ...f, parametersRaw: e.target.value }))} placeholder="e.g. {{clientName}}, invoice" />
                    </Field>
                </div>
                <div className="flex items-center gap-3 pt-1">
                    <Toggle on={kwForm.sendTemplate} onChange={() => setKwForm(f => ({ ...f, sendTemplate: !f.sendTemplate }))} />
                    <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Auto-send template when keyword is matched</span>
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-border">
                    {editingIdx !== null && (
                        <button type="button" onClick={() => { setEditingIdx(null); setKwForm({ keyword: '', template: '', lang: 'en', parametersRaw: '', sendTemplate: true }); }}
                            className="px-4 py-2 text-xs font-semibold text-neutral-600 dark:text-zinc-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-xl transition-all">
                            Cancel
                        </button>
                    )}
                    <button type="button" onClick={handleFormSubmit} disabled={rulesLoading}
                        className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl transition-all shadow-sm">
                        {rulesLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                        {editingIdx !== null ? 'Save Rule' : 'Add Rule'}
                    </button>
                </div>
            </SectionCard>

            {/* List */}
            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-border bg-neutral-50/50 dark:bg-[#151522]">
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Active Rules List</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="bg-neutral-50/20 dark:bg-neutral-900/10 text-neutral-500 border-b border-border font-bold uppercase tracking-wider">
                                <th className="px-5 py-3">Keyword</th>
                                <th className="px-5 py-3">Reply Template</th>
                                <th className="px-5 py-3">Lang</th>
                                <th className="px-5 py-3">Params</th>
                                <th className="px-5 py-3 text-center">Auto-Send</th>
                                <th className="px-5 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {rules.map((rule, idx) => (
                                <tr key={idx} className="hover:bg-neutral-50/30 dark:hover:bg-[#1a1a28]/20 transition-all font-medium text-foreground">
                                    <td className="px-5 py-4 font-mono text-emerald-600 dark:text-emerald-400 font-bold">{rule.keyword}</td>
                                    <td className="px-5 py-4">{rule.template}</td>
                                    <td className="px-5 py-4 font-mono uppercase text-[10px]">{rule.lang}</td>
                                    <td className="px-5 py-4">
                                        {rule.parameters.length > 0 ? (
                                            <div className="flex flex-wrap gap-1">
                                                {rule.parameters.map((p, j) => (
                                                    <span key={j} className="px-1.5 py-0.5 rounded bg-neutral-105 dark:bg-neutral-800 text-[10px] font-semibold text-neutral-600 dark:text-neutral-450 border border-border">{p}</span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-neutral-400 italic text-[11px]">— None —</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                        {rule.sendTemplate ? (
                                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] bg-emerald-50 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400 font-bold">Enabled</span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-zinc-700 text-neutral-550 dark:text-zinc-400">Disabled</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        <div className="flex justify-end gap-1.5">
                                            <button onClick={() => handleEditRule(idx)} className="p-2 rounded-lg text-neutral-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all">
                                                <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                            <button onClick={() => handleDeleteRule(idx)} className="p-2 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {rules.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-5 py-10 text-center text-neutral-450 italic">No keyword rules defined yet. Create your first rule above.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
