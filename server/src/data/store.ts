import { Student } from '../types';
import { generateStudents } from './generator';

class DataStore {
    private students: Student[] = [];

    constructor() {
        this.initialize();
    }

    private initialize() {
        console.log('Initializing in-memory data store...');
        this.students = generateStudents(50);

        // Ensure we have at least one student and override it to be the Demo Student
        if (this.students.length > 0) {
            this.students[0].name = "Priyanshu Bakshi";
            this.students[0].studentId = "STD2506";
            this.students[0].email = "bakshi@gmail.com";
            // Keep other generated data (logs, grades) so risk engine works!
        }

        console.log(`Generated ${this.students.length} students.`);
    }

    getAllStudents(): Student[] {
        return this.students;
    }

    getStudentById(id: string): Student | undefined {
        return this.students.find(s => s.studentId === id);
    }

    getStudentByEmail(email: string): Student | undefined {
        return this.students.find(s => s.email === email);
    }
}

export const store = new DataStore();
