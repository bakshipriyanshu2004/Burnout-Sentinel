import { Router, Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import { getDB } from '../data/db';
import { authenticateToken } from './students';
import { buildVectorStore } from '../services/ragService';

const router = Router();

// Helper: risk level color (returns RGB)
const riskColor = (level: string): [number, number, number] => {
    if (level === 'HIGH') return [239, 68, 68];
    if (level === 'MEDIUM') return [249, 115, 22];
    return [34, 197, 94];
};

const calcSubjectRisk = (m: any) => {
    if (!m) return { riskScore: 0, riskLevel: 'N/A' };
    const avgCA = (m.ca1 + m.ca2 + m.ca3 + m.ca4) / 4;
    const academicDeficit = 100 - avgCA;
    const attPercent = (m.attendance / 120) * 100;
    const attendanceDeficit = 100 - attPercent;
    let trendMod = m.ca4 < m.ca3 ? 5 : m.ca4 > m.ca3 ? -5 : 0;
    let score = Math.min(100, Math.max(0, Math.round((academicDeficit * 0.6) + (attendanceDeficit * 0.4) + trendMod)));
    let level = score >= 60 ? 'HIGH' : score >= 35 ? 'MEDIUM' : 'LOW';
    return { riskScore: score, riskLevel: level };
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/report/student/me  — Download student's PDF report card
// ─────────────────────────────────────────────────────────────────────────────
router.get('/student/me', authenticateToken, async (req: Request, res: Response): Promise<any> => {
    try {
        const user = (req as any).user;
        const db = getDB();

        const student = await db.get('SELECT * FROM Students WHERE studentId = ?', [user.studentId]);
        if (!student) return res.status(404).json({ error: 'Student not found' });

        const marks = await db.all('SELECT * FROM SubjectMarks WHERE studentId = ?', [user.studentId]);

        // Compute per-subject risk + averages
        const subjectData = marks.map((m: any) => {
            const avg = Math.round((m.ca1 + m.ca2 + m.ca3 + m.ca4) / 4);
            const attPct = Math.round((m.attendance / 120) * 100);
            const risk = calcSubjectRisk(m);
            return { ...m, avg, attPct, ...risk };
        });

        const bestSubject = subjectData.reduce((best: any, cur: any) => cur.avg > (best?.avg ?? -1) ? cur : best, null);
        const overallAvg = subjectData.length > 0
            ? Math.round(subjectData.reduce((sum, s) => sum + s.avg, 0) / subjectData.length)
            : 0;
        const highRiskCount = subjectData.filter((s: any) => s.riskLevel === 'HIGH').length;

        // ── Build PDF ──
        const doc = new PDFDocument({ size: 'A4', margin: 0, info: { Title: `Report Card - ${student.name}` } });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="ReportCard_${student.studentId}.pdf"`);
        doc.pipe(res);

        const W = 595.28;
        const pageMargin = 40;
        const contentW = W - pageMargin * 2;

        // ── Header band ──
        doc.rect(0, 0, W, 90).fill('#0a0a0a');
        doc.rect(0, 90, W, 4).fill('#6366f1');

        // Logo placeholder (text-based)
        doc.fontSize(28).fillColor('#6366f1').font('Helvetica-Bold').text('M', 40, 22, { width: 50, align: 'center' });
        doc.rect(40, 18, 50, 50).stroke('#6366f1');

        doc.fontSize(20).fillColor('#ffffff').font('Helvetica-Bold')
            .text('BAAL MANTRA', 105, 22);
        doc.fontSize(9).fillColor('#6366f1').font('Helvetica')
            .text('BURNOUT SENTINEL — ACADEMIC REPORT CARD', 105, 46);

        const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
        doc.fontSize(8).fillColor('#9ca3af').text(`Generated: ${today}`, W - 160, 70, { width: 120, align: 'right' });

        let y = 110;

        // ── Student Info Block ──
        doc.rect(pageMargin, y, contentW, 80).fill('#111827').stroke('#1f2937');
        doc.fontSize(16).fillColor('#ffffff').font('Helvetica-Bold').text(student.name, pageMargin + 16, y + 14);
        doc.fontSize(9).fillColor('#9ca3af').font('Helvetica');
        doc.text(`Student ID: ${student.studentId}`, pageMargin + 16, y + 34);
        doc.text(`Email: ${student.email}`, pageMargin + 16, y + 48);
        doc.text(`Date of Birth: ${student.dob}`, pageMargin + 16, y + 62);

        // Overall avg badge
        const badgeX = pageMargin + contentW - 110;
        doc.rect(badgeX, y + 12, 96, 56).fill('#1f2937').stroke('#374151');
        doc.fontSize(32).fillColor(overallAvg >= 70 ? '#22c55e' : overallAvg >= 50 ? '#f97316' : '#ef4444')
            .font('Helvetica-Bold').text(`${overallAvg}%`, badgeX + 8, y + 14, { width: 80, align: 'center' });
        doc.fontSize(8).fillColor('#9ca3af').font('Helvetica').text('Overall Avg', badgeX + 8, y + 53, { width: 80, align: 'center' });

        y += 100;

        // ── Summary Row ──
        const summaryItems = [
            { label: 'Subjects Tracked', value: String(subjectData.length), color: '#6366f1' },
            { label: 'Best Subject', value: bestSubject?.subjectName?.split(' ').slice(0, 2).join(' ') || 'N/A', color: '#eab308' },
            { label: 'High Risk Subjects', value: String(highRiskCount), color: highRiskCount > 0 ? '#ef4444' : '#22c55e' },
        ];

        const boxW = (contentW - 16) / 3;
        summaryItems.forEach((item, i) => {
            const bx = pageMargin + i * (boxW + 8);
            doc.rect(bx, y, boxW, 52).fill('#111827').stroke('#1f2937');
            doc.fontSize(18).fillColor(item.color).font('Helvetica-Bold').text(item.value, bx + 8, y + 8, { width: boxW - 16, align: 'center' });
            doc.fontSize(8).fillColor('#9ca3af').font('Helvetica').text(item.label, bx + 8, y + 34, { width: boxW - 16, align: 'center' });
        });

        y += 70;

        // ── Subject Marks Table ──
        doc.fontSize(13).fillColor('#ffffff').font('Helvetica-Bold').text('Subject-Wise Performance', pageMargin, y);
        y += 20;

        // Table header
        const cols = { name: 170, ca1: 40, ca2: 40, ca3: 40, ca4: 40, att: 55, attPct: 45, risk: 60, score: 45 };
        const headers = ['Subject', 'CA 1', 'CA 2', 'CA 3', 'CA 4', 'Attended', 'Att %', 'Risk', 'Score'];
        const colWidths = Object.values(cols);
        const colKeys = Object.keys(cols);

        doc.rect(pageMargin, y, contentW, 22).fill('#1f2937');
        let cx = pageMargin + 8;
        headers.forEach((h, i) => {
            doc.fontSize(8).fillColor('#9ca3af').font('Helvetica-Bold').text(h, cx, y + 7, { width: colWidths[i] - 4 });
            cx += colWidths[i];
        });
        y += 22;

        subjectData.forEach((s: any, idx: number) => {
            const rowH = 26;
            const bgColor = idx % 2 === 0 ? '#0f1318' : '#111827';
            doc.rect(pageMargin, y, contentW, rowH).fill(bgColor);

            const rc = riskColor(s.riskLevel);
            const values = [
                s.subjectName,
                String(s.ca1), String(s.ca2), String(s.ca3), String(s.ca4),
                `${s.attendance}/120`,
                `${s.attPct}%`,
                s.riskLevel,
                String(s.riskScore)
            ];

            cx = pageMargin + 8;
            values.forEach((val, i) => {
                let color = '#e5e7eb';
                if (i === 7) color = `rgb(${rc.join(',')})`;  // risk level
                if (i === 5 && s.attPct < 60) color = '#ef4444'; // low attendance
                if (i === 0 && bestSubject?.subjectName === s.subjectName) color = '#eab308'; // best subject

                doc.fontSize(8).fillColor(color).font(i === 0 ? 'Helvetica-Bold' : 'Helvetica')
                    .text(val, cx, y + 9, { width: colWidths[i] - 4, lineBreak: false });
                cx += colWidths[i];
            });

            // Risk bar
            y += rowH;
        });

        y += 20;

        // ── Best Subject Callout ──
        if (bestSubject) {
            doc.rect(pageMargin, y, contentW, 44).fill('#1c1a00').stroke('#eab308');
            doc.fontSize(9).fillColor('#eab308').font('Helvetica-Bold').text('🏆  YOUR STRONGEST SUBJECT', pageMargin + 12, y + 8);
            doc.fontSize(11).fillColor('#ffffff').font('Helvetica-Bold').text(bestSubject.subjectName, pageMargin + 12, y + 22);
            doc.fontSize(9).fillColor('#fbbf24').font('Helvetica').text(`Average: ${bestSubject.avg}/100  ·  Attendance: ${bestSubject.attPct}%`, pageMargin + contentW / 2, y + 22, { width: contentW / 2 - 12, align: 'right' });
        }

        y += 64;

        // ── Burnout Risk Summary ──
        doc.fontSize(13).fillColor('#ffffff').font('Helvetica-Bold').text('Burnout Risk Summary', pageMargin, y);
        y += 18;
        doc.fontSize(9).fillColor('#9ca3af').font('Helvetica');
        const riskLines = [
            highRiskCount === 0
                ? '✓ No high-risk subjects detected. Keep maintaining consistent study and attendance habits.'
                : `⚠ ${highRiskCount} subject(s) are flagged as HIGH RISK. Immediate focus is recommended on these areas.`,
            overallAvg < 50
                ? '⚠ Overall academic average is below 50%. Consider scheduling focused study sessions and seeking teacher support.'
                : overallAvg < 70
                    ? '→ Academic performance is moderate. There is clear room for improvement with consistent effort.'
                    : '✓ Strong overall academic performance. Maintain the momentum!',
        ];
        riskLines.forEach(line => {
            doc.text(line, pageMargin, y, { width: contentW });
            y += 16;
        });

        y += 12;

        // ── Footer ──
        doc.rect(0, 820, W, 22).fill('#0a0a0a');
        doc.fontSize(8).fillColor('#374151').font('Helvetica')
            .text('Baal Mantra — Burnout Sentinel  |  Confidential Academic Record  |  For Internal Use Only', 0, 824, { width: W, align: 'center' });

        doc.end();

    } catch (error) {
        console.error('Report generation error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to generate report' });
        }
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/report/reindex  — Admin triggers RAG re-indexing
// ─────────────────────────────────────────────────────────────────────────────
router.post('/reindex', authenticateToken, async (req: Request, res: Response): Promise<any> => {
    const user = (req as any).user;
    if (user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

    // Run in background — don't block the response
    res.json({ message: 'Re-indexing started. This may take 1-2 minutes depending on document size.' });

    try {
        await buildVectorStore();
        console.log('[Admin] RAG re-index completed successfully.');
    } catch (err) {
        console.error('[Admin] RAG re-index failed:', err);
    }
});

export default router;
