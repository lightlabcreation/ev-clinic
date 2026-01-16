import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

import authRoutes from './routes/auth.routes';
import superRoutes from './routes/super.routes';
import receptionRoutes from './routes/reception.routes';
import doctorRoutes from './routes/doctor.routes';
import billingRoutes from './routes/billing.routes';
import clinicRoutes from './routes/clinic.routes';
import departmentRoutes from './routes/department.routes';
import patientRoutes from './routes/patient.routes';
import formsRoutes from './routes/forms.routes';

import { startTime } from './utils/system';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

// Security Middlewares
app.use(helmet());
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-clinic-id']
}));
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/super', superRoutes);
app.use('/api/reception', receptionRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/clinic', clinicRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/forms', formsRoutes);

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ success: true, message: 'Exclusive Vision HIS API is fully operational' });
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        status: err.status || 'error',
        message: err.message || 'An unexpected error occurred on the server',
        error: process.env.NODE_ENV === 'development' ? err : undefined
    });
});

app.listen(PORT, () => {
    console.log(`
  🚀 EV Clinic HIS Backend
  -----------------------
  Status: Operational
  Port: ${PORT}
  Mode: ${process.env.NODE_ENV}
  -----------------------
  `);
});

export { prisma, startTime };
