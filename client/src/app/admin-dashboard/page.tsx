"use client";

import { useEffect, useState } from 'react';
import { useRouter } from "next/navigation";
import { LogOut, Users, CheckCircle, Hand, Mail, Send, AlertTriangle, RefreshCw, FileText } from 'lucide-react';

export default function AdminDashboard() {
    const router = useRouter();
    const [teacher, setTeacher] = useState<any>(null);
    const [classData, setClassData] = useState<any[]>([]);
    const [helpRequests, setHelpRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [messageTarget, setMessageTarget] = useState('ALL');
    const [messageBody, setMessageBody] = useState('');
    const [sendingMsg, setSendingMsg] = useState(false);

    const [reindexing, setReindexing] = useState(false);

    const handleReindex = async () => {
        setReindexing(true);
        try {
            const token = localStorage.getItem('token');
            await fetch('http://localhost:3001/api/report/reindex', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            alert('Re-indexing started! Check server logs. It will complete in 1-2 minutes.');
        } catch { alert('Failed to start re-indexing.'); }
        finally { setReindexing(false); }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push("/");
            return;
        }
        fetchDashboardData();
    }, [router]);

    const fetchDashboardData = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };

            const [teacherRes, classRes, helpRes] = await Promise.all([
                fetch('http://localhost:3001/api/students/teacher/me', { headers }),
                fetch('http://localhost:3001/api/students/class-marks', { headers }),
                fetch('http://localhost:3001/api/students/help-requests', { headers })
            ]);

            setTeacher(await teacherRes.json());
            setClassData(await classRes.json());
            setHelpRequests(await helpRes.json());
        } catch (error) {
            console.error('Failed to fetch dashboard data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push("/");
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageBody.trim()) return;

        setSendingMsg(true);
        try {
            const token = localStorage.getItem('token');
            await fetch('http://localhost:3001/api/students/notifications', {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ targetStudentId: messageTarget, message: messageBody })
            });
            alert('Message sent successfully!');
            setMessageBody('');
        } catch (error) {
            console.error(error);
            alert('Failed to send message.');
        } finally {
            setSendingMsg(false);
        }
    };

    if (loading) return <div className="p-8 text-white min-h-screen bg-[#0a0a0a]">Loading dashboard...</div>;

    const criticalAttendance = classData.filter(s => {
        if (!s.marks) return false;
        const percentage = (s.marks.attendance / 120) * 100;
        return percentage < 60;
    }).length;

    return (
        <main className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* Header */}
                <header className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-2xl font-bold shadow-lg shadow-orange-500/20">
                            {teacher?.name?.charAt(0) || 'G'}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                                Welcome, {teacher?.name}
                            </h1>
                            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-400">
                                <span className="px-3 py-1 rounded bg-white/5 border border-white/10">Class: {teacher?.department}</span>
                                <span className="px-3 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">Subject: {teacher?.subject}</span>
                                <span className="px-3 py-1 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Total Students: {classData.length}</span>
                                {criticalAttendance > 0 && (
                                    <span className="px-3 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1.5">
                                        <AlertTriangle size={14} /> Critical Attendance: {criticalAttendance}
                                    </span>
                                )}
                                <span className="px-3 py-1 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center gap-1.5">
                                    High Risk: {classData.filter(s => s.subjectRiskLevel === 'HIGH').length}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleReindex}
                            disabled={reindexing}
                            className="px-4 py-2.5 rounded-xl bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-all text-sm font-medium flex items-center gap-2 border border-purple-500/20 disabled:opacity-50"
                            title="Re-index course documents for Sathi RAG chatbot"
                        >
                            <RefreshCw size={16} className={reindexing ? 'animate-spin' : ''} />
                            {reindexing ? 'Re-indexing...' : 'Re-index Docs'}
                        </button>
                        <button onClick={handleLogout} className="px-5 py-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all text-sm font-medium flex items-center gap-2 border border-red-500/20">
                            <LogOut size={16} /> Logout
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Main Class List (2 Cols) */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <Users size={20} className="text-amber-400" /> Class Roster & Marks
                            </h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="text-gray-400 text-sm border-b border-white/10">
                                            <th className="pb-3 px-2 font-medium">Student</th>
                                            <th className="pb-3 px-2 font-medium">CA1</th>
                                            <th className="pb-3 px-2 font-medium">CA2</th>
                                            <th className="pb-3 px-2 font-medium">CA3</th>
                                            <th className="pb-3 px-2 font-medium">CA4</th>
                                            <th className="pb-3 px-2 font-medium">Classes Attended (Max 120)</th>
                                            <th className="pb-3 px-2 font-medium">Att %</th>
                                            <th className="pb-3 px-2 font-medium">Risk Score</th>
                                            <th className="pb-3 px-2 font-medium text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {classData.map((s) => (
                                            <StudentRow key={s.studentId} student={s} fetchDashboardData={fetchDashboardData} />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Raised Hands & Messaging */}
                    <div className="space-y-6">
                        
                        {/* Raised Hands Queue */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md max-h-[400px] overflow-y-auto">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <Hand size={20} className="text-indigo-400" /> Raised Hands Queue
                            </h2>
                            <div className="space-y-3">
                                {helpRequests.length === 0 ? (
                                    <p className="text-gray-500 text-sm text-center py-4">No pending requests.</p>
                                ) : (
                                    helpRequests.map((req) => (
                                        <div key={req.id} className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex flex-col gap-2">
                                            <div className="flex justify-between items-start">
                                                <span className="font-bold text-white text-sm">{req.name}</span>
                                                <span className="text-[10px] text-gray-500">{new Date(req.timestamp).toLocaleTimeString()}</span>
                                            </div>
                                            <p className="text-xs text-indigo-300">Requested a Google Meet / Help.</p>
                                            <a 
                                                href="https://meet.google.com/new" 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className="mt-2 text-center w-full py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-xs font-medium transition-colors"
                                            >
                                                Start Meet
                                            </a>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Messaging System */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <Mail size={20} className="text-green-400" /> Broadcast / Message
                            </h2>
                            <form onSubmit={handleSendMessage} className="space-y-4">
                                <div>
                                    <label className="text-xs text-gray-400 mb-1 block">To:</label>
                                    <select 
                                        value={messageTarget}
                                        onChange={(e) => setMessageTarget(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-green-500"
                                    >
                                        <option value="ALL">Entire Class (Broadcast)</option>
                                        {classData.map(s => (
                                            <option key={s.studentId} value={s.studentId}>{s.name} ({s.studentId})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 mb-1 block">Message:</label>
                                    <textarea 
                                        value={messageBody}
                                        onChange={(e) => setMessageBody(e.target.value)}
                                        rows={4}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-green-500 resize-none"
                                        placeholder="Type your message here..."
                                        required
                                    />
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={sendingMsg}
                                    className="w-full py-2.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                                >
                                    <Send size={16} /> {sendingMsg ? 'Sending...' : 'Send Message'}
                                </button>
                            </form>
                        </div>

                    </div>
                </div>
            </div>
        </main>
    );
}

function StudentRow({ student, fetchDashboardData }: { student: any; fetchDashboardData: () => void }) {
    const marks = student.marks || { ca1: 0, ca2: 0, ca3: 0, ca4: 0, attendance: 0 };
    
    const [ca1, setCa1] = useState(marks.ca1);
    const [ca2, setCa2] = useState(marks.ca2);
    const [ca3, setCa3] = useState(marks.ca3);
    const [ca4, setCa4] = useState(marks.ca4);
    const [attendance, setAttendance] = useState(marks.attendance);
    
    const [updating, setUpdating] = useState(false);

    const hasChanged = ca1 !== marks.ca1 || ca2 !== marks.ca2 || ca3 !== marks.ca3 || ca4 !== marks.ca4 || attendance !== marks.attendance;

    const handleUpdate = async () => {
        setUpdating(true);
        try {
            const token = localStorage.getItem('token');
            await fetch(`http://localhost:3001/api/students/${student.studentId}/marks`, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ca1: Number(ca1), ca2: Number(ca2), ca3: Number(ca3), ca4: Number(ca4), attendance: Number(attendance) })
            });
            fetchDashboardData();
        } catch (error) {
            console.error("Failed to update", error);
            alert("Failed to update marks.");
        } finally {
            setUpdating(false);
        }
    };

    const attendancePercentage = Math.round((Number(attendance) / 120) * 100);
    const isCritical = attendancePercentage < 60;

    return (
        <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
            <td className="py-4 px-2">
                <div className="font-bold text-white text-sm">{student.name}</div>
                <div className="text-xs text-gray-500">{student.studentId}</div>
            </td>
            <td className="py-4 px-2">
                <input type="number" min="0" max="100" value={ca1} onChange={(e) => setCa1(e.target.value)}
                    className="w-14 bg-black/40 border border-white/10 rounded px-2 py-1.5 text-white text-sm focus:outline-none focus:border-amber-500" />
            </td>
            <td className="py-4 px-2">
                <input type="number" min="0" max="100" value={ca2} onChange={(e) => setCa2(e.target.value)}
                    className="w-14 bg-black/40 border border-white/10 rounded px-2 py-1.5 text-white text-sm focus:outline-none focus:border-amber-500" />
            </td>
            <td className="py-4 px-2">
                <input type="number" min="0" max="100" value={ca3} onChange={(e) => setCa3(e.target.value)}
                    className="w-14 bg-black/40 border border-white/10 rounded px-2 py-1.5 text-white text-sm focus:outline-none focus:border-amber-500" />
            </td>
            <td className="py-4 px-2">
                <input type="number" min="0" max="100" value={ca4} onChange={(e) => setCa4(e.target.value)}
                    className="w-14 bg-black/40 border border-white/10 rounded px-2 py-1.5 text-white text-sm focus:outline-none focus:border-amber-500" />
            </td>
            <td className="py-4 px-2 relative">
                <input type="number" min="0" max="120" value={attendance} onChange={(e) => setAttendance(e.target.value)}
                    className={`w-16 bg-black/40 border ${isCritical ? 'border-red-500 text-red-400' : 'border-white/10 text-white'} rounded px-2 py-1.5 text-sm focus:outline-none focus:border-amber-500`} />
                {isCritical && <AlertTriangle size={14} className="absolute top-1/2 -translate-y-1/2 -right-1 text-red-500" />}
            </td>
            <td className="py-4 px-2 font-bold text-sm">
                <span className={isCritical ? 'text-red-400' : 'text-green-400'}>
                    {Math.round((Number(attendance) / 120) * 100)}%
                </span>
            </td>
            <td className="py-4 px-2">
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                    student.subjectRiskLevel === 'HIGH' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                    student.subjectRiskLevel === 'MEDIUM' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                    'bg-green-500/20 text-green-400 border border-green-500/30'
                }`}>
                    {student.subjectRiskScore || 0}
                </span>
            </td>
            <td className="py-4 px-2 text-right">
                <button 
                    onClick={handleUpdate}
                    disabled={updating || !hasChanged}
                    className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                >
                    {updating ? 'Saving...' : 'Save'}
                </button>
            </td>
        </tr>
    );
}
