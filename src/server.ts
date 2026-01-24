import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

import authRoutes from './routes/auth.routes.js';
import superRoutes from './routes/super.routes.js';
import receptionRoutes from './routes/reception.routes.js';
import doctorRoutes from './routes/doctor.routes.js';
import billingRoutes from './routes/billing.routes.js';
import clinicRoutes from './routes/clinic.routes.js';
import departmentRoutes from './routes/department.routes.js';
import patientRoutes from './routes/patient.routes.js';
import formsRoutes from './routes/forms.routes.js';

import { startTime } from './utils/system.js';

dotenv.config();

const app = express();
export const prisma = new PrismaClient();

const PORT = Number(process.env.PORT) || 5000;

/* -------------------- MIDDLEWARES -------------------- */

app.use(helmet());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || true, // ✅ Railway + Local both
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'x-clinic-id'
    ]
  })
);

app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

/* -------------------- ROUTES -------------------- */

app.use('/api/auth', authRoutes);
app.use('/api/super', superRoutes);
app.use('/api/reception', receptionRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/clinic', clinicRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/forms', formsRoutes);

/* -------------------- HEALTH CHECK -------------------- */

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Exclusive Vision HIS API is fully operational 🚀'
  });
});

/* -------------------- GLOBAL ERROR HANDLER -------------------- */

app.use(
  (err: any, _req: Request, res: Response, _next: NextFunction) => {
    const statusCode = err.statusCode || 500;

    res.status(statusCode).json({
      success: false,
      status: err.status || 'error',
      message: err.message || 'Internal Server Error',
      error: process.env.NODE_ENV === 'development' ? err : undefined
    });
  }
);

/* -------------------- SERVER START -------------------- */

const server = app.listen(PORT, () => {
  console.log(`
🚀 EV Clinic HIS Backend (Restarted)
--------------------------------
Status : RUNNING
Port   : ${PORT}
Env    : ${process.env.NODE_ENV || 'production'}
Started: ${startTime}
--------------------------------
`);
});

/* -------------------- GRACEFUL SHUTDOWN -------------------- */

process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  await prisma.$disconnect();
  server.close(() => process.exit(0));
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

export default app;
