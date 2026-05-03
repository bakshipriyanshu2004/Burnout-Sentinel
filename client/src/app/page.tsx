"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Lock, User, ShieldCheck, CalendarDays } from "lucide-react";
import api from "@/lib/api";
import { auth, isFirebaseConfigured } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<'student' | 'admin'>('student');

  // Student Form State
  const [rollNumber, setRollNumber] = useState("");
  const [dob, setDob] = useState("");

  // Admin Form State
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (isFirebaseConfigured && auth) {
        // Firebase Login
        const emailToLogin = role === 'student' ? `${rollNumber.trim()}@bcrec.edu` : `${username.trim()}@bcrec.edu`;
        const passToLogin = role === 'student' ? dob.trim() : password.trim();
        
        const userCredential = await signInWithEmailAndPassword(auth, emailToLogin, passToLogin);
        const token = await userCredential.user.getIdToken();
        
        localStorage.setItem('token', token);
        
        if (role === 'student') {
            router.push("/student-dashboard");
        } else {
            router.push("/admin-dashboard");
        }

      } else {
        // Fallback to local JWT Login
        if (role === 'student') {
          const res = await api.post('/auth/login', { rollNumber, dob });
          localStorage.setItem('token', res.data.token);
          localStorage.setItem('user', JSON.stringify(res.data.user));
          router.push("/student-dashboard");
        } else {
          const res = await api.post('/auth/admin/login', { username, password });
          localStorage.setItem('token', res.data.token);
          router.push("/admin-dashboard");
        }
      }
    } catch (err: any) {
      // Axios wraps 4xx responses as errors — extract the server message cleanly
      const serverMsg = err?.response?.data?.error || err?.response?.data?.message;
      const userMsg = serverMsg
        ? serverMsg
        : err?.message?.includes('401') || err?.response?.status === 401
          ? 'Invalid credentials. Check your Roll Number and Date of Birth.'
          : err?.message || 'Login failed. Please try again.';
      setError(userMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-transparent p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-amber-500/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-yellow-500/10 blur-[120px] rounded-full" />

      <div className="w-full max-w-md bg-black/40 backdrop-blur-sm border border-white/10 p-8 rounded-2xl shadow-xl relative z-10 backdrop-blur-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="h-14 w-14 rounded-2xl overflow-hidden bg-black border border-white/10 shadow-lg shadow-black/40 mb-4 flex items-center justify-center">
            <Image src="/logo.svg" alt="Baal Mantra" width={56} height={56} />
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
          <p className="text-gray-400 text-sm mt-2">Sign in to access your account</p>
        </div>

        {/* Role Toggle */}
        <div className="flex bg-black/50 backdrop-blur-sm p-1 rounded-lg border border-white/5 mb-6">
          <button
            onClick={() => setRole('student')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${role === 'student' ? 'bg-amber-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
              }`}
          >
            <User size={16} />
            Sishya
          </button>
          <button
            onClick={() => setRole('admin')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${role === 'admin' ? 'bg-amber-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
              }`}
          >
            <ShieldCheck size={16} />
            Guru
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          {role === 'student' ? (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 ml-1">Roll Number</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="e.g. R2024001"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    className="w-full bg-black/50 backdrop-blur-sm border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
                    required={role === 'student'}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 ml-1">Date of Birth</label>
                <div className="relative">
                  <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full bg-black/50 backdrop-blur-sm border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
                    required={role === 'student'}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 ml-1">Guru ID (e.g. T1)</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Guru ID"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-black/50 backdrop-blur-sm border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
                    required={role === 'admin'}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 ml-1">Unique Password ID</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black/50 backdrop-blur-sm border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
                    required={role === 'admin'}
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-amber-600 hover:bg-amber-500 text-white font-medium py-3 rounded-lg transition-all shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in...
              </>
            ) : (
              role === 'student' ? 'Sishya Login' : 'Guru Login'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          {role === 'admin' ? (
            <p className="text-xs text-gray-500">
              Use your first name as Guru ID (e.g. Swadhin) and the standard password.
            </p>
          ) : (
            <p className="text-xs text-gray-500">
              Forgot credentials? Contact your Guru.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
