import { faker } from '@faker-js/faker';
import { subDays, format } from 'date-fns';
import { Student, ActivityLog, Assignment, RiskLevel } from '../types';

// Enforce Indian locale-ish or just custom name list if faker locale isn't perfect, 
// but faker.person.fullName() with a seed or manual list is safer for STRICT Indian names requirement.
// We will use a predefined list of Indian first and last names for better control.

const indianFirstNames = [
    "Aarav", "Vihaan", "Vivaan", "Ananya", "Diya", "Advik", "Kabir", "Rohan", "Ishaan", "Anya",
    "Sarthak", "Arjun", "Sai", "Reyansh", "Ayaan", "Krishna", "Dhruv", "Ishita", "Meera", "Riya",
    "Aditi", "Kavya", "Anika", "Priya", "Rahul", "Neha", "Pooja", "Vikram", "Sanjay", "Amit",
    "Sneha", "Manish", "Raj", "Simran", "Varun", "Karan", "Nisha", "Ravi", "Sonia", "Deepak"
];

const indianLastNames = [
    "Patel", "Sharma", "Singh", "Kumar", "Gupta", "Verma", "Mehta", "Reddy", "Nair", "Iyer",
    "Shah", "Joshi", "Malhotra", "Bhatia", "Saxena", "Chopra", "Desai", "Jain", "Agarwal", "Mishra"
];

const generateIndianName = () => {
    const first = faker.helpers.arrayElement(indianFirstNames);
    const last = faker.helpers.arrayElement(indianLastNames);
    return `${first} ${last}`;
};

const generateGrades = (profile: 'HIGH' | 'MEDIUM' | 'LOW'): number[] => {
    const grades: number[] = [];
    // Personalize base grade per student to avoid identical scores
    let base = profile === 'HIGH' ? faker.number.int({ min: 50, max: 65 }) :
        profile === 'MEDIUM' ? faker.number.int({ min: 70, max: 80 }) :
            faker.number.int({ min: 85, max: 95 });

    for (let i = 0; i < 5; i++) {
        // Individual variation per assignment
        let variation = faker.number.int({ min: -8, max: 8 });

        // Trend logic
        if (profile === 'HIGH') variation -= i * faker.number.int({ min: 1, max: 4 }); // Variable decline
        if (profile === 'LOW') variation += i * faker.number.int({ min: 0, max: 2 }); // Stable/Improving

        grades.push(Math.min(100, Math.max(0, base + variation)));
    }
    return grades;
};

const generateActivityLogs = (profile: 'HIGH' | 'MEDIUM' | 'LOW'): ActivityLog[] => {
    const logs: ActivityLog[] = [];

    // Personalize engagement baselines per student
    let loginBase = profile === 'HIGH' ? faker.number.int({ min: 0, max: 2 }) :
        profile === 'MEDIUM' ? faker.number.int({ min: 2, max: 4 }) :
            faker.number.int({ min: 3, max: 6 });

    let watchBase = profile === 'HIGH' ? faker.number.int({ min: 0, max: 30 }) :
        profile === 'MEDIUM' ? faker.number.int({ min: 30, max: 60 }) :
            faker.number.int({ min: 60, max: 120 });

    // Drop magnitude (how hard do they crash?)
    const dropSeverity = faker.number.float({ min: 0.5, max: 1.0 });

    for (let i = 0; i < 30; i++) {
        const date = subDays(new Date(), i).toISOString();

        // Random daily fluctuation
        let loginCount = Math.max(0, loginBase + faker.number.int({ min: -1, max: 2 }));
        let videoWatchMinutes = Math.max(0, watchBase + faker.number.int({ min: -20, max: 40 }));
        let forumPosts = profile === 'LOW' ? faker.number.int({ min: 0, max: 3 }) :
            profile === 'MEDIUM' && Math.random() > 0.7 ? 1 : 0;

        // Recent drop for High/Medium (simulate burnout)
        // High risk: frequent drops. Medium: occasional.
        if (i < 14 && (profile === 'HIGH' || (profile === 'MEDIUM' && Math.random() > 0.6))) {
            // Apply drop factor instead of zeroing out, creates more unique "Decay" scores
            loginCount = Math.floor(loginCount * (1 - dropSeverity));
            videoWatchMinutes = Math.floor(videoWatchMinutes * (1 - dropSeverity));
        }

        logs.push({ date, loginCount, videoWatchMinutes, forumPosts });
    }
    return logs.reverse();
};

const generateAssignments = (isAtRisk: boolean): Assignment[] => {
    const assignments: Assignment[] = [];
    const studentLatencyMap = faker.number.int({ min: 0, max: 5 }); // Some students are chronically late

    for (let i = 1; i <= 5; i++) {
        const dueDate = subDays(new Date(), (5 - i) * 7).toISOString();

        let submittedDate: string | null = subDays(new Date(), (5 - i) * 7 + faker.number.int({ min: -2, max: 2 })).toISOString();
        let grade: number | null = faker.number.int({ min: 70, max: 100 });

        if (isAtRisk && i > 3) {
            const problemType = Math.random();
            if (problemType > 0.6) {
                submittedDate = null; // Missing
                grade = null;
            } else if (problemType > 0.3) {
                // Late submission (variable lateness)
                const daysLate = studentLatencyMap + faker.number.int({ min: 1, max: 7 });
                submittedDate = subDays(new Date(), (5 - i) * 7 - daysLate).toISOString(); // negative subDays = future? No, wait. 
                // subDays(now, 14) is 2 weeks ago.
                // Due date is X days ago.
                // Late means submitted AFTER due date.
                // Due date: subDays(now, (5-i)*7). Say 14 days ago.
                // Late submission: 10 days ago. (14 - 4).
                // So subtract LESS days.
                // Correct logic: (5-i)*7 - daysLate.
                grade = faker.number.int({ min: 40, max: 65 });
            }
        }

        assignments.push({
            id: faker.string.uuid(),
            title: `Assignment ${i}`,
            dueDate,
            submittedDate,
            grade
        });
    }
    return assignments;
};

export const generateStudents = (count: number = 50): Student[] => {
    const students: Student[] = [];

    for (let i = 0; i < count; i++) {
        // Distribute risk profiles: 20% High, 30% Medium, 50% Low  (Strict user requirement)
        const rand = Math.random();
        let profile: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
        if (rand < 0.2) profile = 'HIGH';
        else if (rand < 0.5) profile = 'MEDIUM';

        const name = generateIndianName();
        const studentId = `S${2024001 + i}`;

        students.push({
            studentId,
            name,
            email: `${name.toLowerCase().replace(' ', '.')}@university.edu`,
            activityLogs: generateActivityLogs(profile),
            assignments: generateAssignments(profile === 'HIGH'),
            grades: generateGrades(profile),
            riskScore: 0, // Calculated later by engine
            riskLevel: 'LOW', // Calculated later
            gradeTrend: 'Stable', // Calculated later
            engagementScore: 0, // Calculated later
            redFlags: []
        });
    }

    return students;
};
