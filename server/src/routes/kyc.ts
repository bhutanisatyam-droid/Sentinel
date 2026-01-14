import express from 'express';
import multer from 'multer';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import prisma from '../lib/prisma';
import { compareFaces, verifyDocumentType, validateDocumentWithPython } from '../services/ai';
import { SetuService } from '../services/setu';

const router = express.Router();

// Multer Config
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
        const safeName = file.originalname.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
        cb(null, `${Date.now()}-${safeName}`);
    }
});

const uploadMiddleware = multer({ storage: storage });
const upload = uploadMiddleware.fields([
    { name: 'image1', maxCount: 1 }, // PAN
    { name: 'image2', maxCount: 1 }, // ID
    { name: 'liveImage', maxCount: 1 } // Selfie
]);

// Helper to wait for file to be written
const waitForFile = (filePath: string) => {
    return new Promise<void>((resolve) => {
        let attempts = 0;
        const check = () => {
            if (fs.existsSync(filePath) && fs.statSync(filePath).size > 0) {
                resolve();
            } else if (attempts < 10) {
                attempts++;
                setTimeout(check, 100);
            } else {
                resolve(); // Try anyway
            }
        };
        check();
    });
};

// NEW: Step 1 Document Validation (No Liveness)
router.post('/validate-document', upload, async (req, res) => {
    console.log("KYC: /validate-document route hit!");
    try {
        const { userId, panNumber, name } = req.body;
        const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

        if (!files || !files['image2']) {
            return res.status(400).json({ error: 'Missing ID Document' });
        }

        const idCardPath = path.resolve(files['image2'][0].path);
        await waitForFile(idCardPath);

        // Fetch user name if not provided in body, but ideally frontend sends it
        // We will trust body for this quick check or fetch from DB
        let userName = name || "Unknown";
        if (userId && !name) {
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (user) userName = user.name;
        }

        console.log(`Validating Document: ${idCardPath} for ${userName}`);

        const result: any = await validateDocumentWithPython(
            idCardPath,
            userName,
            panNumber || undefined
        );

        console.log("Document Validation Result:", JSON.stringify(result, null, 2));

        if (result.status === 'rejected' || result.status === 'error') {
            return res.status(400).json({ error: result.reason, details: result.details });
        }

        // --- NEW: GOV DATABASE CHECK (SETU SANDBOX) ---
        if (panNumber) {
            console.log(`Running Gov Database Check for PAN: ${panNumber}`);

            const govCheck = await SetuService.verifyPAN(panNumber);
            console.log("Gov Check Result:", govCheck);

            if (govCheck.status !== 'VALID') {
                return res.status(400).json({
                    error: `Govt Database Error: ${govCheck.message}`,
                    details: {
                        ...result.details,
                        gov_check: 'FAILED'
                    }
                });
            }

            // Append Gov Check Success to Result
            result.details = {
                ...result.details,
                gov_check: 'PASSED',
                gov_name_match: govCheck.data?.fullName
            };
        }
        // ----------------------------------------------

        res.json(result);

    } catch (error: any) {
        console.error("Validation Error:", error);
        res.status(500).json({ error: error.message || 'Validation failed' });
    }
});

// Real Verification (Using Gemini Vision AI)
router.post('/verify', upload, async (req, res) => {
    console.log("KYC: /verify route hit!");
    try {
        const { userId } = req.body;
        const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

        if (!files || !files['image2'] || !files['liveImage']) {
            if (files && files['image1'] && files['image2']) {
                return res.status(400).json({ error: 'Please use the Liveness Check to verify your identity.' });
            }
            return res.status(400).json({ error: 'Missing images for verification' });
        }

        // PRIORITIZE PAN CARD (Image 1) for Verification as it is usually clearer than Secondary ID
        const idCardPath = files['image1'] ? path.resolve(files['image1'][0].path) : path.resolve(files['image2'][0].path);
        const selfiePath = path.resolve(files['liveImage'][0].path);

        await waitForFile(idCardPath);
        await waitForFile(selfiePath);

        const user = await prisma.user.findUnique({ where: { id: userId } });
        const kycRecord = await prisma.kYCRecord.findUnique({ where: { userId } });

        if (!user) return res.status(404).json({ error: "User not found" });

        console.log(`Starting Python DeepFace & OCR Verification: ${idCardPath} vs ${selfiePath}`);

        // Call Python Script using the static import
        const kycResult: any = await import('../services/ai').then(m => m.verifyKYCWithPython(
            idCardPath,
            selfiePath,
            user.name || "Unknown",
            kycRecord?.panNumber || undefined,
            req.body.secondaryIdNumber || undefined
        ));

        console.log("Python KYC Result:", JSON.stringify(kycResult, null, 2));

        const isApproved = kycResult.status === 'approved';
        const status = isApproved ? 'approved' : 'rejected';

        await prisma.kYCRecord.upsert({
            where: { userId },
            update: {
                status,
                faceMatchScore: isApproved ? 95 : 0,
            },
            create: {
                userId,
                status,
                faceMatchScore: isApproved ? 95 : 0,
            }
        });

        await prisma.user.update({
            where: { id: userId },
            data: {
                kycStatus: status,
                balance: isApproved ? 50000 : 0
            },
        });

        res.json({
            status,
            score: isApproved ? 95 : 0,
            match: isApproved,
            method: 'local-deepface-ocr',
            reasoning: kycResult.reason,
            // Pass through the detailed results including steps and any extracted data
            details: kycResult.details,
            steps: kycResult.steps,
            extractedData: kycResult.extractedData
        });

    } catch (error: any) {
        console.error("Verification Error:", error);
        res.status(500).json({
            error: error.message || 'Verification failed severely',
            details: error.stack
        });
    }
});

export default router;
