import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

function fileToGenerativePart(path: string, mimeType: string) {
    return {
        inlineData: {
            data: fs.readFileSync(path).toString("base64"),
            mimeType
        },
    };
}

export async function verifyDocumentType(imagePath: string, expectedType: 'id_card' | 'passport' | 'other' = 'id_card') {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("Missing GEMINI_API_KEY");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    const prompt = `
    Analyze this image. Is it a valid official Identity Document (like a Passport, Driver's License, PAN Card, or Aadhaar Card)?
    
    If it is clearly NOT an ID (e.g., math notes, selfies, random objects, landscape), classify it as INVALID.
    
    Output strictly in JSON:
    {
      "isValid": boolean,
      "detectedType": "string (e.g., PAN Card, Math Notes, etc.)",
      "reasoning": "string explanation"
    }
    `;

    try {
        const imagePart = fileToGenerativePart(imagePath, "image/jpeg");
        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error("AI Document Verification Failed:", error);
        return { isValid: false, detectedType: "Error", reasoning: "AI Failure" };
    }
}

export async function compareFaces(imagePath1: string, imagePath2: string) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("Missing GEMINI_API_KEY");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    const prompt = `
    You are an expert Identity Verification AI.
    Compare these two images:
    1. The first image is a Government ID Document (like Passport, License, Aadhaar).
    2. The second image is a live selfie capture.
    
    Task: Determine if the person in the ID document is the same as the person in the selfie.
    Ignore minor differences like age, glasses, or facial hair. Focus on structural facial features.
    
    Output strictly in JSON format:
    {
      "match": boolean,
      "score": number, // 0 to 100 confidence score
      "reasoning": "string explanation"
    }
    `;

    try {
        const image1Part = fileToGenerativePart(imagePath1, "image/jpeg");
        const image2Part = fileToGenerativePart(imagePath2, "image/jpeg");

        const result = await model.generateContent([prompt, image1Part, image2Part]);
        const response = await result.response;
        const text = response.text();

        // Clean markdown code blocks if present
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error("AI Face Verification Failed:", error);
        // Fallback to strict "fail" rather than approving blindly
        return { match: false, score: 0, reasoning: "AI Error: " + error };
    }
}

export async function analyzeTransactionWithAI(transaction: any) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return "AI Analysis Unavailable: Missing GEMINI_API_KEY.";
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        let model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

        const prompt = `
        Analyze this financial transaction for Anti-Money Laundering (AML) compliance.
        
        Transaction Details:
        - Amount: ${transaction.amount}
        - From User Balance: ${transaction.fromUser?.balance || 'Unknown'}
        - To User: ${transaction.toUserId || 'External'}
        - Country: ${transaction.country}
        - Reason: ${transaction.reason}
        
        Is this suspicious? Provide a concise risk assessment and explanation.
        `;

        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (primaryError) {
            console.warn('Gemini 1.5 Flash failed, trying fallback to gemini-pro:', primaryError);
            model = genAI.getGenerativeModel({ model: "gemini-pro" });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        }
    } catch (error) {
        console.error('Gemini API Error:', error);
        return "AI Analysis Service Error: " + (error instanceof Error ? error.message : String(error));
    }
}

import { spawn } from 'child_process';
import path from 'path';

export async function verifyKYCWithPython(idPath: string, selfiePath: string, userName: string, panNumber?: string, secondaryIdNumber?: string) {
    return new Promise((resolve, reject) => {
        // Assume python script is in server/python/kyc_process.py
        const scriptPath = path.join(__dirname, '../../python/kyc_process.py');

        // FIXED: selfiePath is a named argument (--selfie_path), not positional
        const args = [scriptPath, idPath, '--selfie_path', selfiePath, '--name', userName];
        if (panNumber) {
            args.push('--pan', panNumber);
        }
        if (secondaryIdNumber) {
            args.push('--secondary_id', secondaryIdNumber);
        }

        console.log(`Spawning Python KYC: python ${args.join(' ')}`);

        // Use 'py' command (Windows Launcher) to match the environment where dependencies are installed.
        const pythonProcess = spawn('py', args);

        let dataString = '';
        let errorString = '';

        pythonProcess.stdout.on('data', (data) => {
            dataString += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            console.error(`Python StdErr: ${data}`);
            errorString += data.toString();
        });

        pythonProcess.on('close', (code) => {
            console.log(`Python process exited with code ${code}`);
            if (code !== 0) {
                reject(new Error(`KYC Process Failed (Code ${code}): ${errorString || 'Unknown Error'}`));
                return;
            }

            try {
                // Find JSON in the output (in case of extra logs)
                const jsonMatch = dataString.match(/\{[\s\S]*\}/);
                if (!jsonMatch) {
                    console.error("No JSON found in output:", dataString);
                    throw new Error("No JSON output from Python script");
                }
                const result = JSON.parse(jsonMatch[0]);
                resolve(result);
            } catch (error: any) {
                reject(new Error(`Failed to parse Python Output: ${error.message}`));
            }
        });
    });
}
// ... existing code ...

export async function validateDocumentWithPython(idPath: string, userName: string, panNumber?: string) {
    return new Promise((resolve, reject) => {
        const scriptPath = path.join(__dirname, '../../python/kyc_process.py');

        // Only pass ID path, name, and PAN. No Selfie.
        const args = [scriptPath, idPath, '--name', userName];
        if (panNumber) {
            args.push('--pan', panNumber);
        }

        console.log(`Spawning Python Document Validation: python ${args.join(' ')}`);

        const pythonProcess = spawn('py', args);

        let dataString = '';
        let errorString = '';

        pythonProcess.stdout.on('data', (data) => {
            dataString += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            console.error(`Python StdErr: ${data}`);
            errorString += data.toString();
        });

        pythonProcess.on('close', (code) => {
            console.log(`Python Validation exited with code ${code}`);
            if (code !== 0) {
                reject(new Error(`Validation Failed (Code ${code}): ${errorString || 'Unknown Error'}`));
                return;
            }

            try {
                const jsonMatch = dataString.match(/\{[\s\S]*\}/);
                if (!jsonMatch) {
                    throw new Error("No JSON output from Python script");
                }
                const result = JSON.parse(jsonMatch[0]);
                resolve(result);
            } catch (error: any) {
                reject(new Error(`Failed to parse Python Output: ${error.message}`));
            }
        });
    });
}
