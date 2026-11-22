const express = require('express');
const pool = require('../config/db');
const authenticateToken = require('../middleware/authMiddleware');
const requireAdmin = require('../middleware/adminMiddleware');

const router = express.Router();

// Get all facilities
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, name, sport, location, capacity
            FROM facilities
            ORDER BY id
        `);

        res.json(result.rows);
    } catch (error) {
        console.error('Failed to fetch facilities:', error.message);

        res.status(500).json({
            error: 'Failed to fetch facilities'
        });
    }
});

// Create a facility - Admin only
router.post(
    '/',
    authenticateToken,
    requireAdmin,
    async (req, res) => {
        const { name, sport, location, capacity } = req.body;

        if (!name || !sport || !location || !capacity) {
            return res.status(400).json({
                error: 'name, sport, location and capacity are required'
            });
        }

        if (capacity <= 0) {
            return res.status(400).json({
                error: 'capacity must be greater than 0'
            });
        }

        try {
            const result = await pool.query(
                `
                INSERT INTO facilities
                    (name, sport, location, capacity)
                VALUES
                    ($1, $2, $3, $4)
                RETURNING id, name, sport, location, capacity
                `,
                [name, sport, location, capacity]
            );

            res.status(201).json(result.rows[0]);
        } catch (error) {
            console.error('Failed to create facility:', error.message);

            res.status(500).json({
                error: 'Failed to create facility'
            });
        }
    }
);

module.exports = router;