import express from 'express';
import customerRoutes from './routes/customer.routes.js';

const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.use('/customers', customerRoutes);


export default app;