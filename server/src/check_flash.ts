
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function checkFlash() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        console.error('NO_KEY');
        return;
    }
    const genAI = new GoogleGenerativeAI(key);
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent('Say SUCCESS if you hear me');
        const text = result.response.text();
        console.log('OUTPUT:', text);
    } catch (e: any) {
        console.log('ERROR_CAUGHT');
        fs.writeFileSync('error_log.txt', JSON.stringify(e, Object.getOwnPropertyNames(e), 2));
        fs.writeFileSync('error_msg.txt', e.message);
    }
}

checkFlash();
