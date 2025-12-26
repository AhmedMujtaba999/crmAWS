// src/config/env.js
import dotenv from 'dotenv';

dotenv.config();

export const env = {
    port: process.env.PORT || 3000,

    db: {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        name: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    }
};