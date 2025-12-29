import bcrypt from 'bcrypt';
import { env } from '../config/env.js';
import * as repo from '../repositories/auth.repo.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = env.JWT_SECRET;
const JWT_EXPIRES_IN = env.JWT_EXPIRES_IN || '1d';

function signToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export async function register({ name, email, password }) {
    const existing = await repo.findUserByEmail(email);
    if (existing) throw new Error('Email already registered');

    const password_hash = await bcrypt.hash(password, 10);
    const user = await repo.createUser({ name, email, password_hash });

    // default role for new users (change if you want)
    await repo.assignRoleToUser(user.id, 'DISPATCHER');

    const roles = await repo.getUserRoles(user.id);
    const token = signToken({ userId: user.id, roles });

    return { user, roles, token };
}

export async function login({ email, password }) {
    const user = await repo.findUserByEmail(email);
    if (!user || !user.is_active) throw new Error('Invalid credentials');

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) throw new Error('Invalid credentials');

    const roles = await repo.getUserRoles(user.id);
    const token = signToken({ userId: user.id, roles });

    return {
        user: { id: user.id, name: user.name, email: user.email, is_active: user.is_active },
        roles,
        token
    };
}