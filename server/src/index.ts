import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';

import taskRoutes from './routes/tasks';
import gameStateRoutes from './routes/gameState';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/tasks', taskRoutes);
app.use('/api/game-state', gameStateRoutes);

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

app.get('/', (req, res) => {
    res.send('Imperial Vox-Link Active. Praise the Omnissiah.');
});

app.listen(port, () => {
    console.log(`[Server]: Server is running at http://localhost:${port}`);
});
