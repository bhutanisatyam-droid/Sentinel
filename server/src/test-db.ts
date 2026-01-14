import prisma from './lib/prisma';

async function main() {
    try {
        console.log('Connecting to DB...');
        const count = await prisma.user.count();
        console.log(`Connection successful! User count: ${count}`);
    } catch (e) {
        console.error('Connection failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
