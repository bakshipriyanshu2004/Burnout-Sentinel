"use client";

import { useEffect, useState } from 'react';
import { useRouter } from "next/navigation";
import api from '@/lib/api';
import { DashboardCard } from '@/components/DashboardCard';
import { RiskBubbleChart } from '@/components/charts/RiskBubbleChart';
import { ProgressBar } from '@/components/ProgressBar';
import { Users, AlertCircle, Activity, TrendingDown, RefreshCw, LogOut } from 'lucide-react';

export default function AdminDashboard() {
    const router = useRouter();
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for admin token (simple check)
        const token = localStorage.getItem('token');
        if (!token) {
            // ideally verify role but for now redirect if no token
            router.push("/");
        }

        fetchStudents();
    }, [router]);

    const fetchStudents = async () => {
        try {
            const res = await api.get('/students');
            setStudents(res.data);
        } catch (error) {
            console.error('Failed to fetch students', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push("/");
    };

    if (loading) return <div className="p-8 text-white">Loading dashboard...</div>;

    // KPIs
    const totalStudents = students.length;
    const highRiskStudents = students.filter(s => s.riskLevel === 'HIGH').length;
    const mediumRiskStudents = students.filter(s => s.riskLevel === 'MEDIUM').length;
    const lowRiskStudents = students.filter(s => s.riskLevel === 'LOW').length;
    const avgRiskScore = students.length ? Math.round(students.reduce((acc, s) => acc + s.riskScore, 0) / students.length) : 0;
    const decliningGradesCount = students.filter(s => s.gradeTrend === 'Declining').length;

    return (
        <main className="p-4 md:p-8 space-y-8 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Dashboard Overview</h1>
                    <p className="text-sm md:text-base text-gray-400">Monitor student engagement and burnout risks in real-time.</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={fetchStudents}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0F131E] border border-white/10 text-sm text-gray-300 hover:text-white transition-colors"
                    >
                        <RefreshCw size={14} />
                        <span className="hidden sm:inline">Last updated: Just now</span>
                    </button>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-sm font-medium"
                    >
                        <LogOut size={16} />
                        Logout
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPI_Card
                    title="Total Students"
                    value={totalStudents}
                    icon={<Users size={24} className="text-blue-400" />}
                    trend="+12% vs last month"
                    trendPositive={true}
                    iconBg="bg-blue-500/10"
                />
                <KPI_Card
                    title="High Risk Alerts"
                    value={highRiskStudents}
                    icon={<AlertCircle size={24} className="text-red-400" />}
                    trend="-5% vs last month"
                    trendPositive={true} // Less risk is positive
                    iconBg="bg-red-500/10"
                />
                <KPI_Card
                    title="Avg. Risk Score"
                    value={avgRiskScore}
                    icon={<Activity size={24} className="text-purple-400" />}
                    trend="-0.4 vs last month"
                    trendPositive={true}
                    iconBg="bg-purple-500/10"
                />
                <KPI_Card
                    title="Declining Grades"
                    value={decliningGradesCount}
                    icon={<TrendingDown size={24} className="text-orange-400" />}
                    trend="-2% vs last month"
                    trendPositive={true}
                    iconBg="bg-orange-500/10"
                />
            </div>

            {/* Charts Details */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Risk Landscape - Takes 2 cols */}
                <div className="lg:col-span-2">
                    <DashboardCard title="Risk Landscape Analysis" className="h-[500px] flex flex-col">
                        <div className="flex justify-end gap-4 mb-4 text-xs">
                            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500"></span> High</div>
                            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-500"></span> Medium</div>
                            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500"></span> Low</div>
                        </div>
                        <div className="flex-1 w-full min-h-0 relative">
                            <RiskBubbleChart students={students} />
                        </div>
                    </DashboardCard>
                </div>

                {/* Risk Distribution - Takes 1 col */}
                <div className="lg:col-span-1">
                    <DashboardCard title="Risk Distribution" className="h-[500px]">
                        <div className="flex flex-col justify-center h-full space-y-8 px-2">
                            <RiskDistRow label="Low Risk" count={lowRiskStudents} total={totalStudents} color="success" />
                            <RiskDistRow label="Medium Risk" count={mediumRiskStudents} total={totalStudents} color="warning" />
                            <RiskDistRow label="High Risk" count={highRiskStudents} total={totalStudents} color="danger" />
                        </div>
                    </DashboardCard>
                </div>
            </div>
        </main>
    );
}

function KPI_Card({ title, value, icon, trend, trendPositive, iconBg }: any) {
    return (
        <div className="bg-[#0F131E] border border-white/5 rounded-xl p-6 relative overflow-hidden group">
            {/* Hover Glow Effect */}
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${iconBg} opacity-20 blur-2xl group-hover:opacity-40 transition-opacity`}></div>

            <div className="flex justify-between items-start mb-4">
                <p className="text-gray-400 text-sm font-medium">{title}</p>
                <div className={`p-3 rounded-xl ${iconBg} border border-white/5`}>
                    {icon}
                </div>
            </div>

            <div className="space-y-2">
                <h3 className="text-3xl font-bold text-white">{value}</h3>
                <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${trendPositive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                    {trendPositive ? '↘' : '↗'} {trend}
                </div>
            </div>
        </div>
    )
}

function RiskDistRow({ label, count, total, color }: any) {
    const percentage = Math.round((count / total) * 100) || 0;
    return (
        <div>
            <div className="flex justify-between text-sm mb-2">
                <span className="text-white font-medium">{label}</span>
                <span className="text-white font-bold">{count}</span>
            </div>
            <ProgressBar value={percentage} variant={color} className="h-3 mb-2" />
            <div className="text-right text-xs text-gray-500">{percentage}% of total</div>
        </div>
    )
}
