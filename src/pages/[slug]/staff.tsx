import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import TenantLayout from '@/components/tenant/TenantLayout';
import ConfirmModal from '@/components/tenant/ConfirmModal';
import { getTenantStaff, deleteTenantStaff, createTenantStaff, updateTenantStaff, Staff } from '../../services/api';

export default function TenantStaffManagement() {
    const router = useRouter();
    const { slug } = router.query as { slug: string };

    const [staffList, setStaffList] = useState<Staff[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreatePassword, setShowCreatePassword] = useState(false);
    const [showEditPassword, setShowEditPassword] = useState(false);

    // Create staff modal
    const [showCreate, setShowCreate] = useState(false);
    const [createForm, setCreateForm] = useState({ fullName: '', email: '', password: '', phone: '+91 ' });
    const [createLoading, setCreateLoading] = useState(false);
    const [createError, setCreateError] = useState('');

    // Edit staff modal
    const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
    const [editForm, setEditForm] = useState({ fullName: '', email: '', phone: '', role: '', status: '', password: '' });
    const [editLoading, setEditLoading] = useState(false);

    // Delete confirmation states
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleteName, setDeleteName] = useState<string>('');

    // Close modals on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setShowCreate(false);
                setEditingStaff(null);
                setDeleteId(null);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        if (!slug) return;
        fetchStaff();
    }, [slug]);

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
        const input = e.target.value;
        const digits = input.replace(/^\+91\s?/, '').replace(/\D/g, '').slice(0, 10);
        let formatted = digits;
        if (digits.length > 5) {
            formatted = digits.slice(0, 5) + ' ' + digits.slice(5);
        }
        const finalValue = `+91 ${formatted}`.trimEnd();

        if (isEdit) {
            setEditForm({ ...editForm, phone: finalValue });
        } else {
            setCreateForm({ ...createForm, phone: finalValue });
        }
    };

    const fetchStaff = async () => {
        if (!slug) return;
        setLoading(true);
        try {
            const res = await getTenantStaff(slug);
            if (res.status === 'Success') {
                setStaffList(res.data || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateError('');
        setCreateLoading(true);
        try {
            const payload = {
                ...createForm,
                role: 'staff'
            };
            const res = await createTenantStaff(slug, payload);
            if (res.status === 'Success') {
                setShowCreate(false);
                setCreateForm({ fullName: '', email: '', password: '', phone: '+91 ' });
                fetchStaff();
            } else {
                setCreateError(res.message || 'Failed to create staff');
            }
        } catch (err: any) {
            setCreateError(err.response?.data?.message || 'Failed to create staff');
        } finally {
            setCreateLoading(false);
        }
    };

    const handleOpenEdit = (staff: Staff) => {
        const rawPhone = (staff.phone || '').replace(/^\+91\s?/, '').replace(/\D/g, '').slice(0, 10);
        let phone = '';
        if (rawPhone) {
            phone = `+91 ${rawPhone.length > 5 ? rawPhone.slice(0, 5) + ' ' + rawPhone.slice(5) : rawPhone}`.trimEnd();
        } else {
            phone = '+91 ';
        }

        setEditingStaff(staff);
        setEditForm({ fullName: staff.fullName, email: staff.email, phone, role: staff.role, status: staff.status, password: '' });
        setShowEditPassword(false);
    };

    const handleUpdateStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingStaff) return;
        setEditLoading(true);
        try {
            const payload: any = { ...editForm };
            if (!payload.password) delete payload.password;
            const res = await updateTenantStaff(slug, editingStaff._id, payload);
            if (res.status === 'Success') {
                setEditingStaff(null);
                fetchStaff();
            }
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to update');
        } finally {
            setEditLoading(false);
        }
    };

    const handleDelete = (id: string, name: string) => {
        setDeleteId(id);
        setDeleteName(name);
    };

    const confirmDeleteStaff = async () => {
        if (!deleteId) return;
        try {
            await deleteTenantStaff(slug, deleteId);
            setDeleteId(null);
            fetchStaff();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to delete');
        }
    };

    return (
        <TenantLayout title="Staff Management">
            <div className="space-y-6 max-w-7xl mx-auto">
                {/* Back Link */}
                <button
                    onClick={() => router.push(`/${slug}/whatsapp/chats`)}
                    className="flex items-center gap-2 text-slate-400 hover:text-slate-700 text-xs font-semibold transition-colors leading-none"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Chats
                </button>

                {/* Header Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2.5">
                            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Staff Management</h1>
                            <span className="bg-blue-50 text-blue-600 px-2.5 py-1 text-[10px] font-extrabold rounded-xl uppercase border border-blue-100/30">
                                {staffList.length} staff
                            </span>
                        </div>
                        <p className="text-slate-400 text-xs mt-1">
                            Manage staff accounts and their access to the system.
                        </p>
                    </div>
                    <button
                        id="add-staff-btn"
                        onClick={() => { setShowCreate(true); setShowCreatePassword(false); }}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all shadow-lg shadow-blue-500/10 active:scale-95 whitespace-nowrap leading-none"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                        </svg>
                        Add Staff
                    </button>
                </div>

                {/* Table card */}
                <div className="bg-white border border-slate-100 rounded-3xl shadow-sm p-6">
                    <div className="text-slate-400 text-xs font-semibold mb-4 px-2">
                        {staffList.length} staff members
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center p-20 gap-4">
                            <span className="animate-spin w-8 h-8 border-4 border-blue-600/30 border-t-blue-600 rounded-full"></span>
                            <span className="text-sm font-semibold text-slate-400 tracking-wider">LOADING STAFF DATA</span>
                        </div>
                    ) : staffList.length === 0 ? (
                        <div className="text-center p-16 border-dashed border-2 border-slate-100 m-2 rounded-2xl">
                            <svg className="w-12 h-12 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <h3 className="text-base font-bold text-slate-800">No staff members found</h3>
                            <p className="text-xs text-slate-400 mt-1">Add a new staff member to manage access credentials.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead>
                                    <tr className="border-b border-slate-100 text-slate-400 font-bold text-xs uppercase">
                                        <th className="px-6 py-4 font-bold">NAME</th>
                                        <th className="px-6 py-4 font-bold">EMAIL</th>
                                        <th className="px-6 py-4 font-bold text-center">ROLE</th>
                                        <th className="px-6 py-4 font-bold">JOINED</th>
                                        <th className="px-6 py-4 font-bold text-right">ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {staffList.map((staff) => (
                                        <tr key={staff._id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {/* User Square Icon container */}
                                                    <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                        </svg>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-900 leading-none">{staff.fullName}</span>
                                                        <span className="text-[10px] text-slate-400 mt-1.5 leading-none">Staff Member</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">{staff.email}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-semibold bg-green-50 text-green-700 border border-green-200/50">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5" />
                                                    {staff.role.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 font-medium">
                                                {new Date(staff.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleOpenEdit(staff)}
                                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                                        title="Edit"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(staff._id, staff.fullName)}
                                                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                                        title="Delete"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Modal */}
            {showCreate && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) setShowCreate(false); }}>
                    <div className="bg-white border border-slate-100 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
                        <h3 className="text-xl font-bold text-slate-900 mb-4">Add Staff Member</h3>
                        {createError && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-xs mb-4">
                                {createError}
                            </div>
                        )}
                        <form onSubmit={handleCreateStaff} className="space-y-4">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-1.5">
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Full Name</label>
                                        <div className="relative group/tooltip">
                                            <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 text-[10px] font-bold flex items-center justify-center cursor-pointer select-none">i</span>
                                            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover/tooltip:block z-10 bg-gray-800 text-white text-[11px] rounded-lg px-3 py-1.5 whitespace-nowrap shadow-lg">
                                                Max 22 characters allowed
                                                <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800" />
                                            </div>
                                        </div>
                                    </div>
                                    <span className={`text-[11px] font-semibold ${createForm.fullName.length >= 22 ? 'text-red-500' : 'text-gray-400'}`}>{createForm.fullName.length}/22</span>
                                </div>
                                <input
                                    type="text"
                                    required
                                    maxLength={22}
                                    placeholder="John Doe"
                                    value={createForm.fullName}
                                    onChange={e => setCreateForm({ ...createForm, fullName: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-4 focus:ring-blue-600/5 focus:border-blue-500 rounded-2xl text-slate-800 text-sm focus:outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Email</label>
                                <input
                                    type="email"
                                    required
                                    placeholder="john@company.com"
                                    value={createForm.email}
                                    onChange={e => setCreateForm({ ...createForm, email: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-4 focus:ring-blue-600/5 focus:border-blue-500 rounded-2xl text-slate-800 text-sm focus:outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Password</label>
                                <div className="relative">
                                    <input
                                        type={showCreatePassword ? 'text' : 'password'}
                                        required
                                        placeholder="••••••••"
                                        value={createForm.password}
                                        onChange={e => setCreateForm({ ...createForm, password: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-4 focus:ring-blue-600/5 focus:border-blue-500 rounded-2xl text-slate-800 text-sm focus:outline-none transition-all pr-12"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCreatePassword(p => !p)}
                                        className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
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
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Phone</label>
                                <input
                                    type="tel"
                                    required
                                    placeholder="+91 XXXXX XXXXX"
                                    value={createForm.phone}
                                    onChange={e => handlePhoneChange(e, false)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-4 focus:ring-blue-600/5 focus:border-blue-500 rounded-2xl text-slate-800 text-sm focus:outline-none transition-all"
                                />
                            </div>
                            <div className="flex gap-3 pt-4 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowCreate(false)}
                                    className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createLoading}
                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-2xl transition-all"
                                >
                                    {createLoading ? 'Adding...' : 'Add Staff'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editingStaff && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) setEditingStaff(null); }}>
                    <div className="bg-white border border-slate-100 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
                        <h3 className="text-xl font-bold text-slate-900 mb-4">Edit Staff — {editingStaff.fullName}</h3>
                        <form onSubmit={handleUpdateStaff} className="space-y-4">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-1.5">
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Full Name</label>
                                        <div className="relative group/tooltip">
                                            <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 text-[10px] font-bold flex items-center justify-center cursor-pointer select-none">i</span>
                                            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover/tooltip:block z-10 bg-gray-800 text-white text-[11px] rounded-lg px-3 py-1.5 whitespace-nowrap shadow-lg">
                                                Max 22 characters allowed
                                                <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800" />
                                            </div>
                                        </div>
                                    </div>
                                    <span className={`text-[11px] font-semibold ${editForm.fullName.length >= 22 ? 'text-red-500' : 'text-gray-400'}`}>{editForm.fullName.length}/22</span>
                                </div>
                                <input
                                    type="text"
                                    required
                                    maxLength={22}
                                    value={editForm.fullName}
                                    onChange={e => setEditForm({ ...editForm, fullName: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-4 focus:ring-blue-600/5 focus:border-blue-500 rounded-2xl text-slate-800 text-sm focus:outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Email</label>
                                <input
                                    type="email"
                                    required
                                    value={editForm.email}
                                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-4 focus:ring-blue-600/5 focus:border-blue-500 rounded-2xl text-slate-800 text-sm focus:outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Phone</label>
                                <input
                                    type="tel"
                                    required
                                    value={editForm.phone}
                                    onChange={e => handlePhoneChange(e, true)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-4 focus:ring-blue-600/5 focus:border-blue-500 rounded-2xl text-slate-800 text-sm focus:outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">New Password <span className="text-xs text-slate-400 font-normal">(leave blank to keep current)</span></label>
                                <div className="relative">
                                    <input
                                        type={showEditPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={editForm.password}
                                        onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-4 focus:ring-blue-600/5 focus:border-blue-500 rounded-2xl text-slate-800 text-sm focus:outline-none transition-all pr-12"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowEditPassword(p => !p)}
                                        className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
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
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Role</label>
                                    <select
                                        value={editForm.role}
                                        onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-4 focus:ring-blue-600/5 focus:border-blue-500 rounded-2xl text-slate-800 text-sm focus:outline-none transition-all"
                                    >
                                        <option value="staff">Staff</option>
                                        <option value="manager">Manager</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Status</label>
                                    <select
                                        value={editForm.status}
                                        onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-4 focus:ring-blue-600/5 focus:border-blue-500 rounded-2xl text-slate-800 text-sm focus:outline-none transition-all"
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setEditingStaff(null)}
                                    className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={editLoading}
                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-2xl transition-all"
                                >
                                    {editLoading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={deleteId !== null}
                title="Delete Staff Member?"
                message={`Are you sure you want to delete staff member "${deleteName}"? This cannot be undone.`}
                onConfirm={confirmDeleteStaff}
                onCancel={() => setDeleteId(null)}
            />
        </TenantLayout>
    );
}
