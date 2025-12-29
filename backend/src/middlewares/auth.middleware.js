import jwt from 'jsonwebtoken';
import { env } from '../config/env.js'; // ✅ IMPORT ENV

export function requireAuth(req, res, next) {
    try {
        console.log('➡️ requireAuth hit');
        console.log('JWT VERIFY SECRET =', env.JWT_SECRET);

        const header = req.headers.authorization || '';
        const token = header.startsWith('Bearer ') ? header.slice(7) : null;

        if (!token) {
            return res.status(401).json({ error: 'Missing token' });
        }
        console.log('JWT TOKEN =', token);
        const payload = jwt.verify(token, env.JWT_SECRET); // 
        console.log('JWT PAYLOAD =', payload);
        req.user = payload;

        next();
    } catch (e) {
        console.error('JWT ERROR:', e.message);
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

export function requireRole(...allowed) {
    return (req, res, next) => {
        const roles = req.user?.roles || [];
        const ok = allowed.some(r => roles.includes(r));
        if (!ok) return res.status(403).json({ error: 'Forbidden' });
        next();
    };
}