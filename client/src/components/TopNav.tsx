
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, LayoutDashboard, Users, Bell, Search, UserCircle, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function TopNav() {
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Hide navigation on login page (root)
    if (pathname === '/') return null;

    const isStudentDashboard = pathname === '/student-dashboard';

    return (
        <header className="flex h-16 items-center justify-between border-b border-white/10 bg-[#0B0F19] px-4 md:px-6 relative z-50">
            <div className="flex items-center gap-4 md:gap-8">
                {/* Mobile Menu Button - Hide on Student Dashboard */}
                {!isStudentDashboard && (
                    <button
                        className="md:hidden text-gray-400 hover:text-white"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                )}

                <Link href={isStudentDashboard ? "/student-dashboard" : "/admin-dashboard"} className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
                        <GraduationCap size={20} />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-white leading-none hidden sm:block">Baal Mantra</h1>
                        <h1 className="text-lg font-bold text-white leading-none sm:hidden">Baal Mantra</h1>
                        <p className="text-[10px] text-blue-300 font-medium tracking-wider hidden sm:block">BURNOUT WARNING SYSTEM</p>
                    </div>
                </Link>

                {/* Desktop Nav - Hide on Student Dashboard */}
                {!isStudentDashboard && (
                    <nav className="hidden md:flex items-center space-x-1">
                        <Link
                            href="/admin-dashboard"
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                                pathname === '/admin-dashboard'
                                    ? "bg-white/10 text-white"
                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <LayoutDashboard size={16} />
                            Dashboard
                        </Link>
                        <Link
                            href="/students"
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                                pathname === '/students'
                                    ? "bg-white/10 text-white"
                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <Users size={16} />
                            Students
                        </Link>
                    </nav>
                )}
            </div>

            <div className="flex items-center gap-2 md:gap-4">
                {!isStudentDashboard && (
                    <div className="relative hidden md:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                            type="text"
                            placeholder="Search students..."
                            className="h-9 w-48 lg:w-64 rounded-full bg-white/5 border border-white/10 pl-9 pr-4 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                    </div>
                )}

                <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
                    <Bell size={20} />
                    <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-[#0B0F19]"></span>
                </button>

                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 p-[1px]">
                    <div className="h-full w-full rounded-full bg-[#0B0F19] p-0.5">
                        <div className="h-full w-full rounded-full bg-cyan-500/20 flex items-center justify-center">
                            <UserCircle size={20} className="text-cyan-400" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {isMenuOpen && !isStudentDashboard && (
                <div className="absolute top-16 left-0 right-0 bg-[#0B0F19] border-b border-white/10 p-4 md:hidden flex flex-col gap-2 shadow-2xl animate-in slide-in-from-top-2">
                    <Link
                        href="/admin-dashboard"
                        onClick={() => setIsMenuOpen(false)}
                        className={cn(
                            "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                            pathname === '/admin-dashboard'
                                ? "bg-white/10 text-white"
                                : "text-gray-400 hover:text-white hover:bg-white/5"
                        )}
                    >
                        <LayoutDashboard size={18} />
                        Dashboard
                    </Link>
                    <Link
                        href="/students"
                        onClick={() => setIsMenuOpen(false)}
                        className={cn(
                            "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                            pathname === '/students'
                                ? "bg-white/10 text-white"
                                : "text-gray-400 hover:text-white hover:bg-white/5"
                        )}
                    >
                        <Users size={18} />
                        Students
                    </Link>
                </div>
            )}
        </header>
    );
}
