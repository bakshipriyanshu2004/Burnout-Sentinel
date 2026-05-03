import * as admin from 'firebase-admin';
import { getDB, connectDB } from '../data/db';
import path from 'path';

// IMPORTANT: You must download your Firebase Admin SDK service account key JSON file
// and place it in the server/src/scripts/ directory as 'serviceAccountKey.json'
try {
    const serviceAccount = require('./serviceAccountKey.json');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
} catch (error) {
    console.error("Failed to initialize Firebase Admin. Did you provide the serviceAccountKey.json?");
    process.exit(1);
}

const syncUsersToFirebase = async () => {
    try {
        await connectDB();
        const db = getDB();

        console.log("Fetching users from SQLite...");
        const teachers = await db.all('SELECT * FROM Teachers');
        const students = await db.all('SELECT * FROM Students');

        console.log(`Found ${teachers.length} teachers and ${students.length} students. Starting sync...`);

        // Sync Teachers
        for (const teacher of teachers) {
            const email = `${teacher.teacherId.toLowerCase()}@bcrec.edu`; // e.g., t1@bcrec.edu
            const password = teacher.passwordHash;
            
            try {
                // Try to create the user
                await admin.auth().createUser({
                    uid: teacher.teacherId, // Set UID explicitly to teacherId
                    email: email,
                    password: password,
                    displayName: `${teacher.name} (${teacher.department})`,
                });
                console.log(`Created Teacher Firebase User: ${teacher.teacherId}`);
            } catch (err: any) {
                if (err.code === 'auth/email-already-exists' || err.code === 'auth/uid-already-exists') {
                    // Update if already exists
                    await admin.auth().updateUser(teacher.teacherId, {
                        password: password,
                        displayName: `${teacher.name} (${teacher.department})`,
                    });
                    console.log(`Updated Teacher Firebase User: ${teacher.teacherId}`);
                } else {
                    console.error(`Error syncing teacher ${teacher.teacherId}:`, err.message);
                }
            }
        }

        // Sync Students
        for (const student of students) {
            const email = student.email;
            const password = student.dob; // Using Date of Birth as requested

            try {
                await admin.auth().createUser({
                    uid: student.studentId, // Set UID explicitly to Roll Number
                    email: email,
                    password: password,
                    displayName: student.name,
                });
                console.log(`Created Student Firebase User: ${student.studentId}`);
            } catch (err: any) {
                if (err.code === 'auth/email-already-exists' || err.code === 'auth/uid-already-exists') {
                    await admin.auth().updateUser(student.studentId, {
                        password: password,
                        displayName: student.name,
                    });
                    console.log(`Updated Student Firebase User: ${student.studentId}`);
                } else {
                    console.error(`Error syncing student ${student.studentId}:`, err.message);
                }
            }
        }

        console.log("Firebase sync completed successfully!");
        process.exit(0);

    } catch (error) {
        console.error("Sync process failed:", error);
        process.exit(1);
    }
};

syncUsersToFirebase();
