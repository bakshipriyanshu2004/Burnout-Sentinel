import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { googleService } from '../services/google';
import { getDB } from '../data/db';

const router = Router();
const JWT_SECRET = 'hackathon-secret-key-123';

import { verifyFirebaseToken, isFirebaseEnabled } from '../firebaseAuth';

const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    if (isFirebaseEnabled && token.length > 500) {
        try {
            const decoded = await verifyFirebaseToken(token);
            (req as any).user = { studentId: decoded.uid };
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

router.post('/meet', async (req: Request, res: Response) => {
    try {
        const { studentId } = req.body;
        const db = getDB();
        const student = await db.get('SELECT * FROM Students WHERE studentId = ?', [studentId]);
        const name = student ? student.name : "Student";

        const meetLink = await googleService.createMeetLink(name);

        res.json({
            success: true,
            meetLink,
            message: `Counseling session created for ${name}`
        });
    } catch (error) {
        console.error("Meet API Error:", error);
        res.status(500).json({ error: "Failed to create meeting" });
    }
});

router.post('/focus', authenticateToken, async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const db = getDB();
        const student = await db.get('SELECT * FROM Students WHERE studentId = ?', [user.studentId]);

        const startTime = new Date();
        startTime.setMinutes(startTime.getMinutes() + 10);

        const event = await googleService.scheduleFocusBlock(student?.email || "unknown", startTime, 45);

        res.json({
            success: true,
            event,
            message: "Focus block added to your Google Calendar!"
        });
    } catch (error) {
        console.error("Calendar API Error:", error);
        res.status(500).json({ error: "Failed to schedule focus block" });
    }
});

export default router;
