import express from 'express';

import customerRoutes from './routes/customer.routes.js';
import employeeRoutes from './routes/employee.routes.js';
import serviceRoutes from './routes/services.routes.js';
import leadServicesRoutes from './routes/lead-services.routes.js';
import leadEmployeesRoutes from './routes/lead-employees.routes.js';
import employeeScheduleRoutes from './routes/employee-schedule.routes.js';
import invoiceRoutes from './routes/invoice.routes.js';

import workerTaskRoutes from './routes/workerTask.routes.js';
import workerTaskUploadRoutes from './routes/upload.routes.js';
import uploadConfirmationRoutes from './routes/uploadConfirmation.routes.js';


import uploadRoutes from './routes/upload.routes.js';

import organizationRoutes from './routes/organization.routes.js'

import authRoutes from './routes/auth.routes.js';
import { requireAuth } from './middlewares/auth.middleware.js';


//admin
import adminLeadsRoutes from './routes/adminLeads.routes.js';
import leadRoutes from './routes/lead.routes.js';
import taskRoutes from './routes/adminTasks.router.js';
import scheduleRoutes from './routes/employeeSchedule.router.js';
import companyHoliday from './routes/companyholiday.routes.js';
import empLeaves from './routes/employeeLeave.routes.js';
import empWorkingHours from './routes/employeeWorkingHours.routes.js';

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


app.use('/employees', requireAuth, employeeRoutes);
app.use('/services', requireAuth, serviceRoutes);
app.use('/lead-services', requireAuth, leadServicesRoutes);
app.use('/lead-employees', requireAuth, leadEmployeesRoutes);
app.use('/employee-schedule', requireAuth, employeeScheduleRoutes);
app.use('/invoices', requireAuth, invoiceRoutes);

app.use('/workertaskui', requireAuth, workerTaskRoutes);
app.use('/workertaskinoivoicepicture', requireAuth, workerTaskUploadRoutes);

app.use('/uploads', requireAuth, uploadRoutes);
app.use('/upload-confirmation', requireAuth, uploadConfirmationRoutes);

app.use('/strictadmin/organization', requireAuth, organizationRoutes);


//admin

app.use('/admin', requireAuth, adminLeadsRoutes);
app.use('/leads', requireAuth, leadRoutes);
app.use('/tasks', requireAuth, taskRoutes);
app.use('/schedule', requireAuth, scheduleRoutes);
app.use('/company-holidays', requireAuth, companyHoliday);
app.use('/employee-working-hours', requireAuth, empWorkingHours);
app.use('/employee-leaves', requireAuth, empLeaves);

export default app;