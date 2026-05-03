import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import studentRoutes from './routes/students';
import chatRoutes from './routes/chat';
import calendarRoutes from './routes/calendar';
import { connectDB } from './data/db';
import { seedDatabase } from './data/seed';
import { loadVectorStore } from './services/ragService';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/calendar', calendarRoutes);

connectDB().then(async () => {
    // await seedDatabase(); // Disabled to persist database state

    // Load RAG vector store (if documents have been indexed)
    loadVectorStore();

    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
});
