"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { GlassCard } from '@/components/GlassCard';
import { RiskBadge } from '@/components/RiskBadge';
import { ActivityLineChart } from '@/components/charts/ActivityLineChart';
import { Upload, CheckCircle, AlertTriangle, BookOpen } from 'lucide-react';

export default function StudentPortal() {
    const router = useRouter();
    const [student, setStudent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchStudentData();
    }, []);

    const fetchStudentData = async () => {
        try {
            const res = await api.get('/student/me');
            setStudent(res.data);
        } catch (error) {
            console.error('Failed to fetch student data', error);
            router.push('/login');
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (assignmentId: string) => {
        setSubmitting(true);
        try {
            // Simulate upload delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            await api.post('/student/assignments', { assignmentId });
            alert('Assignment submitted successfully!');
            // Refresh data
            fetchStudentData();
        } catch (error) {
            alert('Failed to submit assignment');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;
    if (!student) return null;

    return (
        <main className="min-h-screen p-4 md:p-8 space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white">Welcome, {student.name}</h1>
                    <p className="text-gray-400">Student ID: {student.studentId}</p>
                </div>
                <button
                    onClick={() => {
                        localStorage.removeItem('token');
                        router.push('/login');
                    }}
                    className="text-sm text-red-300 hover:text-white"
                >
                    Logout
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Risk & Activity */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Risk Card */}
                    <GlassCard className="relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <AlertTriangle size={120} className="text-white" />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-4">Your Academic Pulse</h2>
                        <div className="flex items-center gap-6">
                            <div className="text-center">
                                <div className="text-5xl font-bold text-white mb-1">{student.riskScore}</div>
                                <RiskBadge level={student.riskLevel} />
                            </div>
                            <div className="border-l border-white/10 pl-6">
                                <h3 className="text-sm font-semibold text-gray-300 mb-2">Analysis</h3>
                                {student.redFlags.length > 0 ? (
                                    <ul className="space-y-1">
                                        {student.redFlags.map((flag: string, i: number) => (
                                            <li key={i} className="text-sm text-red-200 flex items-center">
                                                <span className="w-1.5 h-1.5 rounded-full bg-red-400 mr-2" />
                                                {flag}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-green-300 text-sm flex items-center">
                                        <CheckCircle size={16} className="mr-2" />
                                        You are doing great! Keep it up.
                                    </p>
                                )}
                            </div>
                        </div>
                    </GlassCard>

                    {/* Activity Chart */}
                    <GlassCard>
                        <div className="h-64">
                            <ActivityLineChart activityLogs={student.activityLogs} />
                        </div>
                    </GlassCard>
                </div>

                {/* Right Column: Assignments */}
                <div className="space-y-8">
                    <GlassCard>
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                            <BookOpen size={20} className="mr-2" />
                            Assignments
                        </h2>
                        <div className="space-y-4">
                            {student.assignments.map((assignment: any) => (
                                <div key={assignment.id} className="p-3 bg-white/5 rounded-lg border border-white/5">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-medium text-white">{assignment.title}</span>
                                        {assignment.grade ? (
                                            <span className="text-green-300 text-sm font-bold">{assignment.grade}%</span>
                                        ) : (
                                            <span className="text-gray-500 text-xs">No Grade</span>
                                        )}
                                    </div>

                                    <div className="text-xs text-gray-400 mb-3">
                                        Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                    </div>

                                    {assignment.submittedDate ? (
                                        <div className="w-full py-2 bg-green-500/10 text-green-300 text-center rounded text-sm flex items-center justify-center">
                                            <CheckCircle size={14} className="mr-2" /> Submitted
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleUpload(assignment.id)}
                                            disabled={submitting}
                                            className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm flex items-center justify-center transition-colors"
                                        >
                                            <Upload size={14} className="mr-2" /> Upload Work
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </GlassCard>
                </div>
            </div>
        </main>
    );
}
