import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { store } from '../data/store';

const router = Router();
const JWT_SECRET = 'hackathon-secret-key-123'; // Hardcoded for MVP

// POST /api/auth/login
router.post('/login', (req: Request, res: Response): any => {
    const { studentId, email } = req.body;

    // Simple auth: Check if student exists matching ID and Email
    const student = store.getStudentById(studentId);

    if (!student || student.email !== email) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate Token
    const token = jwt.sign(
        { studentId: student.studentId, name: student.name, role: 'student' },
        JWT_SECRET,
        { expiresIn: '1h' }
    );

    return res.json({ token, user: { name: student.name, studentId: student.studentId } });
});

// Admin Login (Mock - hardcoded for demo)
router.post('/admin/login', (req: Request, res: Response) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'admin') {
        const token = jwt.sign(
            { role: 'admin' },
            JWT_SECRET,
            { expiresIn: '1h' }
        );
        return res.json({ token });
    }
    return res.status(401).json({ error: 'Invalid admin credentials' });
});

export default router;
