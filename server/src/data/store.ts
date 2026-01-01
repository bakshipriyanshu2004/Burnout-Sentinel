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
