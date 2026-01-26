
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const schemaSql = `
    -- Tasks Table
    CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        faction TEXT NOT NULL,
        difficulty INTEGER NOT NULL,
        due_date TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        status TEXT NOT NULL,
        is_recurring BOOLEAN DEFAULT FALSE,
        last_completed_at TIMESTAMP WITH TIME ZONE
    );

    -- Projects Table
    CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        month TEXT NOT NULL,
        difficulty INTEGER NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        sub_tasks JSONB DEFAULT '[]'::jsonb
    );

    -- Game State Table
    CREATE TABLE IF NOT EXISTS game_state (
        id TEXT PRIMARY KEY DEFAULT 'global',
        resources JSONB DEFAULT '{"rp": 0, "glory": 0}'::jsonb,
        corruption INTEGER DEFAULT 0,
        current_month INTEGER DEFAULT 0,
        is_penitent_mode BOOLEAN DEFAULT FALSE,
        army_strength JSONB DEFAULT '{"reserves": {"guardsmen": 0, "spaceMarines": 0, "custodes": 0, "dreadnought": 0, "baneblade": 0}, "garrisons": {}, "totalActivePower": 0}'::jsonb,
        sector_history JSONB DEFAULT '{}'::jsonb,
        owned_units JSONB DEFAULT '[]'::jsonb
    );
`;

const initDb = async () => {
    try {
        console.log('Connecting to database...');
        console.log('DB URL:', process.env.DATABASE_URL ? 'Loaded' : 'Missing');

        await pool.query(schemaSql);
        console.log('Schema created successfully.');

        // Initialize default game state if not exists
        const checkState = await pool.query('SELECT * FROM game_state WHERE id = $1', ['global']);
        if (checkState.rows.length === 0) {
            await pool.query('INSERT INTO game_state (id) VALUES ($1)', ['global']);
            console.log('Default game state initialized.');
        } else {
            console.log('Game state already exists.');
        }

    } catch (err) {
        console.error('Error initializing database:', err);
    } finally {
        await pool.end();
    }
};

initDb();
