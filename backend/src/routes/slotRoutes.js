
const express = require('express');
const pool = require('../config/db');
const authenticateToken = require('../middleware/authMiddleware');
const requireAdmin = require('../middleware/adminMiddleware');

const router = express.Router();

// Get all slots or only available slots
router.get('/', async (req, res) => {
    try {
        const availableOnly = req.query.available === 'true';

        const result = await pool.query(
            `
            SELECT
                slots.id,
                slots.facility_id,
                facilities.name AS facility_name,
                facilities.sport,
                slots.start_time,
                slots.end_time
            FROM slots
            JOIN facilities
                ON slots.facility_id = facilities.id
            WHERE
                $1 = FALSE
                OR NOT EXISTS (
                    SELECT 1
                    FROM bookings
                    WHERE bookings.slot_id = slots.id
                      AND bookings.status = 'CONFIRMED'
                )
            ORDER BY slots.start_time
            `,
            [availableOnly]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Failed to fetch slots:', error.message);

        res.status(500).json({
            error: 'Failed to fetch slots'
        });
    }
});

// Create a slot - Admin only
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
    const { facility_id, start_time, end_time } = req.body;

    if (!facility_id || !start_time || !end_time) {
        return res.status(400).json({
            error: 'facility_id, start_time and end_time are required'
        });
    }

    if (
        !Number.isInteger(facility_id) ||
        facility_id <= 0 ||
        !Number.isFinite(Date.parse(start_time)) ||
        !Number.isFinite(Date.parse(end_time)) ||
        new Date(end_time) <= new Date(start_time)
    ) {
        return res.status(400).json({
            error: 'Invalid facility ID or slot time range'
        });
    }

    try {
        const result = await pool.query(
            `
            INSERT INTO slots (facility_id, start_time, end_time)
            VALUES ($1, $2, $3)
            RETURNING id, facility_id, start_time, end_time
            `,
            [facility_id, start_time, end_time]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({
                error: 'This slot already exists'
            });
        }

        if (error.code === '23503') {
            return res.status(404).json({
                error: 'Facility not found'
            });
        }

        console.error('Failed to create slot:', error.message);

        res.status(500).json({
            error: 'Failed to create slot'
        });
    }
});

module.exports = router;
