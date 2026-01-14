
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetDemoKYC() {
    try {
        const user = await prisma.user.update({
            where: { email: 'demo@sentinel.com' },
            data: { kycStatus: 'pending' }
        });
        console.log('Reset Demo User KYC to pending:', user.kycStatus);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

resetDemoKYC();
