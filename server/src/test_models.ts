
import dotenv from 'dotenv';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function listModels() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        console.error('No API KEY');
        return;
    }
    const genAI = new GoogleGenerativeAI(key);
    try {
        // For some versions of the SDK, listModels might not be directly available on genAI instance
        // But let's try or access through model manager if applicable.
        // Actually standard way in recent SDK is confusing, let's try a simple generation to 'gemini-pro' and catch error to see full output.

        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        console.log('Trying gemini-pro...');
        await model.generateContent('test');
        console.log('gemini-pro works!');
    } catch (e: any) {
        console.log('Error with gemini-pro:', e.message);
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        console.log('Trying gemini-1.5-flash...');
        await model.generateContent('test');
        console.log('gemini-1.5-flash works!');
    } catch (e: any) {
        console.log('Error with gemini-1.5-flash:', e.message);
    }
}

listModels();
