import { Tenant } from '../../services/api';
import { useState } from 'react';
import { decrypt } from '../../utils/encryption';

interface Props {
    tenant: Tenant | null;
    onClose: () => void;
}

export default function TenantDetailsModal({ tenant, onClose }: Props) {
    const [showDBPassword, setShowDBPassword] = useState(false);
    const [showCluster, setShowCluster] = useState(false);

    if (!tenant) return null;

    const displayPassword = tenant.dbPassword ? decrypt(tenant.dbPassword) : 'Not available';
    const displayClusterString = tenant.clusterConnectionString ? decrypt(tenant.clusterConnectionString) : 'Not available';

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                {/* Header */}
                <div className="bg-neutral-50 dark:bg-neutral-800/50 px-6 py-4 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <span className="font-bold text-white text-lg tracking-tighter">{tenant.clientName?.[0]?.toUpperCase()}</span>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-foreground tracking-tight">{tenant.clientName}</h3>
                            <p className="text-neutral-500 dark:text-neutral-400 text-sm">Tenant Organization Details</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-neutral-400 hover:text-foreground hover:bg-neutral-200 dark:hover:bg-neutral-700/50 rounded-lg transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {/* Box 1 */}
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-xs font-semibold text-neutral-500 dark:text-neutral-300 uppercase tracking-wider mb-1">Organization Slug</h4>
                                <div className="text-sm font-mono text-indigo-600 dark:text-indigo-400 bg-neutral-100 dark:bg-neutral-800/40 rounded-lg px-3 py-2 border border-border">{tenant.slug || 'N/A'}</div>
                            </div>
                            <div>
                                <h4 className="text-xs font-semibold text-neutral-500 dark:text-neutral-300 uppercase tracking-wider mb-1">Contact Email</h4>
                                <div className="text-sm text-foreground bg-neutral-100 dark:bg-neutral-800/40 rounded-lg px-3 py-2 border border-border">{tenant.email}</div>
                            </div>
                            <div>
                                <h4 className="text-xs font-semibold text-neutral-500 dark:text-neutral-300 uppercase tracking-wider mb-1">Phone / Mobile</h4>
                                <div className="text-sm text-foreground bg-neutral-100 dark:bg-neutral-800/40 rounded-lg px-3 py-2 border border-border">{tenant.mobile || 'N/A'}</div>
                            </div>
                            <div>
                                <h4 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">Status</h4>
                                <div className="mt-1">
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${tenant.status === 'active' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' :
                                        tenant.status === 'pending' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' :
                                            'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                                        }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${tenant.status === 'active' ? 'bg-emerald-500' :
                                            tenant.status === 'pending' ? 'bg-amber-500' : 'bg-red-500'
                                            }`}></span>
                                        {tenant.status || 'Active'}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <h4 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">Account Type</h4>
                                <div className="text-sm font-bold capitalize text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-150/30 rounded-lg px-3 py-2">
                                    {(tenant.accountType || 'live')} account
                                </div>
                            </div>
                            <div>
                                <h4 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">Dealer / Affiliate</h4>
                                <div className="text-sm font-bold text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-150/30 rounded-lg px-3 py-2">
                                    {tenant.createdBy && typeof tenant.createdBy === 'object' 
                                        ? (tenant.createdBy as any).fullName || (tenant.createdBy as any).email 
                                        : 'Direct Superadmin'}
                                </div>
                            </div>
                            <div>
                                <h4 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">Provisioned Date</h4>
                                <div className="text-sm text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800/40 rounded-lg px-3 py-2 border border-border">{new Date(tenant.createdAt).toLocaleDateString()} at {new Date(tenant.createdAt).toLocaleTimeString()}</div>
                            </div>
                        </div>

                        {/* Box 2 */}
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">Project Name</h4>
                                <div className="text-sm text-foreground bg-neutral-100 dark:bg-neutral-800/40 rounded-lg px-3 py-2 border border-border">{tenant.projectName || tenant.clientName}</div>
                            </div>
                            <div>
                                <h4 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">Database Name</h4>
                                <div className="text-sm font-mono text-emerald-600 dark:text-emerald-400 bg-neutral-100 dark:bg-neutral-800/40 rounded-lg px-3 py-2 border border-border">{tenant.databaseName}</div>
                            </div>
                            <div>
                                <h4 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">DB Username</h4>
                                <div className="text-sm font-mono text-foreground bg-neutral-100 dark:bg-neutral-800/40 rounded-lg px-3 py-2 border border-border">{tenant.dbUsername}</div>
                            </div>
                            <div>
                                <h4 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">DB Password</h4>
                                <div className="relative">
                                    <input
                                        type={showDBPassword ? "text" : "password"}
                                        readOnly
                                        value={displayPassword}
                                        title={displayPassword}
                                        className="w-full bg-neutral-100 dark:bg-neutral-800/40 border border-border rounded-lg text-foreground font-mono text-sm px-3 py-2 pr-10 focus:outline-none"
                                    />
                                    <button
                                        onClick={() => setShowDBPassword(!showDBPassword)}
                                        className="absolute right-2 top-2 text-neutral-500 hover:text-emerald-500 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            {showDBPassword ? (
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                            ) : (
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            )}
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <div>
                                <h4 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">ID Ref</h4>
                                <div className="text-xs font-mono text-neutral-500 bg-neutral-100 dark:bg-neutral-800/40 rounded-lg px-3 py-2 border border-border truncate" title={tenant._id}>{tenant._id}</div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6">
                        <h4 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">Cluster Connection String</h4>
                        <div className="relative">
                            <input
                                type={showCluster ? "text" : "password"}
                                readOnly
                                value={displayClusterString}
                                className="w-full bg-neutral-100 dark:bg-black/50 border border-border rounded-lg text-emerald-600 dark:text-emerald-400 font-mono text-xs p-3 pr-16 focus:outline-none focus:border-emerald-500/50"
                            />
                            {tenant.clusterConnectionString && (
                                <div className="absolute right-2 top-2.5 flex items-center gap-2">
                                    <button
                                        onClick={() => setShowCluster(!showCluster)}
                                        className="text-neutral-500 hover:text-emerald-500 transition-colors"
                                        title="Toggle Visibility"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            {showCluster ? (
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                            ) : (
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            )}
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => navigator.clipboard.writeText(displayClusterString)}
                                        className="text-neutral-500 hover:text-foreground transition-colors"
                                        title="Copy Connection String"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-neutral-50 dark:bg-neutral-900/50 px-6 py-4 border-t border-border flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-foreground dark:text-white rounded-xl text-sm font-medium transition-all"
                    >
                        Close Details
                    </button>
                </div>
            </div>
        </div>
    );
}
