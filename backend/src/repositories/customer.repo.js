// src/repositories/customer.repo.js
import { pool } from '../config/db.js';

/**
 * CREATE customer
 */
export async function createCustomer({ name, phone, email, address }) {
    const query = `
    INSERT INTO customers (name, phone, email, address)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;

    const { rows } = await pool.query(query, [
        name,
        phone,
        email,
        address,
    ]);

    return rows[0];
}

/**
 * READ all customers
 */
export async function getAllCustomers() {
    const { rows } = await pool.query(
        `SELECT * FROM customers ORDER BY created_at DESC`
    );
    return rows;
}

/**
 * READ customer by ID
 */
export async function getCustomerById(id) {
    const { rows } = await pool.query(
        `SELECT * FROM customers WHERE id = $1`,
        [id]
    );
    return rows[0];
}

/**
 * UPDATE customer
 */
export async function updateCustomer(id, { name, phone, email, address }) {
    const query = `
    UPDATE customers
    SET
      name = $1,
      phone = $2,
      email = $3,
      address = $4,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $5
    RETURNING *;
  `;

    const { rows } = await pool.query(query, [
        name,
        phone,
        email,
        address,
        id,
    ]);

    return rows[0];
}

/**
 * DELETE customer
 */
export async function deleteCustomer(id) {
    await pool.query(
        `DELETE FROM customers WHERE id = $1`,
        [id]
    );
}