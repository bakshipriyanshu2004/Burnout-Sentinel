"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Line, Bar, Radar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    RadialLinearScale,
    Title,
    Tooltip,
    Legend,
    Filler,
} from "chart.js";
import { LogOut, Bell, Hand, AlertTriangle, User, Calendar, Mail, Sparkles, Trophy, Quote, Download } from "lucide-react";
import { SathiChat } from "@/components/SathiChat";

ChartJS.register(
    CategoryScale, LinearScale, PointElement, LineElement,
    BarElement, RadialLinearScale, Title, Tooltip, Legend, Filler
);

const SUBJECTS = [
    'Games & App Design',
    'AIML',
    'Data Vizualization',
    'Design Process and Perspective',
    'Robotics',
    'Research Methodology'
];

const SUBJECT_COLORS = [
    'rgba(139, 92, 246, 0.85)',
    'rgba(59, 130, 246, 0.85)',
    'rgba(16, 185, 129, 0.85)',
    'rgba(245, 158, 11, 0.85)',
    'rgba(239, 68, 68, 0.85)',
    'rgba(236, 72, 153, 0.85)',
];

const MOTIVATIONAL_QUOTES = [
    { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
    { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
    { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
    { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
    { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
    { text: "The beautiful thing about learning is nobody can take it away from you.", author: "B.B. King" },
    { text: "Push yourself, because no one else is going to do it for you.", author: "Anonymous" },
    { text: "Great things never come from comfort zones.", author: "Anonymous" },
    { text: "Dream it. Wish it. Do it.", author: "Anonymous" },
    { text: "Success doesn't just find you. You have to go out and get it.", author: "Anonymous" },
    { text: "The harder you work for something, the greater you'll feel when you achieve it.", author: "Anonymous" },
    { text: "Don't stop when you're tired. Stop when you're done.", author: "Anonymous" },
    { text: "Wake up with determination. Go to bed with satisfaction.", author: "Anonymous" },
    { text: "Do something today that your future self will thank you for.", author: "Sean Patrick Flanery" },
    { text: "Little things make big days.", author: "Anonymous" },
    { text: "It's going to be hard, but hard does not mean impossible.", author: "Anonymous" },
    { text: "Don't wait for opportunity. Create it.", author: "Anonymous" },
    { text: "Sometimes we're tested not to show our weaknesses, but to discover our strengths.", author: "Anonymous" },
    { text: "The key to success is to focus on goals, not obstacles.", author: "Anonymous" },
    { text: "Dream bigger. Do bigger.", author: "Anonymous" },
    { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
    { text: "In the middle of every difficulty lies opportunity.", author: "Albert Einstein" },
    { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
    { text: "Challenges are what make life interesting and overcoming them is what makes life meaningful.", author: "Joshua J. Marine" },
    { text: "A person who never made a mistake never tried anything new.", author: "Albert Einstein" },
    { text: "Strive for progress, not perfection.", author: "Anonymous" },
    { text: "Your limitation—it's only your imagination.", author: "Anonymous" },
    { text: "Sometimes later becomes never. Do it now.", author: "Anonymous" },
    { text: "Great minds discuss ideas; average minds discuss events; small minds discuss people.", author: "Eleanor Roosevelt" },
    { text: "Learning is not attained by chance, it must be sought for with ardor and attended with diligence.", author: "Abigail Adams" },
    { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
    { text: "Success is no accident. It is hard work, perseverance, learning, studying, sacrifice.", author: "Pelé" },
    { text: "The more that you read, the more things you will know.", author: "Dr. Seuss" },
    { text: "You are braver than you believe, stronger than you seem, and smarter than you think.", author: "A.A. Milne" },
    { text: "What you get by achieving your goals is not as important as what you become by achieving them.", author: "Henry David Thoreau" },
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
    { text: "Knowledge is power.", author: "Francis Bacon" },
    { text: "Curiosity is the engine of achievement.", author: "Ken Robinson" },
    { text: "The more I read, the more I acquire, the more certain I am that I know nothing.", author: "Voltaire" },
    { text: "All progress takes place outside the comfort zone.", author: "Michael John Bobak" },
    { text: "Successful people do what unsuccessful people are not willing to do.", author: "Jeff Olson" },
    { text: "The only place where success comes before work is in the dictionary.", author: "Vidal Sassoon" },
    { text: "Fall seven times, stand up eight.", author: "Japanese Proverb" },
    { text: "I find that the harder I work, the more luck I seem to have.", author: "Thomas Jefferson" },
    { text: "There are no shortcuts to any place worth going.", author: "Beverly Sills" },
    { text: "The secret to getting ahead is getting started.", author: "Agatha Christie" },
    { text: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky" },
    { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
    { text: "Our greatest weakness lies in giving up. The most certain way to succeed is always to try just one more time.", author: "Thomas Edison" },
];

export default function StudentDashboard() {
    const router = useRouter();
    const [student, setStudent] = useState<any>(null);
    const [marks, setMarks] = useState<any[]>([]);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0]);
    const [raisingHand, setRaisingHand] = useState(false);
    const [sathiOpen, setSathiOpen] = useState(false);
    const [bellOpen, setBellOpen] = useState(false);
    const bellRef = useRef<HTMLDivElement>(null);

    // Close bell dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
                setBellOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Pick a random quote once per session
    const quote = useMemo(() => MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)], []);

    useEffect(() => {
        const fetchStudentData = async () => {
            const token = localStorage.getItem('token');
            if (!token) { router.push("/"); return; }

            try {
                const resStudent = await fetch('http://localhost:3001/api/student/me', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!resStudent.ok) throw new Error("Unauthorized");
                setStudent(await resStudent.json());

                const resMarks = await fetch('http://localhost:3001/api/student/me/marks', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setMarks(await resMarks.json());

                const resNotifs = await fetch('http://localhost:3001/api/student/me/notifications', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setNotifications(await resNotifs.json());

            } catch (error) {
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
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ subjectName: selectedSubject })
            });
            alert('Request sent! The teacher will be notified.');
        } catch { alert('Failed to send request'); }
        finally { setRaisingHand(false); }
    };

    if (loading) return (
        <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
            <div className="h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </main>
    );
    if (!student) return null;

    const currentSubjectMarks = marks.find(m => m.subjectName === selectedSubject);

    // --- Compute subject averages for charts ---
    const subjectAverages = SUBJECTS.map(sub => {
        const m = marks.find(x => x.subjectName === sub);
        if (!m) return 0;
        return Math.round((m.ca1 + m.ca2 + m.ca3 + m.ca4) / 4);
    });

    const bestIdx = subjectAverages.indexOf(Math.max(...subjectAverages));
    const bestSubject = SUBJECTS[bestIdx];
    const bestScore = subjectAverages[bestIdx];

    // Radar chart
    const radarData = {
        labels: SUBJECTS.map(s => s.length > 12 ? s.slice(0, 12) + '…' : s),
        datasets: [{
            label: 'Avg Score',
            data: subjectAverages,
            backgroundColor: 'rgba(139, 92, 246, 0.2)',
            borderColor: '#8b5cf6',
            borderWidth: 2,
            pointBackgroundColor: subjectAverages.map((_, i) => i === bestIdx ? '#facc15' : '#8b5cf6'),
            pointRadius: subjectAverages.map((_, i) => i === bestIdx ? 7 : 4),
        }]
    };

    const radarOptions: any = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            r: {
                min: 0, max: 100,
                grid: { color: 'rgba(255,255,255,0.08)' },
                angleLines: { color: 'rgba(255,255,255,0.08)' },
                pointLabels: { color: '#9ca3af', font: { size: 11 } },
                ticks: { display: false, stepSize: 25 },
            }
        },
        plugins: { legend: { display: false } }
    };

    // Bar chart (all subjects)
    const barData = {
        labels: SUBJECTS.map(s => s.length > 10 ? s.slice(0, 10) + '…' : s),
        datasets: [{
            label: 'Avg Marks',
            data: subjectAverages,
            backgroundColor: subjectAverages.map((_, i) =>
                i === bestIdx ? 'rgba(250, 204, 21, 0.85)' : SUBJECT_COLORS[i]
            ),
            borderColor: subjectAverages.map((_, i) =>
                i === bestIdx ? '#facc15' : SUBJECT_COLORS[i]
            ),
            borderWidth: 2,
            borderRadius: 8,
        }]
    };

    const barOptions: any = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: { grid: { color: 'rgba(255,255,255,0.05)' }, min: 0, max: 100, ticks: { color: '#9ca3af' } },
            x: { grid: { display: false }, ticks: { color: '#9ca3af', font: { size: 10 } } }
        },
        plugins: { legend: { display: false } }
    };

    // Line chart (selected subject CAs)
    const chartData = {
        labels: ['CA 1', 'CA 2', 'CA 3', 'CA 4'],
        datasets: [{
            label: 'Marks',
            data: currentSubjectMarks ? [currentSubjectMarks.ca1, currentSubjectMarks.ca2, currentSubjectMarks.ca3, currentSubjectMarks.ca4] : [0, 0, 0, 0],
            fill: true,
            borderColor: '#8b5cf6',
            backgroundColor: 'rgba(139, 92, 246, 0.2)',
            tension: 0.4,
            pointBackgroundColor: '#8b5cf6',
            pointHoverRadius: 6,
        }]
    };

    const chartOptions: any = {
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

                {/* Header */}
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
                    <div className="flex items-center gap-3">
                        {/* Download Report Card */}
                        <button
                            onClick={async () => {
                                const token = localStorage.getItem('token');
                                const res = await fetch('http://localhost:3001/api/report/student/me', {
                                    headers: { 'Authorization': `Bearer ${token}` }
                                });
                                if (!res.ok) { alert('Failed to generate report.'); return; }
                                const blob = await res.blob();
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `ReportCard_${student.studentId}.pdf`;
                                a.click();
                                URL.revokeObjectURL(url);
                            }}
                            className="px-4 py-2.5 rounded-xl bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-all text-sm font-medium flex items-center gap-2 border border-green-500/20"
                        >
                            <Download size={16} /> Report Card
                        </button>

                        {/* Sathi Assistant Button */}
                        <button
                            onClick={() => setSathiOpen(true)}
                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600/20 to-indigo-600/20 text-indigo-300 hover:from-blue-600/30 hover:to-indigo-600/30 transition-all text-sm font-medium flex items-center gap-2 border border-indigo-500/30 shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/25"
                        >
                            <Sparkles size={16} className="text-indigo-400" />
                            Sathi Assistant
                        </button>

                        {/* Bell Notification Button */}
                        <div className="relative" ref={bellRef}>
                            <button
                                onClick={() => setBellOpen(prev => !prev)}
                                className="relative p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-all"
                            >
                                <Bell size={20} />
                                {notifications.length > 0 && (
                                    <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                                    </span>
                                )}
                            </button>

                            {/* Notification Dropdown */}
                            {bellOpen && (
                                <div className="absolute right-0 top-12 z-[100] w-[380px] max-h-[500px] overflow-y-auto bg-[#0d1117] border border-white/15 rounded-2xl shadow-2xl shadow-black isolate">
                                    <div className="sticky top-0 bg-[#0d1117] border-b border-white/10 px-5 py-4 flex items-center justify-between">
                                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                            <Bell size={16} className="text-indigo-400" /> Notifications
                                        </h3>
                                        <span className="text-xs text-gray-500">{notifications.length} message{notifications.length !== 1 ? 's' : ''}</span>
                                    </div>
                                    <div className="p-3 space-y-3">
                                        {notifications.length === 0 ? (
                                            <p className="text-gray-500 text-sm text-center py-10">No notifications yet.</p>
                                        ) : (
                                            notifications.map((notif: any) => (
                                                <div key={notif.id} className="p-4 rounded-xl bg-[#161b27] border border-white/10 relative">
                                                    {notif.studentId === 'ALL' && (
                                                        <span className="absolute top-3 right-3 text-[9px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase tracking-wider font-bold">Broadcast</span>
                                                    )}
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white shrink-0">
                                                            {notif.teacherName?.charAt(0) || 'G'}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-white leading-tight">{notif.teacherName || 'Guru'}</p>
                                                            <p className="text-xs text-indigo-400">{notif.teacherSubject || 'Department'}</p>
                                                        </div>
                                                    </div>
                                                    <p className="text-gray-300 text-sm leading-relaxed">{notif.message}</p>
                                                    <p className="text-xs text-gray-500 mt-2 text-right">
                                                        {new Date(notif.timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                                                    </p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <button onClick={handleLogout} className="px-5 py-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all text-sm font-medium flex items-center gap-2 border border-red-500/20">
                            <LogOut size={16} /> Logout
                        </button>
                    </div>
                </header>

                {/* Motivational Quote Banner */}
                <div className="relative bg-gradient-to-r from-indigo-900/30 via-purple-900/20 to-indigo-900/30 border border-indigo-500/20 rounded-2xl p-6 overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(139,92,246,0.12),_transparent_60%)]" />
                    <div className="relative flex items-start gap-4">
                        <Quote size={32} className="text-indigo-400/60 shrink-0 mt-1" />
                        <div>
                            <p className="text-white/90 text-lg font-medium italic leading-relaxed">"{quote.text}"</p>
                            <p className="text-indigo-400 text-sm mt-2 font-medium">— {quote.author}</p>
                        </div>
                    </div>
                </div>

                {/* Best Subject Highlight */}
                <div className="bg-gradient-to-r from-yellow-900/20 via-amber-900/10 to-yellow-900/20 border border-yellow-500/20 rounded-2xl p-5 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-yellow-500/20 flex items-center justify-center shrink-0">
                        <Trophy size={24} className="text-yellow-400" />
                    </div>
                    <div>
                        <p className="text-yellow-400 text-xs font-bold uppercase tracking-widest mb-0.5">Your Best Subject</p>
                        <p className="text-white text-xl font-bold">{bestSubject}</p>
                        <p className="text-yellow-300/70 text-sm">Average score: <span className="text-yellow-300 font-bold">{bestScore}/100</span> — Keep it up! 🎯</p>
                    </div>
                </div>

                {/* Subject Performance Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Radar Chart */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
                        <h2 className="text-lg font-bold text-white mb-1">Subject Strengths</h2>
                        <p className="text-gray-500 text-xs mb-5">Radar view across all subjects — your best subject glows gold.</p>
                        <div className="h-[280px]">
                            <Radar data={radarData} options={radarOptions} />
                        </div>
                    </div>

                    {/* Bar Chart */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
                        <h2 className="text-lg font-bold text-white mb-1">Score Comparison</h2>
                        <p className="text-gray-500 text-xs mb-5">Average CA marks per subject. Gold bar = your best subject.</p>
                        <div className="h-[280px]">
                            <Bar data={barData} options={barOptions} />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-8">

                    {/* Academic Tracking — full width */}
                    <div className="space-y-6">

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

                            {currentSubjectMarks && (currentSubjectMarks.attendance / 120 * 100) < 60 && (
                                <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
                                    <AlertTriangle className="text-red-500 mt-0.5" size={18} />
                                    <div>
                                        <h4 className="text-red-400 font-bold text-sm">Critical Attendance Warning</h4>
                                        <p className="text-red-300/80 text-sm mt-1">Your attendance for this subject is {Math.round(currentSubjectMarks.attendance / 120 * 100)}%. Strictly below the 60% requirement.</p>
                                    </div>
                                </div>
                            )}

                            {currentSubjectMarks && currentSubjectMarks.riskLevel === 'HIGH' && (
                                <div className="mb-6 p-4 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-start gap-3">
                                    <AlertTriangle className="text-orange-500 mt-0.5" size={18} />
                                    <div>
                                        <h4 className="text-orange-400 font-bold text-sm">High Academic Risk Detected</h4>
                                        <p className="text-orange-300/80 text-sm mt-1">Your Danger Score indicates struggle in this subject. Use "Raise Hand" to reach out to your teacher.</p>
                                    </div>
                                </div>
                            )}

                            <div className="h-[300px] w-full">
                                <Line data={chartData} options={chartOptions} />
                            </div>

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



                </div>
            </div>

            {/* Sathi Chat Panel — controlled by header button */}
            <SathiChat isOpen={sathiOpen} onClose={() => setSathiOpen(false)} />
        </main>
    );
}
