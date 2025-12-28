import { pool } from '../config/db.js';

/**
 * Assign employee to lead with hours worked
 */
export async function addEmployeeToLead({
    lead_id,
    employee_id,
    hours_worked,
    role_on_job
}) {
    const result = await pool.query(
        `
    INSERT INTO lead_employees
      (lead_id, employee_id, hours_worked, role_on_job)
    VALUES
      ($1, $2, $3, $4)
    RETURNING *
    `,
        [lead_id, employee_id, hours_worked, role_on_job]
    );

    return result.rows[0];
}

/**
 * Get all employees working on a lead
 */
export async function getEmployeesByLead(lead_id) {
    const result = await pool.query(
        `
    SELECT
      le.lead_id,
      le.employee_id,
      e.name AS employee_name,
      le.role_on_job,
      le.hours_worked,
      le.labor_cost
    FROM lead_employees le
    JOIN employees e ON e.id = le.employee_id
    WHERE le.lead_id = $1
    `,
        [lead_id]
    );

    return result.rows;
}

/**
 * Admin/debug – get all lead_employees
 */
export async function getAllLeadEmployees() {
    const result = await pool.query(
        `
    SELECT
      le.lead_id,
      le.employee_id,
      e.name AS employee_name,
      le.role_on_job,
      le.hours_worked,
      le.labor_cost
    FROM lead_employees le
    JOIN employees e ON e.id = le.employee_id
    ORDER BY le.lead_id
    `
    );

    return result.rows;
}

/**
 * Update hours / role
 */
export async function updateLeadEmployee(
    lead_id,
    employee_id,
    hours_worked,
    role_on_job
) {
    const result = await pool.query(
        `
    UPDATE lead_employees
    SET hours_worked = $1,
        role_on_job = $2
    WHERE lead_id = $3
      AND employee_id = $4
    RETURNING *
    `,
        [hours_worked, role_on_job, lead_id, employee_id]
    );

    return result.rows[0];
}

/**
 * Remove employee from lead
 */
export async function removeEmployeeFromLead(lead_id, employee_id) {
    const result = await pool.query(
        `
    DELETE FROM lead_employees
    WHERE lead_id = $1
      AND employee_id = $2
    RETURNING *
    `,
        [lead_id, employee_id]
    );

    return result.rows[0];
}