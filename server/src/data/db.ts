import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

let dbInstance: Database | null = null;

export const connectDB = async (): Promise<Database> => {
    if (dbInstance) return dbInstance;

    dbInstance = await open({
        filename: path.join(__dirname, '../../database.sqlite'),
        driver: sqlite3.Database
    });

    await dbInstance.exec(`
        CREATE TABLE IF NOT EXISTS Teachers (
            teacherId TEXT PRIMARY KEY,
            name TEXT,
            department TEXT,
            subject TEXT,
            passwordHash TEXT
        );

        CREATE TABLE IF NOT EXISTS Students (
            studentId TEXT PRIMARY KEY,
            name TEXT,
            email TEXT,
            dob TEXT,
            department TEXT,
            activityLogs TEXT, -- JSON
            assignments TEXT, -- JSON
            grades TEXT, -- JSON
            riskScore INTEGER,
            riskLevel TEXT,
            gradeTrend TEXT,
            engagementScore INTEGER,
            attendancePercentage INTEGER,
            redFlags TEXT -- JSON
        );

        CREATE TABLE IF NOT EXISTS SubjectMarks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            studentId TEXT,
            subjectName TEXT,
            ca1 INTEGER,
            ca2 INTEGER,
            ca3 INTEGER,
            ca4 INTEGER,
            attendance INTEGER,
            UNIQUE(studentId, subjectName)
        );

        CREATE TABLE IF NOT EXISTS HelpRequests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            studentId TEXT,
            subjectName TEXT,
            status TEXT, -- 'Pending', 'Resolved'
            timestamp TEXT
        );

        CREATE TABLE IF NOT EXISTS Notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            teacherId TEXT,
            studentId TEXT, -- 'ALL' or specific ID
            message TEXT,
            isRead INTEGER DEFAULT 0, -- 0 or 1
            timestamp TEXT
        );
    `);

    return dbInstance;
};

export const getDB = (): Database => {
    if (!dbInstance) throw new Error("Database not initialized");
    return dbInstance;
};
