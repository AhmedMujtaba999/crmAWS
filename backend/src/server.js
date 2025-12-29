import { env } from './config/env.js';
import app from './app.js';
import { pool } from './config/db.js';

async function startServer() {
    try {
        // 🔥 TEST DB CONNECTION
        await pool.query('SELECT 1');
        console.log('✅ Database connection verified');

        app.listen(env.port, () => {
            console.log(`🚀 Server running on port ${env.port}`);
        });
    } catch (err) {
        console.error('❌ Failed to start server', err);
        process.exit(1);
    }
}

startServer();
