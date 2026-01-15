import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function requireAuth(req, res, next) {
    try {
        const header = req.headers.authorization || '';
        const token = header.startsWith('Bearer ')
            ? header.slice(7)
            : null;

        if (!token) {
            return res.status(401).json({ error: 'Missing token' });
        }

        const payload = jwt.verify(token, env.JWT_SECRET);
        req.user = payload;

        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

export function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!allowedRoles.includes(req.auth.role)) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        next();
    };
}