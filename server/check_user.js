
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser() {
    try {
        const user = await prisma.user.findUnique({
            where: { email: 'demo@sentinel.com' },
        });
        console.log('Demo User:', user);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkUser();
