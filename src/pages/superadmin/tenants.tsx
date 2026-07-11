import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import SuperAdminLayout from '../../components/superadmin/SuperAdminLayout';
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

export default function SuperAdminTenants() {
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
    const [isMaster, setIsMaster] = useState(false);

    useEffect(() => {
        if (!localStorage.getItem('token')) {
            router.push('/superadmin/login');
            return;
        }
        setIsAuth(true);

        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const userObj = JSON.parse(userStr);
                if (userObj && userObj.isMaster) {
                    setIsMaster(true);
                }
            } catch (e) {}
        }

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

    const handleDelete = async (id: string) => {
        if (!confirm('Warning: Are you sure you want to delete and archive this tenant? All MongoDB resources will be unlinked!')) return;
        try {
            await deleteTenant(id);
            fetchData();
        } catch (err: any) {
            console.error(err);
            const errMsg = err.response?.data?.message || 'Error delegating tenant cleanup';
            alert(errMsg);
            fetchData();
        }
    };

    if (!isAuth) return null;

    if (loading) {
        return (
            <SuperAdminLayout title="Tenants">
                <div className="flex flex-col items-center justify-center p-20 gap-4">
                    <span className="animate-spin w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full"></span>
                    <span className="text-sm font-medium text-neutral-400 tracking-wider">LOADING DATA</span>
                </div>
            </SuperAdminLayout>
        );
    }

    return (
        <SuperAdminLayout title="Tenants">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">Organization Tenants</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1 text-sm">Manage database provisioning and isolation clusters</p>
                </div>
                {isMaster && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-[0_4px_20px_rgba(16,185,129,0.2)] active:scale-95 whitespace-nowrap leading-none"
                    >
                        <svg className="w-5 h-5 -ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                        Provision New Tenant
                    </button>
                )}
            </div>

            {/* Filter Options */}
            <div className="flex items-center gap-1.5 mb-6 bg-card border border-border p-4 rounded-2xl w-full max-w-sm">
                <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mr-2">Account Type:</span>
                {(['ALL', 'LIVE', 'DEMO'] as const).map(f => (
                    <button
                        key={f}
                        onClick={() => setAccountTypeFilter(f)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            accountTypeFilter === f
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border border-emerald-500/25 shadow-sm'
                                : 'text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            <TenantTable
                tenants={tenants.filter(t => accountTypeFilter === 'ALL' || (t.accountType || 'live') === accountTypeFilter.toLowerCase())}
                onDelete={handleDelete}
                onView={(t) => setViewingTenant(t)}
                onEdit={handleOpenEdit}
                onChangePassword={(t) => {
                    setPasswordChangingTenant(t);
                    setNewAdminPassword('');
                    setShowChangePasswordEye(false);
                    setChangePasswordError(null);
                }}
            />

            <TenantProvisionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleCreateOrigin}
                isSubmitting={isSubmitting}
            />

            <TenantDetailsModal
                tenant={viewingTenant}
                onClose={() => setViewingTenant(null)}
            />

            {/* ─── Edit Tenant Modal ─── */}
            {editingTenant && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingTenant(null)}></div>
                    <div className="relative bg-card border border-border rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200" style={{ animation: 'fadeScaleIn 0.2s ease-out' }}>
                        <div className="p-6 border-b border-border flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                                    <Building2 className="w-5 h-5 text-amber-600 dark:text-amber-500" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-foreground">Edit Tenant</h3>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Update organization details</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setEditingTenant(null)}
                                className="p-1.5 text-neutral-400 hover:text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-all -mr-1"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleEditTenant} className="p-6 space-y-5">
                            {editError && (
                                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-200 flex items-start gap-2.5">
                                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                    <div>{editError}</div>
                                </div>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Organization Name</label>
                                    <div className="relative">
                                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
                                            <Building2 className="w-4.5 h-4.5" />
                                        </div>
                                        <input
                                            type="text"
                                            value={editFormData.clientName}
                                            onChange={(e) => setEditFormData({ ...editFormData, clientName: e.target.value })}
                                            className="w-full bg-neutral-50 dark:bg-neutral-900/50 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all placeholder-neutral-450 dark:placeholder-neutral-550"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Email</label>
                                    <div className="relative">
                                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
                                            <Mail className="w-4.5 h-4.5" />
                                        </div>
                                        <input
                                            type="email"
                                            value={editFormData.email}
                                            onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                                            className="w-full bg-neutral-50 dark:bg-neutral-900/50 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all placeholder-neutral-450 dark:placeholder-neutral-550"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Mobile</label>
                                    <div className="relative">
                                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
                                            <Phone className="w-4.5 h-4.5" />
                                        </div>
                                        <input
                                            type="text"
                                            value={editFormData.mobile}
                                            onChange={handleMobileChange}
                                            className="w-full bg-neutral-50 dark:bg-neutral-900/50 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all placeholder-neutral-450 dark:placeholder-neutral-550"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Status</label>
                                    <div className="relative">
                                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
                                            <Activity className="w-4.5 h-4.5" />
                                        </div>
                                        <select
                                            value={editFormData.status}
                                            onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                                            className="w-full bg-neutral-50 dark:bg-neutral-900/50 border border-border rounded-xl pl-10 pr-10 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="active">Active</option>
                                            <option value="pending">Pending</option>
                                            <option value="inactive">Inactive</option>
                                            <option value="archived">Archived</option>
                                        </select>
                                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-450 pointer-events-none">
                                            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Amount (₹)</label>
                                    <div className="relative">
                                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
                                            <IndianRupee className="w-4.5 h-4.5" />
                                        </div>
                                        <input
                                            type="number"
                                            required
                                            value={editFormData.amount}
                                            onChange={(e) => setEditFormData({ ...editFormData, amount: Number(e.target.value) })}
                                            className="w-full bg-neutral-50 dark:bg-neutral-900/50 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all placeholder-neutral-450 dark:placeholder-neutral-550"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Payment Status</label>
                                    <div className="relative">
                                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
                                            <CreditCard className="w-4.5 h-4.5" />
                                        </div>
                                        <select
                                            value={editFormData.paymentStatus}
                                            onChange={(e) => setEditFormData({ ...editFormData, paymentStatus: e.target.value as any })}
                                            className="w-full bg-neutral-50 dark:bg-neutral-900/50 border border-border rounded-xl pl-10 pr-10 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="PENDING">Pending</option>
                                            <option value="PARTIAL">Partial</option>
                                            <option value="COMPLETED">Completed</option>
                                        </select>
                                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-450 pointer-events-none">
                                            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Account Type</label>
                                    <div className="relative">
                                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
                                            <Sliders className="w-4.5 h-4.5" />
                                        </div>
                                        <select
                                            value={editFormData.accountType}
                                            onChange={(e) => setEditFormData({ ...editFormData, accountType: e.target.value })}
                                            className="w-full bg-neutral-50 dark:bg-neutral-900/50 border border-border rounded-xl pl-10 pr-10 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="live">Live Account</option>
                                            <option value="demo">Demo Account</option>
                                        </select>
                                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-450 pointer-events-none">
                                            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                                {editFormData.paymentStatus === 'PARTIAL' ? (
                                    <>
                                        <div>
                                            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Paid Amount (₹)</label>
                                            <div className="relative">
                                                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
                                                    <IndianRupee className="w-4.5 h-4.5" />
                                                </div>
                                                <input
                                                    type="number"
                                                    required
                                                    value={editFormData.paidAmount}
                                                    onChange={(e) => setEditFormData({ ...editFormData, paidAmount: Number(e.target.value) })}
                                                    className="w-full bg-neutral-50 dark:bg-neutral-900/50 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all placeholder-neutral-450 dark:placeholder-neutral-550"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Storage Limit (GB)</label>
                                            <div className="relative">
                                                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
                                                    <Database className="w-4.5 h-4.5" />
                                                </div>
                                                <input
                                                    type="number"
                                                    step="0.001"
                                                    required
                                                    value={editFormData.storageLimitGB}
                                                    onChange={(e) => setEditFormData({ ...editFormData, storageLimitGB: Number(e.target.value) })}
                                                    className="w-full bg-neutral-50 dark:bg-neutral-900/50 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all placeholder-neutral-450 dark:placeholder-neutral-550"
                                                />
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Storage Limit (GB)</label>
                                        <div className="relative">
                                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
                                                <Database className="w-4.5 h-4.5" />
                                            </div>
                                            <input
                                                type="number"
                                                step="0.001"
                                                required
                                                value={editFormData.storageLimitGB}
                                                onChange={(e) => setEditFormData({ ...editFormData, storageLimitGB: Number(e.target.value) })}
                                                className="w-full bg-neutral-50 dark:bg-neutral-900/50 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all placeholder-neutral-450 dark:placeholder-neutral-550"
                                            />
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Plan Start Date</label>
                                    <div className="relative">
                                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
                                            <Calendar className="w-4.5 h-4.5" />
                                        </div>
                                        <input
                                            type="date"
                                            required
                                            value={editFormData.planStartDate}
                                            onChange={(e) => setEditFormData({ ...editFormData, planStartDate: e.target.value })}
                                            className="w-full bg-neutral-50 dark:bg-neutral-900/50 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all cursor-pointer"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Plan End Date</label>
                                    <div className="relative">
                                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
                                            <Calendar className="w-4.5 h-4.5" />
                                        </div>
                                        <input
                                            type="date"
                                            required
                                            value={editFormData.planEndDate}
                                            onChange={(e) => setEditFormData({ ...editFormData, planEndDate: e.target.value })}
                                            className="w-full bg-neutral-50 dark:bg-neutral-900/50 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setEditingTenant(null)}
                                    className="flex-1 py-2.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 font-medium rounded-xl transition-all active:scale-[0.98] text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isEditSubmitting}
                                    className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-medium rounded-xl shadow-[0_4px_20px_rgba(245,158,11,0.2)] hover:shadow-[0_4px_25px_rgba(245,158,11,0.35)] transition-all active:scale-[0.98] flex justify-center items-center gap-2 text-sm"
                                >
                                    {isEditSubmitting ? (
                                        <><span className="animate-spin w-4 h-4 border-2 border-white/20 border-t-white rounded-full"></span> Updating...</>
                                    ) : "Update Tenant"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Change Password Modal ── */}
            {passwordChangingTenant && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setPasswordChangingTenant(null)}></div>
                    <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6" style={{ animation: 'fadeScaleIn 0.2s ease-out' }}>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                                <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m-5 4a5 5 0 01-5-5 5 5 0 115 5zm0 0V19a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2a2 2 0 012-2h2" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-foreground">Change Password</h3>
                                <p className="text-neutral-500 text-xs">Update administrator credentials for {passwordChangingTenant.clientName}</p>
                            </div>
                        </div>
                        <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
                            {changePasswordError && (
                                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-650 dark:text-red-400 text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-200">
                                    {changePasswordError}
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-2">New Admin Password</label>
                                <div className="relative">
                                    <input
                                        type={showChangePasswordEye ? 'text' : 'password'}
                                        value={newAdminPassword}
                                        onChange={(e) => setNewAdminPassword(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 border border-border rounded-xl text-foreground focus:outline-none focus:border-indigo-500 transition-all text-sm pr-12"
                                        placeholder="••••••••"
                                        required
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowChangePasswordEye(p => !p)}
                                        className="absolute right-4 top-3 text-slate-400 hover:text-slate-650 transition-colors"
                                    >
                                        {showChangePasswordEye ? (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setPasswordChangingTenant(null)}
                                    className="px-4 py-2 text-neutral-500 hover:text-foreground transition-colors text-sm font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPasswordSubmitting}
                                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-all shadow-[0_0_15px_rgba(79,70,229,0.2)]"
                                >
                                    {isPasswordSubmitting ? 'Updating...' : 'Update Password'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes fadeScaleIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </SuperAdminLayout>
    );
}
