"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateStudents = void 0;
const faker_1 = require("@faker-js/faker");
const date_fns_1 = require("date-fns");
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
    const first = faker_1.faker.helpers.arrayElement(indianFirstNames);
    const last = faker_1.faker.helpers.arrayElement(indianLastNames);
    return `${first} ${last}`;
};
const generateActivityLogs = (isAtRisk) => {
    var _a;
    const logs = [];
    for (let i = 0; i < 30; i++) {
        const date = (0, date_fns_1.subDays)(new Date(), i).toISOString(); // Today going backwards
        let loginCount = faker_1.faker.number.int({ min: 1, max: 5 });
        let videoWatchMinutes = faker_1.faker.number.int({ min: 10, max: 120 });
        let forumPosts = faker_1.faker.number.int({ min: 0, max: 3 });
        // If at risk, significant drop in last 14 days (index 0 to 13)
        if (isAtRisk && i < 14) {
            loginCount = (_a = faker_1.faker.helpers.maybe(() => 0, { probability: 0.6 })) !== null && _a !== void 0 ? _a : 1;
            videoWatchMinutes = faker_1.faker.number.int({ min: 0, max: 15 });
            forumPosts = 0;
        }
        logs.push({ date, loginCount, videoWatchMinutes, forumPosts });
    }
    return logs.reverse(); // Chronological order
};
const generateAssignments = (isAtRisk) => {
    const assignments = [];
    for (let i = 1; i <= 5; i++) {
        const dueDate = (0, date_fns_1.subDays)(new Date(), (5 - i) * 7).toISOString(); // Weekly assignments
        let submittedDate = (0, date_fns_1.subDays)(new Date(), (5 - i) * 7 + faker_1.faker.number.int({ min: 0, max: 2 })).toISOString();
        let grade = faker_1.faker.number.int({ min: 70, max: 100 });
        if (isAtRisk && i > 3) {
            // Late or missing assignments recently
            if (Math.random() > 0.5) {
                submittedDate = null; // Missing
                grade = null;
            }
            else {
                // Late
                submittedDate = (0, date_fns_1.subDays)(new Date(), (5 - i) * 7 - 3).toISOString();
                grade = faker_1.faker.number.int({ min: 40, max: 60 });
            }
        }
        assignments.push({
            id: faker_1.faker.string.uuid(),
            title: `Assignment ${i}`,
            dueDate,
            submittedDate,
            grade
        });
    }
    return assignments;
};
const generateStudents = (count = 50) => {
    const students = [];
    for (let i = 0; i < count; i++) {
        // 20% chance of being an "at-risk" student simulation base
        const isAtRisk = i < 10; // First 10 always at risk for demo purposes
        const name = generateIndianName();
        const studentId = `S${2024001 + i}`;
        students.push({
            studentId,
            name,
            email: `${name.toLowerCase().replace(' ', '.')}@university.edu`,
            activityLogs: generateActivityLogs(isAtRisk),
            assignments: generateAssignments(isAtRisk),
            grades: isAtRisk ? [85, 80, 75, 60, 50] : [80, 82, 85, 88, 90], // Simulated grade history
            riskScore: 0, // Calculated later
            riskLevel: 'LOW',
            redFlags: []
        });
    }
    return students;
};
exports.generateStudents = generateStudents;
