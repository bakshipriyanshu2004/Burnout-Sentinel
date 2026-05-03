import { ActivityLog, Assignment, RiskLevel, GradeTrend } from '../types';

export const DEPARTMENTS = ['CSE', 'CSD', 'EE', 'ME', 'CE', 'DS', 'CS', 'ECE'];

export interface IStudent {
    studentId: string;
    name: string;
    email: string;
    dob: string;
    department: string;
    activityLogs: ActivityLog[];
    assignments: Assignment[];
    grades: number[];
    riskScore: number;
    riskLevel: string;
    gradeTrend: string;
    engagementScore: number;
    redFlags: string[];
}

export interface ITeacher {
    teacherId: string;
    name: string;
    department: string;
    passwordHash: string;
}
