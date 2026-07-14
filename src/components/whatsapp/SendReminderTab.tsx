import React, { useState, useEffect } from 'react';
import { Send, Calendar, Clock, Repeat, ChevronDown, Check, Loader2, Play, Users, Hash, Phone, FileText, Trash2, CheckCircle2, ShieldAlert, X, Plus, ChevronRight, ChevronLeft, Search, MessageSquare } from 'lucide-react';
import { api } from '@/services/apiClient';
import LivePreview from './LivePreview';
import { useConfirm } from '@/context/ConfirmContext';

function Pill({ children, className }: { children: React.ReactNode; className?: string }) {
    return <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${className}`}>{children}</span>;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-450">{label}</label>
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

interface CustomerGroup {
    _id: string;
    name: string;
    color: string;
    membersCount?: number;
}

interface SendReminderTabProps {
    clients: any[];
    templates: any[];
    slug: string;
    show: (msg: string, type?: 'success' | 'error' | 'info') => void;
    showModal?: boolean;
    setShowModal?: (v: boolean) => void;
}

function getContactName(c: any): string {
    if (!c) return 'Unknown';
    if (c.profile?.whatsapp?.name) {
        const pName = c.profile.whatsapp.name;
        if (typeof pName === 'string' && pName.trim() !== '') return pName;
    }
    if (c.name) {
        if (typeof c.name === 'object') {
            const fname = c.name.first_name || '';
            const lname = c.name.last_name || '';
            const combined = `${fname} ${lname}`.trim();
            if (combined) return combined;
        } else if (typeof c.name === 'string') {
            return c.name;
        }
    }
    const val = c.chat_name || c.whatsapp || c.phone || 'Unknown';
    return String(val);
}

function getContactPhone(c: any): string {
    if (!c) return '';
    if (c.profile?.whatsapp?.identifier) {
        return String(c.profile.whatsapp.identifier);
    }
    if (c.name?.first_name) {
        const rawFn = String(c.name.first_name);
        const cleanFn = rawFn.replace(/[\s\-\(\)\+]/g, '');
        if (/^\d{8,16}$/.test(cleanFn)) {
            return rawFn;
        }
    }
    const val = c.whatsapp || c.phone || '';
    if (c.contact && typeof c.contact === 'object') {
        return getContactPhone(c.contact);
    }
    if (c.customer && typeof c.customer === 'object') {
        return getContactPhone(c.customer);
    }
    return String(val);
}

export default function SendReminderTab({
    clients = [],
    templates = [],
    slug,
    show,
    showModal,
    setShowModal
}: SendReminderTabProps) {
    const confirm = useConfirm();
    
    // Modal states
    const [localShowModal, setLocalShowModal] = useState(false);
    const isModalOpen = setShowModal !== undefined && showModal !== undefined ? showModal : localShowModal;
    const setIsModalOpen = setShowModal !== undefined ? setShowModal : setLocalShowModal;
    const [step, setStep] = useState(1);

    const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    const selectAllInList = (list: any[]) => {
        const ids = list.map(c => c._id || c.id);
        setSelectedClientIds(prev => {
            const next = [...prev];
            ids.forEach(id => {
                if (!next.includes(id)) next.push(id);
            });
            return next;
        });
    };

    const deselectAllInList = (list: any[]) => {
        const ids = list.map(c => c._id || c.id);
        setSelectedClientIds(prev => prev.filter(id => !ids.includes(id)));
    };

    const toggleClientSelection = (id: string) => {
        setSelectedClientIds(prev =>
            prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
        );
    };

    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

    const toggleGroupExpanded = (groupId: string) => {
        setExpandedGroups(prev => ({
            ...prev,
            [groupId]: !prev[groupId]
        }));
    };

    const filteredClients = clients.filter(c =>
        c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery)
    );
    const filteredTotalCount = filteredClients.length;

    const selectAllMatching = () => {
        const ids = filteredClients.map(c => c._id || c.id);
        setSelectedClientIds(prev => {
            const next = [...prev];
            ids.forEach(id => {
                if (!next.includes(id)) next.push(id);
            });
            return next;
        });
    };

    // Form States
    const [title, setTitle] = useState('');
    const [recipientType, setRecipientType] = useState<'customers' | 'groups' | 'new' | 'whatsapp'>('customers');
    const [selectedClientId, setSelectedClientId] = useState('');

    // WhatsApp Contacts state
    const [waContacts, setWaContacts] = useState<any[]>([]);
    const [waContactsLoading, setWaContactsLoading] = useState(false);
    const [waContactsError, setWaContactsError] = useState('');
    const [selectedWaContacts, setSelectedWaContacts] = useState<{ name: string; phone: string }[]>([]);
    const [waSearchQuery, setWaSearchQuery] = useState('');
    const [selectedGroupName, setSelectedGroupName] = useState('All Clients');
    const [newName, setNewName] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [templateName, setTemplateName] = useState('');
    const [parameters, setParameters] = useState<string[]>([]);
    const [scheduledDate, setScheduledDate] = useState('');
    const [scheduledTime, setScheduledTime] = useState('');
    const [repeatEnabled, setRepeatEnabled] = useState(false);
    const [repeatFrequency, setRepeatFrequency] = useState<'day' | 'week' | 'month' | 'year'>('day');
    const [repeatInterval, setRepeatInterval] = useState(1);
    const [repeatEndDate, setRepeatEndDate] = useState('');
    const [headerLink, setHeaderLink] = useState('');
    const [headerUploadLoading, setHeaderUploadLoading] = useState(false);

    const [formLoading, setFormLoading] = useState(false);

    // Reminders & Groups states
    const [reminders, setReminders] = useState<any[]>([]);
    const [remindersLoading, setRemindersLoading] = useState(false);
    const [customGroups, setCustomGroups] = useState<CustomerGroup[]>([]);

    // Fetch custom customer groups from backend
    const fetchCustomGroups = async () => {
        if (!slug) return;
        try {
            const res = await api.get(`/tenants/${slug}/customer-groups`);
            if (res.data.success) {
                setCustomGroups(res.data.data || []);
            }
        } catch (err) {
            console.error('Failed to load custom customer groups:', err);
        }
    };

    const fetchReminders = async () => {
        if (!slug) return;
        setRemindersLoading(true);
        try {
            const res = await api.get(`/tenants/${slug}/whatsapp-reminders`);
            if (res.data.success) {
                setReminders(res.data.data || []);
            }
        } catch (err) {
            console.error('Failed to load reminders:', err);
        } finally {
            setRemindersLoading(false);
        }
    };

    useEffect(() => {
        fetchReminders();
        fetchCustomGroups();
    }, [slug]);

    // Compute active clients in selected group
    const getGroupClientsCount = (groupName: string) => {
        if (groupName === 'All Clients') return clients.length;
        if (groupName === 'Pending Payments') return clients.filter(c => c.paymentStatus === 'PENDING').length;
        if (groupName === 'Clear Payments') return clients.filter(c => c.paymentStatus === 'CLEAR').length;
        if (groupName === 'Active Services') return clients.filter(c => c.serviceStatus === 'ON').length;
        if (groupName === 'Inactive Services') return clients.filter(c => c.serviceStatus === 'OFF').length;
        // Check custom groups
        return clients.filter(c => (c.group?._id || c.group) === groupName).length;
    };

    const activeGroupMembersCount = getGroupClientsCount(selectedGroupName);
    const hasGroupMembers = activeGroupMembersCount > 0;

    // Detect variables count in selected template
    const selectedTemplate = templates.find(t => t.name === templateName);
    const bodyText = selectedTemplate?.components?.find((c: any) => c.type === 'BODY')?.text || '';
    const headerComponent = selectedTemplate?.components?.find((c: any) => c.type === 'HEADER');
    const headerFormat = headerComponent?.format || 'NONE';
    const headerText = headerComponent?.text || '';
    const footerText = selectedTemplate?.components?.find((c: any) => c.type === 'FOOTER')?.text || '';
    const buttonComponent = selectedTemplate?.components?.find((c: any) => c.type === 'BUTTONS');
    const btnType = buttonComponent ? (buttonComponent.buttons?.[0]?.type === 'QUICK_REPLY' ? 'QUICK_REPLY' : 'URL') : 'NONE';
    const quickReplies = buttonComponent?.buttons?.map((b: any) => b.text) || [];
    const ctaLabel = buttonComponent?.buttons?.[0]?.text || '';
    const ctaUrl = buttonComponent?.buttons?.[0]?.url || '';

    const bodyVarCount = (() => {
        const m = bodyText.match(/\{\{\d+\}\}/g);
        return m ? Math.max(...m.map((v: string) => parseInt(v.replace(/\D/g, '')))) : 0;
    })();

    // Resize parameters array
    useEffect(() => {
        setParameters(Array(bodyVarCount).fill(''));
    }, [bodyVarCount, templateName]);

    useEffect(() => {
        setHeaderLink('');
        setHeaderUploadLoading(false);
    }, [templateName]);

    const handleParamChange = (index: number, val: string) => {
        const u = [...parameters];
        u[index] = val;
        setParameters(u);
    };

    const handleScheduleReminder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!slug) return;
        if (recipientType === 'groups' && !hasGroupMembers) {
            show('Selected group has no active clients', 'error');
            return;
        }
        if (!scheduledDate || !scheduledTime) {
            show('Select scheduled Date and Time', 'error');
            return;
        }

        setFormLoading(true);
        try {
            const basePayload = {
                title: title.trim() || `${templateName} Reminder`,
                recipientType: 'customers',
                templateName,
                languageCode: selectedTemplate?.language || 'en_US',
                parameters,
                headerLink: ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(headerFormat) ? headerLink : undefined,
                headerFormat: ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(headerFormat) ? headerFormat : 'NONE',
                scheduledAt: new Date(`${scheduledDate}T${scheduledTime}`),
                repeat: {
                    enabled: repeatEnabled,
                    frequency: repeatEnabled ? repeatFrequency : undefined,
                    interval: repeatEnabled ? repeatInterval : undefined,
                    endDate: (repeatEnabled && repeatEndDate) ? new Date(repeatEndDate) : undefined
                }
            };

            if (recipientType === 'customers') {
                await Promise.all(selectedClientIds.map(clientId => {
                    const payload = {
                        ...basePayload,
                        customer: clientId
                    };
                    return api.post(`/tenants/${slug}/whatsapp-reminders`, payload);
                }));
            } else if (recipientType === 'whatsapp') {
                // Send one reminder per selected WhatsApp contact
                await Promise.all(selectedWaContacts.map(contact => {
                    const payload = {
                        ...basePayload,
                        recipientType: 'new',
                        newName: contact.name,
                        newPhone: contact.phone,
                    };
                    return api.post(`/tenants/${slug}/whatsapp-reminders`, payload);
                }));
            } else {
                const payload = {
                    ...basePayload,
                    recipientType,
                    newName: recipientType === 'new' ? newName : undefined,
                    newPhone: recipientType === 'new' ? newPhone : undefined,
                    groupName: recipientType === 'groups' ? selectedGroupName : undefined
                };
                await api.post(`/tenants/${slug}/whatsapp-reminders`, payload);
            }

            show('WhatsApp reminder scheduled successfully!', 'success');
            fetchReminders();
            // Close & Reset
            setIsModalOpen(false);
            setStep(1);
            setTitle('');
            setSelectedClientId('');
            setSelectedClientIds([]);
            setSearchQuery('');
            setNewName('');
            setNewPhone('');
            setSelectedWaContacts([]);
            setWaSearchQuery('');
            setTemplateName('');
            setScheduledDate('');
            setScheduledTime('');
            setRepeatEnabled(false);
            setRepeatEndDate('');
            setHeaderLink('');
        } catch (err: any) {
            show(err.response?.data?.message || 'Failed to schedule reminder.', 'error');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDeleteReminder = async (id: string) => {
        const isConfirmed = await confirm({
            title: 'Delete Scheduled Reminder',
            message: 'Are you sure you want to cancel and delete this scheduled reminder campaign?',
            confirmLabel: 'Delete',
            cancelLabel: 'Keep',
            variant: 'danger'
        });
        if (!isConfirmed) return;
        try {
            const res = await api.delete(`/tenants/${slug}/whatsapp-reminders/${id}`);
            if (res.data.success) {
                show('Reminder cancelled and deleted.', 'success');
                fetchReminders();
            }
        } catch (err: any) {
            show(err.response?.data?.message || 'Failed to delete reminder.', 'error');
        }
    };

    const handleRetryReminder = async (id: string) => {
        show('Sending reminder immediately...', 'info');
        try {
            const res = await api.post(`/tenants/${slug}/whatsapp-reminders/${id}/retry`);
            if (res.data.success) {
                show('Reminder sent successfully!', 'success');
                fetchReminders();
            }
        } catch (err: any) {
            show(err.response?.data?.message || 'Failed to send immediately.', 'error');
            fetchReminders();
        }
    };

    // WhatsApp contacts fetch
    const fetchWaContacts = async () => {
        if (!slug) return;
        setWaContactsLoading(true);
        setWaContactsError('');
        try {
            const res = await api.get(`/tenants/${slug}/whatsapp-chats`, { params: { page: 1, limit: 1000 } });
            if (res.data.success) {
                const responseData = res.data.data;
                let list: any[] = [];
                if (Array.isArray(responseData)) {
                    list = responseData;
                } else if (responseData && Array.isArray(responseData.data)) {
                    list = responseData.data;
                } else if (responseData && Array.isArray(responseData.chats)) {
                    list = responseData.chats;
                } else if (responseData && Array.isArray(responseData.contacts)) {
                    list = responseData.contacts;
                } else if (res.data && Array.isArray(res.data.data)) {
                    list = res.data.data;
                } else if (res.data && Array.isArray(res.data.chats)) {
                    list = res.data.chats;
                } else if (res.data && Array.isArray(res.data.contacts)) {
                    list = res.data.contacts;
                }
                setWaContacts(list || []);
            } else {
                setWaContactsError('Failed to load WhatsApp contacts.');
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Could not load WhatsApp contacts.';
            setWaContactsError(msg);
        } finally {
            setWaContactsLoading(false);
        }
    };

    useEffect(() => {
        if (recipientType === 'whatsapp' && waContacts.length === 0 && !waContactsLoading) {
            fetchWaContacts();
        }
    }, [recipientType]);

    const toggleWaContact = (contact: any) => {
        const phone = getContactPhone(contact);
        const name = getContactName(contact);
        if (!phone) return;
        setSelectedWaContacts(prev => {
            const exists = prev.find(c => c.phone === phone);
            if (exists) return prev.filter(c => c.phone !== phone);
            return [...prev, { name, phone }];
        });
    };

    const filteredWaContacts = (Array.isArray(waContacts) ? waContacts : []).filter(c => {
        const name = getContactName(c);
        const phone = getContactPhone(c);
        return (
            name.toLowerCase().includes(waSearchQuery.toLowerCase()) ||
            phone.includes(waSearchQuery)
        );
    });

    // Step validation checks
    const isStep1Valid = title.trim() !== '' && recipientType;
    const isStep2Valid = (() => {
        if (recipientType === 'customers') return selectedClientIds.length > 0;
        if (recipientType === 'groups') return selectedGroupName !== '' && hasGroupMembers;
        if (recipientType === 'new') return newName.trim() !== '' && newPhone.trim() !== '';
        if (recipientType === 'whatsapp') return selectedWaContacts.length > 0;
        return false;
    })();
    const isStep3Valid = templateName !== '' && scheduledDate !== '' && scheduledTime !== '' && (!repeatEnabled || repeatInterval >= 1) && (!['IMAGE', 'VIDEO', 'DOCUMENT'].includes(headerFormat) || headerLink !== '');

    return (
        <div className="space-y-6">

            {/* Queue List Section */}
            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-border bg-neutral-50/50 dark:bg-[#151522] flex justify-between items-center">
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Queue Pipelines</h3>
                    <button type="button" onClick={fetchReminders} className="text-xs font-bold text-emerald-650 dark:text-emerald-455 hover:underline">Refresh List</button>
                </div>
                
                {remindersLoading ? (
                    <div className="py-16 flex items-center justify-center gap-2 text-neutral-400">
                        <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                        <span className="text-xs font-medium">Loading pipelines...</span>
                    </div>
                ) : reminders.length === 0 ? (
                    <div className="text-center py-16">
                        <FileText className="w-8 h-8 text-neutral-350 dark:text-neutral-600 mx-auto mb-3" />
                        <p className="text-xs text-neutral-500 italic">No scheduled campaigns active. Click &quot;Schedule New Reminder&quot; to begin.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto scrollbar-none">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-neutral-50/20 dark:bg-neutral-900/10 text-neutral-500 border-b border-border font-bold uppercase tracking-wider">
                                    <th className="px-5 py-3">Campaign Name</th>
                                    <th className="px-5 py-3">Recipient / Group</th>
                                    <th className="px-5 py-3">Template</th>
                                    <th className="px-5 py-3">Scheduled At</th>
                                    <th className="px-5 py-3">Recurrence</th>
                                    <th className="px-5 py-3 text-center">Status</th>
                                    <th className="px-5 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {reminders.map((r, i) => {
                                    const statusColors =
                                        r.status === 'Sent' ? 'bg-emerald-50 dark:bg-emerald-950/25 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 font-bold' :
                                        r.status === 'Scheduled' ? 'bg-amber-50 dark:bg-amber-950/25 border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-400 font-bold' :
                                        r.status === 'Failed' ? 'bg-rose-50 dark:bg-rose-950/25 border-rose-200 dark:border-rose-900 text-rose-705 dark:text-rose-400 font-bold' :
                                        'bg-neutral-50 dark:bg-neutral-800 border-neutral-250 dark:border-zinc-700 text-neutral-500 dark:text-zinc-400';

                                    const recipientDisplay =
                                        r.recipientType === 'new' ? `Manual: ${r.newName || 'Customer'} (${r.newPhone})` :
                                        r.recipientType === 'groups' ? (() => {
                                            const customMatch = customGroups.find(cg => cg._id === r.groupName);
                                            return `Group: ${customMatch ? customMatch.name : r.groupName}`;
                                        })() :
                                        r.customer ? `Client: ${r.customer.fullName} (${r.customer.phone})` :
                                        'Unknown recipient';

                                    return (
                                        <tr key={i} className="hover:bg-neutral-50/30 dark:hover:bg-[#1a1a28]/20 transition-all font-medium text-foreground">
                                            <td className="px-5 py-4 font-bold">{r.title}</td>
                                            <td className="px-5 py-4 select-all">{recipientDisplay}</td>
                                            <td className="px-5 py-4 font-mono text-[11px]">{r.templateName}</td>
                                            <td className="px-5 py-4">{new Date(r.scheduledAt).toLocaleString()}</td>
                                            <td className="px-5 py-4">
                                                {r.repeat?.enabled ? (
                                                    <span className="capitalize text-emerald-600 dark:text-emerald-400 font-bold">Every {r.repeat.interval} {r.repeat.frequency}(s)</span>
                                                ) : (
                                                    <span className="text-neutral-400 dark:text-neutral-500 font-semibold">— Once —</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <Pill className={statusColors}>{r.status}</Pill>
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <div className="flex justify-end gap-1">
                                                    {r.status === 'Failed' && (
                                                        <button onClick={() => handleRetryReminder(r._id)} className="p-2 rounded-lg text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all" title="Send Immediately">
                                                            <Play className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                    <button onClick={() => handleDeleteReminder(r._id)} className="p-2 rounded-lg text-neutral-450 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-955/35 transition-all" title="Delete Schedule">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create Reminder step wizard Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                    onClick={(e) => { if (e.target === e.currentTarget) { setIsModalOpen(false); setStep(1); } }}>
                    <div className="bg-white dark:bg-neutral-900 rounded-[2rem] shadow-2xl w-full max-w-4xl border border-border flex flex-col overflow-hidden max-h-[90vh]">
                        
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-8 py-5 border-b border-border bg-neutral-50/50 dark:bg-neutral-950/20 shrink-0">
                            <div>
                                <h3 className="text-base font-bold text-foreground">Schedule Message Campaign</h3>
                                <p className="text-[11px] text-neutral-400 dark:text-neutral-500 font-semibold mt-0.5">
                                    {step === 1 && 'Step 1 of 3 — Campaign Details & Recipient Type'}
                                    {step === 2 && recipientType === 'customers' && 'Step 2 of 3 — Select CRM Clients'}
                                    {step === 2 && recipientType === 'groups' && 'Step 2 of 3 — Select Customer Group'}
                                    {step === 2 && recipientType === 'new' && 'Step 2 of 3 — Manual Recipient Entry'}
                                    {step === 2 && recipientType === 'whatsapp' && 'Step 2 of 3 — Select WhatsApp Contacts'}
                                    {step === 3 && 'Step 3 of 3 — Message Template & Date Settings'}
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5">
                                    {[1, 2, 3].map(s => (
                                        <div key={s} className={`rounded-full transition-all h-2 ${s === step ? 'w-5 bg-emerald-500' : 'w-2 bg-neutral-200 dark:bg-neutral-800'}`} />
                                    ))}
                                </div>
                                <button onClick={() => { setIsModalOpen(false); setStep(1); }}
                                    className="p-2 text-neutral-400 hover:text-foreground dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-850 rounded-xl transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-border">
                            
                            {/* Form steps */}
                            <div className="lg:col-span-2 p-8 space-y-5">
                                {step === 1 && (
                                    <div className="space-y-5 animate-fade-in">
                                        <Field label="Campaign Name / Reminder Title *" hint="Provide an identifiable label for tracking.">
                                            <Input required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. GST Filing Reminder" />
                                        </Field>

                                        <div className="space-y-2">
                                            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400">Recipient Type *</label>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                {[
                                                    { id: 'customers', label: 'Select Clients', icon: <Users size={16} />, desc: 'Target individual CRM clients' },
                                                    { id: 'groups', label: 'Customer Group', icon: <Hash size={16} />, desc: 'Bulk send to active lists' },
                                                    { id: 'new', label: 'Manual Entry', icon: <Phone size={16} />, desc: 'Type number manually' },
                                                    { id: 'whatsapp', label: 'WhatsApp Contact', icon: <MessageSquare size={16} />, desc: 'Pick from WA contact list' }
                                                ].map(target => (
                                                    <button key={target.id} type="button" onClick={() => setRecipientType(target.id as any)}
                                                        className={`flex flex-col items-start gap-2 p-3.5 border-2 rounded-xl text-left transition-all ${
                                                            recipientType === target.id
                                                                ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400'
                                                                : 'border-border bg-white dark:bg-neutral-900 text-neutral-500 hover:border-neutral-350 hover:bg-neutral-50'
                                                        }`}>
                                                        <div className={`p-2 rounded-lg ${recipientType === target.id ? 'bg-emerald-500 text-white' : 'bg-neutral-100 dark:bg-neutral-800'}`}>
                                                            {target.icon}
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold leading-none">{target.label}</p>
                                                            <p className="text-[10px] text-neutral-400 mt-1 font-semibold leading-tight">{target.desc}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {step === 2 && (
                                    <div className="space-y-4 animate-fade-in">
                                        {recipientType === 'customers' && (
                                            <div className="space-y-4">
                                                {/* Search bar & Global bulk triggers */}
                                                <div className="flex flex-col sm:flex-row gap-3">
                                                    <div className="relative flex-1">
                                                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                        <input
                                                            type="text"
                                                            placeholder="Search clients by name or phone..."
                                                            value={searchQuery}
                                                            onChange={e => setSearchQuery(e.target.value)}
                                                            className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-xs outline-none focus:ring-2 focus:ring-emerald-500/25 focus:bg-white dark:focus:bg-zinc-850 transition-all font-medium text-slate-800 dark:text-zinc-200"
                                                        />
                                                    </div>
                                                    <div className="flex gap-2 shrink-0">
                                                        <button
                                                            type="button"
                                                            onClick={selectAllMatching}
                                                            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-bold rounded-xl transition-all"
                                                        >
                                                            Select All ({filteredTotalCount})
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedClientIds([])}
                                                            className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-900/30 text-rose-600 dark:text-rose-450 text-xs font-bold rounded-xl transition-all"
                                                        >
                                                            Clear All
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* List of Groups & Clients */}
                                                <div className="max-h-[40vh] overflow-y-auto space-y-3.5 border border-border rounded-2xl p-4 bg-slate-50/50 dark:bg-neutral-950/20 scrollbar-thin">
                                                    {/* Custom Customer Groups */}
                                                    {customGroups.map(group => {
                                                        const groupClients = clients.filter(c => {
                                                            const cGroupId = c.group?._id || c.group;
                                                            return cGroupId && cGroupId.toString() === group._id.toString();
                                                        });
                                                        const filtered = groupClients.filter(c =>
                                                            c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                            c.phone.includes(searchQuery)
                                                        );

                                                        if (filtered.length === 0 && searchQuery) return null;

                                                        const groupSelectedCount = filtered.filter(c => selectedClientIds.includes(c._id)).length;
                                                        const isExpanded = searchQuery.trim() !== '' || !!expandedGroups[group._id];

                                                        return (
                                                            <div key={group._id} className="border border-slate-100 dark:border-zinc-800/80 rounded-xl bg-white dark:bg-zinc-900 overflow-hidden shadow-xs">
                                                                {/* Header */}
                                                                <div 
                                                                    onClick={() => toggleGroupExpanded(group._id)}
                                                                    className="flex items-center justify-between px-4 py-3 bg-slate-50/40 dark:bg-zinc-850/40 hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer select-none transition-colors"
                                                                >
                                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                                        <ChevronDown className={`w-4 h-4 text-slate-400 dark:text-zinc-500 shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                                                                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: group.color || '#CBD5E1' }} />
                                                                        <span className="text-xs font-bold text-slate-800 dark:text-neutral-300 truncate">{group.name}</span>
                                                                        <span className="text-[10px] text-slate-400 dark:text-zinc-550 font-semibold shrink-0">
                                                                            ({groupClients.length} members{groupSelectedCount > 0 && `, ${groupSelectedCount} selected`})
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                                                        <button type="button" onClick={() => selectAllInList(filtered)} className="text-[10px] font-black text-emerald-600 dark:text-emerald-450 hover:underline">Select Group</button>
                                                                        <span className="text-slate-200 dark:text-zinc-800 text-[10px]">|</span>
                                                                        <button type="button" onClick={() => deselectAllInList(filtered)} className="text-[10px] font-black text-slate-450 hover:underline">Clear</button>
                                                                    </div>
                                                                </div>

                                                                {/* Clients grid */}
                                                                {isExpanded && (
                                                                    <div className="p-3 bg-white dark:bg-zinc-900 grid grid-cols-1 sm:grid-cols-2 gap-2 border-t border-slate-50 dark:border-zinc-800/40 max-h-[25vh] overflow-y-auto scrollbar-thin">
                                                                        {filtered.length === 0 ? (
                                                                            <p className="text-[10px] text-slate-400 font-medium italic p-2 col-span-2">No clients match search query.</p>
                                                                        ) : (
                                                                            filtered.map(c => (
                                                                                <label key={c._id} className={`flex items-center gap-2.5 p-2 border rounded-xl cursor-pointer transition-all select-none ${
                                                                                    selectedClientIds.includes(c._id)
                                                                                        ? 'border-emerald-500 bg-emerald-50/10 dark:bg-emerald-950/5'
                                                                                        : 'border-slate-105 dark:border-zinc-800 hover:border-slate-200 hover:bg-slate-50/30'
                                                                                }`}>
                                                                                    <input
                                                                                        type="checkbox"
                                                                                        checked={selectedClientIds.includes(c._id)}
                                                                                        onChange={() => toggleClientSelection(c._id)}
                                                                                        className="rounded border-gray-300 dark:border-zinc-800 text-emerald-600 focus:ring-emerald-500/30 w-3.5 h-3.5"
                                                                                    />
                                                                                    <div className="min-w-0 leading-none">
                                                                                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{c.fullName}</p>
                                                                                        <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium mt-1">{c.phone}</p>
                                                                                    </div>
                                                                                </label>
                                                                            ))
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}

                                                    {/* Unassigned Clients */}
                                                    {(() => {
                                                        const unassignedClients = clients.filter(c => !c.group);
                                                        const filtered = unassignedClients.filter(c =>
                                                            c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                            c.phone.includes(searchQuery)
                                                        );

                                                        if (filtered.length === 0 && searchQuery) return null;

                                                        const groupSelectedCount = filtered.filter(c => selectedClientIds.includes(c._id)).length;
                                                        const isExpanded = searchQuery.trim() !== '' || !!expandedGroups['unassigned'];

                                                        return (
                                                            <div className="border border-slate-100 dark:border-zinc-800/80 rounded-xl bg-white dark:bg-zinc-900 overflow-hidden shadow-xs">
                                                                {/* Header */}
                                                                <div 
                                                                    onClick={() => toggleGroupExpanded('unassigned')}
                                                                    className="flex items-center justify-between px-4 py-3 bg-slate-50/40 dark:bg-zinc-850/40 hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer select-none transition-colors"
                                                                >
                                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                                        <ChevronDown className={`w-4 h-4 text-slate-400 dark:text-zinc-500 shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                                                                        <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-slate-300 dark:bg-zinc-700" />
                                                                        <span className="text-xs font-bold text-slate-800 dark:text-neutral-300 truncate">Unassigned Members</span>
                                                                        <span className="text-[10px] text-slate-400 dark:text-zinc-555 font-semibold shrink-0">
                                                                            ({unassignedClients.length} members{groupSelectedCount > 0 && `, ${groupSelectedCount} selected`})
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                                                        <button type="button" onClick={() => selectAllInList(filtered)} className="text-[10px] font-black text-emerald-600 dark:text-emerald-455 hover:underline">Select Group</button>
                                                                        <span className="text-slate-200 dark:text-zinc-800 text-[10px]">|</span>
                                                                        <button type="button" onClick={() => deselectAllInList(filtered)} className="text-[10px] font-black text-slate-450 hover:underline">Clear</button>
                                                                    </div>
                                                                </div>

                                                                {/* Clients grid */}
                                                                {isExpanded && (
                                                                    <div className="p-3 bg-white dark:bg-zinc-900 grid grid-cols-1 sm:grid-cols-2 gap-2 border-t border-slate-50 dark:border-zinc-800/40 max-h-[25vh] overflow-y-auto scrollbar-thin">
                                                                        {filtered.length === 0 ? (
                                                                            <p className="text-[10px] text-slate-400 font-medium italic p-2 col-span-2">No unassigned clients found.</p>
                                                                        ) : (
                                                                            filtered.map(c => (
                                                                                <label key={c._id} className={`flex items-center gap-2.5 p-2 border rounded-xl cursor-pointer transition-all select-none ${
                                                                                    selectedClientIds.includes(c._id)
                                                                                        ? 'border-emerald-500 bg-emerald-50/10 dark:bg-emerald-950/5'
                                                                                        : 'border-slate-105 dark:border-zinc-800 hover:border-slate-200 hover:bg-slate-50/30'
                                                                                }`}>
                                                                                    <input
                                                                                        type="checkbox"
                                                                                        checked={selectedClientIds.includes(c._id)}
                                                                                        onChange={() => toggleClientSelection(c._id)}
                                                                                        className="rounded border-gray-300 dark:border-zinc-800 text-emerald-600 focus:ring-emerald-500/30 w-3.5 h-3.5"
                                                                                    />
                                                                                    <div className="min-w-0 leading-none">
                                                                                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{c.fullName}</p>
                                                                                        <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium mt-1">{c.phone}</p>
                                                                                    </div>
                                                                                </label>
                                                                            ))
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })()}
                                                </div>

                                                {/* Selected indicator */}
                                                <div className="flex items-center justify-between text-xs font-bold bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-500/20 px-3.5 py-2.5 rounded-xl">
                                                    <span className="text-emerald-800 dark:text-emerald-450">{selectedClientIds.length} CRM clients selected for broadcast</span>
                                                    {selectedClientIds.length > 0 && (
                                                        <button type="button" onClick={() => setSelectedClientIds([])} className="text-slate-400 hover:text-red-500 hover:underline text-[10px]">Clear All</button>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {recipientType === 'groups' && (
                                            <div className="space-y-3.5">
                                                <Field label="Choose Customer Group *" hint="System dynamic categories and custom tags.">
                                                    <Select value={selectedGroupName} onChange={e => setSelectedGroupName(e.target.value)}>
                                                        <optgroup label="Dynamic System Groups">
                                                            <option value="All Clients">All Clients ({clients.length} members)</option>
                                                            <option value="Pending Payments">Pending Payments ({clients.filter(c => c.paymentStatus === 'PENDING').length} members)</option>
                                                            <option value="Clear Payments">Clear Payments ({clients.filter(c => c.paymentStatus === 'CLEAR').length} members)</option>
                                                            <option value="Active Services">Active Services ({clients.filter(c => c.serviceStatus === 'ON').length} members)</option>
                                                            <option value="Inactive Services">Inactive Services ({clients.filter(c => c.serviceStatus === 'OFF').length} members)</option>
                                                        </optgroup>
                                                        {customGroups.length > 0 && (
                                                            <optgroup label="Custom Tag Groups">
                                                                {customGroups.map(cg => (
                                                                    <option key={cg._id} value={cg._id}>{cg.name} ({cg.membersCount ?? 0} members)</option>
                                                                ))}
                                                            </optgroup>
                                                        )}
                                                    </Select>
                                                </Field>

                                                {!hasGroupMembers ? (
                                                    <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 dark:bg-amber-955/20 border border-amber-200 dark:border-amber-900/35 rounded-xl text-amber-800 dark:text-amber-400 text-xs">
                                                        <ShieldAlert className="w-4.5 h-4.5 text-amber-500 shrink-0 mt-0.5" />
                                                        <div>
                                                            <strong>Zero members group:</strong> Selected group &quot;{customGroups.find(g => g._id === selectedGroupName)?.name || selectedGroupName}&quot; is empty. Assign clients to this group under Client tab to send.
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">✓ Selected target group contains {activeGroupMembersCount} active clients.</p>
                                                )}
                                            </div>
                                        )}

                                        {recipientType === 'new' && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <Field label="Recipient Full Name *">
                                                    <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. John Doe" />
                                                </Field>
                                                <Field label="Recipient Mobile Phone *">
                                                    <Input value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="e.g. 919974401999" />
                                                </Field>
                                            </div>
                                        )}

                                        {recipientType === 'whatsapp' && (
                                            <div className="space-y-4">
                                                {/* Search + controls */}
                                                <div className="flex flex-col sm:flex-row gap-3">
                                                    <div className="relative flex-1">
                                                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                        <input
                                                            type="text"
                                                            placeholder="Search by name or phone..."
                                                            value={waSearchQuery}
                                                            onChange={e => setWaSearchQuery(e.target.value)}
                                                            className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-xs outline-none focus:ring-2 focus:ring-emerald-500/25 transition-all font-medium text-slate-800 dark:text-zinc-200"
                                                        />
                                                    </div>
                                                    <div className="flex gap-2 shrink-0">
                                                        <button type="button"
                                                            onClick={() => {
                                                                const newSel = filteredWaContacts.map(c => ({
                                                                    name: getContactName(c),
                                                                    phone: getContactPhone(c)
                                                                })).filter(item => item.phone);
                                                                setSelectedWaContacts(prev => {
                                                                    const existing = [...prev];
                                                                    newSel.forEach(ns => {
                                                                        if (!existing.find(e => e.phone === ns.phone)) existing.push(ns);
                                                                    });
                                                                    return existing;
                                                                });
                                                            }}
                                                            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-bold rounded-xl transition-all">
                                                            Select All ({filteredWaContacts.length})
                                                        </button>
                                                        <button type="button" onClick={() => setSelectedWaContacts([])}
                                                            className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 text-xs font-bold rounded-xl transition-all">
                                                            Clear All
                                                        </button>
                                                        <button type="button" onClick={fetchWaContacts} disabled={waContactsLoading}
                                                            className="px-3 py-2.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-xl transition-all disabled:opacity-50">
                                                            {waContactsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : '↻'}
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Contact list */}
                                                <div className="max-h-[40vh] overflow-y-auto border border-border rounded-2xl p-3 bg-slate-50/50 dark:bg-neutral-950/20 scrollbar-thin space-y-1.5">
                                                    {waContactsLoading ? (
                                                        <div className="flex items-center justify-center py-10 gap-2 text-neutral-400">
                                                            <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                                                            <span className="text-xs font-medium">Loading WhatsApp contacts...</span>
                                                        </div>
                                                    ) : waContactsError ? (
                                                        <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
                                                            <p className="text-xs text-red-500 font-medium">{waContactsError}</p>
                                                            <button type="button" onClick={fetchWaContacts}
                                                                className="text-xs text-emerald-600 hover:underline font-bold">Retry</button>
                                                        </div>
                                                    ) : filteredWaContacts.length === 0 ? (
                                                        <p className="text-xs text-slate-400 font-medium italic text-center py-8">
                                                            {waContacts.length === 0 ? 'No WhatsApp contacts found. Make sure your WhatsApp CRM API is configured.' : 'No contacts match your search.'}
                                                        </p>
                                                    ) : (
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                                            {filteredWaContacts.map((c, idx) => {
                                                                const phone = getContactPhone(c);
                                                                const name = getContactName(c);
                                                                const isSelected = !!selectedWaContacts.find(s => s.phone === phone);
                                                                return (
                                                                    <label key={idx} className={`flex items-center gap-2.5 p-2.5 border rounded-xl cursor-pointer transition-all select-none ${
                                                                        isSelected
                                                                            ? 'border-emerald-500 bg-emerald-50/10 dark:bg-emerald-950/5'
                                                                            : 'border-slate-100 dark:border-zinc-800 hover:border-slate-200 hover:bg-slate-50/30'
                                                                    }`}>
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={isSelected}
                                                                            onChange={() => toggleWaContact(c)}
                                                                            className="rounded border-gray-300 dark:border-zinc-700 text-emerald-600 focus:ring-emerald-500/30 w-3.5 h-3.5"
                                                                        />
                                                                        <div className="flex items-center gap-2 min-w-0">
                                                                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-[10px] font-black shrink-0">
                                                                                {name.slice(0, 2).toUpperCase()}
                                                                            </div>
                                                                            <div className="min-w-0 leading-none">
                                                                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{name}</p>
                                                                                <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium mt-0.5">{phone}</p>
                                                                            </div>
                                                                        </div>
                                                                    </label>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Selected indicator */}
                                                <div className="flex items-center justify-between text-xs font-bold bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-500/20 px-3.5 py-2.5 rounded-xl">
                                                    <span className="text-emerald-800 dark:text-emerald-450">{selectedWaContacts.length} WhatsApp contact{selectedWaContacts.length !== 1 ? 's' : ''} selected</span>
                                                    {selectedWaContacts.length > 0 && (
                                                        <button type="button" onClick={() => setSelectedWaContacts([])} className="text-slate-400 hover:text-red-500 hover:underline text-[10px]">Clear All</button>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {step === 3 && (
                                    <div className="space-y-4 max-h-[48vh] overflow-y-auto pr-1.5 scrollbar-none animate-fade-in">
                                        <Field label="Select approved WABA Template *" hint="Only APPROVED templates synchronized from Meta account.">
                                            <Select value={templateName} onChange={e => setTemplateName(e.target.value)}>
                                                <option value="">— Select Template —</option>
                                                {templates.filter(t => t.status === 'APPROVED').map((t, i) => (
                                                    <option key={i} value={t.name}>{t.name} ({t.language})</option>
                                                ))}
                                            </Select>
                                        </Field>

                                        {['IMAGE', 'VIDEO', 'DOCUMENT'].includes(headerFormat) && (
                                            <div className="p-4 bg-neutral-50 dark:bg-neutral-950 border border-border rounded-xl space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-black text-neutral-450 dark:text-neutral-500 uppercase tracking-widest leading-none">
                                                        Template Header {headerFormat.toLowerCase()} *
                                                    </span>
                                                    {headerUploadLoading && (
                                                        <span className="text-[10px] text-blue-600 font-bold flex items-center gap-1">
                                                            <Loader2 className="w-3 h-3 animate-spin" /> Uploading...
                                                        </span>
                                                    )}
                                                </div>
                                                
                                                {headerLink ? (
                                                    <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/20 px-3.5 py-2.5 border border-emerald-250 dark:border-emerald-900 rounded-xl">
                                                        <span className="text-xs text-emerald-800 dark:text-emerald-400 font-bold truncate max-w-[200px]">
                                                            ✓ {headerLink.split('/').pop()}
                                                        </span>
                                                        <button type="button" onClick={() => setHeaderLink('')} className="text-xs text-red-500 hover:underline font-bold">
                                                            Remove
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="relative">
                                                        <input
                                                            type="file"
                                                            required
                                                            accept={
                                                                headerFormat === 'IMAGE' ? 'image/*' :
                                                                headerFormat === 'VIDEO' ? 'video/*' :
                                                                'application/pdf'
                                                            }
                                                            onChange={async (e) => {
                                                                const f = e.target.files?.[0];
                                                                if (f) {
                                                                    setHeaderUploadLoading(true);
                                                                    try {
                                                                        const formData = new FormData();
                                                                        formData.append('file', f);
                                                                        const res = await api.post(`/tenants/${slug}/whatsapp-local-upload`, formData, {
                                                                            headers: { 'Content-Type': 'multipart/form-data' }
                                                                        });
                                                                        if (res.data.success && res.data.url) {
                                                                            setHeaderLink(res.data.url);
                                                                            show('Header media uploaded successfully', 'success');
                                                                        }
                                                                    } catch (err: any) {
                                                                        show(err.response?.data?.message || 'Failed to upload header media', 'error');
                                                                    } finally {
                                                                        setHeaderUploadLoading(false);
                                                                    }
                                                                }
                                                            }}
                                                            className="w-full text-xs text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-neutral-100 file:text-neutral-700 hover:file:bg-neutral-200 cursor-pointer"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {bodyVarCount > 0 && (
                                            <div className="space-y-3.5 bg-neutral-50 dark:bg-neutral-950 p-4 border border-border rounded-xl">
                                                <p className="text-[10px] font-black text-neutral-450 uppercase tracking-widest">Assign Dynamic Template Variables</p>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                                    {parameters.map((val, idx) => (
                                                        <Field key={idx} label={`Var {{${idx + 1}}} *`} hint={idx === 0 ? 'Use "{{clientName}}" to auto-insert recipient name' : undefined}>
                                                            <Input value={val} onChange={e => handleParamChange(idx, e.target.value)} placeholder={`e.g. values`} />
                                                        </Field>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-4 pt-1">
                                            <Field label="Launch Date *">
                                                <div className="relative">
                                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                                                    <Input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} className="pl-10" />
                                                </div>
                                            </Field>
                                            <Field label="Launch Time *">
                                                <div className="relative">
                                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                                                    <Input type="time" value={scheduledTime} onChange={e => setScheduledTime(e.target.value)} className="pl-10" />
                                                </div>
                                            </Field>
                                        </div>

                                        {/* Repeat settings */}
                                        <div className="border border-border rounded-2xl bg-neutral-50/50 dark:bg-neutral-950/20 overflow-hidden">
                                            <button type="button" onClick={() => setRepeatEnabled(!repeatEnabled)}
                                                className="w-full flex items-center justify-between px-4.5 py-3 hover:bg-neutral-100/30 dark:hover:bg-neutral-800/10 transition-all">
                                                <div className="flex items-center gap-3">
                                                    <Repeat className={`w-4.5 h-4.5 ${repeatEnabled ? 'text-emerald-500' : 'text-neutral-400'}`} />
                                                    <span className="text-xs font-bold text-foreground">Recurring Schedule Campaign</span>
                                                </div>
                                                <div className={`w-9 h-5 rounded-full transition-colors relative flex items-center ${repeatEnabled ? 'bg-emerald-500' : 'bg-neutral-250 dark:bg-neutral-700'}`}>
                                                    <div className={`absolute w-3.5 h-3.5 bg-white rounded-full transition-all ${repeatEnabled ? 'left-4.5' : 'left-0.5'}`} />
                                                </div>
                                            </button>

                                            {repeatEnabled && (
                                                <div className="border-t border-border p-4 space-y-3.5 bg-white dark:bg-neutral-900">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <Field label="Repeat Frequency">
                                                            <Select value={repeatFrequency} onChange={e => setRepeatFrequency(e.target.value as any)}>
                                                                <option value="day">Daily</option>
                                                                <option value="week">Weekly</option>
                                                                <option value="month">Monthly</option>
                                                                <option value="year">Yearly</option>
                                                            </Select>
                                                        </Field>
                                                        <Field label="Repeat Interval" hint={`Sends every ${repeatInterval} ${repeatFrequency}(s)`}>
                                                            <Input type="number" min={1} value={repeatInterval} onChange={e => setRepeatInterval(Math.max(1, Number(e.target.value)))} />
                                                        </Field>
                                                    </div>
                                                    <Field label="Repeat End Date (Optional)">
                                                        <Input type="date" value={repeatEndDate} onChange={e => setRepeatEndDate(e.target.value)} />
                                                    </Field>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Live Mobile Preview panel */}
                            <div className="lg:col-span-1 p-8 bg-neutral-50/40 dark:bg-neutral-950/20 flex flex-col items-center justify-center min-h-[400px]">
                                <LivePreview
                                    headerFormat={headerFormat}
                                    headerText={headerText}
                                    headerLink={headerLink}
                                    bodyText={bodyText}
                                    footerText={footerText}
                                    btnType={btnType}
                                    quickReplies={quickReplies}
                                    ctaLabel={ctaLabel}
                                    ctaUrl={ctaUrl}
                                    previewParams={parameters}
                                    compact={true}
                                />
                            </div>

                        </div>

                        {/* Modal Footer Controls */}
                        <div className="px-8 py-4 bg-neutral-50 dark:bg-neutral-950/40 border-t border-border flex items-center justify-between shrink-0">
                            <div>
                                {step > 1 && (
                                    <button type="button" onClick={() => setStep(step - 1)}
                                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-neutral-550 dark:text-neutral-400 hover:text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-850 rounded-xl transition-all">
                                        <ChevronLeft size={16} /> Back
                                    </button>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <button type="button" onClick={() => { setIsModalOpen(false); setStep(1); }}
                                    className="px-4.5 py-2 text-xs font-semibold text-neutral-450 hover:text-foreground dark:hover:text-white transition-colors">
                                    Cancel
                                </button>
                                {step < 3 ? (
                                    <button type="button" onClick={() => setStep(step + 1)}
                                        disabled={(step === 1 && !isStep1Valid) || (step === 2 && !isStep2Valid)}
                                        className="flex items-center gap-1 px-4.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all shadow-sm">
                                        Next <ChevronRight size={16} />
                                    </button>
                                ) : (
                                    <button type="button" onClick={handleScheduleReminder}
                                        disabled={formLoading || !isStep3Valid}
                                        className="flex items-center gap-1.5 px-6 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all shadow-md shadow-emerald-600/10">
                                        {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send size={14} />}
                                        {formLoading ? 'Submitting Schedule...' : 'Confirm Schedule Campaign'}
                                    </button>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}
