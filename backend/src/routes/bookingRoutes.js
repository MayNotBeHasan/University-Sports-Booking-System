const express = require('express');
const pool = require('../config/db');
const authenticateToken = require('../middleware/authMiddleware');
const requireAdmin = require('../middleware/adminMiddleware');

const router = express.Router();

// Create a booking
router.post('/', authenticateToken, async (req, res) => {
    const { slot_id } = req.body;
    const user_id = req.user.user_id;

    if (!slot_id) {
        return res.status(400).json({
            error: 'slot_id is required'
        });
    }

    try {
        // Check whether the requested slot exists
        const slotResult = await pool.query(
            `
            SELECT id
            FROM slots
            WHERE id = $1
            `,
            [slot_id]
        );

        if (slotResult.rows.length === 0) {
            return res.status(404).json({
                error: 'Slot not found'
            });
        }

        // Attempt the booking.
        // The database unique index handles concurrent requests.
        const result = await pool.query(
            `
            INSERT INTO bookings (user_id, slot_id, status)
            VALUES ($1, $2, 'CONFIRMED')
            RETURNING id, user_id, slot_id, status, created_at
            `,
            [user_id, slot_id]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        // PostgreSQL unique violation:
        // another request already booked this slot.
        if (error.code === '23505') {
            return res.status(409).json({
                error: 'Slot is already booked'
            });
        }

        console.error('Booking failed:', error.message);

        res.status(500).json({
            error: 'Booking failed'
        });
    }
});

// Get all bookings - Admin only
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                bookings.id,
                bookings.user_id,
                users.name AS user_name,
                bookings.slot_id,
                facilities.name AS facility_name,
                facilities.sport,
                slots.start_time,
                slots.end_time,
                bookings.status,
                bookings.created_at
            FROM bookings
            JOIN users
                ON bookings.user_id = users.id
            JOIN slots
                ON bookings.slot_id = slots.id
            JOIN facilities
                ON slots.facility_id = facilities.id
            ORDER BY bookings.created_at DESC
        `);

        res.json(result.rows);
    } catch (error) {
        console.error('Failed to fetch bookings:', error.message);

        res.status(500).json({
            error: 'Failed to fetch bookings'
        });
    }
});

// Get current user's bookings
router.get('/my', authenticateToken, async (req, res) => {
    const user_id = req.user.user_id;

    try {
        const result = await pool.query(
            `
            SELECT
                bookings.id,
                bookings.slot_id,
                facilities.name AS facility_name,
                facilities.sport,
                facilities.location,
                slots.start_time,
                slots.end_time,
                bookings.status,
                bookings.created_at,
                bookings.cancelled_at
            FROM bookings
            JOIN slots
                ON bookings.slot_id = slots.id
            JOIN facilities
                ON slots.facility_id = facilities.id
            WHERE bookings.user_id = $1
            ORDER BY slots.start_time DESC
            `,
            [user_id]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Failed to fetch user bookings:', error.message);

        res.status(500).json({
            error: 'Failed to fetch user bookings'
        });
    }
});

// Cancel a booking
router.patch('/:id/cancel', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const user_id = req.user.user_id;

    try {
        const result = await pool.query(
            `
            UPDATE bookings
            SET
                status = 'CANCELLED',
                cancelled_at = NOW()
            WHERE id = $1
              AND user_id = $2
              AND status = 'CONFIRMED'
            RETURNING id, user_id, slot_id, status, created_at, cancelled_at
            `,
            [id, user_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Confirmed booking not found'
            });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Cancellation failed:', error.message);

        res.status(500).json({
            error: 'Cancellation failed'
        });
    }
});

module.exports = router;