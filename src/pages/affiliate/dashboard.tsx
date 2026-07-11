import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AffiliateLayout from '../../components/affiliate/AffiliateLayout';
import { getDashboardSummary, getTenants, Tenant } from '../../services/api';
import { IndianRupee } from 'lucide-react';

export default function AffiliateDashboard() {
    const router = useRouter();
    const [isAuth, setIsAuth] = useState(false);
    const [summary, setSummary] = useState<any>(null);
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (!localStorage.getItem('token')) {
            router.push('/superadmin/login');
        } else {
            setIsAuth(true);
            fetchData();
        }
    }, [router]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [summaryRes, tenantsRes] = await Promise.all([
                getDashboardSummary(),
                getTenants()
            ]);

            if (summaryRes.success) {
                setSummary(summaryRes.data);
            }
            if (tenantsRes.success) {
                setTenants(tenantsRes.data);
            }
        } catch (error) {
            console.error("Failed to fetch dashboard data", error);
        } finally {
            setLoading(false);
        }
    };

    const getDaysRemaining = (endDateStr?: string) => {
        if (!endDateStr) return null;
        const end = new Date(endDateStr).getTime();
        const now = new Date().setHours(0, 0, 0, 0);
        return Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    };

    const getDaysBadge = (days: number | null) => {
        if (days === null) return <span className="text-neutral-400">N/A</span>;
        if (days < 0) {
            return (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 dark:bg-red-950/35 text-red-600 dark:text-red-400 border border-red-200/20">
                    Expired ({Math.abs(days)}d ago)
                </span>
            );
        }
        if (days <= 15) {
            return (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 dark:bg-amber-950/35 text-amber-600 dark:text-amber-400 border border-amber-200/20 animate-pulse">
                    Expiring ({days}d left)
                </span>
            );
        }
        return (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/35 text-emerald-600 dark:text-emerald-400 border border-emerald-200/20">
                Active ({days}d left)
            </span>
        );
    };

    const filteredTenants = tenants.filter(t => 
        t.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.slug && t.slug.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (!isAuth) return null;

    // Financial indicators
    const revenueProgress = summary?.totalSubscriptionAmount 
        ? Math.round((summary.totalPaidAmount / summary.totalSubscriptionAmount) * 100) 
        : 0;

    // Storage indicators
    const totalStorageLimitMB = (summary?.totalStorageLimitGB || 0) * 1024;
    const storageProgress = totalStorageLimitMB 
        ? Math.min(100, Math.round((summary.totalStorageUsedMB / totalStorageLimitMB) * 100)) 
        : 0;

    return (
        <AffiliateLayout title="Dashboard">
            <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">Affiliate Overview</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1 text-sm">Real-time statistics across your clients' provisioned database clusters</p>
                </div>
                <button
                    onClick={fetchData}
                    disabled={loading}
                    className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl transition-all text-sm font-medium shadow-[0_4px_20px_rgba(245,158,11,0.2)] active:scale-95 disabled:opacity-50"
                >
                    <svg className={`w-4.5 h-4.5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh Metrics
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Collected Revenue Card */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-xl relative overflow-hidden transition-all duration-300 hover:border-emerald-500/20">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
                            <IndianRupee className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 rounded px-2 py-0.5 leading-none mt-1">
                            {revenueProgress}% Collected
                        </span>
                    </div>
                    <div className="mt-2 text-3xl font-black text-foreground">
                        {loading ? '...' : `₹${summary?.totalPaidAmount?.toLocaleString() || 0}`}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-neutral-500 dark:text-neutral-400">My Collected Revenue</div>
                    <div className="mt-3 text-xs text-neutral-400 dark:text-neutral-500 flex justify-between">
                        <span>Billing Target: ₹{summary?.totalSubscriptionAmount?.toLocaleString() || 0}</span>
                    </div>
                </div>

                {/* Pending Balances Card */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-xl relative overflow-hidden transition-all duration-300 hover:border-amber-500/20">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-bl-full pointer-events-none" />
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                    <div className="mt-2 text-3xl font-black text-foreground">
                        {loading ? '...' : `₹${summary?.pendingRevenue?.toLocaleString() || 0}`}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-neutral-500 dark:text-neutral-400">Client Balances Pending</div>
                    <div className="mt-3 text-xs text-neutral-400 dark:text-neutral-500">
                        Total uncollected billing from your clients
                    </div>
                </div>

                {/* Combined storage tracker */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-xl relative overflow-hidden transition-all duration-300 hover:border-indigo-500/20">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-full pointer-events-none" />
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-500">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                            </svg>
                        </div>
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-500/10 rounded px-2 py-0.5 leading-none mt-1">
                            {storageProgress}% Allocated
                        </span>
                    </div>
                    <div className="mt-2 text-2xl font-black text-foreground">
                        {loading ? '...' : `${summary?.totalStorageUsedMB?.toFixed(1) || 0} MB`}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-neutral-500 dark:text-neutral-400">Total Storage Used</div>
                    <div className="mt-3 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${storageProgress}%` }}></div>
                    </div>
                    <div className="mt-2 text-[10px] text-neutral-400 dark:text-neutral-500">
                        Limit Cap: {summary?.totalStorageLimitGB || 0} GB
                    </div>
                </div>

                {/* Total Documents Card */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-xl relative overflow-hidden transition-all duration-300 hover:border-purple-500/20">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-bl-full pointer-events-none" />
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-3 bg-purple-500/10 rounded-xl text-purple-500">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <span className="text-[10px] uppercase font-bold text-purple-600 bg-purple-500/10 rounded px-1.5 py-0.5 mt-1 leading-none">
                            Indexed
                        </span>
                    </div>
                    <div className="mt-2 text-3xl font-black text-foreground">
                        {loading ? '...' : summary?.totalDocuments?.toLocaleString() || 0}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-neutral-500 dark:text-neutral-400">Total Client Documents</div>
                    <div className="mt-3 text-xs text-neutral-400 dark:text-neutral-500">
                        Aggregated metadata file records
                    </div>
                </div>
            </div>

            {/* Main Area: Active Clients Table & Details */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
                {/* Active Client Table */}
                <div className="xl:col-span-2 bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
                    <div className="p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-bold text-foreground">My Client Directory</h2>
                            <p className="text-xs text-neutral-500 mt-1">Real-time status indicators and space quotas for your clients</p>
                        </div>
                        <div className="relative max-w-xs w-full">
                            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search clients..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full bg-neutral-50 dark:bg-neutral-900/50 border border-border rounded-xl py-2 pl-9 pr-4 text-xs focus:ring-2 focus:ring-amber-500/30 outline-none placeholder:text-neutral-500 text-foreground transition-all"
                            />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-neutral-50 dark:bg-neutral-900/80 uppercase text-[10px] font-bold tracking-wider text-neutral-500 dark:text-neutral-400 border-b border-border">
                                <tr>
                                    <th className="px-6 py-4">Client Organization</th>
                                    <th className="px-6 py-4">Storage Usage</th>
                                    <th className="px-6 py-4">Days Remaining</th>
                                    <th className="px-6 py-4">Payment</th>
                                    <th className="px-6 py-4">Billing Ratio</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredTenants.map(t => {
                                    const used = t.storageUsedMB || 0;
                                    const limit = (t.storageLimitGB || 1) * 1024;
                                    const pct = Math.min(100, Math.round((used / limit) * 100));
                                    const progressColor = pct > 90 ? 'bg-red-500' : pct > 75 ? 'bg-amber-500' : 'bg-emerald-500';
                                    const daysRemaining = getDaysRemaining(t.planEndDate);

                                    return (
                                        <tr key={t._id} className="hover:bg-neutral-50/40 dark:hover:bg-neutral-800/10 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-foreground text-sm">{t.clientName}</div>
                                                <div className="text-neutral-400 text-xs mt-0.5 flex items-center gap-1.5">
                                                    <span>{t.email}</span>
                                                    <span className="w-1 h-1 rounded-full bg-neutral-600"></span>
                                                    <span className="font-mono text-[10px] text-amber-500 dark:text-amber-400">/{t.slug}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1 w-32">
                                                    <div className="flex justify-between items-center text-[10px] text-neutral-500 font-bold uppercase">
                                                        <span>{used.toFixed(1)} MB</span>
                                                        <span>{t.storageLimitGB} GB</span>
                                                    </div>
                                                    <div className="w-full bg-neutral-100 dark:bg-neutral-850 rounded-full h-1.5 overflow-hidden">
                                                        <div className={`h-full rounded-full ${progressColor}`} style={{ width: `${pct}%` }}></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {getDaysBadge(daysRemaining)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${
                                                    t.paymentStatus === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' :
                                                    t.paymentStatus === 'PARTIAL' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' :
                                                    'bg-red-500/10 text-red-650 dark:text-red-400 border-red-500/20'
                                                }`}>
                                                    {t.paymentStatus || 'PENDING'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-mono font-bold text-xs text-foreground">
                                                ₹{t.paidAmount?.toLocaleString() || 0} / ₹{t.amount?.toLocaleString() || 0}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredTenants.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-neutral-500">
                                            No client directory matches.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Side Panel: Recent Provisions & Distribution */}
                <div className="space-y-6">
                    {/* Status breakdown Card */}
                    <div className="bg-card border border-border rounded-2xl p-6 shadow-xl">
                        <h3 className="font-bold text-foreground text-sm mb-4 uppercase tracking-wider">Client Health</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-semibold text-neutral-500 flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded bg-emerald-500" /> Active clients
                                </span>
                                <span className="font-bold text-foreground">{summary?.statusStats?.active || 0}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-semibold text-neutral-500 flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded bg-amber-500" /> Pending setup
                                </span>
                                <span className="font-bold text-foreground">{summary?.statusStats?.pending || 0}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-semibold text-neutral-500 flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded bg-red-500" /> Suspended
                                </span>
                                <span className="font-bold text-foreground">{summary?.statusStats?.inactive || 0}</span>
                            </div>
                        </div>
                    </div>

                    {/* Recent Provisions Card */}
                    <div className="bg-card border border-border rounded-2xl p-6 shadow-xl">
                        <h3 className="font-bold text-foreground text-sm mb-4 uppercase tracking-wider">Recent Creations</h3>
                        <div className="divide-y divide-border/60">
                            {summary?.recentTenants?.map((t: any) => (
                                <div key={t._id} className="py-3.5 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="font-bold text-foreground text-sm truncate">{t.clientName}</div>
                                        <div className="text-[10px] text-neutral-400 truncate mt-0.5">{new Date(t.createdAt).toLocaleDateString()}</div>
                                    </div>
                                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase shrink-0 ${
                                        t.status === 'active' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                                        t.status === 'pending' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' :
                                        'bg-red-500/10 text-red-650 dark:text-red-400'
                                    }`}>
                                        {t.status}
                                    </span>
                                </div>
                            ))}
                            {(!summary?.recentTenants || summary?.recentTenants.length === 0) && (
                                <p className="text-xs text-neutral-500 text-center py-4">No recent provisions.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AffiliateLayout>
    );
}
