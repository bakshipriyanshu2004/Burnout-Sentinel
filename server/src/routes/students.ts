import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getDB } from '../data/db';
import { calculateRisk } from '../risk/engine';

const router = Router();
const JWT_SECRET = 'hackathon-secret-key-123';

import { verifyFirebaseToken, isFirebaseEnabled } from '../firebaseAuth';

// Middleware to verify token (Supports both JWT and Firebase)
export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    // Heuristic: Firebase tokens are very long (usually > 500 chars)
    if (isFirebaseEnabled && token.length > 500) {
        try {
            const decoded = await verifyFirebaseToken(token);
            const db = getDB();
            
            // Check if UID is a Teacher or Student
            if (decoded.uid.startsWith('T')) {
                const teacher = await db.get('SELECT * FROM Teachers WHERE teacherId = ?', [decoded.uid]);
                if (!teacher) return res.sendStatus(403);
                (req as any).user = { role: 'admin', teacherId: teacher.teacherId, department: teacher.department };
            } else {
                const student = await db.get('SELECT * FROM Students WHERE studentId = ?', [decoded.uid]);
                if (!student) return res.sendStatus(403);
                (req as any).user = { role: 'student', studentId: student.studentId, department: student.department };
            }
            return next();
        } catch (error) {
            console.error("Firebase Auth Error:", error);
            return res.sendStatus(403);
        }
    }

    // Fallback to local JWT
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

// GET /api/students (Guru only - returns all students in their department)
router.get('/', authenticateToken, async (req: Request, res: Response): Promise<any> => {
    try {
        const user = (req as any).user;
        
        if (user.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const db = getDB();
        const rawStudents = await db.all('SELECT * FROM Students WHERE department = ?', [user.department]);

        const students = rawStudents.map(parseStudentJSON);

        const studentsWithRisk = students.map(s => {
            const riskProfile = calculateRisk(s as any);
            return { ...s, ...riskProfile };
        });

        res.json(studentsWithRisk);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /api/student/me (Sishya portal)
router.get('/me', authenticateToken, async (req: Request, res: Response): Promise<any> => {
    try {
        const user = (req as any).user;
        const db = getDB();
        const rawStudent = await db.get('SELECT * FROM Students WHERE studentId = ?', [user.studentId]);

        if (!rawStudent) return res.status(404).json({ error: 'Sishya not found' });

        const student = parseStudentJSON(rawStudent);
        const riskProfile = calculateRisk(student as any);
        res.json({ ...student, ...riskProfile });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /api/students/teacher/me (Guru portal)
router.get('/teacher/me', authenticateToken, async (req: Request, res: Response): Promise<any> => {
    try {
        const user = (req as any).user;
        if (user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
        
        const db = getDB();
        const rawTeacher = await db.get('SELECT * FROM Teachers WHERE teacherId = ?', [user.teacherId]);
        
        if (!rawTeacher) return res.status(404).json({ error: 'Teacher not found' });
        
        res.json(rawTeacher);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST /api/student/assignments (Simulate upload)
router.post('/assignments', authenticateToken, (req: Request, res: Response) => {
    const { assignmentId } = req.body;
    res.json({ message: 'Assignment submitted successfully' });
});

// PUT /api/students/:id/attendance (Guru manually feeds attendance)
router.put('/:id/attendance', authenticateToken, async (req: Request, res: Response): Promise<any> => {
    try {
        const user = (req as any).user;
        if (user.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden' });
        }
        const { attendance } = req.body;
        if (typeof attendance !== 'number' || attendance < 0 || attendance > 100) {
            return res.status(400).json({ error: 'Invalid attendance value (0-100)' });
        }

        const db = getDB();
        await db.run('UPDATE Students SET attendancePercentage = ? WHERE studentId = ? AND department = ?', [attendance, req.params.id, user.department]);
        res.json({ success: true, message: 'Attendance updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// --- NEW ENDPOINTS FOR SUBJECT MARKS, HELP REQUESTS, NOTIFICATIONS ---

const calculateSubjectRisk = (marks: any) => {
    if (!marks) return { riskScore: 0, riskLevel: 'LOW' };
    const avgCA = (marks.ca1 + marks.ca2 + marks.ca3 + marks.ca4) / 4;
    const academicDeficit = 100 - avgCA;
    const attPercent = (marks.attendance / 120) * 100;
    const attendanceDeficit = 100 - attPercent;
    
    let trendMod = 0;
    if (marks.ca4 < marks.ca3) trendMod += 5;
    if (marks.ca4 > marks.ca3) trendMod -= 5;

    let score = Math.round((academicDeficit * 0.6) + (attendanceDeficit * 0.4) + trendMod);
    if (score < 0) score = 0;
    if (score > 100) score = 100;

    let level = 'LOW';
    if (score >= 60) level = 'HIGH';
    else if (score >= 35) level = 'MEDIUM';

    return { riskScore: score, riskLevel: level };
};

// GET /api/student/me/marks (Get marks for all subjects)
router.get('/me/marks', authenticateToken, async (req: Request, res: Response): Promise<any> => {
    try {
        const user = (req as any).user;
        const db = getDB();
        const marks = await db.all('SELECT * FROM SubjectMarks WHERE studentId = ?', [user.studentId]);
        const marksWithRisk = marks.map(m => ({ ...m, ...calculateSubjectRisk(m) }));
        res.json(marksWithRisk);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /api/student/me/notifications
router.get('/me/notifications', authenticateToken, async (req: Request, res: Response): Promise<any> => {
    try {
        const user = (req as any).user;
        const db = getDB();
        const notifications = await db.all(`
            SELECT n.*, t.name as teacherName, t.subject as teacherSubject 
            FROM Notifications n 
            JOIN Teachers t ON n.teacherId = t.teacherId 
            WHERE n.studentId = ? OR n.studentId = "ALL" 
            ORDER BY n.timestamp DESC
        `, [user.studentId]);
        res.json(notifications);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST /api/student/help-requests
router.post('/help-requests', authenticateToken, async (req: Request, res: Response): Promise<any> => {
    try {
        const user = (req as any).user;
        const { subjectName } = req.body;
        const db = getDB();
        await db.run('INSERT INTO HelpRequests (studentId, subjectName, status, timestamp) VALUES (?, ?, ?, ?)', 
            [user.studentId, subjectName, 'Pending', new Date().toISOString()]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /api/students/class-marks (Teacher gets students with marks for their subject)
router.get('/class-marks', authenticateToken, async (req: Request, res: Response): Promise<any> => {
    try {
        const user = (req as any).user;
        if (user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
        
        const db = getDB();
        const teacher = await db.get('SELECT * FROM Teachers WHERE teacherId = ?', [user.teacherId]);
        if (!teacher) return res.status(404).json({ error: 'Teacher not found' });

        const studentsRaw = await db.all('SELECT * FROM Students WHERE department = ?', [user.department]);
        const marksRaw = await db.all('SELECT * FROM SubjectMarks WHERE subjectName = ?', [teacher.subject]);

        const classData = studentsRaw.map(s => {
            const studentMarks = marksRaw.find(m => m.studentId === s.studentId);
            const subjectRisk = calculateSubjectRisk(studentMarks);
            return {
                studentId: s.studentId,
                name: s.name,
                email: s.email,
                dob: s.dob,
                marks: studentMarks || null,
                subjectRiskScore: subjectRisk.riskScore,
                subjectRiskLevel: subjectRisk.riskLevel
            };
        });

        res.json(classData);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// PUT /api/students/:id/marks (Teacher updates marks/attendance)
router.put('/:id/marks', authenticateToken, async (req: Request, res: Response): Promise<any> => {
    try {
        const user = (req as any).user;
        if (user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
        
        const { ca1, ca2, ca3, ca4, attendance } = req.body;
        const studentId = req.params.id;
        
        const db = getDB();
        const teacher = await db.get('SELECT * FROM Teachers WHERE teacherId = ?', [user.teacherId]);
        
        await db.run(
            'UPDATE SubjectMarks SET ca1 = ?, ca2 = ?, ca3 = ?, ca4 = ?, attendance = ? WHERE studentId = ? AND subjectName = ?',
            [ca1, ca2, ca3, ca4, attendance, studentId, teacher.subject]
        );
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /api/students/help-requests (Teacher gets pending requests for their subject)
router.get('/help-requests', authenticateToken, async (req: Request, res: Response): Promise<any> => {
    try {
        const user = (req as any).user;
        if (user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
        
        const db = getDB();
        const teacher = await db.get('SELECT * FROM Teachers WHERE teacherId = ?', [user.teacherId]);
        
        const requests = await db.all('SELECT h.*, s.name FROM HelpRequests h JOIN Students s ON h.studentId = s.studentId WHERE h.subjectName = ? ORDER BY h.timestamp DESC', [teacher.subject]);
        res.json(requests);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST /api/students/notifications (Teacher sends notification)
router.post('/notifications', authenticateToken, async (req: Request, res: Response): Promise<any> => {
    try {
        const user = (req as any).user;
        if (user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
        
        const { targetStudentId, message } = req.body; // targetStudentId can be 'ALL'
        const db = getDB();
        
        await db.run('INSERT INTO Notifications (teacherId, studentId, message, timestamp) VALUES (?, ?, ?, ?)',
            [user.teacherId, targetStudentId, message, new Date().toISOString()]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;
