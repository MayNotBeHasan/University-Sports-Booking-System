const pool = require('./config/db');

async function testDatabase() {
    try {
        const result = await pool.query('SELECT NOW() AS current_time');

        console.log('Database connected successfully.');
        console.log('Database time:', result.rows[0].current_time);

        await pool.end();
    } catch (error) {
        console.error('Database connection failed.');
        console.error(error.message);

        process.exit(1);
    }
}

testDatabase();
