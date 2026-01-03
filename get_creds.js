// Retrieve credentials via API

// Node 18+ has native fetch

async function getCreds() {
    try {
        // 1. Login as Admin
        const loginRes = await fetch('http://localhost:3001/api/auth/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'admin' })
        });

        if (!loginRes.ok) {
            console.log("Login failed:", loginRes.status, await loginRes.text());
            return;
        }

        const loginData = await loginRes.json();
        const token = loginData.token;

        if (!token) {
            console.log("Failed to get admin token");
            return;
        }

        // 2. Fetch Students
        const studentsRes = await fetch('http://localhost:3001/api/students', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!studentsRes.ok) {
            console.log("Fetch students failed:", studentsRes.status);
            return;
        }

        const students = await studentsRes.json();

        if (students && students.length > 0) {
            const fs = require('fs');
            const path = require('path');

            let output = "STUDENT CREDENTIALS\n===================\n\n";
            output += `Admin Login: admin / admin\n\n`;

            students.forEach(s => {
                output += `Name: ${s.name}\nID:   ${s.studentId}\nEmail: ${s.email}\n-------------------\n`;
            });

            const outputPath = path.join(__dirname, 'student_credentials.txt');
            fs.writeFileSync(outputPath, output);
            console.log(`Successfully wrote ${students.length} credentials to ${outputPath}`);
        } else {
            console.log("No students found.");
        }
    } catch (e) {
        console.error(e);
    }
}

getCreds();
