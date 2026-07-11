import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AffiliateLayout from '../../components/affiliate/AffiliateLayout';
import { getAllTickets, resolveTicket, deleteTicket, Ticket } from '../../services/api';
import { Search, X, Check, Trash2, Eye, Calendar, User, Building, LifeBuoy } from 'lucide-react';

export default function AffiliateTickets() {
    const router = useRouter();
    const [isAuth, setIsAuth] = useState(false);
    const [tickets, setTickets] = useState<Ticket[]>([]);

    const getPlainText = (html: string) => {
        if (!html) return '';
        return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
    };
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'RESOLVED'>('ALL');
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

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
            const res = await getAllTickets();
            if (res.success && res.data) {
                setTickets(res.data);
            }
        } catch (err: any) {
            console.error('Failed to fetch tickets:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleResolve = async (ticket: Ticket) => {
        try {
            const res = await resolveTicket(ticket._id);
            if (res.success) {
                if (selectedTicket && selectedTicket._id === ticket._id) {
                    setSelectedTicket({ ...selectedTicket, status: selectedTicket.status === 'open' ? 'resolved' : 'open' });
                }
                fetchData();
            }
        } catch (err) {
            console.error('Error toggling resolve:', err);
            alert('Failed to resolve ticket');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this ticket?')) return;
        try {
            await deleteTicket(id);
            if (selectedTicket && selectedTicket._id === id) {
                setSelectedTicket(null);
            }
            fetchData();
        } catch (err) {
            console.error('Error deleting ticket:', err);
            alert('Error deleting ticket');
        }
    };

    const filtered = tickets.filter(t => {
        const q = search.toLowerCase();
        const matchQ = t.subject.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || (t.tenantName || '').toLowerCase().includes(q) || (t.raisedBy || '').toLowerCase().includes(q);
        const matchS = statusFilter === 'ALL' || (statusFilter === 'OPEN' && t.status === 'open') || (statusFilter === 'RESOLVED' && t.status === 'resolved');
        return matchQ && matchS;
    });

    if (!isAuth) return null;

    if (loading) {
        return (
            <AffiliateLayout title="Support Tickets">
                <div className="flex flex-col items-center justify-center p-20 gap-4">
                    <span className="animate-spin w-8 h-8 border-4 border-amber-500/30 border-t-amber-500 rounded-full"></span>
                    <span className="text-sm font-medium text-neutral-400 tracking-wider">LOADING SUPPORT TICKETS</span>
                </div>
            </AffiliateLayout>
        );
    }

    return (
        <AffiliateLayout title="Support Tickets">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">Support Tickets</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1 text-sm">Review and resolve support tickets raised by your client administrators</p>
                </div>
            </div>

            <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden backdrop-blur-xl">
                {/* Search + Filter Header */}
                <div className="p-6 border-b border-border flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                        <input
                          type="text"
                          placeholder="Search by client, subject, description..."
                          value={search}
                          onChange={e => setSearch(e.target.value)}
                          className="w-full bg-neutral-50/50 dark:bg-neutral-900/50 border border-border rounded-xl py-2 pl-11 pr-10 text-sm outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-foreground"
                        />
                        {search && (
                            <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-foreground">
                                <X size={15} />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5 self-start md:self-auto">
                        <span className="text-xs uppercase tracking-widest text-neutral-400 font-bold mr-2">Filter:</span>
                        {(['ALL', 'OPEN', 'RESOLVED'] as const).map(f => (
                            <button
                                key={f}
                                onClick={() => setStatusFilter(f)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                    statusFilter === f 
                                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' 
                                      : 'text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                                  }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-neutral-50/50 dark:bg-neutral-900/50 border-b border-border text-neutral-500 dark:text-neutral-400 text-sm font-medium">
                                <th className="px-6 py-4">Client Org</th>
                                <th className="px-6 py-4">Subject</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Raised By</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filtered.map((ticket) => (
                                <tr key={ticket._id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-foreground">{ticket.tenantName || 'Unknown'}</div>
                                        <div className="text-neutral-500 dark:text-neutral-400 text-xs mt-0.5">/{ticket.tenantSlug}</div>
                                    </td>
                                    <td className="px-6 py-4 max-w-sm">
                                        <div className="font-medium text-foreground truncate">{ticket.subject}</div>
                                        <p className="text-neutral-500 dark:text-neutral-400 text-xs truncate mt-0.5">{getPlainText(ticket.description)}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                                            ticket.status === 'resolved'
                                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                              : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                        }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${ticket.status === 'resolved' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                            {ticket.status === 'resolved' ? 'Resolved' : 'Open'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-neutral-500 dark:text-neutral-400">
                                        {ticket.raisedBy}
                                    </td>
                                    <td className="px-6 py-4 text-neutral-500 dark:text-neutral-400 text-xs">
                                        {new Date(ticket.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            {/* View button */}
                                            <button
                                                onClick={() => setSelectedTicket(ticket)}
                                                title="View ticket details"
                                                className="p-2 text-neutral-500 dark:text-neutral-400 hover:text-sky-500 dark:hover:text-sky-400 hover:bg-sky-500/10 dark:hover:bg-sky-400/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <Eye size={17} />
                                            </button>
                                            {/* Resolve button */}
                                            <button
                                                onClick={() => handleToggleResolve(ticket)}
                                                title={ticket.status === 'resolved' ? "Reopen Ticket" : "Mark as Resolved"}
                                                className={`p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100 ${
                                                    ticket.status === 'resolved'
                                                      ? 'text-neutral-400 hover:text-indigo-500 hover:bg-indigo-500/10'
                                                      : 'text-neutral-400 hover:text-emerald-500 hover:bg-emerald-500/10'
                                                }`}
                                            >
                                                <Check size={17} />
                                            </button>
                                            {/* Delete button */}
                                            <button
                                                onClick={() => handleDelete(ticket._id)}
                                                title="Delete Ticket"
                                                className="p-2 text-neutral-500 dark:text-neutral-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-400/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 size={17} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-neutral-500">
                                        No support tickets matching filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Ticket Details Modal */}
            {selectedTicket && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedTicket(null)}></div>
                    <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg p-7 animate-[fadeScaleIn_0.2s_ease-out] text-foreground">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-550">
                                    <LifeBuoy size={22} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-foreground">Ticket Details</h3>
                                    <p className="text-neutral-500 text-xs">Support query resolution parameters</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedTicket(null)}
                                className="p-2 text-neutral-500 hover:text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-neutral-50 dark:bg-neutral-800/50 border border-border rounded-xl p-4 space-y-3">
                                <div className="flex items-center gap-3">
                                    <Building className="text-neutral-400 w-4 h-4" />
                                    <div>
                                        <span className="text-[9px] text-neutral-500 uppercase tracking-widest block">Client Organization</span>
                                        <span className="text-sm font-semibold text-foreground">{selectedTicket.tenantName} (/{selectedTicket.tenantSlug})</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <User className="text-neutral-400 w-4 h-4" />
                                    <div>
                                        <span className="text-[9px] text-neutral-500 uppercase tracking-widest block">Raised By</span>
                                        <span className="text-sm font-semibold text-foreground font-mono">{selectedTicket.raisedBy}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Calendar className="text-neutral-400 w-4 h-4" />
                                    <div>
                                        <span className="text-[9px] text-neutral-500 uppercase tracking-widest block">Submitted On</span>
                                        <span className="text-sm font-semibold text-foreground">
                                            {new Date(selectedTicket.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })} at {new Date(selectedTicket.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-neutral-50 dark:bg-neutral-800/50 border border-border rounded-xl p-4">
                                <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-wider block mb-1">Subject</span>
                                <p className="font-semibold text-foreground text-base leading-snug">{selectedTicket.subject}</p>
                            </div>

                            <div className="bg-neutral-50 dark:bg-neutral-800/50 border border-border rounded-xl p-4">
                                <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-wider block mb-2">Description</span>
                                <div 
                                    className="text-sm text-foreground leading-relaxed font-sans max-w-full overflow-hidden break-words prose dark:prose-invert"
                                    dangerouslySetInnerHTML={{ __html: selectedTicket.description }}
                                />
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
                            <button
                                onClick={() => handleToggleResolve(selectedTicket)}
                                className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                    selectedTicket.status === 'resolved'
                                      ? 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-foreground'
                                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                }`}
                            >
                                {selectedTicket.status === 'resolved' ? 'Reopen Ticket' : 'Mark as Resolved'}
                            </button>
                            <button
                                onClick={() => setSelectedTicket(null)}
                                className="px-5 py-2.5 bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-foreground dark:text-white rounded-xl text-sm font-medium transition-all"
                            >
                                Close Details
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AffiliateLayout>
    );
}
