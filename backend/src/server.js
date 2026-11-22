const express = require('express');
const cors = require('cors');
const pool = require('./config/db');

const facilityRoutes = require('./routes/facilityRoutes');
const slotRoutes = require('./routes/slotRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const authRoutes = require('./routes/authRoutes');

require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/facilities', facilityRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
    res.json({
        message: 'University Sports Booking API is running'
    });
});

app.get('/api/health/db', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT NOW() AS current_time'
        );

        res.json({
            database: 'connected',
            time: result.rows[0].current_time
        });
    } catch (error) {
        console.error(
            'Database query failed:',
            error.message
        );

        res.status(500).json({
            database: 'disconnected'
        });
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(
        `Server running on http://localhost:${PORT}`
    );
});