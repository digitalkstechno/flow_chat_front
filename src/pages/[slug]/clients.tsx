import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import TenantLayout from '@/components/tenant/TenantLayout';
import { useConfirm } from '@/context/ConfirmContext';
import {
    Search, X, Plus, Eye, Pencil, Trash2, Copy, Check,
    Users, Upload, Loader2, AlertCircle, CheckCircle2
} from 'lucide-react';
import { api } from '@/services/apiClient';
import { getClients, createClient, updateClient, deleteClient, Client } from '@/services/tenantService';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CustomerGroup {
    _id: string;
    name: string;
    color: string;
    membersCount?: number;
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ msg, type }: { msg: string; type: 'success' | 'error' | 'info' }) {
    const cls =
        type === 'success' ? 'bg-emerald-600 text-white shadow-emerald-600/30' :
        type === 'error'   ? 'bg-red-600 text-white shadow-red-600/30' :
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
    let timer: ReturnType<typeof setTimeout>;
    const show = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'success') => {
        clearTimeout(timer);
        setToast({ msg, type });
        timer = setTimeout(() => setToast(null), 4000);
    }, []);
    return { toast, show };
}

// ─── CopyPhone ────────────────────────────────────────────────────────────────

function CopyPhone({ phone }: { phone: string }) {
    const [copied, setCopied] = useState(false);
    const copy = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(phone);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };
    return (
        <div className="flex items-center gap-1.5 group/phone">
            <span className="text-sm font-medium text-slate-700 dark:text-zinc-300">{phone}</span>
            <button onClick={copy} className="opacity-0 group-hover/phone:opacity-100 transition-opacity p-1 text-slate-400 hover:text-blue-600" title="Copy">
                {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
            </button>
        </div>
    );
}

// ─── Input helper ─────────────────────────────────────────────────────────────

const inputCls = 'w-full border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 transition-all font-medium';

// ─── COLOR SWATCHES ───────────────────────────────────────────────────────────

const GROUP_COLORS = [
    '#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6',
    '#EC4899','#14B8A6','#F97316','#6366F1','#84CC16',
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ClientsPage() {
    const router = useRouter();
    const { slug } = router.query as { slug: string };
    const confirm = useConfirm();
    const { toast, show } = useToast();

    const [clients, setClients] = useState<Client[]>([]);
    const [groups, setGroups] = useState<CustomerGroup[]>([]);
    const [search, setSearch] = useState('');
    const [groupFilter, setGroupFilter] = useState('ALL');
    const [loading, setLoading] = useState(true);

    // ── Add modal ──────────────────────────────────────────────────────────────
    const [showAdd, setShowAdd] = useState(false);
    const [addForm, setAddForm] = useState({ fullName: '', phone: '', email: '', group: '' });
    const [addLoading, setAddLoading] = useState(false);

    // ── Edit modal ─────────────────────────────────────────────────────────────
    const [editClient, setEditClient] = useState<Client | null>(null);
    const [editForm, setEditForm] = useState({ fullName: '', phone: '', email: '', group: '' });
    const [editLoading, setEditLoading] = useState(false);

    // ── View modal ─────────────────────────────────────────────────────────────
    const [viewClient, setViewClient] = useState<Client | null>(null);

    // ── Groups manager ─────────────────────────────────────────────────────────
    const [showGroups, setShowGroups] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupColor, setNewGroupColor] = useState(GROUP_COLORS[0]);
    const [groupLoading, setGroupLoading] = useState(false);
    const [editGroupId, setEditGroupId] = useState<string | null>(null);
    const [editGroupName, setEditGroupName] = useState('');
    const [editGroupColor, setEditGroupColor] = useState('');

    // ── Bulk import ────────────────────────────────────────────────────────────
    const [showBulk, setShowBulk] = useState(false);
    const [parsing, setParsing] = useState(false);
    const [parseError, setParseError] = useState<string | null>(null);
    const [parsedData, setParsedData] = useState<any[]>([]);
    const [uploading, setUploading] = useState(false);

    // ─── Fetch ────────────────────────────────────────────────────────────────

    const fetchClients = useCallback(() => {
        if (!slug) return;
        setLoading(true);
        getClients(slug)
            .then(r => { if (r.success) setClients(r.data || []); })
            .catch(e => console.error(e))
            .finally(() => setLoading(false));
    }, [slug]);

    const fetchGroups = useCallback(() => {
        if (!slug) return;
        api.get(`/tenants/${slug}/customer-groups`)
            .then(res => { if (res.data.success) setGroups(res.data.data || []); })
            .catch(err => console.error(err));
    }, [slug]);

    useEffect(() => {
        fetchClients();
        fetchGroups();
    }, [fetchClients, fetchGroups]);

    // Escape key closes modals
    useEffect(() => {
        const h = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setShowAdd(false);
                setEditClient(null);
                setViewClient(null);
                setShowGroups(false);
                setShowBulk(false);
            }
        };
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, []);

    // ─── Filtered clients ─────────────────────────────────────────────────────

    const filtered = clients.filter(c => {
        const matchSearch =
            c.fullName.toLowerCase().includes(search.toLowerCase()) ||
            c.phone.includes(search) ||
            (c.email || '').toLowerCase().includes(search.toLowerCase());
        const matchGroup =
            groupFilter === 'ALL' ? true :
            groupFilter === 'NONE' ? !c.group :
            (c.group?._id || '') === groupFilter;
        return matchSearch && matchGroup;
    });

    // ─── Add Client ───────────────────────────────────────────────────────────

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!slug) return;
        setAddLoading(true);
        try {
            const res = await createClient(slug, {
                fullName: addForm.fullName,
                phone: addForm.phone,
                email: addForm.email || undefined,
                group: addForm.group || undefined,
            });
            if (res.success) {
                show('Client added successfully!', 'success');
                setShowAdd(false);
                setAddForm({ fullName: '', phone: '', email: '', group: '' });
                fetchClients();
                fetchGroups();
            }
        } catch (err: any) {
            show(err.response?.data?.message || 'Failed to add client.', 'error');
        } finally {
            setAddLoading(false);
        }
    };

    // ─── Edit Client ──────────────────────────────────────────────────────────

    const openEdit = (c: Client) => {
        setEditClient(c);
        setEditForm({
            fullName: c.fullName,
            phone: c.phone,
            email: c.email || '',
            group: (c.group as any)?._id || '',
        });
    };

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!slug || !editClient) return;
        setEditLoading(true);
        try {
            const res = await updateClient(slug, editClient._id, {
                fullName: editForm.fullName,
                phone: editForm.phone,
                email: editForm.email || 'N/A',
                group: editForm.group || null,
            });
            if (res.success) {
                show('Client updated successfully!', 'success');
                setEditClient(null);
                fetchClients();
                fetchGroups();
            }
        } catch (err: any) {
            show(err.response?.data?.message || 'Failed to update client.', 'error');
        } finally {
            setEditLoading(false);
        }
    };

    // ─── Delete Client ────────────────────────────────────────────────────────

    const handleDelete = async (c: Client) => {
        const ok = await confirm({
            title: 'Delete Client',
            message: `Are you sure you want to delete "${c.fullName}"? This cannot be undone.`,
            confirmLabel: 'Delete',
            cancelLabel: 'Cancel',
            variant: 'danger',
        });
        if (!ok) return;
        try {
            const res = await deleteClient(slug, c._id);
            if (res.success) {
                show('Client deleted.', 'success');
                fetchClients();
                fetchGroups();
            }
        } catch (err: any) {
            show(err.response?.data?.message || 'Failed to delete client.', 'error');
        }
    };

    // ─── Groups Manager ───────────────────────────────────────────────────────

    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGroupName.trim()) return;
        setGroupLoading(true);
        try {
            await api.post(`/tenants/${slug}/customer-groups`, { name: newGroupName.trim(), color: newGroupColor });
            setNewGroupName('');
            setNewGroupColor(GROUP_COLORS[0]);
            show('Group created!', 'success');
            fetchGroups();
        } catch (err: any) {
            show(err.response?.data?.message || 'Failed to create group.', 'error');
        } finally {
            setGroupLoading(false);
        }
    };

    const handleDeleteGroup = async (g: CustomerGroup) => {
        const ok = await confirm({
            title: 'Delete Group',
            message: `Delete "${g.name}"? All clients in this group will be unassigned.`,
            confirmLabel: 'Delete',
            cancelLabel: 'Cancel',
            variant: 'danger',
        });
        if (!ok) return;
        try {
            await api.delete(`/tenants/${slug}/customer-groups/${g._id}`);
            show('Group deleted.', 'success');
            fetchGroups();
            fetchClients();
        } catch (err: any) {
            show(err.response?.data?.message || 'Failed to delete group.', 'error');
        }
    };

    const handleUpdateGroup = async (g: CustomerGroup) => {
        if (!editGroupName.trim()) return;
        try {
            await api.put(`/tenants/${slug}/customer-groups/${g._id}`, { name: editGroupName, color: editGroupColor });
            setEditGroupId(null);
            show('Group updated!', 'success');
            fetchGroups();
            fetchClients();
        } catch (err: any) {
            show(err.response?.data?.message || 'Failed to update group.', 'error');
        }
    };

    // ─── Bulk Import ──────────────────────────────────────────────────────────

    const downloadTemplate = async () => {
        try {
            const ExcelJS = (await import('exceljs')).default;
            const wb = new ExcelJS.Workbook();
            const ws = wb.addWorksheet('Clients Template');
            ws.columns = [
                { header: 'S.No.', key: 'sNo', width: 8 },
                { header: 'Full Name *', key: 'fullName', width: 25 },
                { header: 'Mobile Phone *', key: 'phone', width: 20 },
                { header: 'Email', key: 'email', width: 25 },
                { header: 'Group Name', key: 'groupName', width: 20 },
            ];
            ws.addRow({ sNo: 'Demo', fullName: 'John Doe', phone: '9974401999', email: 'john@example.com', groupName: groups[0]?.name || '' });
            const buf = await wb.xlsx.writeBuffer();
            const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = 'clients_template.xlsx'; a.click();
            URL.revokeObjectURL(url);
        } catch { show('Failed to generate template.', 'error'); }
    };

    const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setParsing(true); setParseError(null); setParsedData([]);
        try {
            const ExcelJS = (await import('exceljs')).default;
            const wb = new ExcelJS.Workbook();
            const buf = await file.arrayBuffer();
            await wb.xlsx.load(buf);
            const ws = wb.getWorksheet(1);
            if (!ws) throw new Error('Worksheet not found');
            const list: any[] = [];
            ws.eachRow((row, rowNum) => {
                if (rowNum <= 2) return;
                const fullName = row.getCell(2).value?.toString()?.trim();
                const rawPhone = row.getCell(3).value?.toString()?.trim();
                const email = row.getCell(4).value?.toString()?.trim() || '';
                const groupName = row.getCell(5).value?.toString()?.trim();
                const matchedGroup = groups.find(g => g.name.toLowerCase() === groupName?.toLowerCase());
                let phone = rawPhone ? rawPhone.replace(/\D/g, '') : '';
                if (phone.length === 10) phone = '91' + phone;
                if (fullName || rawPhone) {
                    list.push({
                        fullName, phone, email,
                        group: matchedGroup?._id,
                        groupName: matchedGroup?.name || groupName || 'None',
                        isValid: !!fullName && !!phone && phone.length >= 10,
                        rowNum,
                    });
                }
            });
            if (list.length === 0) throw new Error('No client rows found. Data must start from row 3.');
            setParsedData(list);
        } catch (err: any) {
            setParseError(err.message || 'Failed to parse file.');
        } finally {
            setParsing(false);
            e.target.value = '';
        }
    };

    const submitBulk = async () => {
        const valid = parsedData.filter(c => c.isValid);
        if (valid.length === 0) { show('No valid clients to import.', 'error'); return; }
        setUploading(true);
        try {
            const res = await api.post(`/tenants/${slug}/clients/bulk`, valid.map(c => ({
                fullName: c.fullName, phone: c.phone, email: c.email, group: c.group
            })));
            if (res.data.success) {
                show(`Imported ${res.data.count} clients! (${res.data.skipped || 0} skipped as duplicates)`, 'success');
                setShowBulk(false); setParsedData([]);
                fetchClients(); fetchGroups();
            }
        } catch (err: any) {
            show(err.response?.data?.message || 'Bulk import failed.', 'error');
        } finally {
            setUploading(false);
        }
    };

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <TenantLayout title="Clients">
            {toast && <Toast msg={toast.msg} type={toast.type} />}

            <div className="max-w-7xl mx-auto space-y-6 pb-10">

                {/* Header */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Clients</h1>
                        <p className="text-slate-400 text-sm mt-1.5 font-medium">Manage your CRM client list and groups.</p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <button onClick={() => setShowGroups(true)}
                            className="flex items-center gap-2 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 px-4 py-2.5 rounded-xl text-sm font-bold transition-all">
                            <Users size={16} /> Manage Groups
                        </button>
                        <button onClick={() => setShowBulk(true)}
                            className="flex items-center gap-2 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 px-4 py-2.5 rounded-xl text-sm font-bold transition-all">
                            <Upload size={16} /> Bulk Import
                        </button>
                        <button onClick={() => setShowAdd(true)}
                            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-500/20 active:scale-95">
                            <Plus size={16} /> Add Client
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name, phone or email..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/25 font-medium text-slate-800 dark:text-zinc-200"
                        />
                    </div>
                    <select
                        value={groupFilter}
                        onChange={e => setGroupFilter(e.target.value)}
                        className="px-4 py-2.5 text-sm bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/25 font-medium text-slate-700 dark:text-zinc-300 min-w-[180px]"
                    >
                        <option value="ALL">All Groups ({clients.length})</option>
                        <option value="NONE">Unassigned ({clients.filter(c => !c.group).length})</option>
                        {groups.map(g => (
                            <option key={g._id} value={g._id}>{g.name} ({g.membersCount ?? 0})</option>
                        ))}
                    </select>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-[#0f0f1c] border border-slate-100 dark:border-zinc-800/80 rounded-2xl shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="py-20 flex items-center justify-center gap-2 text-slate-400">
                            <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                            <span className="text-xs font-bold uppercase tracking-widest">Loading clients...</span>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="py-20 text-center">
                            <Users className="w-10 h-10 text-slate-300 dark:text-zinc-700 mx-auto mb-3" />
                            <p className="text-slate-400 text-sm font-medium">
                                {clients.length === 0 ? 'No clients yet. Click "Add Client" to get started.' : 'No clients match your search/filter.'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/80 dark:bg-zinc-900/60 text-slate-500 dark:text-zinc-500 border-b border-slate-100 dark:border-zinc-800 font-bold uppercase tracking-wider">
                                        <th className="px-5 py-3.5">#</th>
                                        <th className="px-5 py-3.5">Name</th>
                                        <th className="px-5 py-3.5">Phone</th>
                                        <th className="px-5 py-3.5">Email</th>
                                        <th className="px-5 py-3.5">Group</th>
                                        <th className="px-5 py-3.5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-zinc-800/50">
                                    {filtered.map((c, i) => (
                                        <tr key={c._id} className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/20 transition-colors group">
                                            <td className="px-5 py-3.5 text-slate-400 dark:text-zinc-600 font-bold">{i + 1}</td>
                                            <td className="px-5 py-3.5">
                                                <span className="font-bold text-slate-800 dark:text-zinc-100 text-sm">{c.fullName}</span>
                                            </td>
                                            <td className="px-5 py-3.5"><CopyPhone phone={c.phone} /></td>
                                            <td className="px-5 py-3.5 text-slate-500 dark:text-zinc-400 font-medium">{c.email || '—'}</td>
                                            <td className="px-5 py-3.5">
                                                {c.group ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold text-white"
                                                        style={{ backgroundColor: (c.group as any).color || '#6366F1' }}>
                                                        {(c.group as any).name}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-300 dark:text-zinc-700 font-medium text-[11px]">—</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <div className="flex justify-end items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => setViewClient(c)}
                                                        className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all" title="View">
                                                        <Eye size={15} />
                                                    </button>
                                                    <button onClick={() => openEdit(c)}
                                                        className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all" title="Edit">
                                                        <Pencil size={15} />
                                                    </button>
                                                    <button onClick={() => handleDelete(c)}
                                                        className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all" title="Delete">
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="px-5 py-3 border-t border-slate-50 dark:border-zinc-800/50 bg-slate-50/30 dark:bg-zinc-900/30">
                                <span className="text-[11px] text-slate-400 dark:text-zinc-600 font-bold">
                                    Showing {filtered.length} of {clients.length} clients
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Add Client Modal ─────────────────────────────────────────── */}
            {showAdd && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                    onClick={e => { if (e.target === e.currentTarget) setShowAdd(false); }}>
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-100 dark:border-zinc-800">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">Add New Client</h3>
                            <button onClick={() => setShowAdd(false)} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleAdd} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 mb-1.5">Full Name *</label>
                                <input required value={addForm.fullName} onChange={e => setAddForm(f => ({ ...f, fullName: e.target.value }))}
                                    placeholder="e.g. John Doe" className={inputCls} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 mb-1.5">Phone Number *</label>
                                <input required value={addForm.phone} onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))}
                                    placeholder="e.g. 919974401999 (with country code)" className={inputCls} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 mb-1.5">Email</label>
                                <input type="email" value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))}
                                    placeholder="e.g. john@example.com" className={inputCls} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 mb-1.5">Group (optional)</label>
                                <select value={addForm.group} onChange={e => setAddForm(f => ({ ...f, group: e.target.value }))} className={inputCls}>
                                    <option value="">— No Group —</option>
                                    {groups.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
                                </select>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowAdd(false)}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-sm font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" disabled={addLoading}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                                    {addLoading && <Loader2 size={15} className="animate-spin" />}
                                    Add Client
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Edit Client Modal ────────────────────────────────────────── */}
            {editClient && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                    onClick={e => { if (e.target === e.currentTarget) setEditClient(null); }}>
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-100 dark:border-zinc-800">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">Edit Client</h3>
                            <button onClick={() => setEditClient(null)} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleEdit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 mb-1.5">Full Name *</label>
                                <input required value={editForm.fullName} onChange={e => setEditForm(f => ({ ...f, fullName: e.target.value }))}
                                    placeholder="Full Name" className={inputCls} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 mb-1.5">Phone Number *</label>
                                <input required value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                                    placeholder="Phone" className={inputCls} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 mb-1.5">Email</label>
                                <input type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                                    placeholder="Email" className={inputCls} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 mb-1.5">Group</label>
                                <select value={editForm.group} onChange={e => setEditForm(f => ({ ...f, group: e.target.value }))} className={inputCls}>
                                    <option value="">— No Group —</option>
                                    {groups.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
                                </select>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setEditClient(null)}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-sm font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" disabled={editLoading}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                                    {editLoading && <Loader2 size={15} className="animate-spin" />}
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── View Client Modal ────────────────────────────────────────── */}
            {viewClient && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                    onClick={e => { if (e.target === e.currentTarget) setViewClient(null); }}>
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-sm border border-slate-100 dark:border-zinc-800">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">Client Details</h3>
                            <button onClick={() => setViewClient(null)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-black text-xl">
                                    {viewClient.fullName.slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-lg font-black text-slate-900 dark:text-white">{viewClient.fullName}</p>
                                    {viewClient.group && (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white mt-1"
                                            style={{ backgroundColor: (viewClient.group as any).color || '#6366F1' }}>
                                            {(viewClient.group as any).name}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-3 pt-2">
                                {[
                                    { label: 'Phone', value: viewClient.phone },
                                    { label: 'Email', value: viewClient.email || '—' },
                                    { label: 'Added On', value: viewClient.addedOn ? new Date(viewClient.addedOn).toLocaleDateString() : '—' },
                                ].map(row => (
                                    <div key={row.label} className="flex items-center justify-between py-2.5 border-b border-slate-50 dark:border-zinc-800/60">
                                        <span className="text-xs font-bold text-slate-400 dark:text-zinc-500">{row.label}</span>
                                        <span className="text-sm font-semibold text-slate-700 dark:text-zinc-300">{row.value}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => { setViewClient(null); openEdit(viewClient); }}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-all flex items-center justify-center gap-2">
                                    <Pencil size={14} /> Edit
                                </button>
                                <button onClick={() => { setViewClient(null); handleDelete(viewClient); }}
                                    className="px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-sm font-bold transition-all">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Groups Manager Modal ─────────────────────────────────────── */}
            {showGroups && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                    onClick={e => { if (e.target === e.currentTarget) setShowGroups(false); }}>
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-100 dark:border-zinc-800 max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800 shrink-0">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">Manage Client Groups</h3>
                            <button onClick={() => setShowGroups(false)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"><X size={18} /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-5">
                            {/* Create new group */}
                            <form onSubmit={handleCreateGroup} className="bg-slate-50 dark:bg-zinc-800/50 rounded-xl p-4 space-y-3">
                                <p className="text-xs font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Create New Group</p>
                                <input value={newGroupName} onChange={e => setNewGroupName(e.target.value)}
                                    placeholder="Group name..." className={inputCls} />
                                <div>
                                    <p className="text-xs font-bold text-slate-500 dark:text-zinc-500 mb-2">Pick a color:</p>
                                    <div className="flex gap-2 flex-wrap">
                                        {GROUP_COLORS.map(color => (
                                            <button type="button" key={color} onClick={() => setNewGroupColor(color)}
                                                className={`w-7 h-7 rounded-full transition-all ${newGroupColor === color ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'opacity-80 hover:opacity-100'}`}
                                                style={{ backgroundColor: color }} />
                                        ))}
                                    </div>
                                </div>
                                <button type="submit" disabled={groupLoading || !newGroupName.trim()}
                                    className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                                    {groupLoading && <Loader2 size={14} className="animate-spin" />}
                                    <Plus size={14} /> Create Group
                                </button>
                            </form>

                            {/* Existing groups */}
                            {groups.length === 0 ? (
                                <p className="text-center text-xs text-slate-400 dark:text-zinc-600 py-4 font-medium">No groups yet. Create one above.</p>
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-xs font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Existing Groups</p>
                                    {groups.map(g => (
                                        <div key={g._id} className="flex items-center gap-3 p-3 border border-slate-100 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900">
                                            {editGroupId === g._id ? (
                                                <>
                                                    <input value={editGroupName} onChange={e => setEditGroupName(e.target.value)}
                                                        className="flex-1 text-sm border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-200 bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-200" />
                                                    <div className="flex gap-1">
                                                        {GROUP_COLORS.map(color => (
                                                            <button type="button" key={color} onClick={() => setEditGroupColor(color)}
                                                                className={`w-5 h-5 rounded-full transition-all ${editGroupColor === color ? 'ring-2 ring-offset-1 ring-slate-400 scale-110' : ''}`}
                                                                style={{ backgroundColor: color }} />
                                                        ))}
                                                    </div>
                                                    <button onClick={() => handleUpdateGroup(g)}
                                                        className="p-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"><Check size={13} /></button>
                                                    <button onClick={() => setEditGroupId(null)}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"><X size={13} /></button>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: g.color }} />
                                                    <span className="flex-1 text-sm font-bold text-slate-800 dark:text-zinc-200">{g.name}</span>
                                                    <span className="text-xs text-slate-400 dark:text-zinc-600 font-medium">{g.membersCount ?? 0} members</span>
                                                    <button onClick={() => { setEditGroupId(g._id); setEditGroupName(g.name); setEditGroupColor(g.color); }}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors"><Pencil size={13} /></button>
                                                    <button onClick={() => handleDeleteGroup(g)}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"><Trash2 size={13} /></button>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Bulk Import Modal ────────────────────────────────────────── */}
            {showBulk && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                    onClick={e => { if (e.target === e.currentTarget) { setShowBulk(false); setParsedData([]); setParseError(null); } }}>
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-100 dark:border-zinc-800 max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800 shrink-0">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">Bulk Import Clients</h3>
                            <button onClick={() => { setShowBulk(false); setParsedData([]); setParseError(null); }}
                                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-5">
                            <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30 rounded-xl">
                                <div className="text-xs text-blue-700 dark:text-blue-300 font-medium leading-relaxed">
                                    Download the template, fill in client data (name, phone required; 10-digit phones are auto-prefixed with 91), then upload. Duplicates are skipped.
                                </div>
                                <button onClick={downloadTemplate}
                                    className="shrink-0 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors">
                                    Download Template
                                </button>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 mb-2">Upload Excel File (.xlsx)</label>
                                <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-200 dark:border-zinc-700 rounded-xl py-8 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/10 transition-all">
                                    {parsing ? <Loader2 className="w-6 h-6 animate-spin text-emerald-500" /> : <Upload className="w-6 h-6 text-slate-400" />}
                                    <span className="text-xs text-slate-400 font-medium">{parsing ? 'Parsing...' : 'Click to select .xlsx file'}</span>
                                    <input type="file" accept=".xlsx" onChange={handleExcelUpload} className="hidden" />
                                </label>
                            </div>

                            {parseError && (
                                <div className="p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl text-xs text-red-600 dark:text-red-400 font-medium">
                                    {parseError}
                                </div>
                            )}

                            {parsedData.length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-bold text-slate-600 dark:text-zinc-300">
                                            Preview: {parsedData.filter(c => c.isValid).length} valid / {parsedData.length} total rows
                                        </p>
                                        <button onClick={submitBulk} disabled={uploading}
                                            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all disabled:opacity-60 flex items-center gap-2">
                                            {uploading && <Loader2 size={13} className="animate-spin" />}
                                            Import {parsedData.filter(c => c.isValid).length} Clients
                                        </button>
                                    </div>
                                    <div className="max-h-[32vh] overflow-y-auto border border-slate-100 dark:border-zinc-800 rounded-xl">
                                        <table className="w-full text-xs border-collapse">
                                            <thead className="bg-slate-50 dark:bg-zinc-800/60 text-slate-500 dark:text-zinc-500">
                                                <tr>
                                                    <th className="px-3 py-2 text-left font-bold">Status</th>
                                                    <th className="px-3 py-2 text-left font-bold">Name</th>
                                                    <th className="px-3 py-2 text-left font-bold">Phone</th>
                                                    <th className="px-3 py-2 text-left font-bold">Group</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50 dark:divide-zinc-800">
                                                {parsedData.map((c, i) => (
                                                    <tr key={i} className={c.isValid ? '' : 'bg-red-50/30 dark:bg-red-950/10'}>
                                                        <td className="px-3 py-2">
                                                            <span className={`font-bold ${c.isValid ? 'text-emerald-600' : 'text-red-500'}`}>
                                                                {c.isValid ? '✓ Valid' : '✗ Invalid'}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-2 font-medium text-slate-700 dark:text-zinc-300">{c.fullName || '—'}</td>
                                                        <td className="px-3 py-2 font-mono text-slate-600 dark:text-zinc-400">{c.phone || '—'}</td>
                                                        <td className="px-3 py-2 text-slate-500 dark:text-zinc-500">{c.groupName || '—'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </TenantLayout>
    );
}
