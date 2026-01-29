import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';

import taskRoutes from './routes/tasks';
import gameStateRoutes from './routes/gameState';
import projectRoutes from './routes/projects';
import './db/init'; // Initialize DB and run migrations

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

import { verifyToken } from './middleware/auth';

import migrationRoutes from './routes/migration';

// Apply auth middleware to all API routes
app.use('/api/tasks', verifyToken, taskRoutes);
app.use('/api/game-state', verifyToken, gameStateRoutes);
app.use('/api/projects', verifyToken, projectRoutes);
app.use('/api/migration', verifyToken, migrationRoutes);

import authRoutes from './routes/auth';
app.use('/api/auth', authRoutes); // Public route for login

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

app.get('/', (req, res) => {
    res.send('Imperial Vox-Link Active. Praise the Omnissiah.');
});

import { startScheduler } from './scheduler';

app.listen(port, () => {
    console.log(`[Server]: Server is running at http://localhost:${port}`);
    startScheduler(); // Initialize Corruption Engine
});
