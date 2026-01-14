import express from 'express';
import prisma from '../lib/prisma';
import { analyzeTransactionWithAI } from '../services/ai';
import { ComplianceConfig } from '../config/compliance';

const router = express.Router();

// Get User Transactions
router.get('/:userId', async (req, res) => {
    try {
        const transactions = await prisma.transaction.findMany({
            where: {
                OR: [
                    { fromUserId: req.params.userId },
                    { toUserId: req.params.userId }
                ]
            },
            orderBy: { timestamp: 'desc' },
            include: {
                fromUser: { select: { name: true, email: true } },
                toUser: { select: { name: true, email: true } }
            }
        });
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Create Transaction
router.post('/create', async (req, res) => {
    try {
        const { fromUserId, toUserId, amount, country, reason, toAccount } = req.body;

        // Real AI Analysis
        let aiExplanation = 'AI Analysis Pending...';
        let status = 'clear';
        let riskScore = 10;

        // Fetch real sender details for AI Context
        const sender = await prisma.user.findUnique({ where: { id: fromUserId } });
        const senderBalance = sender?.balance || 0;

        // Mock a transaction object for the AI
        const txForAi = {
            amount,
            fromUser: { balance: senderBalance },
            toUserId,
            country,
            reason
        };

        try {
            // Dynamic import to avoid build issues if file not perfect
            const { analyzeTransactionWithAI } = require('../services/ai');

            const analysis = await analyzeTransactionWithAI(txForAi);
            aiExplanation = analysis;

            // Simple keyword parsing from AI response to determine status
            if (analysis.toLowerCase().includes('suspicious') || analysis.toLowerCase().includes('high risk')) {
                status = 'flagged';
                riskScore = 85;
            } else if (analysis.toLowerCase().includes('medium risk')) {
                riskScore = 45;
            } else {
                riskScore = 15; // Low risk
            }
        } catch (e) {
            console.error("AI Service Error:", e);
            aiExplanation = "AI Service Unavailable. Manual Review Required.";
            riskScore = 50; // Neutral risk on error
        }

        // Check for Structuring/Smurfing patterns
        // Detects amounts specifically designed to fall just below reporting thresholds
        if (parseFloat(amount) === ComplianceConfig.STRUCTURING_THRESHOLD) {
            status = 'flagged';
            riskScore = 88;
            aiExplanation = `Suspicious Pattern Detected: Transaction amount (${amount}) matches the configured structuring threshold. This is just below the reporting limit of ${ComplianceConfig.REPORTING_THRESHOLD}, indicating potential intent to evade regulatory oversight.`;
        }

        const transaction = await prisma.transaction.create({
            data: {
                amount,
                fromUserId,
                toUserId,
                toAccount,
                country,
                riskScore,
                status,
                reason,
                aiExplanation,
            },
        });

        // Update balances if internal
        if (status !== 'blocked') {
            const amountFloat = parseFloat(amount);
            await prisma.user.update({
                where: { id: fromUserId },
                data: { balance: { decrement: amountFloat } }
            });
            if (toUserId) {
                await prisma.user.update({
                    where: { id: toUserId },
                    data: { balance: { increment: amountFloat } }
                });
            }
        }

        res.json(transaction);
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: 'Transaction failed' });
    }
});

// Deposit Money (Add Funds)
router.post('/deposit', async (req, res) => {
    try {
        const { userId, amount } = req.body;
        const amountFloat = parseFloat(amount);

        // Update User Balance
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { balance: { increment: amountFloat } }
        });

        // Log as a "Self Deposit" transaction
        const transaction = await prisma.transaction.create({
            data: {
                amount: amountFloat,
                fromUserId: userId, // Self
                toUserId: userId,   // Self
                toAccount: "Wallet Top-up",
                country: "India",
                riskScore: 0,
                status: "clear",
                reason: "Deposit (Add Money)",
                aiExplanation: "Automated Wallet Deposit",
            },
        });

        res.json({ balance: updatedUser.balance, transaction });
    } catch (error) {
        console.error("Deposit Error:", error);
        res.status(400).json({ error: 'Deposit failed' });
    }
});

export default router;
