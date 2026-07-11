import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AffiliateLayout from '../../components/affiliate/AffiliateLayout';
import TenantTable from '../../components/superadmin/TenantTable';
import TenantProvisionModal from '../../components/superadmin/TenantProvisionModal';
import TenantDetailsModal from '../../components/superadmin/TenantDetailsModal';
import { getTenants, createTenant, updateTenant, deleteTenant, Tenant } from '../../services/api';
import {
    Building2,
    Mail,
    Phone,
    IndianRupee,
    Database,
    Calendar,
    X,
    AlertCircle,
    Activity,
    CreditCard,
    Sliders
} from 'lucide-react';

export default function AffiliateTenants() {
    const router = useRouter();
    const [isAuth, setIsAuth] = useState(false);
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewingTenant, setViewingTenant] = useState<Tenant | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [accountTypeFilter, setAccountTypeFilter] = useState<'ALL' | 'LIVE' | 'DEMO'>('ALL');

    // Edit state
    const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
    const [editFormData, setEditFormData] = useState({
        clientName: '',
        email: '',
        mobile: '',
        status: '',
        amount: 0,
        paidAmount: 0,
        storageLimitGB: 1,
        paymentStatus: 'PENDING',
        planStartDate: '',
        planEndDate: '',
        accountType: 'live'
    });
    const [isEditSubmitting, setIsEditSubmitting] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);

    // Change Password states
    const [passwordChangingTenant, setPasswordChangingTenant] = useState<Tenant | null>(null);
    const [newAdminPassword, setNewAdminPassword] = useState('');
    const [showChangePasswordEye, setShowChangePasswordEye] = useState(false);
    const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);
    const [changePasswordError, setChangePasswordError] = useState<string | null>(null);

    useEffect(() => {
        if (!localStorage.getItem('token')) {
            router.push('/superadmin/login');
            return;
        }
        setIsAuth(true);
        fetchData();
    }, [router]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await getTenants();
            if (res.success) setTenants(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateOrigin = async (form: { clientName: string; email: string; mobile: string; amount: number; paidAmount: number; storageLimitGB: number; paymentStatus: string }) => {
        setIsSubmitting(true);
        try {
            const res = await createTenant(form);
            if (res.success) {
                setIsModalOpen(false);
                fetchData();
            } else {
                throw new Error(res.message || 'Failed to create tenant');
            }
        } catch (err: any) {
            console.error(err);
            throw err;
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenEdit = (tenant: Tenant) => {
        const rawPhone = (tenant.mobile || '').replace(/^\+91\s?/, '').replace(/\D/g, '').slice(0, 10);
        let mobile = '';
        if (rawPhone) {
            mobile = `+91 ${rawPhone.length > 5 ? rawPhone.slice(0, 5) + ' ' + rawPhone.slice(5) : rawPhone}`.trimEnd();
        } else {
            mobile = '+91 ';
        }

        setEditingTenant(tenant);
        setEditError(null);
        setEditFormData({
            clientName: tenant.clientName,
            email: tenant.email,
            mobile: mobile,
            status: tenant.status || 'active',
            amount: tenant.amount ?? 0,
            paidAmount: tenant.paidAmount ?? 0,
            storageLimitGB: tenant.storageLimitGB ?? 1,
            paymentStatus: tenant.paymentStatus || 'PENDING',
            planStartDate: tenant.planStartDate ? new Date(tenant.planStartDate).toISOString().split('T')[0] : '',
            planEndDate: tenant.planEndDate ? new Date(tenant.planEndDate).toISOString().split('T')[0] : '',
            accountType: tenant.accountType || 'live'
        });
    };

    const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value;
        const digits = input.replace(/^\+91\s?/, '').replace(/\D/g, '').slice(0, 10);
        let formatted = digits;
        if (digits.length > 5) {
            formatted = digits.slice(0, 5) + ' ' + digits.slice(5);
        }
        setEditFormData({ ...editFormData, mobile: `+91 ${formatted}`.trimEnd() });
    };

    const handleEditTenant = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTenant) return;
        setEditError(null);
        if (editFormData.paymentStatus === 'PARTIAL') {
            if (editFormData.paidAmount <= 0) {
                setEditError("Paid amount must be greater than 0 for partial payment.");
                return;
            }
            if (editFormData.paidAmount > editFormData.amount) {
                setEditError("Paid amount cannot be greater than the total amount.");
                return;
            }
            if (editFormData.paidAmount === editFormData.amount) {
                setEditError("Paid amount equals total amount. Please select 'COMPLETED' payment status instead.");
                return;
            }
        }
        setIsEditSubmitting(true);
        try {
            const res = await updateTenant(editingTenant._id, editFormData);
            if (res.success) {
                setEditingTenant(null);
                fetchData();
            } else {
                setEditError(res.message || 'Failed to update tenant');
            }
        } catch (err: any) {
            setEditError(err.response?.data?.message || 'Error occurred while updating tenant.');
        } finally {
            setIsEditSubmitting(false);
        }
    };

    const handleChangePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!passwordChangingTenant) return;
        setChangePasswordError(null);
        setIsPasswordSubmitting(true);
        try {
            const res = await updateTenant(passwordChangingTenant._id, { adminPassword: newAdminPassword });
            if (res.success) {
                alert('Admin password changed and synchronized successfully!');
                setPasswordChangingTenant(null);
                setNewAdminPassword('');
            } else {
                setChangePasswordError(res.message || 'Failed to change password');
            }
        } catch (err: any) {
            setChangePasswordError(err.response?.data?.message || 'Error occurred while updating password.');
        } finally {
            setIsPasswordSubmitting(false);
        }
    };

    const handleDeleteTenant = async (id: string) => {
        if (!confirm("Are you sure you want to permanently delete/archive this tenant? This will terminate its associated Atlas project and cannot be undone!")) return;
        try {
            setLoading(true);
            const res = await deleteTenant(id);
            if (res.success) {
                fetchData();
            } else {
                alert(res.message || 'Failed to delete tenant');
            }
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to delete tenant.');
        } finally {
            setLoading(false);
        }
    };

    if (!isAuth) return null;

    const filteredTenants = tenants.filter(t => {
        if (accountTypeFilter === 'ALL') return true;
        return t.accountType?.toUpperCase() === accountTypeFilter;
    });

    return (
        <AffiliateLayout title="My Clients">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">Client Hub</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1 text-sm">Provision, configure, and monitor your client databases</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-[0_4px_20px_rgba(245,158,11,0.2)] active:scale-95 whitespace-nowrap leading-none"
                >
                    <svg className="w-5 h-5 -ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                    Provision New Client
                </button>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
                <button
                    onClick={() => setAccountTypeFilter('ALL')}
                    className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all ${
                        accountTypeFilter === 'ALL'
                            ? 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold'
                            : 'bg-card border-border text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
                >
                    All Accounts
                </button>
                <button
                    onClick={() => setAccountTypeFilter('LIVE')}
                    className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all ${
                        accountTypeFilter === 'LIVE'
                            ? 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold'
                            : 'bg-card border-border text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
                >
                    Live Accounts
                </button>
                <button
                    onClick={() => setAccountTypeFilter('DEMO')}
                    className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all ${
                        accountTypeFilter === 'DEMO'
                            ? 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold'
                            : 'bg-card border-border text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
                >
                    Demo Accounts
                </button>
            </div>

            {loading && tenants.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-20 gap-4">
                    <span className="animate-spin w-8 h-8 border-4 border-amber-500/30 border-t-amber-500 rounded-full"></span>
                    <span className="text-sm font-medium text-neutral-400 tracking-wider">LOADING SECURE ENVIRONMENT</span>
                </div>
            ) : (
                <TenantTable
                    tenants={filteredTenants}
                    onDelete={handleDeleteTenant}
                    onView={setViewingTenant}
                    onEdit={handleOpenEdit}
                    onChangePassword={setPasswordChangingTenant}
                    isAffiliateView={true}
                />
            )}

            {/* Create Client Modal */}
            <TenantProvisionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleCreateOrigin}
                isSubmitting={isSubmitting}
            />

            {/* View Details Modal */}
            <TenantDetailsModal
                tenant={viewingTenant}
                onClose={() => setViewingTenant(null)}
            />

            {/* ─── Edit Modal ─── */}
            {editingTenant && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingTenant(null)}></div>
                    <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-xl p-6 overflow-y-auto max-h-[90vh]">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                                <Sliders className="w-5 h-5 text-amber-500" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-foreground">Edit Client Parameters</h3>
                                <p className="text-neutral-500 text-xs">Update database properties and quotas</p>
                            </div>
                        </div>

                        <form onSubmit={handleEditTenant} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-450 uppercase mb-2">Client Org Name</label>
                                    <div className="relative">
                                        <Building2 className="absolute left-3.5 top-3.5 text-slate-400 w-4.5 h-4.5" />
                                        <input
                                            type="text"
                                            value={editFormData.clientName}
                                            onChange={e => setEditFormData({ ...editFormData, clientName: e.target.value })}
                                            className="w-full pl-10 pr-4 py-3 bg-neutral-50 dark:bg-neutral-850 border border-border rounded-xl text-foreground text-sm focus:outline-none"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-450 uppercase mb-2">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3.5 top-3.5 text-slate-400 w-4.5 h-4.5" />
                                        <input
                                            type="email"
                                            value={editFormData.email}
                                            onChange={e => setEditFormData({ ...editFormData, email: e.target.value })}
                                            className="w-full pl-10 pr-4 py-3 bg-neutral-50 dark:bg-neutral-850 border border-border rounded-xl text-foreground text-sm focus:outline-none"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-450 uppercase mb-2">Mobile Number</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3.5 top-3.5 text-slate-400 w-4.5 h-4.5" />
                                        <input
                                            type="text"
                                            value={editFormData.mobile}
                                            onChange={handleMobileChange}
                                            className="w-full pl-10 pr-4 py-3 bg-neutral-50 dark:bg-neutral-850 border border-border rounded-xl text-foreground text-sm focus:outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-450 uppercase mb-2">Status</label>
                                    <select
                                        value={editFormData.status}
                                        onChange={e => setEditFormData({ ...editFormData, status: e.target.value })}
                                        className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-850 border border-border rounded-xl text-foreground text-sm focus:outline-none"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-450 uppercase mb-2">Subscription Cost (₹)</label>
                                    <div className="relative">
                                        <IndianRupee className="absolute left-3.5 top-3.5 text-slate-400 w-4.5 h-4.5" />
                                        <input
                                            type="number"
                                            value={editFormData.amount}
                                            onChange={e => setEditFormData({ ...editFormData, amount: Number(e.target.value) })}
                                            className="w-full pl-10 pr-4 py-3 bg-neutral-50 dark:bg-neutral-850 border border-border rounded-xl text-foreground text-sm focus:outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-450 uppercase mb-2">Amount Paid (₹)</label>
                                    <div className="relative">
                                        <IndianRupee className="absolute left-3.5 top-3.5 text-slate-400 w-4.5 h-4.5" />
                                        <input
                                            type="number"
                                            value={editFormData.paidAmount}
                                            onChange={e => setEditFormData({ ...editFormData, paidAmount: Number(e.target.value) })}
                                            className="w-full pl-10 pr-4 py-3 bg-neutral-50 dark:bg-neutral-850 border border-border rounded-xl text-foreground text-sm focus:outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-450 uppercase mb-2">Payment Status</label>
                                    <div className="relative">
                                        <CreditCard className="absolute left-3.5 top-3.5 text-slate-400 w-4.5 h-4.5" />
                                        <select
                                            value={editFormData.paymentStatus}
                                            onChange={e => setEditFormData({ ...editFormData, paymentStatus: e.target.value })}
                                            className="w-full pl-10 pr-4 py-3 bg-neutral-50 dark:bg-neutral-850 border border-border rounded-xl text-foreground text-sm focus:outline-none"
                                        >
                                            <option value="PENDING">PENDING</option>
                                            <option value="PARTIAL">PARTIAL</option>
                                            <option value="COMPLETED">COMPLETED</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-450 uppercase mb-2">Storage Cap (GB)</label>
                                    <div className="relative">
                                        <Database className="absolute left-3.5 top-3.5 text-slate-400 w-4.5 h-4.5" />
                                        <input
                                            type="number"
                                            value={editFormData.storageLimitGB}
                                            onChange={e => setEditFormData({ ...editFormData, storageLimitGB: Number(e.target.value) })}
                                            className="w-full pl-10 pr-4 py-3 bg-neutral-50 dark:bg-neutral-850 border border-border rounded-xl text-foreground text-sm focus:outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-450 uppercase mb-2">Plan Start Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3.5 top-3.5 text-slate-400 w-4.5 h-4.5" />
                                        <input
                                            type="date"
                                            value={editFormData.planStartDate}
                                            onChange={e => setEditFormData({ ...editFormData, planStartDate: e.target.value })}
                                            className="w-full pl-10 pr-4 py-3 bg-neutral-50 dark:bg-neutral-850 border border-border rounded-xl text-foreground text-sm focus:outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-450 uppercase mb-2">Plan End Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3.5 top-3.5 text-slate-400 w-4.5 h-4.5" />
                                        <input
                                            type="date"
                                            value={editFormData.planEndDate}
                                            onChange={e => setEditFormData({ ...editFormData, planEndDate: e.target.value })}
                                            className="w-full pl-10 pr-4 py-3 bg-neutral-50 dark:bg-neutral-850 border border-border rounded-xl text-foreground text-sm focus:outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-450 uppercase mb-2">Account Type</label>
                                    <select
                                        value={editFormData.accountType}
                                        onChange={e => setEditFormData({ ...editFormData, accountType: e.target.value })}
                                        className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-850 border border-border rounded-xl text-foreground text-sm focus:outline-none font-bold uppercase"
                                    >
                                        <option value="live">LIVE ACCOUNT</option>
                                        <option value="demo">DEMO ACCOUNT</option>
                                    </select>
                                </div>
                            </div>

                            {editError && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 mt-4">
                                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                    <p className="text-red-400 text-xs font-medium">{editError}</p>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setEditingTenant(null)}
                                    className="px-5 py-2.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-500 dark:text-neutral-400 rounded-xl text-sm font-medium transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isEditSubmitting}
                                    className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-all shadow-[0_4px_15px_rgba(245,158,11,0.2)]"
                                >
                                    {isEditSubmitting ? 'Updating...' : 'Save Configuration'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ─── Change Password Modal ─── */}
            {passwordChangingTenant && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setPasswordChangingTenant(null)}></div>
                    <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                                <Sliders className="w-5 h-5 text-indigo-500" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-foreground">Sync Credentials</h3>
                                <p className="text-neutral-500 text-xs">Reset administrative control passwords</p>
                            </div>
                        </div>

                        <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-450 uppercase mb-2">New Admin Password</label>
                                <div className="relative">
                                    <input
                                        type={showChangePasswordEye ? 'text' : 'password'}
                                        value={newAdminPassword}
                                        onChange={e => setNewAdminPassword(e.target.value)}
                                        className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-850 border border-border rounded-xl text-foreground text-sm pr-12 focus:outline-none"
                                        placeholder="••••••••"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowChangePasswordEye(p => !p)}
                                        className="absolute right-4 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        {showChangePasswordEye ? (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {changePasswordError && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 mt-4">
                                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                    <p className="text-red-400 text-xs font-medium">{changePasswordError}</p>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setPasswordChangingTenant(null)}
                                    className="px-5 py-2.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-500 dark:text-neutral-400 rounded-xl text-sm font-medium transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPasswordSubmitting}
                                    className="px-6 py-2.5 bg-indigo-650 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-all shadow-[0_4px_15px_rgba(99,102,241,0.2)]"
                                >
                                    {isPasswordSubmitting ? 'Syncing...' : 'Sync Admin Password'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AffiliateLayout>
    );
}
