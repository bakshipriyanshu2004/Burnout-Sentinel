import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getDB } from '../data/db';
import { calculateRisk } from '../risk/engine';
import { generateRAGResponse } from '../services/gemini';
import { retrieveContext } from '../services/ragService';
import { verifyFirebaseToken, isFirebaseEnabled } from '../firebaseAuth';

const router = Router();
const JWT_SECRET = 'hackathon-secret-key-123';

const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    if (isFirebaseEnabled && token.length > 500) {
        try {
            const decoded = await verifyFirebaseToken(token);
            (req as any).user = { studentId: decoded.uid };
            return next();
        } catch {
            return res.sendStatus(403);
        }
    }

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) return res.sendStatus(403);
        (req as any).user = user;
        next();
    });
};

const parseStudentJSON = (student: any) => ({
    ...student,
    activityLogs: JSON.parse(student.activityLogs),
    assignments: JSON.parse(student.assignments),
    grades: JSON.parse(student.grades),
    redFlags: JSON.parse(student.redFlags)
});

router.post('/message', authenticateToken, async (req: Request, res: Response): Promise<any> => {
    try {
        const { message } = req.body;
        const user = (req as any).user;
        const db = getDB();

        const rawStudent = await db.get('SELECT * FROM Students WHERE studentId = ?', [user.studentId]);
        if (!rawStudent) return res.status(404).json({ error: "Student not found" });

        const student = parseStudentJSON(rawStudent);
        const riskProfile = calculateRisk(student as any);

        const avgGrade = student.grades.length > 0
            ? Math.round(student.grades.reduce((a: number, b: number) => a + b, 0) / student.grades.length)
            : 0;

        const studentContext = `
Name: ${student.name}
Student ID: ${student.studentId}
Average Grade: ${avgGrade}%
Risk Level: ${riskProfile.riskLevel} (Score: ${riskProfile.riskScore}/100)
Engagement Score: ${riskProfile.engagementScore}/100
Risk Factors: ${riskProfile.redFlags.join(", ") || "None"}
        `.trim();

        // RAG: retrieve relevant document chunks for the student's question
        const retrievedContext = await retrieveContext(message, 4);

        // Generate grounded response
        const reply = await generateRAGResponse(message, retrievedContext, studentContext);

        res.json({ reply, hasDocContext: retrievedContext.length > 0 });

    } catch (error) {
        console.error("Chat Error:", error);
        res.status(500).json({ error: "Failed to generate response" });
    }
});

export default router;
