import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { loginUser, getMe } from '../../services/api';
import ThemeToggle from '@/components/ThemeToggle';

export default function SuperAdminLogin() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            const userStr = localStorage.getItem('user');
            if (token && userStr) {
                try {
                    const user = JSON.parse(userStr);
                    await getMe();
                    if (user.role === 'affiliate') {
                        router.push('/affiliate/dashboard');
                    } else {
                        router.push('/superadmin/dashboard');
                    }
                } catch (err) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                }
            }
        };
        checkAuth();
    }, [router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await loginUser({ email, password });
            if (res.status === 'Success' && res.token) {
                localStorage.setItem('token', res.token);
                localStorage.setItem('user', JSON.stringify(res.data));
                if (res.data.role === 'affiliate') {
                    router.push('/affiliate/dashboard');
                } else {
                    router.push('/superadmin/dashboard');
                }
            } else {
                setError(res.message || 'Invalid credentials');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 selection:bg-indigo-500/30 transition-colors duration-300">
            <Head>
                <title>Login | WA Flow</title>
            </Head>

            <div className="fixed top-6 right-6">
                <ThemeToggle />
            </div>

            <div className="max-w-md w-full bg-card border border-border rounded-2xl shadow-2xl overflow-hidden p-8 backdrop-blur-xl relative">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-green-500 to-emerald-500"></div>
                <div className="text-center mb-10 mt-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20 mx-auto mb-6">
                        <span className="font-bold text-white text-2xl tracking-tighter">WA</span>
                    </div>
                    <h1 className="text-2xl font-bold text-foreground mb-2 tracking-tight">Welcome Back</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 text-sm">Sign in to your administration panel</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-2">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800/50 border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
                            placeholder="admin@waflow.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-2">Secure Passcode</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800/50 border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm pr-12"
                                placeholder="••••••••"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(p => !p)}
                                className="absolute right-4 top-3.5 text-neutral-450 hover:text-neutral-650 transition-colors"
                            >
                                {showPassword ? (
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

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                            <p className="text-red-400 text-sm text-center font-medium">{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:shadow-[0_0_25px_rgba(99,102,241,0.4)] transition-all active:scale-[0.98] mt-4"
                    >
                        {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
                    </button>
                </form>
            </div>
        </div>
    );
}
