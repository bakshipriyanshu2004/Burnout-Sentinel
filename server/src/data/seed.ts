import { DEPARTMENTS } from './models';
import { generateStudentsWithDemographics } from './generator';
import fs from 'fs';
import path from 'path';
import { getDB } from './db';

const SPECIFIC_TEACHERS = [
    { name: 'Swadhin Kumar Mondal', subject: 'Games & App Design' },
    { name: 'Monalisa Chakraborty', subject: 'AIML' },
    { name: 'Rajkumar Samanta', subject: 'Data Vizualization' },
    { name: 'Ardhendu Chattopadhayay', subject: 'Design Process and Perspective' },
    { name: 'Subhajit Bhattacharya', subject: 'Robotics' },
    { name: 'Prasanjit Maji', subject: 'Research Methodology' }
];

export const seedDatabase = async () => {
    try {
        const db = getDB();
        
        await db.exec('DELETE FROM Teachers');
        await db.exec('DELETE FROM Students');
        await db.exec('DELETE FROM SubjectMarks');
        
        let teachersList: any[] = [];
        
        console.log('[Seed] Seeding specific subject teachers...');
        const stmt = await db.prepare('INSERT INTO Teachers (teacherId, name, department, subject, passwordHash) VALUES (?, ?, ?, ?, ?)');
        
        for (let i = 0; i < SPECIFIC_TEACHERS.length; i++) {
            // "Name credentials should be same" -> Using First Name as ID, and same password for all
            const firstName = SPECIFIC_TEACHERS[i].name.split(' ')[0];
            const t = {
                teacherId: firstName,
                name: SPECIFIC_TEACHERS[i].name,
                department: 'CSD',
                subject: SPECIFIC_TEACHERS[i].subject,
                passwordHash: 'bcrec123' // Same password for all
            };
            await stmt.run(t.teacherId, t.name, t.department, t.subject, t.passwordHash);
            teachersList.push(t);
        }
        await stmt.finalize();
        console.log('[Seed] 6 Subject Teachers seeded successfully.');

        let studentsList: any[] = [];

        console.log('[Seed] Seeding 60 CSD students with demographics...');
        const generated = generateStudentsWithDemographics(); // Generates exactly 60 students
        
        const stmt2 = await db.prepare(`
            INSERT INTO Students (
                studentId, name, email, dob, department, activityLogs, assignments, grades, 
                riskScore, riskLevel, gradeTrend, engagementScore, attendancePercentage, redFlags
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (let index = 0; index < generated.length; index++) {
            const s = generated[index];
            const dept = 'CSD';
            
            const initialAttendance = Math.floor(Math.random() * 41) + 60;

            await stmt2.run(
                s.studentId, s.name, s.email, s.dob, dept,
                JSON.stringify(s.activityLogs), JSON.stringify(s.assignments), JSON.stringify(s.grades),
                s.riskScore, s.riskLevel, s.gradeTrend, s.engagementScore, initialAttendance, JSON.stringify(s.redFlags)
            );
            
            studentsList.push({ ...s, department: dept, attendancePercentage: initialAttendance });
        }
        await stmt2.finalize();
        console.log('[Seed] 60 Dummy students seeded successfully for CSD.');

        console.log('[Seed] Seeding Subject Marks for all students...');
        const subjectsList = [
            'Games & App Design',
            'AIML',
            'Data Vizualization',
            'Design Process and Perspective',
            'Robotics',
            'Research Methodology'
        ];
        
        const stmt3 = await db.prepare('INSERT INTO SubjectMarks (studentId, subjectName, ca1, ca2, ca3, ca4, attendance) VALUES (?, ?, ?, ?, ?, ?, ?)');
        for (const s of studentsList) {
            for (const subject of subjectsList) {
                // Determine a base performance for this student/subject
                const isGood = Math.random() > 0.3;
                const minMark = isGood ? 60 : 30;
                const maxMark = isGood ? 100 : 75;
                const ca1 = Math.floor(Math.random() * (maxMark - minMark + 1)) + minMark;
                const ca2 = Math.floor(Math.random() * (maxMark - minMark + 1)) + minMark;
                const ca3 = Math.floor(Math.random() * (maxMark - minMark + 1)) + minMark;
                const ca4 = Math.floor(Math.random() * (maxMark - minMark + 1)) + minMark;
                
                // Attendance between 50 and 100
                const att = Math.floor(Math.random() * 51) + 50;
                
                await stmt3.run(s.studentId, subject, ca1, ca2, ca3, ca4, att);
            }
        }
        await stmt3.finalize();
        console.log('[Seed] Subject marks seeded successfully.');

        // Write credentials to a text file for the user
        if (teachersList.length > 0 && studentsList.length > 0) {
            const credsPath = path.join(__dirname, '../../../student_credentials.txt');
            
            let credsContent = 'BURNOUT SENTINEL - GENERATED LOGIN CREDENTIALS\n';
            credsContent += '==============================================\n\n';
            
            credsContent += 'SUBJECT TEACHERS (CSD FACULTY)\n';
            credsContent += '------------------------------\n';
            teachersList.forEach(t => {
                credsContent += `Guru ID: ${t.teacherId} | Password: ${t.passwordHash} | Name: ${t.name} | Subject: ${t.subject}\n`;
            });

            credsContent += '\nSTUDENTS (SISHYAS) - All 60 CSD Students\n';
            credsContent += '----------------------------------------\n';
            
            studentsList.forEach(s => {
                credsContent += `Roll Number: ${s.studentId} | DOB: ${s.dob} | Name: ${s.name} | Email: ${s.email}\n`;
            });
            
            fs.writeFileSync(credsPath, credsContent, 'utf-8');
            console.log(`[Seed] Credentials written to ${credsPath}`);
        }

    } catch (error) {
        console.error('[Seed] Error seeding database:', error);
    }
};
