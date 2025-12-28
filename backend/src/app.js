import express from 'express';

import customerRoutes from './routes/customer.routes.js';
import leadRoutes from './routes/lead.routes.js';
import taskRoutes from './routes/task.routes.js';
import employeeRoutes from './routes/employee.routes.js';
import serviceRoutes from './routes/services.routes.js';
import leadServicesRoutes from './routes/lead-services.routes.js';
import leadEmployeesRoutes from './routes/lead-employees.routes.js';

const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.use('/customers', customerRoutes);
app.use('/leads', leadRoutes);
app.use('/tasks', taskRoutes);
app.use('/employees', employeeRoutes);
app.use('/services', serviceRoutes);
app.use('/lead-services', leadServicesRoutes);
app.use('/lead-employees', leadEmployeesRoutes);




export default app;