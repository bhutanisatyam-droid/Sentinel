import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../lib/prisma';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string(),
    phone: z.string().optional(),
});

router.post('/register', async (req, res) => {
    try {
        const { email, password, name } = registerSchema.parse(req.body);

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                name,
                role: 'customer',
                balance: 50000,
                kycStatus: 'pending',
            },
        });

        const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET);
        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                kycStatus: user.kycStatus, // Added
                balance: user.balance,     // Added
                riskScore: 0               // Added default
            }
        });
    } catch (error: any) {
        console.error("Registration Error");
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors.map(e => e.message).join(", ") });
        }
        res.status(400).json({ error: error.message || 'Invalid input or server error' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET);
        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                kycStatus: user.kycStatus,
                balance: user.balance
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
