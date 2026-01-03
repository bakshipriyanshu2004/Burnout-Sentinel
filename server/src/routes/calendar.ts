import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { googleService } from '../services/google';
import { store } from '../data/store';

const router = Router();
const JWT_SECRET = 'hackathon-secret-key-123';

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

// POST /api/calendar/meet
// Triggered by Admin or System for "Instant Counseling"
router.post('/meet', async (req: Request, res: Response) => {
    try {
        const { studentId } = req.body;
        // In real app: verify admin permissions

        const student = store.getStudentById(studentId);
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

// POST /api/calendar/focus
// Triggered by Student (via Sathi Chat) for "Focus Block"
router.post('/focus', authenticateToken, async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const student = store.getStudentById(user.studentId);

        // Default to starting in 10 mins, for 45 mins
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
