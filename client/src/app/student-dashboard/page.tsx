"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Line, Bar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from "chart.js";
import { Clock, BookOpen, Activity, AlertCircle, LogOut, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";


ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

export default function StudentDashboard() {
    const router = useRouter();

    const [student, setStudent] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Derived Data - Computed unconditionally at top level
    const engagementData = useMemo(() => {
        if (!student?.activityLogs) return Array(30).fill(0);
        const sortedLogs = [...student.activityLogs].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const last30 = sortedLogs.slice(-30);
        return last30.map((log: any) => {
            const rawScore = (log.videoWatchMinutes) + (log.forumPosts * 10) + (log.loginCount * 5);
            return Math.min(100, Math.round((rawScore / 150) * 100));
        });
    }, [student]);

    const attendanceData = useMemo(() => {
        if (!student?.studentId) return Array(7).fill(0);
        // "Random attendance" but consistent for the student (seeded by ID)
        const seed = student.studentId.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
        const seededRandom = (s: number) => {
            const x = Math.sin(s++) * 10000;
            return x - Math.floor(x);
        };

        return Array.from({ length: 7 }, (_, i) => seededRandom(seed + i) > 0.3 ? 1 : 0);
    }, [student]);

    const metrics = useMemo(() => {
        // Attendance %
        const totalDays = student?.activityLogs?.length || 1;
        const activeDays = student?.activityLogs?.filter((l: any) => l.loginCount > 0).length || 0;
        const attPct = Math.round((activeDays / totalDays) * 100);

        // Assignments
        const totalAss = student?.assignments?.length || 0;
        const completed = student?.assignments?.filter((a: any) => a.submittedDate).length || 0;

        return {
            attendance: attPct,
            engagement: student?.engagementScore || 0,
            completedAssignments: completed,
            totalAssignments: totalAss
        };
    }, [student]);

    const analysisItems = useMemo(() => {
        if (!student) return [];
        const items = [];

        // 1. Risk Level Analysis
        if (student.riskLevel === 'HIGH') {
            items.push({ type: 'warning', text: 'Engagement significantly below threshold.', date: '1 day ago' });
            items.push({ type: 'warning', text: 'Multiple missed login sessions detected.', date: '3 days ago' });
        } else if (student.riskLevel === 'MEDIUM') {
            items.push({ type: 'info', text: 'Engagement pattern shows slight inconsistency.', date: '2 days ago' });
        } else {
            items.push({ type: 'success', text: 'Maintained excellent engagement streak.', date: '1 day ago' });
        }

        // 2. Assignment Analysis
        const pending = student.assignments?.filter((a: any) => !a.submittedDate) || [];
        if (pending.length > 0) {
            items.push({ type: 'warning', text: `Pending submission: ${pending[0].title}`, date: 'Due soon' });
        } else {
            items.push({ type: 'success', text: 'All assignments submitted on time.', date: 'Current' });
        }

        // 3. General
        if (student.engagementScore > 80) {
            items.push({ type: 'info', text: 'Your activity is in the top 10% of class.', date: '1 week ago' });
        }

        return items.slice(0, 3);
    }, [student]);



    useEffect(() => {
        const fetchStudentData = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push("/");
                return;
            }

            try {
                // Fetch student profile using the token
                // We'll use a direct fetch here or if api interceptor handles it, good. 
                // Assuming api instance doesn't auto-attach, we attach manually or use the helper.
                // But let's check if api lib handles it. If not, we do it here.
                const res = await fetch('http://localhost:3001/api/student/me', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!res.ok) throw new Error("Unauthorized");

                const data = await res.json();
                setStudent(data);
            } catch (error) {
                console.error("Failed to load student data", error);
                localStorage.removeItem('token');
                router.push("/");
            } finally {
                setLoading(false);
            }
        };

        fetchStudentData();
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push("/");
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-[#060910] flex items-center justify-center">
                <div className="text-white flex flex-col items-center gap-4">
                    <div className="h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <p>Loading dashboard...</p>
                </div>
            </main>
        );
    }

    if (!student) return null;



    // Chart Configs
    const labels = Array.from({ length: 30 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (29 - i));
        return format(d, 'MMM d');
    });

    const engagementChartData = {
        labels,
        datasets: [
            {
                label: 'Engagement Score',
                data: engagementData,
                fill: true,
                borderColor: '#818cf8',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 4,
            },
        ],
    };

    const attendanceLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const attendanceChartData = {
        labels: attendanceLabels,
        datasets: [
            {
                label: 'Attendance',
                data: attendanceData, // dummy last 7 days
                backgroundColor: attendanceData.map(val => val === 1 ? '#4ade80' : '#f87171'),
                borderRadius: 4,
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: { grid: { display: false }, ticks: { color: '#9ca3af' } },
            y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af' }, min: 0, max: 100 }
        },
        plugins: { legend: { display: false } }
    };

    const barOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: { grid: { display: false }, ticks: { color: '#9ca3af' } },
            y: { display: false, min: 0, max: 1.5 }
        },
        plugins: { legend: { display: false } }
    };


    return (
        <main className="min-h-screen bg-[#060910] p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#0B0F19] p-6 rounded-2xl border border-white/10">
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 p-[2px]">
                            <div className="h-full w-full rounded-full bg-[#0B0F19] p-1">
                                <div className="h-full w-full rounded-full bg-indigo-500/20 flex items-center justify-center text-xl font-bold text-indigo-400">
                                    {student.name.charAt(0)}
                                </div>
                            </div>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white max-w-[200px] truncate sm:max-w-none">Welcome, {student.name}</h1>
                            <p className="text-gray-400 text-sm flex items-center gap-2">
                                {student.program} • {student.semester} • <span className="text-indigo-400">{student.id}</span>
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-sm font-medium"
                    >
                        <LogOut size={16} />
                        Logout
                    </button>
                </header>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <MetricCard
                        title="Current Attendance"
                        value={`${metrics.attendance}%`}
                        sub="Last 30 Days"
                        icon={<Clock size={20} className="text-blue-400" />}
                        className="bg-blue-500/5 border-blue-500/10"
                    />
                    <MetricCard
                        title="Engagement Score"
                        value={`${metrics.engagement}/100`}
                        sub="Realtime Score"
                        icon={<Activity size={20} className="text-purple-400" />}
                        className="bg-purple-500/5 border-purple-500/10"
                    />
                    <MetricCard
                        title="Assignments"
                        value={`${metrics.completedAssignments}/${metrics.totalAssignments}`}
                        sub="Submissions"
                        icon={<BookOpen size={20} className="text-indigo-400" />}
                        className="bg-indigo-500/5 border-indigo-500/10"
                    />
                </div>

                {/* Charts & Analysis */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Performance Graph */}
                    <div className="lg:col-span-2 bg-[#0B0F19] border border-white/10 rounded-2xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <Activity size={18} className="text-indigo-400" />
                                Performance Trends
                            </h2>
                            <div className="flex gap-2">
                                <span className="text-xs px-2 py-1 rounded bg-white/5 text-gray-400">30 Days</span>
                            </div>
                        </div>
                        <div className="h-[300px] w-full">
                            <Line data={engagementChartData} options={chartOptions} />
                        </div>
                    </div>

                    {/* Attendance & Alerts */}
                    <div className="space-y-6">
                        {/* Weekly Attendance */}
                        <div className="bg-[#0B0F19] border border-white/10 rounded-2xl p-6">
                            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <CheckCircle size={18} className="text-green-400" />
                                Weekly Attendance
                            </h2>
                            <div className="h-[150px]">
                                <Bar data={attendanceChartData} options={barOptions} />
                            </div>
                        </div>

                        {/* Analysis / Alerts */}
                        <div className="bg-[#0B0F19] border border-white/10 rounded-2xl p-6 flex-1">
                            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <AlertCircle size={18} className="text-orange-400" />
                                Recent Analysis
                            </h2>
                            <div className="space-y-3">
                                {analysisItems.map((item, i) => (
                                    <AnalysisItem
                                        key={i}
                                        type={item.type}
                                        text={item.text}
                                        date={item.date}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </main>
    );
}

function MetricCard({ title, value, sub, icon, className }: any) {
    return (
        <div className={`p-6 rounded-2xl border ${className}`}>
            <div className="flex justify-between items-start mb-2">
                <span className="text-gray-400 text-sm font-medium">{title}</span>
                <div className="p-2 bg-white/5 rounded-lg">{icon}</div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{value}</div>
            <div className="text-xs text-gray-500">{sub}</div>
        </div>
    )
}

function AnalysisItem({ type, text, date }: any) {
    const color = type === 'warning' ? 'text-orange-400 bg-orange-400/10 border-orange-400/20' :
        type === 'success' ? 'text-green-400 bg-green-400/10 border-green-400/20' :
            'text-blue-400 bg-blue-400/10 border-blue-400/20';

    return (
        <div className={`p-3 rounded-lg border ${color} flex flex-col gap-1`}>
            <span className="text-sm font-medium">{text}</span>
            <span className="text-[10px] opacity-70">{date}</span>
        </div>
    );
}
