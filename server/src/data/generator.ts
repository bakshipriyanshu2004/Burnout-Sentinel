import { faker } from '@faker-js/faker';
import { subDays, format } from 'date-fns';
import { Student, ActivityLog, Assignment, RiskLevel } from '../types';

const bihariFirst = ["Amit", "Rahul", "Rakesh", "Vikash", "Sanjay", "Neha", "Pooja", "Aarti", "Priya", "Anand", "Ravi", "Manoj", "Suman", "Rajesh", "Pawan"];
const bihariLast = ["Kumar", "Singh", "Yadav", "Sharma", "Mishra", "Thakur", "Chaudhary", "Paswan", "Pandey"];

const bengaliFirst = ["Sourav", "Abir", "Jeet", "Arijit", "Shreya", "Koel", "Subhash", "Arindam", "Anik", "Sayan", "Riya", "Sneha", "Ananya", "Debolina", "Poulomi"];
const bengaliLast = ["Banerjee", "Chatterjee", "Mukherjee", "Ghosh", "Bose", "Das", "Sengupta", "Roy", "Dutta", "Saha", "Biswas"];

const punjabiFirst = ["Diljit", "Gurdas", "Amrinder", "Harbhajan", "Yuvraj", "Sunny", "Simran", "Amrita", "Gurpreet", "Manpreet", "Jaspreet", "Karan"];
const punjabiLast = ["Singh", "Kaur", "Gill", "Dhillon", "Sandhu", "Kapur", "Malhotra", "Chadha", "Grover"];

const muslimFirst = ["Salman", "Aamir", "Saif", "Irfan", "Ali", "Hasan", "Fatima", "Ayesha", "Sana", "Zoya", "Tariq", "Zayn", "Zakir", "Imran"];
const muslimLast = ["Khan", "Ansari", "Qureshi", "Sheikh", "Syed", "Ahmed", "Ali", "Rahman", "Hussain"];

const othersFirst = ["Aarav", "Diya", "Kabir", "Meera", "Vikram", "Sonia", "Kavya", "Dhruv", "Aditi", "Sai", "Krishna", "Arjun", "Anika", "Varun"];
const othersLast = ["Patel", "Reddy", "Nair", "Iyer", "Shah", "Joshi", "Desai", "Jain", "Agarwal"];

const generateDemographicName = (demo: string) => {
    let f, l;
    if (demo === 'Bihari') { f = bihariFirst; l = bihariLast; }
    else if (demo === 'Bengali') { f = bengaliFirst; l = bengaliLast; }
    else if (demo === 'Punjabi') { f = punjabiFirst; l = punjabiLast; }
    else if (demo === 'Muslim') { f = muslimFirst; l = muslimLast; }
    else { f = othersFirst; l = othersLast; }
    
    return `${faker.helpers.arrayElement(f)} ${faker.helpers.arrayElement(l)}`;
};

const generateGrades = (profile: 'HIGH' | 'MEDIUM' | 'LOW'): number[] => {
    const grades: number[] = [];
    let base = profile === 'HIGH' ? faker.number.int({ min: 50, max: 65 }) :
        profile === 'MEDIUM' ? faker.number.int({ min: 70, max: 80 }) :
            faker.number.int({ min: 85, max: 95 });

    for (let i = 0; i < 5; i++) {
        let variation = faker.number.int({ min: -8, max: 8 });
        if (profile === 'HIGH') variation -= i * faker.number.int({ min: 1, max: 4 });
        if (profile === 'LOW') variation += i * faker.number.int({ min: 0, max: 2 });
        grades.push(Math.min(100, Math.max(0, base + variation)));
    }
    return grades;
};

const generateActivityLogs = (profile: 'HIGH' | 'MEDIUM' | 'LOW'): ActivityLog[] => {
    const logs: ActivityLog[] = [];
    let loginBase = profile === 'HIGH' ? faker.number.int({ min: 0, max: 2 }) :
        profile === 'MEDIUM' ? faker.number.int({ min: 2, max: 4 }) :
            faker.number.int({ min: 3, max: 6 });

    let watchBase = profile === 'HIGH' ? faker.number.int({ min: 0, max: 30 }) :
        profile === 'MEDIUM' ? faker.number.int({ min: 30, max: 60 }) :
            faker.number.int({ min: 60, max: 120 });

    const dropSeverity = faker.number.float({ min: 0.5, max: 1.0 });

    for (let i = 0; i < 30; i++) {
        const date = subDays(new Date(), i).toISOString();
        let loginCount = Math.max(0, loginBase + faker.number.int({ min: -1, max: 2 }));
        let videoWatchMinutes = Math.max(0, watchBase + faker.number.int({ min: -20, max: 40 }));
        let forumPosts = profile === 'LOW' ? faker.number.int({ min: 0, max: 3 }) :
            profile === 'MEDIUM' && Math.random() > 0.7 ? 1 : 0;

        if (i < 14 && (profile === 'HIGH' || (profile === 'MEDIUM' && Math.random() > 0.6))) {
            loginCount = Math.floor(loginCount * (1 - dropSeverity));
            videoWatchMinutes = Math.floor(videoWatchMinutes * (1 - dropSeverity));
        }

        logs.push({ date, loginCount, videoWatchMinutes, forumPosts });
    }
    return logs.reverse();
};

const generateAssignments = (isAtRisk: boolean): Assignment[] => {
    const assignments: Assignment[] = [];
    const studentLatencyMap = faker.number.int({ min: 0, max: 5 });

    for (let i = 1; i <= 5; i++) {
        const dueDate = subDays(new Date(), (5 - i) * 7).toISOString();
        let submittedDate: string | null = subDays(new Date(), (5 - i) * 7 + faker.number.int({ min: -2, max: 2 })).toISOString();
        let grade: number | null = faker.number.int({ min: 70, max: 100 });

        if (isAtRisk && i > 3) {
            const problemType = Math.random();
            if (problemType > 0.6) {
                submittedDate = null;
                grade = null;
            } else if (problemType > 0.3) {
                const daysLate = studentLatencyMap + faker.number.int({ min: 1, max: 7 });
                submittedDate = subDays(new Date(), (5 - i) * 7 - daysLate).toISOString();
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

export const generateStudentsWithDemographics = (): Student[] => {
    const students: Student[] = [];
    
    // Exact counts for 60 total students
    const demographics = [
        ...Array(24).fill('Bihari'),   // 40%
        ...Array(25).fill('Bengali'),  // 42%
        ...Array(2).fill('Punjabi'),   // ~4%
        ...Array(4).fill('Muslim'),    // ~7%
        ...Array(5).fill('Others')     // Remaining
    ];

    // Shuffle demographics array
    for (let i = demographics.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [demographics[i], demographics[j]] = [demographics[j], demographics[i]];
    }

    for (let i = 0; i < 60; i++) {
        const rand = Math.random();
        let profile: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
        if (rand < 0.2) profile = 'HIGH';
        else if (rand < 0.5) profile = 'MEDIUM';

        let name = generateDemographicName(demographics[i]);
        // Roll number as studentId (12031523001 to 12031523060)
        const studentId = `12031523${String(i + 1).padStart(3, '0')}`;
        
        const cleanName = name.replace(/\s+/g, '').toLowerCase();
        const uniqueNum = faker.number.int({ min: 100, max: 999 });
        let email = `${cleanName}${uniqueNum}.bcrec@gmail.com`;
        
        // Random birthday between Jan 1, 2003 and Dec 31, 2006
        const dobDate = faker.date.between({ from: '2003-01-01T00:00:00.000Z', to: '2006-12-31T23:59:59.000Z' });
        let dob = format(dobDate, 'yyyy-MM-dd');

        if (studentId === '12031523036') {
            name = 'Pranajit Banerjee';
            dob = '2004-08-22';
            email = 'prana2004jit@gmail.com';
        } else if (studentId === '12031523037') {
            name = 'Priyanshu Bakshi';
            dob = '2004-09-10';
            email = 'priyanshubakshi2506@gmail.com';
        } else if (studentId === '12031523016') {
            name = 'Atanu Sarkar';
            dob = '2005-10-16';
            email = 'atanusarkar5012@gmail.com';
        }

        students.push({
            studentId,
            name,
            email,
            dob,
            activityLogs: generateActivityLogs(profile),
            assignments: generateAssignments(profile === 'HIGH'),
            grades: generateGrades(profile),
            riskScore: 0,
            riskLevel: 'LOW',
            gradeTrend: 'Stable',
            engagementScore: 0,
            attendancePercentage: 100,
            redFlags: []
        });
    }

    return students;
};
