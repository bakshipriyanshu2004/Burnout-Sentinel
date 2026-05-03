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
import { LogOut, Bell, Hand, AlertTriangle, User, Calendar, Mail } from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

const SUBJECTS = [
    'Games & App Design',
    'AIML',
    'Data Vizualization',
    'Design Process and Perspective',
    'Robotics',
    'Research Methodology'
];

export default function StudentDashboard() {
    const router = useRouter();

    const [student, setStudent] = useState<any>(null);
    const [marks, setMarks] = useState<any[]>([]);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0]);
    const [raisingHand, setRaisingHand] = useState(false);

    useEffect(() => {
        const fetchStudentData = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push("/");
                return;
            }

            try {
                // Fetch student profile
                const resStudent = await fetch('http://localhost:3001/api/student/me', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!resStudent.ok) throw new Error("Unauthorized");
                const studentData = await resStudent.json();
                setStudent(studentData);

                // Fetch marks
                const resMarks = await fetch('http://localhost:3001/api/student/me/marks', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const marksData = await resMarks.json();
                setMarks(marksData);

                // Fetch notifications
                const resNotifs = await fetch('http://localhost:3001/api/student/me/notifications', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const notifData = await resNotifs.json();
                setNotifications(notifData);

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

    const handleRaiseHand = async () => {
        const token = localStorage.getItem('token');
        setRaisingHand(true);
        try {
            await fetch('http://localhost:3001/api/student/help-requests', {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ subjectName: selectedSubject })
            });
            alert('Request sent! The teacher will be notified.');
        } catch (error) {
            console.error(error);
            alert('Failed to send request');
        } finally {
            setRaisingHand(false);
        }
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <div className="h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </main>
        );
    }

    if (!student) return null;

    // Derived State for Selected Subject
    const currentSubjectMarks = marks.find(m => m.subjectName === selectedSubject);

    const chartData = {
        labels: ['CA 1', 'CA 2', 'CA 3', 'CA 4'],
        datasets: [
            {
                label: 'Marks',
                data: currentSubjectMarks ? [currentSubjectMarks.ca1, currentSubjectMarks.ca2, currentSubjectMarks.ca3, currentSubjectMarks.ca4] : [0,0,0,0],
                fill: true,
                borderColor: '#8b5cf6', // Violet
                backgroundColor: 'rgba(139, 92, 246, 0.2)',
                tension: 0.4,
                pointBackgroundColor: '#8b5cf6',
                pointHoverRadius: 6,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: { grid: { color: 'rgba(255,255,255,0.05)' }, min: 0, max: 100, ticks: { color: '#9ca3af' } },
            x: { grid: { display: false }, ticks: { color: '#9ca3af' } }
        },
        plugins: { legend: { display: false } }
    };

    return (
        <main className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8 font-sans overflow-x-hidden">
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* Modern Header */}
                <header className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl font-bold shadow-lg shadow-indigo-500/20">
                            {student.name.charAt(0)}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                                {student.name}
                            </h1>
                            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-400">
                                <span className="flex items-center gap-1.5"><User size={14} /> {student.studentId}</span>
                                <span className="flex items-center gap-1.5"><Mail size={14} /> {student.email}</span>
                                <span className="flex items-center gap-1.5"><Calendar size={14} /> {student.dob}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="px-5 py-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all text-sm font-medium flex items-center gap-2 border border-red-500/20">
                        <LogOut size={16} /> Logout
                    </button>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left Column: Academic Tracking */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* Subject Selector */}
                        <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-hide">
                            {SUBJECTS.map(sub => (
                                <button
                                    key={sub}
                                    onClick={() => setSelectedSubject(sub)}
                                    className={`relative whitespace-nowrap px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                                        selectedSubject === sub 
                                        ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 border-transparent' 
                                        : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                                    }`}
                                >
                                    {sub}
                                    {marks.find(m => m.subjectName === sub)?.riskLevel === 'HIGH' && (
                                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Chart & Subject Details */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-4">
                                    <h2 className="text-xl font-bold text-white">{selectedSubject} Performance</h2>
                                    {currentSubjectMarks && (
                                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                                            currentSubjectMarks.riskLevel === 'HIGH' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                            currentSubjectMarks.riskLevel === 'MEDIUM' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                                            'bg-green-500/20 text-green-400 border border-green-500/30'
                                        }`}>
                                            Danger Score: {currentSubjectMarks.riskScore}
                                        </span>
                                    )}
                                </div>
                                <button 
                                    onClick={handleRaiseHand}
                                    disabled={raisingHand}
                                    className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg transition-all text-sm font-medium disabled:opacity-50"
                                >
                                    <Hand size={16} /> {raisingHand ? 'Requesting...' : 'Raise Hand / Meet'}
                                </button>
                            </div>
                            
                            {/* Attendance Alert */}
                            {currentSubjectMarks && (currentSubjectMarks.attendance / 120 * 100) < 60 && (
                                <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
                                    <AlertTriangle className="text-red-500 mt-0.5" size={18} />
                                    <div>
                                        <h4 className="text-red-400 font-bold text-sm">Critical Attendance Warning</h4>
                                        <p className="text-red-300/80 text-sm mt-1">Your attendance for this subject is {Math.round(currentSubjectMarks.attendance / 120 * 100)}%. It is strictly below the 60% requirement.</p>
                                    </div>
                                </div>
                            )}

                            {/* High Risk Alert */}
                            {currentSubjectMarks && currentSubjectMarks.riskLevel === 'HIGH' && (
                                <div className="mb-6 p-4 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-start gap-3">
                                    <AlertTriangle className="text-orange-500 mt-0.5" size={18} />
                                    <div>
                                        <h4 className="text-orange-400 font-bold text-sm">High Academic Risk Detected</h4>
                                        <p className="text-orange-300/80 text-sm mt-1">Your Danger Score indicates you are struggling in this subject. Please use the "Raise Hand" feature to reach out to your teacher.</p>
                                    </div>
                                </div>
                            )}

                            <div className="h-[300px] w-full">
                                <Line data={chartData} options={chartOptions} />
                            </div>

                            {/* CA Blocks */}
                            <div className="grid grid-cols-5 gap-4 mt-6">
                                {[1, 2, 3, 4].map(ca => (
                                    <div key={ca} className="p-4 rounded-xl bg-black/40 border border-white/5 text-center">
                                        <div className="text-xs text-gray-500 font-medium mb-1">CA {ca}</div>
                                        <div className="text-xl font-bold text-white">
                                            {currentSubjectMarks ? currentSubjectMarks[`ca${ca}`] : '-'}
                                        </div>
                                    </div>
                                ))}
                                <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-center flex flex-col justify-center">
                                    <div className="text-xs text-indigo-400 font-medium mb-1">Classes Attended</div>
                                    <div className="text-xl font-bold text-white">
                                        {currentSubjectMarks ? currentSubjectMarks.attendance : '-'} / 120
                                    </div>
                                    <div className="text-[10px] text-indigo-300 mt-1">
                                        ({currentSubjectMarks ? Math.round(currentSubjectMarks.attendance / 120 * 100) : '-'}%)
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Right Column: Notifications */}
                    <div className="space-y-6">
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md h-[calc(100vh-140px)] overflow-y-auto">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <Bell size={20} className="text-indigo-400" /> Notifications
                            </h2>
                            <div className="space-y-4">
                                {notifications.length === 0 ? (
                                    <p className="text-gray-500 text-sm text-center py-8">No notifications yet.</p>
                                ) : (
                                    notifications.map((notif: any) => (
                                        <div key={notif.id} className="p-5 rounded-xl bg-gradient-to-br from-black/60 to-black/40 border border-white/10 relative group shadow-lg">
                                            {notif.studentId === 'ALL' && (
                                                <span className="absolute top-4 right-4 text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase tracking-wider font-bold">
                                                    Broadcast
                                                </span>
                                            )}
                                            <div className="flex items-center gap-3 mb-3 border-b border-white/5 pb-3">
                                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-lg font-bold text-white shadow-md shadow-indigo-500/20">
                                                    {notif.teacherName?.charAt(0) || 'G'}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold text-white tracking-wide">{notif.teacherName || 'Guru'}</p>
                                                    <p className="text-xs font-medium text-indigo-400">{notif.teacherSubject || 'Department'}</p>
                                                </div>
                                            </div>
                                            <p className="text-gray-200 text-[15px] leading-relaxed bg-white/5 p-4 rounded-lg border border-white/5 shadow-inner">
                                                {notif.message}
                                            </p>
                                            <p className="text-xs font-medium text-gray-500 mt-3 text-right">
                                                {new Date(notif.timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </main>
    );
}
