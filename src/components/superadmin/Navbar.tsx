import { useRouter } from 'next/router';

export default function Navbar() {
    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem('superadmin_auth');
        router.push('/superadmin/login');
    };

    return (
        <nav className="border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-xl sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <span className="font-bold text-white text-sm">CA</span>
                    </div>
                    <span className="font-semibold text-lg text-white tracking-tight">Flow SuperAdmin</span>
                </div>
                <button
                    onClick={handleLogout}
                    className="text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 px-4 py-2 rounded-lg transition-all"
                >
                    Sign out
                </button>
            </div>
        </nav>
    );
}
