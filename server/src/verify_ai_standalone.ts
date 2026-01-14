
import dotenv from 'dotenv';
import path from 'path';

// Load env vars explicitly
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { analyzeTransactionWithAI } from './services/ai';

async function testAI() {
    console.log('Testing Gemini AI Integration...');
    const key = process.env.GEMINI_API_KEY;

    if (!key) {
        console.error('ERROR: GEMINI_API_KEY is missing in process.env');
        return;
    }
    console.log('API Key found:', key.substring(0, 5) + '...' + key.substring(key.length - 3));

    const mockTx = {
        amount: 1500000,
        fromUser: { balance: 2000000 },
        toUserId: 'user-3',
        region: 'Cayman Islands',
        country: 'Cayman Islands',
        reason: 'Consulting Fees',
    };

    try {
        console.log('Sending transaction to Gemini service...', mockTx);
        const result = await analyzeTransactionWithAI(mockTx);
        console.log('--------------------------------------------------');
        console.log('Gemini Analysis Result:');
        console.log(result);
        console.log('--------------------------------------------------');
    } catch (error) {
        console.error('AI Service Failed:', error);
    }
}

testAI();
