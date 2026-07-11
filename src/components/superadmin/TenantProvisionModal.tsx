import { useState } from 'react';
import {
    Building2,
    Mail,
    Lock,
    Phone,
    IndianRupee,
    CreditCard,
    Database,
    Calendar,
    X,
    AlertCircle,
    Eye,
    EyeOff,
    Sliders
} from 'lucide-react';

interface TenantProvisionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { clientName: string; email: string; mobile: string; amount: number; paidAmount: number; storageLimitGB: number; paymentStatus: string; adminPassword?: string; planStartDate?: string; planEndDate?: string; accountType?: string }) => Promise<void>;
    isSubmitting: boolean;
}

export default function TenantProvisionModal({ isOpen, onClose, onSubmit, isSubmitting }: TenantProvisionModalProps) {
    const [form, setForm] = useState({
        clientName: '',
        email: '',
        mobile: '+91 ',
        amount: 0,
        paidAmount: 0,
        storageLimitGB: 1,
        paymentStatus: 'PENDING',
        adminPassword: '',
        planStartDate: new Date().toISOString().split('T')[0],
        planEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        accountType: 'live'
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleClose = () => {
        setError(null);
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (form.paymentStatus === 'PARTIAL') {
            if (form.paidAmount <= 0) {
                setError("Paid amount must be greater than 0 for partial payment.");
                return;
            }
            if (form.paidAmount > form.amount) {
                setError("Paid amount cannot be greater than the total amount.");
                return;
            }
            if (form.paidAmount === form.amount) {
                setError("Paid amount equals total amount. Please select 'COMPLETED' payment status instead.");
                return;
            }
        }
        try {
            await onSubmit(form);
            setForm({
                clientName: '',
                email: '',
                mobile: '+91 ',
                amount: 0,
                paidAmount: 0,
                storageLimitGB: 1,
                paymentStatus: 'PENDING',
                adminPassword: '',
                planStartDate: new Date().toISOString().split('T')[0],
                planEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
                accountType: 'live'
            });
            setShowPassword(false);
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Error occurred while provisioning tenant.');
        }
    };

    const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value;
        const digits = input.replace(/^\+91\s?/, '').replace(/\D/g, '').slice(0, 10);

        let formatted = digits;
        if (digits.length > 5) {
            formatted = digits.slice(0, 5) + ' ' + digits.slice(5);
        }

        setForm({ ...form, mobile: `+91 ${formatted}`.trimEnd() });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-card border border-border rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-border flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                            <Database className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-foreground">Provision MongoDB Tenant</h2>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Creates cluster project, db users and network rules automatically.</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="p-1.5 text-neutral-400 hover:text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-all -mr-1"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-200 flex items-start gap-2.5">
                            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                            <div>{error}</div>
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Client/Organization Name</label>
                            <div className="relative">
                                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
                                    <Building2 className="w-4.5 h-4.5" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    value={form.clientName}
                                    onChange={e => setForm({ ...form, clientName: e.target.value })}
                                    className="w-full bg-neutral-50 dark:bg-neutral-900/50 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all placeholder-neutral-450 dark:placeholder-neutral-550"
                                    placeholder="e.g. Acme Corp"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Admin Email</label>
                            <div className="relative">
                                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
                                    <Mail className="w-4.5 h-4.5" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={form.email}
                                    onChange={e => setForm({ ...form, email: e.target.value })}
                                    className="w-full bg-neutral-50 dark:bg-neutral-900/50 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all placeholder-neutral-450 dark:placeholder-neutral-550"
                                    placeholder="admin@acme.com"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Admin Password</label>
                            <div className="relative">
                                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
                                    <Lock className="w-4.5 h-4.5" />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={form.adminPassword}
                                    onChange={e => setForm({ ...form, adminPassword: e.target.value })}
                                    className="w-full bg-neutral-50 dark:bg-neutral-900/50 border border-border rounded-xl pl-10 pr-12 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all placeholder-neutral-450 dark:placeholder-neutral-550"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(p => !p)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-4.5 h-4.5" />
                                    ) : (
                                        <Eye className="w-4.5 h-4.5" />
                                    )}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Mobile Number</label>
                            <div className="relative">
                                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
                                    <Phone className="w-4.5 h-4.5" />
                                </div>
                                <input
                                    type="tel"
                                    value={form.mobile}
                                    onChange={handleMobileChange}
                                    className="w-full bg-neutral-50 dark:bg-neutral-900/50 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all placeholder-neutral-450 dark:placeholder-neutral-550"
                                    placeholder="+91"
                                />
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
                                    value={form.amount}
                                    onChange={e => setForm({ ...form, amount: Number(e.target.value) })}
                                    className="w-full bg-neutral-50 dark:bg-neutral-900/50 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all placeholder-neutral-450 dark:placeholder-neutral-550"
                                    placeholder="e.g. 1500"
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
                                    value={form.paymentStatus}
                                    onChange={e => setForm({ ...form, paymentStatus: e.target.value })}
                                    className="w-full bg-neutral-50 dark:bg-neutral-900/50 border border-border rounded-xl pl-10 pr-10 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all appearance-none cursor-pointer"
                                >
                                    <option value="PENDING">PENDING</option>
                                    <option value="PARTIAL">PARTIAL</option>
                                    <option value="COMPLETED">COMPLETED</option>
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
                                    value={form.accountType}
                                    onChange={e => setForm({ ...form, accountType: e.target.value })}
                                    className="w-full bg-neutral-50 dark:bg-neutral-900/50 border border-border rounded-xl pl-10 pr-10 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all appearance-none cursor-pointer"
                                >
                                    <option value="live">Live Account</option>
                                    <option value="demo">Demo Account</option>
                                </select>
                                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-455 pointer-events-none">
                                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                        {form.paymentStatus === 'PARTIAL' ? (
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
                                            value={form.paidAmount}
                                            onChange={e => setForm({ ...form, paidAmount: Number(e.target.value) })}
                                            className="w-full bg-neutral-50 dark:bg-neutral-900/50 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all placeholder-neutral-450 dark:placeholder-neutral-550"
                                            placeholder="e.g. 500"
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
                                            value={form.storageLimitGB}
                                            onChange={e => setForm({ ...form, storageLimitGB: Number(e.target.value) })}
                                            className="w-full bg-neutral-50 dark:bg-neutral-900/50 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all placeholder-neutral-450 dark:placeholder-neutral-550"
                                            placeholder="e.g. 1"
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
                                        value={form.storageLimitGB}
                                        onChange={e => setForm({ ...form, storageLimitGB: Number(e.target.value) })}
                                        className="w-full bg-neutral-50 dark:bg-neutral-900/50 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all placeholder-neutral-450 dark:placeholder-neutral-550"
                                        placeholder="e.g. 1"
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
                                    value={form.planStartDate}
                                    onChange={e => setForm({ ...form, planStartDate: e.target.value })}
                                    className="w-full bg-neutral-50 dark:bg-neutral-900/50 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all cursor-pointer"
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
                                    value={form.planEndDate}
                                    onChange={e => setForm({ ...form, planEndDate: e.target.value })}
                                    className="w-full bg-neutral-50 dark:bg-neutral-900/50 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="pt-2 flex gap-3">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 py-2.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 font-medium rounded-xl transition-all active:scale-[0.98] text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium rounded-xl shadow-[0_4px_20px_rgba(16,185,129,0.2)] hover:shadow-[0_4px_25px_rgba(16,185,129,0.35)] transition-all active:scale-[0.98] flex justify-center items-center gap-2 text-sm"
                        >
                            {isSubmitting ? (
                                <><span className="animate-spin w-4 h-4 border-2 border-white/20 border-t-white rounded-full"></span> Provisioning...</>
                            ) : "Create Tenant"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
