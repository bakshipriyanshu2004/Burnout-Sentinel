"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.store = void 0;
const generator_1 = require("./generator");
class DataStore {
    constructor() {
        this.students = [];
        this.initialize();
    }
    initialize() {
        console.log('Initializing in-memory data store...');
        this.students = (0, generator_1.generateStudents)(50);
        console.log(`Generated ${this.students.length} students.`);
    }
    getAllStudents() {
        return this.students;
    }
    getStudentById(id) {
        return this.students.find(s => s.studentId === id);
    }
    getStudentByEmail(email) {
        return this.students.find(s => s.email === email);
    }
}
exports.store = new DataStore();
