export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type GradeTrend = 'Improving' | 'Stable' | 'Declining';

export interface ActivityLog {
    date: string; // ISO date
    loginCount: number;
    videoWatchMinutes: number;
    forumPosts: number;
}

export interface Assignment {
    id: string;
    title: string;
    dueDate: string;
    submittedDate: string | null;
    grade: number | null; // 0-100
}

export interface Student {
    studentId: string;
    name: string;
    email: string;
    activityLogs: ActivityLog[];
    assignments: Assignment[];
    grades: number[]; // Historical grades
    riskScore: number;
    riskLevel: RiskLevel;
    gradeTrend: GradeTrend;
    engagementScore: number; // 0-100
    redFlags: string[];
}
