import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { store } from '../data/store';
import { calculateRisk } from '../risk/engine';

const router = Router();
const JWT_SECRET = 'hackathon-secret-key-123';

// Middleware to verify token
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

// GET /api/students (Admin only - returns all students with risk data)
router.get('/', (req: Request, res: Response) => {
    // Ideally check for admin role here
    const students = store.getAllStudents();

    // Augment with realtime risk calculation
    const studentsWithRisk = students.map(s => {
        const riskProfile = calculateRisk(s);
        return { ...s, ...riskProfile };
    });

    res.json(studentsWithRisk);
});

// GET /api/student/me (Student portal)
router.get('/me', authenticateToken, (req: Request, res: Response): any => {
    const user = (req as any).user;
    const student = store.getStudentById(user.studentId);

    if (!student) return res.status(404).json({ error: 'Student not found' });

    const riskProfile = calculateRisk(student);
    res.json({ ...student, ...riskProfile });
});

// POST /api/student/assignments (Simulate upload)
router.post('/assignments', authenticateToken, (req: Request, res: Response) => {
    const { assignmentId } = req.body;
    // In a real app, update the store. For MVP, just acknowledge.
    // We can update the in-memory store to mark it as submitted if we want to be fancy.
    res.json({ message: 'Assignment submitted successfully' });
});

export default router;
