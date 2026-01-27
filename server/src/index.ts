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

app.use('/api/tasks', taskRoutes);
app.use('/api/game-state', gameStateRoutes);
app.use('/api/projects', projectRoutes);

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
