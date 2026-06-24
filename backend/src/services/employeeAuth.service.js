import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import * as repo from '../repositories/employee.repo.js';

const JWT_SECRET = env.JWT_SECRET;
const JWT_EXPIRES_IN = env.JWT_EXPIRES_IN || '1d';

function signToken(payload) {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN
    });
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

    const existing = await repo.findEmployeeForLogin(email, organization_id);
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

export async function loginEmployee({ email, password, organization_id }) {
    if (!email || !password || !organization_id) {
        throw new Error('email, password, and organization_id are required');
    }

    const employee = await repo.findEmployeeForLogin(email, organization_id);

    if (!employee) {
        throw new Error('Invalid credentials');
    }

    if (!employee.is_active) {
        throw new Error('Employee account is inactive');
    }

    const ok = await bcrypt.compare(password, employee.password_hash);
    if (!ok) {
        throw new Error('Invalid credentials');
    }

    const token = signToken({
        employee_id: employee.id,
        organization_id: employee.organization_id,
        role: employee.role
    });

    return {
        employee: {
            id: employee.id,
            name: employee.name,
            email: employee.email,
            role: employee.role,
            organization_id: employee.organization_id
        },
        token
    };
}
