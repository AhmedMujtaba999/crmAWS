import bcrypt from 'bcrypt';
import { env } from '../config/env.js';
import * as repo from '../repositories/auth.repo.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = env.JWT_SECRET;
const JWT_EXPIRES_IN = env.JWT_EXPIRES_IN || '1d';

function signToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export async function registerEmployee(data) {
    const {
        name,
        phone,
        email,
        password,
        role,
        employment_type,
        hourly_rate,
        organization_id
    } = data;

    // ✅ Required fields
    if (!name || !phone || !email || !password || !organization_id) {
        throw new Error('name, phone, email, password, organization_id are required');
    }

    const existing = await repo.findEmployeeByEmailAndOrg(email, organization_id);
    if (existing) {
        throw new Error('Employee already exists in this organization');
    }

    const password_hash = await bcrypt.hash(password, 10);

    const employee = await repo.createEmployee({
        name,
        phone,
        email,
        role,
        employment_type,
        hourly_rate,
        password_hash,
        organization_id
    });

    const token = signToken({
        employee_id: employee.id,
        organization_id: employee.organization_id,
        role: employee.role
    });

    return { employee, token };
}

export async function login({ email, password, organization_id }) {
    if (!organization_id) throw new Error('organization_id is required');

    const user = await repo.findUserByEmailAndOrg(email, organization_id);
    if (!user || !user.is_active) throw new Error('Invalid credentials');

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) throw new Error('Invalid credentials');

    const roles = await repo.getUserRoles(user.id);

    const token = signToken({
        userId: user.id,
        organization_id: user.organization_id,
        roles
    });

    return {
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            organization_id: user.organization_id,
            is_active: user.is_active
        },
        roles,
        token
    };
}