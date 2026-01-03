"use client";

import React from 'react';
import { X, Clock, Activity, BookOpen, AlertCircle } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { format, parseISO } from 'date-fns';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface StudentDetailModalProps {
    student: any;
    onClose: () => void;
}

export function StudentDetailModal({ student, onClose }: StudentDetailModalProps) {
    if (!student) return null;

    // 1. Chart Data from Activity Logs
    const chartValues = React.useMemo(() => {
        if (!student.activityLogs || student.activityLogs.length === 0) return Array(30).fill(0);

        // Sort logs by date just in case
        const sortedLogs = [...student.activityLogs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Take last 30 or fill
        const last30 = sortedLogs.slice(-30);

        return last30.map(log => {
            // Heuristic for daily engagement score:
            // Max ~150 (120 min video + 3 posts) -> 100
            const rawScore = (log.videoWatchMinutes) + (log.forumPosts * 10) + (log.loginCount * 5);
            return Math.min(100, Math.round((rawScore / 150) * 100));
        });
    }, [student]);

    // 2. Submission Latency from Assignments
    const latencyState = React.useMemo(() => {
        if (!student.assignments || student.assignments.length === 0) return { text: 'No Data', color: 'text-gray-400' };

        const recent = student.assignments.slice(-5);
        const lateCount = recent.filter((a: any) => !a.submittedDate || new Date(a.submittedDate) > new Date(a.dueDate)).length;

        if (lateCount === 0) return { text: 'On Time', color: 'text-green-400' };
        if (lateCount <= 2) return { text: 'Occasional Late', color: 'text-yellow-400' };
        return { text: 'Consistent Late', color: 'text-red-400' };
    }, [student]);

    // 3. Attendance from Activity Logs
    const attendanceText = React.useMemo(() => {
        if (!student.activityLogs || student.activityLogs.length === 0) return 'Unknown';

        const last14 = student.activityLogs.slice(-14);
        const activeDays = last14.filter((l: any) => l.loginCount > 0).length;

        if (activeDays >= 12) return 'Daily';
        if (activeDays >= 8) return 'Frequent';
        if (activeDays >= 4) return 'Irregular';
        return 'Rare';
    }, [student]);

    // Use dates from actual logs if available, or just generate last 30 days
    const labels = Array.from({ length: 30 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (29 - i));
        return format(d, 'MMM d');
    });

    const chartData = {
        labels,
        datasets: [
            {
                label: 'Engagement Score',
                data: chartValues,
                fill: true,
                borderColor: '#818cf8', // Indigo-400
                backgroundColor: 'rgba(99, 102, 241, 0.1)', // Indigo-500/10
                tension: 0.4,
                pointBackgroundColor: '#818cf8',
                pointBorderColor: '#0F131E',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                grid: { display: false, drawBorder: false },
                ticks: { color: '#64748b', font: { size: 10 }, maxTicksLimit: 7 }
            },
            y: {
                grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
                ticks: { color: '#64748b', font: { size: 10 }, stepSize: 25 },
                min: 0,
                max: 100
            }
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#1e293b',
                titleColor: '#fff',
                bodyColor: '#cbd5e1',
                padding: 10,
                displayColors: false,
                callbacks: {
                    label: (context: any) => `Engagement Score: ${context.parsed.y}`
                }
            }
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <div className="bg-[#0F131E] border border-white/10 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 my-4 md:my-0">

                {/* Header */}
                <div className="p-4 md:p-6 border-b border-white/5 flex justify-between items-start">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-xl font-bold ring-1 ring-white/10 shrink-0">
                            {student.name.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-bold text-white mb-1">{student.name}</h2>
                            <p className="text-gray-400 text-sm mb-2">{student.email}</p>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-xs font-bold ring-1 ring-inset ${student.riskLevel === 'HIGH' ? 'bg-red-500/10 text-red-500 ring-red-500/20' :
                                    student.riskLevel === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-500 ring-yellow-500/20' :
                                        'bg-green-500/10 text-green-500 ring-green-500/20'
                                    }`}>
                                    {student.riskLevel} RISK
                                </span>
                                <span className="px-2 py-0.5 rounded text-xs text-gray-500 bg-white/5 border border-white/5 hidden sm:inline-block">
                                    Student ID: #{student.studentId.substring(1)}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {student.riskLevel === 'HIGH' && (
                            <button
                                onClick={() => {
                                    fetch('http://localhost:3001/api/calendar/meet', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ studentId: student.studentId })
                                    })
                                        .then(res => res.json())
                                        .then(data => {
                                            window.open(data.meetLink, '_blank');
                                        })
                                        .catch(err => console.error(err));
                                }}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors shadow-lg shadow-red-500/20 animate-pulse"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>
                                Instant Counseling
                            </button>
                        )}
                        <button
                            onClick={() => {
                                // Admin triggering focus block for student
                                fetch('http://localhost:3001/api/calendar/focus', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ studentId: student.studentId }) // endpoint needs to handle this or we just mock it for admin
                                })
                                    .then(() => alert(`Focus block scheduled for ${student.name}`))
                                    .catch(err => console.error(err));
                            }}
                            className="p-2 rounded-lg hover:bg-white/5 text-indigo-400 hover:text-indigo-300 transition-colors shrink-0 border border-transparent hover:border-white/10"
                            title="Assign Focus Block"
                        >
                            <Clock size={24} />
                        </button>
                        <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors shrink-0">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <div className="p-4 md:p-6 space-y-6 md:space-y-8">
                    {/* Metric Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <MetricCard
                            title="Attendance" // Renamed from Login Frequency
                            value={attendanceText}
                            icon={<Clock size={20} className="text-blue-400" />}
                            iconBg="bg-blue-500/10"
                        />
                        <MetricCard
                            title="Engagement"
                            value={`${student.engagementScore}%`}
                            icon={<Activity size={20} className="text-purple-400" />}
                            iconBg="bg-purple-500/10"
                        />
                        <MetricCard
                            title="Submission Latency"
                            value={latencyState.text}
                            valueColor={latencyState.color}
                            icon={<BookOpen size={20} className="text-green-400" />}
                            iconBg="bg-green-500/10"
                        />
                    </div>

                    {/* Chart */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4">30-Day Activity Trend</h3>
                        <div className="h-[250px] w-full bg-white/[0.02] rounded-xl border border-white/5 p-4 relative group">
                            {/* Simple tooltip overlay simulation or relying on ChartJS tooltip */}
                            <Line data={chartData} options={chartOptions as any} />
                        </div>
                    </div>

                    {/* Risk Factors */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-3">Identified Risk Factors</h3>
                        <div className="flex flex-wrap gap-3">
                            {student.redFlags.length > 0 ? (
                                student.redFlags.map((flag: string, i: number) => (
                                    <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                        <AlertCircle size={16} />
                                        {flag}
                                    </div>
                                ))
                            ) : (
                                <div className="text-gray-500 italic text-sm">No specific risk flags identified.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MetricCard({ title, value, icon, iconBg, valueColor = 'text-white' }: any) {
    return (
        <div className="bg-[#151926] p-4 rounded-xl border border-white/5 flex flex-col justify-between h-28">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${iconBg}`}>
                    {icon}
                </div>
                <span className="text-gray-400 text-sm font-medium">{title}</span>
            </div>
            <div className={`text-2xl font-bold ${valueColor}`}>
                {value}
            </div>
        </div>
    )
}
