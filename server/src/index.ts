import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import kycRoutes from './routes/kyc';
import transactionRoutes from './routes/transactions';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Request Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/transactions', transactionRoutes);

app.get('/', (req, res) => {
    res.send('AML Compliance Server Running');
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log("KYC Logic Updated: v3 (Fallback Enabled)"); // Force Restart
});
