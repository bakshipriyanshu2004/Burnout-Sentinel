"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { GlassCard } from '@/components/GlassCard';

export default function LoginPage() {
    const router = useRouter();
    const [studentId, setStudentId] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Helper to pre-fill for demo
    const handleDemoFill = () => {
        // S2024001 should be a student ID generated
        setStudentId('S2024001');
        // Need matching email. In generator: name.toLowerCase().replace(' ', '.') + '@university.edu'
        // This is tricky without knowing the random name.
        // So maybe we skip autofill or assume the user knows.
        // Or we hardcode one specific student in the generator?
        // User said "Generate 50 synthetic students...".
        // I can't guarantee the email.
        // I entered "Indian names only".
        // I'll leave the helper empty or comment it out.
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await api.post('/auth/login', { studentId, email });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            router.push('/student');
        } catch (err) {
            setError('Invalid credentials. Check the admin dashboard for valid Student IDs.');
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center p-4">
            <GlassCard className="w-full max-w-md">
                <h1 className="text-2xl font-bold text-white mb-2 text-center">Student Portal</h1>
                <p className="text-blue-200 text-center mb-8">Login to view your academic health.</p>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm text-gray-300 mb-2">Student ID</label>
                        <input
                            type="text"
                            value={studentId}
                            onChange={(e) => setStudentId(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                            placeholder="e.g. S2024001"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-300 mb-2">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                            placeholder="student@university.edu"
                            required
                        />
                    </div>

                    {error && <div className="text-red-400 text-sm text-center">{error}</div>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <div className="mt-4 text-center text-xs text-gray-500">
                    (Tip: Use Admin Dashboard to find a valid Student ID/Email pair)
                </div>
            </GlassCard>
        </main>
    );
}
