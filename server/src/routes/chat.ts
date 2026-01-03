import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { store } from '../data/store';
import { calculateRisk } from '../risk/engine';
import { generateResponse } from '../services/gemini';

const router = Router();
const JWT_SECRET = 'hackathon-secret-key-123';

// Middleware (duplicated from students.ts - in a real app this would be shared)
const authenticateToken = (req: Request, res: Response, next: NextFunction): any => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) return res.sendStatus(403);
        (req as any).user = user;
        next();
    });
};

router.post('/message', authenticateToken, async (req: Request, res: Response): Promise<any> => {
    try {
        const { message } = req.body;
        const user = (req as any).user;
        const student = store.getStudentById(user.studentId);

        if (!student) {
            return res.status(404).json({ error: "Student not found" });
        }

        const riskProfile = calculateRisk(student);

        // Calculate derived stats
        const avgGrade = student.grades.length > 0
            ? Math.round(student.grades.reduce((a, b) => a + b, 0) / student.grades.length)
            : 0;

        const lastActivity = student.activityLogs.length > 0
            ? student.activityLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date
            : "Unknown";

        // Construct a context summary for the AI
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
