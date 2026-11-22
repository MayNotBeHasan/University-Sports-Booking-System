const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const router = express.Router();

// Register a new user
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({
            error: 'name, email and password are required'
        });
    }

    if (password.length < 6) {
        return res.status(400).json({
            error: 'Password must be at least 6 characters'
        });
    }

    try {
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                error: 'Email is already registered'
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `
            INSERT INTO users (name, email, password_hash, role)
            VALUES ($1, $2, $3, 'STUDENT')
            RETURNING id, name, email, role, created_at
            `,
            [name, email, passwordHash]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Registration failed:', error.message);

        res.status(500).json({
            error: 'Registration failed'
        });
    }
});

// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            error: 'email and password are required'
        });
    }

    try {
        const result = await pool.query(
            `
            SELECT id, name, email, password_hash, role
            FROM users
            WHERE email = $1
            `,
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                error: 'Invalid email or password'
            });
        }

        const user = result.rows[0];

        const passwordMatch = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatch) {
            return res.status(401).json({
                error: 'Invalid email or password'
            });
        }

        const token = jwt.sign(
            {
                user_id: user.id,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '2h'
            }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login failed:', error.message);

        res.status(500).json({
            error: 'Login failed'
        });
    }
});

module.exports = router;