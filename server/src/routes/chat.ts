import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getDB } from '../data/db';
import { calculateRisk } from '../risk/engine';
import { generateResponse } from '../services/gemini';
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
            (req as any).user = { studentId: decoded.uid }; // Chat is only for students
            return next();
        } catch (error) {
            return res.sendStatus(403);
        }
    }

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) return res.sendStatus(403);
        (req as any).user = user;
        next();
    });
};

const parseStudentJSON = (student: any) => {
    return {
        ...student,
        activityLogs: JSON.parse(student.activityLogs),
        assignments: JSON.parse(student.assignments),
        grades: JSON.parse(student.grades),
        redFlags: JSON.parse(student.redFlags)
    };
};

router.post('/message', authenticateToken, async (req: Request, res: Response): Promise<any> => {
    try {
        const { message } = req.body;
        const user = (req as any).user;
        const db = getDB();
        
        const rawStudent = await db.get('SELECT * FROM Students WHERE studentId = ?', [user.studentId]);

        if (!rawStudent) {
            return res.status(404).json({ error: "Student not found" });
        }

        const student = parseStudentJSON(rawStudent);
        const riskProfile = calculateRisk(student as any);

        const avgGrade = student.grades.length > 0
            ? Math.round(student.grades.reduce((a: number, b: number) => a + b, 0) / student.grades.length)
            : 0;

        const lastActivity = student.activityLogs.length > 0
            ? student.activityLogs.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date
            : "Unknown";

        const context = `
        Name: ${student.name}
        ID: ${student.studentId}
        Current Average Grade: ${avgGrade}%
        Engagement Score: ${riskProfile.engagementScore}/100
        Risk Level: ${riskProfile.riskLevel} (${riskProfile.riskScore}/100)
        Risk Factors: ${riskProfile.redFlags.join(", ")}
        Last Activity: ${lastActivity}
        `;

        const aiResponse = await generateResponse(message, context);

        res.json({ reply: aiResponse });

    } catch (error) {
        console.error("Chat Error:", error);
        res.status(500).json({ error: "Failed to generate response" });
    }
});

export default router;
