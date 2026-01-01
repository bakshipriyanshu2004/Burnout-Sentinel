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

    // Local state for randomized data (per user request for "random graph when i click")
    // We use a seed or just run it on mount.
    const [chartValues, setChartValues] = React.useState<number[]>([]);
    const [latencyState, setLatencyState] = React.useState<{ text: string, color: string }>({ text: '...', color: 'text-gray-400' });
    const [attendanceText, setAttendanceText] = React.useState('...');

    React.useEffect(() => {
        // 1. Generate Random Graph Data (30 days)
        // Create a smooth-ish random curve
        const newValues = [];
        let current = Math.floor(Math.random() * 60) + 20; // Start somewhere 20-80
        for (let i = 0; i < 30; i++) {
            const move = Math.floor(Math.random() * 30) - 15; // -15 to +15
            current = Math.max(10, Math.min(100, current + move));
            newValues.push(current);
        }
        setChartValues(newValues);

        // 2. Random Submission Latency
        const statuses = [
            { text: 'On Time', color: 'text-green-400' },
            { text: 'Occasional Late', color: 'text-yellow-400' },
            { text: 'Consistent Late', color: 'text-red-400' }
        ];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        setLatencyState(randomStatus);

        // 3. Random Attendance (Login Frequency)
        const attendances = ['Daily', 'Frequent', 'Irregular', 'Rare'];
        setAttendanceText(attendances[Math.floor(Math.random() * attendances.length)]);

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
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors shrink-0">
                        <X size={24} />
                    </button>
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
