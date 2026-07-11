import { useRouter } from 'next/router';
import { Tenant, impersonateStaff } from '../../services/api';
import { useState, useEffect } from 'react';

interface TenantTableProps {
    tenants: Tenant[];
    onDelete: (id: string) => void;
    onView: (tenant: Tenant) => void;
    onEdit: (tenant: Tenant) => void;
    onChangePassword: (tenant: Tenant) => void;
    isAffiliateView?: boolean;
}

export default function TenantTable({ tenants, onDelete, onView, onEdit, onChangePassword, isAffiliateView = false }: TenantTableProps) {
    const router = useRouter();
    const [loadingSlug, setLoadingSlug] = useState<string | null>(null);
    const [isMaster, setIsMaster] = useState(false);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const userObj = JSON.parse(userStr);
                if (userObj && (userObj.isMaster || userObj.role === 'affiliate')) {
                    setIsMaster(true);
                }
            } catch (e) {}
        }
    }, []);

    const handleManageStaff = async (slug: string) => {
        try {
            setLoadingSlug(slug);
            const res = await impersonateStaff(slug);
            if (res.status === 'Success' && res.token) {
                // Store in format expected by /[slug]/dashboard.tsx
                localStorage.setItem(`staff_token_${slug}`, res.token);
                localStorage.setItem(`staff_user_${slug}`, JSON.stringify(res.data));
                localStorage.setItem(`tenant_name_${slug}`, res.tenant?.clientName || slug);

                // Open staff dashboard in NEW tab
                window.open(`/${slug}/dashboard`, '_blank');
            } else {
                alert(res.message || 'Failed to impersonate');
            }
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.message || 'Error occurred while attempting to impersonate staff.');
        } finally {
            setLoadingSlug(null);
        }
    };

    const getPaymentBadgeClass = (status?: string) => {
        switch (status) {
            case 'COMPLETED':
                return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
            case 'PARTIAL':
                return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
            default: // PENDING
                return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
        }
    };

    return (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-2xl transition-all">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-neutral-50 dark:bg-neutral-900/80 uppercase text-xs font-semibold text-neutral-500 dark:text-neutral-400 border-b border-border">
                        <tr>
                            <th className="px-6 py-4">Organization</th>
                            <th className="px-6 py-4">Database Name</th>
                            <th className="px-6 py-4">DB Username</th>
                            <th className="px-6 py-4">Status</th>
                            {!isAffiliateView && <th className="px-6 py-4">Dealer</th>}
                            <th className="px-6 py-4">Amount</th>
                            <th className="px-6 py-4">Storage</th>
                            <th className="px-6 py-4">Payment Status</th>
                            <th className="px-6 py-4">Plan Period</th>
                            <th className="px-6 py-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {tenants.map(t => {
                            const usedMB = t.storageUsedMB || 0;
                            const limitGB = t.storageLimitGB || 1;
                            const limitMB = limitGB * 1024;
                            const percentage = Math.min(100, (usedMB / limitMB) * 100);
                            const progressColor = percentage > 90 ? 'bg-red-500' : percentage > 75 ? 'bg-amber-500' : 'bg-emerald-500';

                            return (
                                <tr key={t._id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                                                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-foreground">{t.clientName}</span>
                                            <span className={`inline-block px-1.5 py-0.5 text-[9px] font-bold uppercase rounded-md tracking-wider ${
                                                t.accountType === 'demo'
                                                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25'
                                                    : 'bg-indigo-500/15 text-indigo-650 dark:text-indigo-400 border border-indigo-500/25'
                                            }`}>
                                                {t.accountType || 'live'}
                                            </span>
                                        </div>
                                        <div className="text-neutral-500 dark:text-neutral-400 text-xs mt-0.5">{t.email}</div>
                                        {t.slug && (
                                            <div className="mt-0.5">
                                                <span className="inline-block font-mono text-xs bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20 rounded px-1.5 py-0.5">/{t.slug}</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-neutral-600 dark:text-neutral-300 font-mono text-xs">{t.databaseName}</td>
                                    <td className="px-6 py-4 text-neutral-500 dark:text-neutral-400">{t.dbUsername}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${t.status === 'active' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' :
                                            t.status === 'pending' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' :
                                                'bg-red-500/10 text-red-655 dark:text-red-400 border-red-500/20'
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${t.status === 'active' ? 'bg-emerald-500' :
                                                t.status === 'pending' ? 'bg-amber-500' : 'bg-red-500'
                                                }`}></span>
                                            {t.status}
                                        </span>
                                    </td>
                                    {!isAffiliateView && (
                                        <td className="px-6 py-4">
                                            {t.createdBy && typeof t.createdBy === 'object' ? (
                                                <div>
                                                    <div className="font-semibold text-foreground text-xs">{(t.createdBy as any).fullName}</div>
                                                    <div className="text-[10px] text-neutral-400">{(t.createdBy as any).email}</div>
                                                </div>
                                            ) : (
                                                <span className="text-neutral-400 text-xs font-medium bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">Direct</span>
                                            )}
                                        </td>
                                    )}
                                    <td className="px-6 py-4 font-semibold text-foreground">
                                        ₹{t.paidAmount !== undefined ? t.paidAmount : 0} / ₹{t.amount || 0}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1 w-44">
                                            <div className="flex justify-between items-center text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                                <span>{usedMB} MB</span>
                                                <span>{limitGB} GB</span>
                                            </div>
                                            <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2 overflow-hidden border border-neutral-200/40">
                                                <div className={`h-full rounded-full transition-all duration-500 ${progressColor}`} style={{ width: `${percentage}%` }}></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getPaymentBadgeClass(t.paymentStatus)}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                                t.paymentStatus === 'COMPLETED' ? 'bg-emerald-500' :
                                                t.paymentStatus === 'PARTIAL' ? 'bg-amber-500' : 'bg-red-500'
                                            }`}></span>
                                            {t.paymentStatus || 'PENDING'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-neutral-600 dark:text-neutral-400 text-xs">
                                        {t.planStartDate && t.planEndDate ? (
                                            <div>
                                                <div className="font-semibold text-foreground">
                                                    {new Date(t.planStartDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                                </div>
                                                <div className="text-[10px] text-neutral-400 mt-0.5">
                                                    to {new Date(t.planEndDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-neutral-400">N/A</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => onView(t)}
                                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-medium text-sm transition-colors py-1.5 px-3 hover:bg-indigo-400/10 rounded-lg mr-1 disabled:opacity-50"
                                        title="View Details"
                                        disabled={!!loadingSlug}
                                    >
                                        <svg className="w-5 h-5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    </button>
                                    {isMaster && (
                                        <button
                                            onClick={() => onEdit(t)}
                                            className="text-amber-600 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300 font-medium text-sm transition-colors py-1.5 px-3 hover:bg-amber-400/10 rounded-lg mr-1 disabled:opacity-50"
                                            title="Edit Tenant"
                                            disabled={!!loadingSlug}
                                        >
                                            <svg className="w-5 h-5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                        </button>
                                    )}
                                    {isMaster && (
                                        <button
                                            onClick={() => onChangePassword(t)}
                                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-medium text-sm transition-colors py-1.5 px-3 hover:bg-indigo-400/10 rounded-lg mr-1 disabled:opacity-50"
                                            title="Change Admin Password"
                                            disabled={!!loadingSlug}
                                        >
                                            <svg className="w-5 h-5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m-5 4a5 5 0 01-5-5 5 5 0 115 5zm0 0V19a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2a2 2 0 012-2h2" />
                                            </svg>
                                        </button>
                                    )}
                                                                    {t.slug && t.status === 'active' && (
                                        <button
                                            onClick={() => handleManageStaff(t.slug!)}
                                            className="relative text-violet-600 dark:text-violet-400 hover:text-violet-500 dark:hover:text-violet-300 font-medium text-sm transition-colors py-1.5 px-3 hover:bg-violet-400/10 rounded-lg mr-1 disabled:opacity-50"
                                            title="Manage Staff"
                                            disabled={!!loadingSlug}
                                        >
                                            {loadingSlug === t.slug ? (
                                                <div className="w-5 h-5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin"></div>
                                            ) : (
                                                <svg className="w-5 h-5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                            )}
                                        </button>
                                    )}
                                    {isMaster && (
                                        <button
                                            onClick={() => onDelete(t._id)}
                                            className="text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300 font-medium text-sm transition-colors py-1.5 px-3 hover:bg-red-400/10 rounded-lg disabled:opacity-50"
                                            title="Delete Tenant"
                                            disabled={!!loadingSlug}
                                        >
                                            <svg className="w-5 h-5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ); })}
                        {tenants.length === 0 && (
                            <tr>
                                <td colSpan={8} className="px-6 py-12 text-center text-neutral-500 dark:text-neutral-400">
                                    <div className="flex flex-col items-center justify-center">
                                        <svg className="w-10 h-10 mb-3 text-neutral-300 dark:text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                                        No tenants provisioned yet.
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
