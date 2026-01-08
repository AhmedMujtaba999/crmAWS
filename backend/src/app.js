import express from 'express';

import customerRoutes from './routes/customer.routes.js';
import leadRoutes from './routes/lead.routes.js';
import taskRoutes from './routes/task.routes.js';
import employeeRoutes from './routes/employee.routes.js';
import serviceRoutes from './routes/services.routes.js';
import leadServicesRoutes from './routes/lead-services.routes.js';
import leadEmployeesRoutes from './routes/lead-employees.routes.js';
import employeeLeavesRoutes from './routes/employee-leaves.routes.js';
import employeeScheduleRoutes from './routes/employee-schedule.routes.js';
import invoiceRoutes from './routes/invoice.routes.js';

import workerTaskRoutes from './routes/workerTask.routes.js';


import authRoutes from './routes/auth.routes.js';
import { requireAuth } from './middlewares/auth.middleware.js';

const app = express();

app.use(express.json());

/**
 * Public routes
 */
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.use('/auth', authRoutes);

/**
 * Protected routes (login required)
 */
app.use('/customers', requireAuth, customerRoutes);
app.use('/leads', requireAuth, leadRoutes);
app.use('/tasks', requireAuth, taskRoutes);
app.use('/employees', requireAuth, employeeRoutes);
app.use('/services', requireAuth, serviceRoutes);
app.use('/lead-services', requireAuth, leadServicesRoutes);
app.use('/lead-employees', requireAuth, leadEmployeesRoutes);
app.use('/employee-leaves', requireAuth, employeeLeavesRoutes);
app.use('/employee-schedule', requireAuth, employeeScheduleRoutes);
app.use('/invoices', requireAuth, invoiceRoutes);

app.use('/workertaskui', requireAuth, workerTaskRoutes);
app.use('/workertaskui', requireAuth, workerTaskRoutes);
app.use('/workertaskui', requireAuth, workerTaskRoutes);

export default app;