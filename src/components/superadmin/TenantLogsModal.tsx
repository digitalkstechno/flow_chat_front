import React, { useEffect, useState } from 'react';
import { Tenant, TenantLog, getTenantLogs, updateTenantLog, deleteTenantLog } from '../../services/api';

interface TenantLogsModalProps {
    tenant: Tenant | null;
    onClose: () => void;
}

export default function TenantLogsModal({ tenant, onClose }: TenantLogsModalProps) {
    const [logs, setLogs] = useState<TenantLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [editingLogId, setEditingLogId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ action: '', status: '' });

    useEffect(() => {
        if (tenant) {
            fetchLogs(tenant._id);
        } else {
            setLogs([]);
        }
    }, [tenant]);

    const fetchLogs = async (id: string) => {
        try {
            setLoading(true);
            const res = await getTenantLogs(id);
            if (res.success) {
                setLogs(res.data);
            }
        } catch (err) {
            console.error('Failed to fetch logs:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (logId: string) => {
        if (!tenant || !window.confirm('Are you sure you want to delete this log entry?')) return;
        try {
            const res = await deleteTenantLog(tenant._id, logId);
            if (res.success) {
                setLogs(logs.filter(l => l._id !== logId));
            }
        } catch (err) {
            console.error('Failed to delete log:', err);
            alert('Failed to delete log');
        }
    };

    const handleEdit = (log: TenantLog) => {
        setEditingLogId(log._id);
        setEditForm({ action: log.action, status: log.status });
    };

    const handleSaveEdit = async (logId: string) => {
        if (!tenant) return;
        try {
            const res = await updateTenantLog(tenant._id, logId, editForm);
            if (res.success) {
                setLogs(logs.map(l => l._id === logId ? { ...l, ...editForm } : l));
                setEditingLogId(null);
            }
        } catch (err) {
            console.error('Failed to update log:', err);
            alert('Failed to update log');
        }
    };

    const handleCancelEdit = () => {
        setEditingLogId(null);
    };

    if (!tenant) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-card border border-border rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <div>
                        <h2 className="text-xl font-bold text-foreground mb-1">Tenant Logs</h2>
                        <p className="text-neutral-500 dark:text-neutral-400 text-sm">{tenant.clientName} ({tenant.databaseName})</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-neutral-500 hover:text-foreground p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                    {loading ? (
                        <div className="flex justify-center p-10">
                            <span className="animate-spin w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full"></span>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center text-neutral-500 dark:text-neutral-400 p-10">
                            No logs found for this tenant.
                        </div>
                    ) : (
                        <ul className="space-y-4">
                            {logs.map((log) => (
                                <li key={log._id} className="bg-neutral-50 dark:bg-neutral-800/40 p-4 rounded-xl border border-border group">
                                    {editingLogId === log._id ? (
                                        <div className="space-y-3">
                                            <div className="flex gap-4">
                                                <div className="flex-1">
                                                    <label className="text-xs text-neutral-500 mb-1 block">Action</label>
                                                    <input
                                                        type="text"
                                                        value={editForm.action}
                                                        onChange={(e) => setEditForm(prev => ({ ...prev, action: e.target.value }))}
                                                        className="w-full bg-neutral-100 dark:bg-neutral-900 border border-border text-foreground rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
                                                    />
                                                </div>
                                                <div className="w-48">
                                                    <label className="text-xs text-neutral-500 mb-1 block">Status</label>
                                                    <select
                                                        value={editForm.status}
                                                        onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                                                        className="w-full bg-neutral-100 dark:bg-neutral-900 border border-border text-foreground rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
                                                    >
                                                        <option value="success">Success</option>
                                                        <option value="failed">Failed</option>
                                                        <option value="pending">Pending</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-2">
                                                <button onClick={handleCancelEdit} className="px-3 py-1.5 text-xs text-neutral-500 hover:text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors">Cancel</button>
                                                <button onClick={() => handleSaveEdit(log._id)} className="px-3 py-1.5 text-xs text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow shadow-indigo-500/20">Save</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex justify-between items-start mb-2 relative">
                                                <div className="font-semibold text-foreground">{log.action}</div>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-1 mr-2">
                                                        <button
                                                            onClick={() => handleEdit(log)}
                                                            className="text-indigo-600 dark:text-indigo-400 p-1.5 hover:bg-indigo-600/10 rounded-md transition-colors"
                                                            title="Edit Log"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(log._id)}
                                                            className="text-red-600 dark:text-red-400 p-1.5 hover:bg-red-600/10 rounded-md transition-colors"
                                                            title="Delete Log"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                        </button>
                                                    </div>
                                                    <span className={`text-xs px-2 py-1 rounded-md ${log.status === 'success' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                                                            log.status === 'failed' ? 'bg-red-500/10 text-red-600 dark:text-red-400' :
                                                                'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                                        }`}>
                                                        {log.status.toUpperCase()}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
                                                {new Date(log.createdAt).toLocaleString()}
                                            </div>
                                            {log.details && (
                                                <div className="bg-neutral-100 dark:bg-neutral-900/50 text-neutral-600 dark:text-neutral-300 p-3 rounded-lg text-sm font-mono whitespace-pre-wrap word-break border border-border">
                                                    {JSON.stringify(log.details, null, 2)}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
