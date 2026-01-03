"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Lock, User, ShieldCheck, Mail } from "lucide-react";
import api from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<'student' | 'admin'>('student');

  // Student Form State
  const [studentId, setStudentId] = useState("");
  const [email, setEmail] = useState("");

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
      if (role === 'student') {
        const res = await api.post('/auth/login', { studentId, email });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user)); // Optional: store basics
        router.push("/student-dashboard");
      } else {
        const res = await api.post('/auth/admin/login', { username, password });
        localStorage.setItem('token', res.data.token);
        router.push("/admin-dashboard");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#060910] p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full" />

      <div className="w-full max-w-md bg-[#0B0F19] border border-white/10 p-8 rounded-2xl shadow-xl relative z-10 backdrop-blur-xl">
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white mb-4 shadow-lg shadow-indigo-600/20">
            <GraduationCap size={28} />
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
          <p className="text-gray-400 text-sm mt-2">Sign in to access your account</p>
        </div>

        {/* Role Toggle */}
        <div className="flex bg-[#151926] p-1 rounded-lg border border-white/5 mb-6">
          <button
            onClick={() => setRole('student')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${role === 'student' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
              }`}
          >
            <User size={16} />
            Student
          </button>
          <button
            onClick={() => setRole('admin')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${role === 'admin' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
              }`}
          >
            <ShieldCheck size={16} />
            Admin
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
                <label className="text-sm font-medium text-gray-300 ml-1">Student ID</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="e.g. STU12345"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="w-full bg-[#151926] border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    required={role === 'student'}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="email"
                    placeholder="student@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#151926] border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    required={role === 'student'}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 ml-1">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Admin Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-[#151926] border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    required={role === 'admin'}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#151926] border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    required={role === 'admin'}
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-lg transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in...
              </>
            ) : (
              role === 'student' ? 'Student Login' : 'Admin Login'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          {role === 'admin' ? (
            <p className="text-xs text-gray-500">
              Use <span className="text-white font-mono">admin / admin</span> for demo.
            </p>
          ) : (
            <p className="text-xs text-gray-500">
              Forgot credentials? Contact your administrator.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
