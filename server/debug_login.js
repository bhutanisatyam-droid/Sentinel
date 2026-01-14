
const bcrypt = require('bcrypt');

async function checkHash() {
    const hash = "$2b$10$YourHashFromPreviousStep"; // I will wait for previous step to get real hash, or simple test:
    const pass = "demo123";
    const hashMatches = await bcrypt.compare(pass, hash);
    console.log("Match:", hashMatches);
}
// I'll update this file once I get the user object from the previous step.
// For now, let's make a script that does both lookup and compare.

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugUser() {
    const user = await prisma.user.findUnique({ where: { email: 'demo@sentinel.com' } });
    if (!user) {
        console.log("User NOT FOUND");
        return;
    }
    console.log("User found:", user.email);
    console.log("Stored Hash:", user.passwordHash);

    const isValid = await bcrypt.compare('demo123', user.passwordHash);
    console.log("Password 'demo123' valid?", isValid);
}

debugUser()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
