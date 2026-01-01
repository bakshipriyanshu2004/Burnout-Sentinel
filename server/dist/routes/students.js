"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const store_1 = require("../data/store");
const engine_1 = require("../risk/engine");
const router = (0, express_1.Router)();
const JWT_SECRET = 'hackathon-secret-key-123';
// Middleware to verify token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token)
        return res.sendStatus(401);
    jsonwebtoken_1.default.verify(token, JWT_SECRET, (err, user) => {
        if (err)
            return res.sendStatus(403);
        req.user = user;
        next();
    });
};
// GET /api/students (Admin only - returns all students with risk data)
router.get('/', (req, res) => {
    // Ideally check for admin role here
    const students = store_1.store.getAllStudents();
    // Augment with realtime risk calculation
    const studentsWithRisk = students.map(s => {
        const riskProfile = (0, engine_1.calculateRisk)(s);
        return Object.assign(Object.assign({}, s), riskProfile);
    });
    res.json(studentsWithRisk);
});
// GET /api/student/me (Student portal)
router.get('/me', authenticateToken, (req, res) => {
    const user = req.user;
    const student = store_1.store.getStudentById(user.studentId);
    if (!student)
        return res.status(404).json({ error: 'Student not found' });
    const riskProfile = (0, engine_1.calculateRisk)(student);
    res.json(Object.assign(Object.assign({}, student), riskProfile));
});
// POST /api/student/assignments (Simulate upload)
router.post('/assignments', authenticateToken, (req, res) => {
    const { assignmentId } = req.body;
    // In a real app, update the store. For MVP, just acknowledge.
    // We can update the in-memory store to mark it as submitted if we want to be fancy.
    res.json({ message: 'Assignment submitted successfully' });
});
exports.default = router;
