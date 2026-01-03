import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import studentRoutes from './routes/students';
import chatRoutes from './routes/chat';
import calendarRoutes from './routes/calendar';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes); // For admin list
app.use('/api/student', studentRoutes); // For student portal (me) - reusing file but routes within handle paths
app.use('/api/chat', chatRoutes);
app.use('/api/calendar', calendarRoutes);


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
