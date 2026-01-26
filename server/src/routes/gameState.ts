
import { Router } from 'express';
import { query } from '../db';

const router = Router();

// GET game state
router.get('/', async (req, res) => {
    try {
        const result = await query('SELECT * FROM game_state WHERE id = $1', ['global']);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Game state not found' });
        }
        const row = result.rows[0];
        // CamelCase conversion
        const gameState = {
            id: row.id,
            resources: row.resources,
            corruption: row.corruption,
            currentMonth: row.current_month,
            isPenitentMode: row.is_penitent_mode,
            armyStrength: row.army_strength,
            sectorHistory: row.sector_history,
            ownedUnits: row.owned_units
        };
        res.json(gameState);
    } catch (err) {
        console.error('Error fetching game state:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST/PUT update game state (Sync)
// In a real app we might update specific fields, but for this sync logic 
// we'll accept a partial object and merge it, or overwrite key fields.
router.post('/', async (req, res) => {
    const state = req.body;

    // We update all tracked fields if they are present in the payload
    const fields = [];
    const values = [];
    let idx = 1;

    if (state.resources) { fields.push(`resources = $${idx++}`); values.push(state.resources); }
    if (state.corruption !== undefined) { fields.push(`corruption = $${idx++}`); values.push(state.corruption); }
    if (state.currentMonth !== undefined) { fields.push(`current_month = $${idx++}`); values.push(state.currentMonth); }
    if (state.isPenitentMode !== undefined) { fields.push(`is_penitent_mode = $${idx++}`); values.push(state.isPenitentMode); }
    if (state.armyStrength) { fields.push(`army_strength = $${idx++}`); values.push(state.armyStrength); }
    if (state.sectorHistory) { fields.push(`sector_history = $${idx++}`); values.push(state.sectorHistory); }
    if (state.ownedUnits) { fields.push(`owned_units = $${idx++}`); values.push(state.ownedUnits); }

    if (fields.length === 0) return res.status(400).json({ message: 'No data to sync' });

    values.push('global');
    const sql = `UPDATE game_state SET ${fields.join(', ')} WHERE id = $${idx}`;

    try {
        await query(sql, values);
        res.json({ message: 'Game state synced' });
    } catch (err) {
        console.error('Error syncing game state:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;
