
"use client";

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { DashboardCard } from '@/components/DashboardCard';
import { StatusBadge } from '@/components/StatusBadge';
import { ProgressBar } from '@/components/ProgressBar';
import { Search, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

import { StudentDetailModal } from '@/components/StudentDetailModal';

export default function StudentsPage() {
    const [students, setStudents] = useState<any[]>([]);
    const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL'); // ALL, HIGH, MEDIUM, LOW
    const [search, setSearch] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

    useEffect(() => {
        fetchStudents();
    }, []);

    useEffect(() => {
        let result = students;

        if (filter !== 'ALL') {
            result = result.filter(s => s.riskLevel === filter);
        }

        if (search) {
            const q = search.toLowerCase();
            result = result.filter(s =>
                s.name.toLowerCase().includes(q) ||
                s.email.toLowerCase().includes(q)
            );
        }

        setFilteredStudents(result);
    }, [students, filter, search]);

    const fetchStudents = async () => {
        try {
            const res = await api.get('/students');
            setStudents(res.data);
            setFilteredStudents(res.data);
        } catch (error) {
            console.error('Failed to fetch students', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="p-4 md:p-8 space-y-6 max-w-[1600px] mx-auto">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white">At-Risk Students</h1>

                <div className="flex gap-4">
                    <div className="relative hidden sm:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                            type="text"
                            placeholder="Search student..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-10 w-64 rounded-lg bg-[#0F131E] border border-white/10 pl-9 pr-4 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                    </div>

                    <div className="flex bg-[#0F131E] p-1 rounded-lg border border-white/10 overflow-x-auto max-w-[200px] sm:max-w-none no-scrollbar">
                        {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={cn(
                                    "px-4 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap",
                                    filter === f
                                        ? "bg-indigo-600 text-white shadow-lg"
                                        : "text-gray-400 hover:text-white hover:bg-white/5"
                                )}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-white/5 overflow-hidden bg-[#0F131E] overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-white/5 text-xs text-gray-400 uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-4 font-medium">Student</th>
                            <th className="px-6 py-4 font-medium">Risk Score</th>
                            <th className="px-6 py-4 font-medium">Engagement</th>
                            <th className="px-6 py-4 font-medium">Grade Trend</th>
                            <th className="px-6 py-4 font-medium">Status</th>
                            <th className="px-6 py-4 font-medium">Top Flag</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {loading ? (
                            <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Loading students...</td></tr>
                        ) : filteredStudents.length === 0 ? (
                            <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No students found matching filters.</td></tr>
                        ) : (
                            filteredStudents.map((student) => (
                                <tr
                                    key={student.studentId}
                                    onClick={() => setSelectedStudent(student)}
                                    className="hover:bg-white/5 transition-colors group cursor-pointer"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs ring-1 ring-white/10">
                                                {student.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-white group-hover:text-indigo-400 transition-colors">{student.name}</div>
                                                <div className="text-xs text-gray-500">{student.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3 w-32">
                                            <ProgressBar
                                                value={student.riskScore}
                                                variant={student.riskScore > 70 ? 'danger' : student.riskScore > 40 ? 'warning' : 'success'}
                                                className="h-1.5"
                                            />
                                            <span className="text-xs text-gray-400 font-medium w-6">{student.riskScore}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-gray-300">{student.engagementScore}%</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={student.gradeTrend} />
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={student.riskLevel} />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-400 truncate max-w-[200px]">
                                            {student.redFlags[0] || "None"}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {selectedStudent && (
                <StudentDetailModal
                    student={selectedStudent}
                    onClose={() => setSelectedStudent(null)}
                />
            )}

        </main>
    );
}
