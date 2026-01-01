"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const store_1 = require("../data/store");
const router = (0, express_1.Router)();
const JWT_SECRET = 'hackathon-secret-key-123'; // Hardcoded for MVP
// POST /api/auth/login
router.post('/login', (req, res) => {
    const { studentId, email } = req.body;
    // Simple auth: Check if student exists matching ID and Email
    const student = store_1.store.getStudentById(studentId);
    if (!student || student.email !== email) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    // Generate Token
    const token = jsonwebtoken_1.default.sign({ studentId: student.studentId, name: student.name, role: 'student' }, JWT_SECRET, { expiresIn: '1h' });
    return res.json({ token, user: { name: student.name, studentId: student.studentId } });
});
// Admin Login (Mock - hardcoded for demo)
router.post('/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'admin') {
        const token = jsonwebtoken_1.default.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });
        return res.json({ token });
    }
    return res.status(401).json({ error: 'Invalid admin credentials' });
});
exports.default = router;
