import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import SuperAdminLayout from '../../components/superadmin/SuperAdminLayout';
import { getUsers, createUser, updateUser, deleteUser, User } from '../../services/api';
import { decryptUserPassword } from '../../utils/encryption';

export default function SuperAdminUsers() {
    const router = useRouter();
    const [isAuth, setIsAuth] = useState(false);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({ fullName: '', email: '', phone: '+91 ', password: '', role: 'superadmin' });

    // Edit state
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editFormData, setEditFormData] = useState({ fullName: '', email: '', phone: '+91 ', password: '', role: 'superadmin' });
    const [isEditSubmitting, setIsEditSubmitting] = useState(false);

    // View state
    const [viewingUser, setViewingUser] = useState<User | null>(null);
    const [showUserPassword, setShowUserPassword] = useState(false);

    const [isMaster, setIsMaster] = useState(false);
    const [showCreatePassword, setShowCreatePassword] = useState(false);
    const [showEditPassword, setShowEditPassword] = useState(false);

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

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
        const input = e.target.value;
        const digits = input.replace(/^\+91\s?/, '').replace(/\D/g, '').slice(0, 10);
        let formatted = digits;
        if (digits.length > 5) {
            formatted = digits.slice(0, 5) + ' ' + digits.slice(5);
        }
        const finalValue = `+91 ${formatted}`.trimEnd();

        if (isEdit) {
            setEditFormData({ ...editFormData, phone: finalValue });
        } else {
            setFormData({ ...formData, phone: finalValue });
        }
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await getUsers();
            if (res.status === 'Success' && res.data) {
                setUsers(res.data);
            }
        } catch (err: any) {
            console.error('Failed to fetch users:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await createUser(formData);
            if (res.status === 'Success') {
                setIsModalOpen(false);
                setFormData({ fullName: '', email: '', phone: '+91 ', password: '', role: 'superadmin' });
                fetchData();
            } else {
                alert(res.message || 'Failed to create user');
            }
        } catch (err: any) {
            alert(err.response?.data?.message || 'Error occurred while creating user.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenEdit = (user: User) => {
        const rawPhone = (user.phone || '').replace(/^\+91\s?/, '').replace(/\D/g, '').slice(0, 10);
        let phone = '';
        if (rawPhone) {
            phone = `+91 ${rawPhone.length > 5 ? rawPhone.slice(0, 5) + ' ' + rawPhone.slice(5) : rawPhone}`.trimEnd();
        } else {
            phone = '+91 ';
        }
        setEditingUser(user);
        setEditFormData({ fullName: user.fullName, email: user.email, phone, password: '', role: user.role || 'superadmin' });
        setShowEditPassword(false);
    };

    const handleEditUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        setIsEditSubmitting(true);
        try {
            const payload: any = { fullName: editFormData.fullName, email: editFormData.email, phone: editFormData.phone, role: editFormData.role };
            if (editFormData.password.trim()) {
                payload.password = editFormData.password;
            }
            const res = await updateUser(editingUser._id, payload);
            if (res.status === 'Success') {
                setEditingUser(null);
                fetchData();
            } else {
                alert(res.message || 'Failed to update user');
            }
        } catch (err: any) {
            alert(err.response?.data?.message || 'Error occurred while updating user.');
        } finally {
            setIsEditSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        try {
            await deleteUser(id);
            fetchData();
        } catch (err) {
            console.error('Error deleting user:', err);
            alert('Error deleting user');
        }
    };

    if (!isAuth) return null;

    if (loading) {
        return (
            <SuperAdminLayout title="Users">
                <div className="flex flex-col items-center justify-center p-20 gap-4">
                    <span className="animate-spin w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full"></span>
                    <span className="text-sm font-medium text-neutral-400 tracking-wider">LOADING SECURE ENVIRONMENT</span>
                </div>
            </SuperAdminLayout>
        );
    }

    return (
        <SuperAdminLayout title="Users">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">User Management</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1 text-sm">View and provision super users or system operators</p>
                </div>
                {isMaster && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-[0_4px_20px_rgba(99,102,241,0.2)] active:scale-95 whitespace-nowrap leading-none"
                    >
                        <svg className="w-5 h-5 -ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                        Create New User
                    </button>
                )}
            </div>

            <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden backdrop-blur-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-neutral-50/50 dark:bg-neutral-900/50 border-b border-border text-neutral-500 dark:text-neutral-400 text-sm font-medium">
                                <th className="px-6 py-4">User Name</th>
                                <th className="px-6 py-4">Contact Info</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Joined At</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {users.map((user) => (
                                <tr key={user._id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-border flex items-center justify-center flex-shrink-0 text-foreground font-medium">
                                                {user.fullName?.[0]?.toUpperCase() || 'U'}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-foreground">{user.fullName}</span>
                                                    {user.isMaster && (
                                                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                                                            Master
                                                        </span>
                                                    )}
                                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                                        user.role === 'affiliate'
                                                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                                            : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                                                    }`}>
                                                        {user.role || 'superadmin'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-foreground">{user.email}</div>
                                        <div className="text-neutral-500 dark:text-neutral-400 text-sm">{user.phone}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${user.status === 'active' || user.status === 'ACTIVE'
                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                            : 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20'
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${user.status === 'active' || user.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-neutral-500'
                                                }`}></span>
                                            {user.status || 'Active'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-neutral-500 dark:text-neutral-400 text-sm">
                                        {new Date(user.createdAt).toLocaleDateString('en-GB')}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            {/* View (Eye) Button */}
                                            <button
                                                onClick={() => setViewingUser(user)}
                                                title="View Details"
                                                className="p-2 text-neutral-500 dark:text-neutral-400 hover:text-sky-500 dark:hover:text-sky-400 hover:bg-sky-500/10 dark:hover:bg-sky-400/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                            </button>
                                            {/* Edit (Pencil) Button */}
                                            {isMaster && (
                                                <button
                                                    onClick={() => handleOpenEdit(user)}
                                                    title="Edit User"
                                                    className="p-2 text-neutral-500 dark:text-neutral-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-amber-500/10 dark:hover:bg-amber-400/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                </button>
                                            )}
                                            {/* Delete Button */}
                                            {isMaster && !user.isMaster && (
                                                <button
                                                    onClick={() => handleDelete(user._id)}
                                                    title="Delete User"
                                                    className="p-2 text-neutral-500 dark:text-neutral-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-400/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-neutral-500">
                                        No users found. Create one to get started.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ─── Create User Modal ─── */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 animate-[fadeScaleIn_0.2s_ease-out]">
                        <h3 className="text-xl font-bold text-foreground mb-6">Create New User</h3>
                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-2">Full Name</label>
                                <input
                                    type="text"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 border border-border rounded-xl text-foreground focus:outline-none focus:border-indigo-500 transition-all font-mono text-sm"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-2">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 border border-border rounded-xl text-foreground focus:outline-none focus:border-indigo-500 transition-all font-mono text-sm"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-2">Phone</label>
                                <input
                                    type="text"
                                    value={formData.phone}
                                    onChange={(e) => handlePhoneChange(e, false)}
                                    className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 border border-border rounded-xl text-foreground focus:outline-none focus:border-indigo-500 transition-all font-mono text-sm"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-2">Role</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 border border-border rounded-xl text-foreground focus:outline-none focus:border-indigo-500 transition-all text-sm"
                                    required
                                >
                                    <option value="superadmin">Superadmin</option>
                                    <option value="affiliate">Affiliate / Dealer</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-2">Password</label>
                                <div className="relative">
                                    <input
                                        type={showCreatePassword ? 'text' : 'password'}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 border border-border rounded-xl text-foreground focus:outline-none focus:border-indigo-500 transition-all font-mono text-sm pr-12"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCreatePassword(p => !p)}
                                        className="absolute right-4 top-3 text-slate-400 hover:text-slate-650 transition-colors"
                                    >
                                        {showCreatePassword ? (
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
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-neutral-500 hover:text-foreground transition-colors text-sm font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-all shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                                >
                                    {isSubmitting ? 'Creating...' : 'Create User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ─── Edit User Modal ─── */}
            {editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingUser(null)}></div>
                    <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 animate-[fadeScaleIn_0.2s_ease-out]">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                                <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-foreground">Edit User</h3>
                                <p className="text-neutral-500 text-xs">Update user details below</p>
                            </div>
                        </div>
                        <form onSubmit={handleEditUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-2">Full Name</label>
                                <input
                                    type="text"
                                    value={editFormData.fullName}
                                    onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 border border-border rounded-xl text-foreground focus:outline-none focus:border-amber-500 transition-all text-sm"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-2">Email</label>
                                <input
                                    type="email"
                                    value={editFormData.email}
                                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 border border-border rounded-xl text-foreground focus:outline-none focus:border-amber-500 transition-all text-sm"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-2">Phone</label>
                                <input
                                    type="text"
                                    value={editFormData.phone}
                                    onChange={(e) => handlePhoneChange(e, true)}
                                    className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 border border-border rounded-xl text-foreground focus:outline-none focus:border-amber-500 transition-all text-sm"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-2">Role</label>
                                <select
                                    value={editFormData.role}
                                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 border border-border rounded-xl text-foreground focus:outline-none focus:border-amber-500 transition-all text-sm"
                                    required
                                >
                                    <option value="superadmin">Superadmin</option>
                                    <option value="affiliate">Affiliate / Dealer</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-2">New Password <span className="text-neutral-500 dark:text-neutral-400 font-normal">(leave blank to keep current)</span></label>
                                <div className="relative">
                                    <input
                                        type={showEditPassword ? 'text' : 'password'}
                                        value={editFormData.password}
                                        onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 border border-border rounded-xl text-foreground focus:outline-none focus:border-amber-500 transition-all text-sm pr-12"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowEditPassword(p => !p)}
                                        className="absolute right-4 top-3 text-slate-400 hover:text-slate-650 transition-colors"
                                    >
                                        {showEditPassword ? (
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
                                    onClick={() => setEditingUser(null)}
                                    className="px-4 py-2 text-neutral-500 hover:text-foreground transition-colors text-sm font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isEditSubmitting}
                                    className="px-6 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                                >
                                    {isEditSubmitting ? 'Updating...' : 'Update User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ─── View User Details Modal ─── */}
            {viewingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setViewingUser(null)}></div>
                    <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 animate-[fadeScaleIn_0.2s_ease-out] text-foreground">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 text-lg font-bold">
                                    {viewingUser.fullName?.[0]?.toUpperCase() || 'U'}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-foreground">{viewingUser.fullName}</h3>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border mt-1 ${viewingUser.status === 'active' || viewingUser.status === 'ACTIVE'
                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                        : 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20'
                                        }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${viewingUser.status === 'active' || viewingUser.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-neutral-500'}`}></span>
                                        {viewingUser.status || 'Active'}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => setViewingUser(null)}
                                className="p-2 text-neutral-500 hover:text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-all"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {/* Details Grid */}
                        <div className="space-y-4">
                            <div className="bg-neutral-50 dark:bg-neutral-800/50 border border-border rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                    <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium uppercase tracking-wider">Full Name</span>
                                </div>
                                <p className="text-foreground font-medium">{viewingUser.fullName}</p>
                            </div>

                            <div className="bg-neutral-50 dark:bg-neutral-800/50 border border-border rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                    <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium uppercase tracking-wider">Email</span>
                                </div>
                                <p className="text-foreground font-medium font-mono text-sm">{viewingUser.email}</p>
                            </div>

                            <div className="bg-neutral-50 dark:bg-neutral-800/50 border border-border rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                    <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium uppercase tracking-wider">Phone</span>
                                </div>
                                <p className="text-foreground font-medium">{viewingUser.phone}</p>
                            </div>
                            <div className="bg-neutral-50 dark:bg-neutral-800/50 border border-border rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                    <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium uppercase tracking-wider">Password</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <p className="text-foreground font-medium font-mono text-sm">
                                        {showUserPassword && viewingUser.password ? decryptUserPassword(viewingUser.password) : '••••••••'}
                                    </p>
                                    <button
                                        onClick={() => setShowUserPassword(!showUserPassword)}
                                        className="p-1 text-neutral-500 dark:text-neutral-400 hover:text-emerald-500 transition-colors"
                                        title={showUserPassword ? "Hide Password" : "Show Password"}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            {showUserPassword ? (
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                            ) : (
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            )}
                                        </svg>
                                    </button>
                                </div>
                                <p className="text-neutral-500 dark:text-neutral-400 text-xs mt-1">Encrypted — use Edit to change password</p>
                            </div>

                            <div className="bg-neutral-50 dark:bg-neutral-800/50 border border-border rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium uppercase tracking-wider">Joined On</span>
                                </div>
                                <p className="text-foreground font-medium">{new Date(viewingUser.createdAt).toLocaleDateString('en-GB')} &bull; {new Date(viewingUser.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
                            {isMaster && (
                                <button
                                    onClick={() => {
                                        setViewingUser(null);
                                        handleOpenEdit(viewingUser);
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 text-amber-500 hover:bg-amber-500/10 rounded-xl transition-all text-sm font-medium"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                    Edit
                                </button>
                            )}
                            <button
                                onClick={() => setViewingUser(null)}
                                className="px-5 py-2 bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-foreground dark:text-white rounded-xl text-sm font-medium transition-all"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Keyframe animation for modals */}
            <style jsx>{`
                @keyframes fadeScaleIn {
                    from {
                        opacity: 0;
                        transform: scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
            `}</style>
        </SuperAdminLayout>
    );
}
