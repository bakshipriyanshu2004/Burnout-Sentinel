import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { getDB } from '../data/db';

const router = Router();
const JWT_SECRET = 'hackathon-secret-key-123'; // Hardcoded for MVP

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response): Promise<any> => {
    try {
        let { rollNumber, dob } = req.body; 

        console.log(`[Login Attempt] Roll Number: "${rollNumber}", DOB: "${dob}"`);

        rollNumber = rollNumber?.trim();
        dob = dob?.trim();

        const db = getDB();
        const student = await db.get('SELECT * FROM Students WHERE studentId = ? AND dob = ?', [rollNumber, dob]);

        if (student) {
            console.log(`[Login Info] Found match: ${student.studentId}`);
        } else {
            console.log(`[Login Info] No student found with Roll Number: "${rollNumber}" and DOB: "${dob}"`);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate Token
        const token = jwt.sign(
            { studentId: student.studentId, name: student.name, role: 'student', department: student.department },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        console.log('[Login Success]');
        return res.json({ token, user: { name: student.name, studentId: student.studentId, department: student.department } });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Admin Login (Guru)
router.post('/admin/login', async (req: Request, res: Response): Promise<any> => {
    try {
        const { username, password } = req.body;
        
        const db = getDB();
        const teacher = await db.get('SELECT * FROM Teachers WHERE teacherId = ? AND passwordHash = ?', [username, password]);
        
        if (teacher) {
            const token = jwt.sign(
                { role: 'admin', teacherId: teacher.teacherId, department: teacher.department },
                JWT_SECRET,
                { expiresIn: '1h' }
            );
            return res.json({ token, user: { teacherId: teacher.teacherId, department: teacher.department } });
        }
        return res.status(401).json({ error: 'Invalid Guru credentials' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;
