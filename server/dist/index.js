"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_1 = __importDefault(require("./routes/auth"));
const students_1 = __importDefault(require("./routes/students"));
const app = (0, express_1.default)();
const PORT = 3001;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/students', students_1.default); // For admin list
app.use('/api/student', students_1.default); // For student portal (me) - reusing file but routes within handle paths
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
