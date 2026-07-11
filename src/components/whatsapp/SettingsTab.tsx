import React, { useState } from 'react';
import { Server, Phone, Key, Save, Loader2, Database, Eye, EyeOff, Globe, Bot } from 'lucide-react';

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

interface SettingsTabProps {
    saveLoading: boolean;
    settingsForm: {
        whatsappApiBaseUrl: string;
        whatsappPhoneNumberId: string;
        whatsappWabaId: string;
        whatsappAccessToken: string;
        crmApiDomain: string;
        crmApiAccessToken: string;
    };
    setSettingsForm: React.Dispatch<React.SetStateAction<{
        whatsappApiBaseUrl: string;
        whatsappPhoneNumberId: string;
        whatsappWabaId: string;
        whatsappAccessToken: string;
        crmApiDomain: string;
        crmApiAccessToken: string;
    }>>;
    handleSaveSettings: (e: React.FormEvent) => void;
}

export default function SettingsTab({
    saveLoading,
    settingsForm,
    setSettingsForm,
    handleSaveSettings
}: SettingsTabProps) {
    const [showToken, setShowToken] = useState(false);
    const [showCrmToken, setShowCrmToken] = useState(false);

    return (
        <form onSubmit={handleSaveSettings} className="space-y-5 max-w-xl">

            <SectionCard title="WhatsApp Cloud API" dot="bg-[#25d366]">
                <Field label="API Base URL" hint="Meta Cloud API base URL or proxy gateway (without trailing slash).">
                    <div className="relative">
                        <Server className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                        <Input required value={settingsForm.whatsappApiBaseUrl}
                            onChange={e => setSettingsForm(f => ({ ...f, whatsappApiBaseUrl: e.target.value.trim() }))}
                            placeholder="https://graph.facebook.com/v19.0"
                            className="pl-9 font-mono text-xs" />
                    </div>
                </Field>
                <Field label="Phone Number ID" hint="Retrieved from Meta Developer Panel -> WhatsApp Setup.">
                    <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                        <Input required value={settingsForm.whatsappPhoneNumberId}
                            onChange={e => setSettingsForm(f => ({ ...f, whatsappPhoneNumberId: e.target.value.trim() }))}
                            placeholder="e.g. 104558296711928"
                            className="pl-9 font-mono text-xs" />
                    </div>
                </Field>
                <Field label="WhatsApp Business Account (WABA) ID" hint="Retrieved from Meta Developer Panel -> API credentials page.">
                    <div className="relative">
                        <Database className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                        <Input required value={settingsForm.whatsappWabaId}
                            onChange={e => setSettingsForm(f => ({ ...f, whatsappWabaId: e.target.value.trim() }))}
                            placeholder="e.g. 293361596700592"
                            className="pl-9 font-mono text-xs" />
                    </div>
                </Field>
                <Field label="Permanent Access Token" hint="Meta System User token with whatsapp_business_messaging permissions.">
                    <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                        <Input required value={settingsForm.whatsappAccessToken}
                            onChange={e => setSettingsForm(f => ({ ...f, whatsappAccessToken: e.target.value.trim() }))}
                            placeholder="e.g. EAAG..."
                            type={showToken ? "text" : "password"}
                            className="pl-9 pr-10 font-mono text-xs" />
                        <button
                            type="button"
                            onClick={() => setShowToken(!showToken)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-250 transition-colors focus:outline-none"
                            title={showToken ? "Hide access token" : "Show access token"}
                        >
                            {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                </Field>
            </SectionCard>

            <SectionCard title="CRM API (com.bot Chats)" dot="bg-blue-500">
                <p className="text-[11px] text-neutral-400 dark:text-neutral-500 leading-relaxed">
                    Required for the <strong className="text-neutral-600 dark:text-neutral-350">WhatsApp Chats</strong> panel. Configure your com.bot CRM domain and API access token to view contacts and message history.
                </p>
                <Field label="CRM API Domain" hint="Your com.bot workspace domain, e.g. https://app.com.bot (without trailing slash).">
                    <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                        <Input value={settingsForm.crmApiDomain}
                            onChange={e => setSettingsForm(f => ({ ...f, crmApiDomain: e.target.value.trim() }))}
                            placeholder="https://app.com.bot"
                            className="pl-9 font-mono text-xs" />
                    </div>
                </Field>
                <Field label="CRM API Access Token" hint="The API-KEY from your com.bot workspace settings.">
                    <div className="relative">
                        <Bot className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                        <Input value={settingsForm.crmApiAccessToken}
                            onChange={e => setSettingsForm(f => ({ ...f, crmApiAccessToken: e.target.value.trim() }))}
                            placeholder="Enter your com.bot API access token"
                            type={showCrmToken ? "text" : "password"}
                            className="pl-9 pr-10 font-mono text-xs" />
                        <button
                            type="button"
                            onClick={() => setShowCrmToken(!showCrmToken)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-250 transition-colors focus:outline-none"
                            title={showCrmToken ? "Hide token" : "Show token"}
                        >
                            {showCrmToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                </Field>
            </SectionCard>

            <button type="submit" disabled={saveLoading}
                className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl transition-all shadow-md shadow-emerald-600/10">
                {saveLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saveLoading ? 'Saving...' : 'Save API Settings'}
            </button>
        </form>
    );
}
