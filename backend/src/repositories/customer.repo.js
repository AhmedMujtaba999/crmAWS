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




/**
 * CRUD operattions usinng client
 */


/**
 * create
 */
export async function createClient(client, data) {
    const { rows } = await client.query(
        `INSERT INTO customers (name, phone, email, address, organization_id)
         VALUES ($1,$2,$3,$4,$5)
         RETURNING *`,
        [data.name, data.phone, data.email, data.address, data.organization_id]
    );
    return rows[0];
}



/**
 * read
 */
export async function findByPhoneClient(client, phone) {
    const { rows } = await client.query(
        `SELECT * FROM customers WHERE phone = $1`,
        [phone]
    );
    return rows[0];
}

export async function findByIdClient(
    client,
    customer_id,
    organization_id
) {
    if (!customer_id) {
        throw new Error('customer_id is required');
    }
    if (!organization_id) {
        throw new Error('organization_id is required');
    }

    const { rows } = await client.query(
        `
    SELECT
      id,
      name,
      phone,
      email,
      address,
      created_at,
      updated_at,
      organization_id
    FROM customers
    WHERE id = $1
      AND organization_id = $2
    `,
        [customer_id, organization_id]
    );

    return rows[0] ?? null;
}

export async function getCustomerByIdClient(client, customerId) {
    if (!client) {
        throw new Error('DB client is required');
    }

    if (!customerId) {
        throw new Error('customerId is required');
    }

    const result = await client.query(
        `
        SELECT
            id,
            name,
            email,
            phone,
            created_at
        FROM customers
        WHERE id = $1
        `,
        [customerId]
    );

    return result.rows[0] || null;
}

export async function updateClient(
    client,
    customer_id,
    organization_id,
    { name, phone, email, address }
) {
    const { rows } = await client.query(
        `
    UPDATE customers
    SET
      name = $1,
      phone = $2,
      email = $3,
      address = $4,
      updated_at = NOW()
    WHERE id = $5
      AND organization_id = $6
    RETURNING *
    `,
        [name, phone, email, address, customer_id, organization_id]
    );

    return rows[0];
}
