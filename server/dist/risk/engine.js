"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateRisk = void 0;
const calculateRisk = (student) => {
    const { activityLogs, assignments, grades } = student;
    const redFlags = [];
    // 1. Login Decay (30%) - Last 14 days vs Previous 14 days
    const recentLogs = activityLogs.slice(0, 14); // Newest 14 days (assuming logs are reverse chronological? Generator returns chronological, wait. Let's check generator.)
    // Generator: logs.reverse() at the end. So index 0 is TODAY (newest).
    // Actually, generator returns logs.reverse(), and the loop goes subDays(new Date(), i).
    // i=0 is today. i=29 is 30 days ago.
    // logs.push(...) adds to end.
    // reverse creates [today...30 days ago].
    // Wait, if I push i=0 first, then i=29 last. Then reverse gives [i=29...i=0]. 
    // Let's re-verify generator logic mentally.
    // Loop i=0 to 29. Push. Array: [Day0, Day1... Day29].
    // Reverse: [Day29, ... Day1, Day0].
    // So index 0 is oldest, index 29 is today.
    // Let's assume standard chronological: index 0 = Oldest, index 29 = Today.
    // Helper to slice
    const logsChronological = [...activityLogs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const midPoint = Math.floor(logsChronological.length / 2);
    const oldLogs = logsChronological.slice(0, midPoint);
    const newLogs = logsChronological.slice(midPoint);
    const avgLoginOld = oldLogs.reduce((acc, log) => acc + log.loginCount, 0) / oldLogs.length || 1;
    const avgLoginNew = newLogs.reduce((acc, log) => acc + log.loginCount, 0) / newLogs.length || 0;
    // Calculate decay %
    const loginDrop = Math.max(0, (avgLoginOld - avgLoginNew) / avgLoginOld);
    const scoreLogin = loginDrop * 100 * 0.30;
    if (loginDrop > 0.5)
        redFlags.push('Significant drop in login frequency');
    // 2. Submission Latency Increase (25%)
    // Count late or missing assignments
    // We look at the last 3 assignments vs all
    const recentAssignments = assignments.slice(-3);
    const lateOrMissingCount = recentAssignments.filter(a => !a.submittedDate || new Date(a.submittedDate) > new Date(a.dueDate)).length;
    // This is a simple heuristic since "latency increase" is hard with small sample size (5 total assignments)
    const latencyScoreRaw = (lateOrMissingCount / 3);
    const scoreSubmission = latencyScoreRaw * 100 * 0.25;
    if (latencyScoreRaw > 0.3)
        redFlags.push('Recent missed or late assignments');
    // 3. Engagement Drop (25%) - Video + Forum
    const avgEngOld = oldLogs.reduce((acc, log) => acc + log.videoWatchMinutes + (log.forumPosts * 10), 0) / oldLogs.length || 1;
    const avgEngNew = newLogs.reduce((acc, log) => acc + log.videoWatchMinutes + (log.forumPosts * 10), 0) / newLogs.length || 0;
    const engDrop = Math.max(0, (avgEngOld - avgEngNew) / avgEngOld);
    const scoreEngagement = engDrop * 100 * 0.25;
    if (engDrop > 0.5)
        redFlags.push('Drastic decline in engagement');
    // 4. Grade Decline Trend (20%)
    // Simple slope check: compare avg of first half vs second half of grades
    const midGrades = Math.floor(grades.length / 2);
    const oldGrades = grades.slice(0, midGrades);
    const newGrades = grades.slice(midGrades);
    const avgGradeOld = oldGrades.reduce((a, b) => a + b, 0) / oldGrades.length || 100;
    const avgGradeNew = newGrades.reduce((a, b) => a + b, 0) / newGrades.length || 100;
    const gradeDrop = Math.max(0, (avgGradeOld - avgGradeNew) / avgGradeOld); // % drop
    // Magnify grade drop impact? 
    // If grade drops 20% (80 -> 64), that's huge.
    // Let's say max risk is if drop is > 20%.
    const scoreGrade = Math.min(1, gradeDrop * 5) * 100 * 0.20;
    if (gradeDrop > 0.1)
        redFlags.push('Declining academic performance');
    // Total Score
    const totalScore = Math.min(100, Math.round(scoreLogin + scoreSubmission + scoreEngagement + scoreGrade));
    let riskLevel = 'LOW';
    if (totalScore >= 70)
        riskLevel = 'HIGH';
    else if (totalScore >= 40)
        riskLevel = 'MEDIUM';
    return {
        riskScore: totalScore,
        riskLevel,
        redFlags: redFlags.slice(0, 2) // Top 2
    };
};
exports.calculateRisk = calculateRisk;
