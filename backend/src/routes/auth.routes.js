import express from 'express';
import { registerEmployee, loginEmployee } from '../controllers/auth.controller.js';


const router = express.Router();

router.post('/register', registerEmployee);
router.post('/login', loginEmployee);

export default router;