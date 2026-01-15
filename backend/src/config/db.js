// src/config/db.js
import pkg from 'pg';
import { env } from './env.js';

const { Pool } = pkg;

export const pool = new Pool({
    host: env.db.host,
    port: env.db.port,
    database: env.db.name,
    user: env.db.user,
    password: env.db.password,
    ssl: {
        rejectUnauthorized: false, // required for AWS RDS
    },
    /* 🔒 HARD LIMITS */
    max: 20,                    // max concurrent DB connections
    min: 2,                     // keep some warm connections
    idleTimeoutMillis: 30_000,  // close idle clients after 30s
    connectionTimeoutMillis: 5_000, // fail if DB not reachable in 5s

    /* ⚡ FAIL FAST */
    statement_timeout: 10_000,  // kill queries > 10s
    query_timeout: 10_000,

    application_name: 'crm-api'

});

pool.on('connect', () => {
    console.log('✅ PostgreSQL connected');
});

pool.on('error', (err) => {
    console.error('❌ PostgreSQL pool error', err);
});