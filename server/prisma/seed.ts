import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    // 1. Clean existing data (optional, maybe keep admin)
    // await prisma.transaction.deleteMany();
    // await prisma.kYCRecord.deleteMany();
    // await prisma.user.deleteMany();

    // 2. Create Admin
    const adminEmail = 'officer@trustshield.com';
    const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

    if (!existingAdmin) {
        const passwordHash = await bcrypt.hash('admin123', 10);
        await prisma.user.create({
            data: {
                email: adminEmail,
                passwordHash,
                name: 'Compliance Officer',
                role: 'admin',
                kycStatus: 'approved',
                riskScore: 0,
            }
        });
        console.log('Created Admin User');
    }

    // 2.1 Create Demo User (For Frontend Demo Button)
    const demoEmail = 'demo@sentinel.com';
    const existingDemo = await prisma.user.findUnique({ where: { email: demoEmail } });

    if (!existingDemo) {
        const passwordHash = await bcrypt.hash('demo123', 10);
        await prisma.user.create({
            data: {
                email: demoEmail,
                passwordHash,
                name: 'Demo User',
                role: 'customer',
                kycStatus: 'approved',
                riskScore: 15,
                balance: 50000.00
            }
        });
        console.log('Created Demo User');
    }

    // 3. Generate 1000 Users
    const users = [];
    const passwordHash = await bcrypt.hash('password123', 10); // Same password for speed

    console.log('Generating 1000 users...');
    for (let i = 0; i < 1000; i++) {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const email = faker.internet.email({ firstName, lastName });

        // Mix of statuses
        const kycStatus = faker.helpers.arrayElement(['approved', 'pending', 'processing', 'manual-review']);
        const riskScore = faker.number.int({ min: 0, max: 99 });

        users.push({
            email,
            passwordHash,
            name: `${firstName} ${lastName}`,
            role: 'customer',
            kycStatus,
            riskScore,
            balance: parseFloat(faker.finance.amount({ min: 1000, max: 1000000 })),
        });
    }

    // Batch insert users
    await prisma.user.createMany({
        data: users as any,
    });

    // 4. Generate Transactions (Web of Trust)
    console.log('Generating transactions...');
    const allUsers = await prisma.user.findMany({ select: { id: true } });
    const transactions = [];

    for (let i = 0; i < 5000; i++) {
        const fromUser = faker.helpers.arrayElement(allUsers);
        let toUser = faker.helpers.arrayElement(allUsers);
        while (toUser.id === fromUser.id) {
            toUser = faker.helpers.arrayElement(allUsers);
        }

        const amount = parseFloat(faker.finance.amount({ min: 100, max: 500000 }));
        const isSuspicious = amount > 200000;

        transactions.push({
            amount,
            fromUserId: fromUser.id,
            toUserId: toUser.id,
            timestamp: faker.date.recent({ days: 30 }),
            status: isSuspicious ? 'flagged' : 'clear',
            riskScore: isSuspicious ? faker.number.int({ min: 60, max: 99 }) : faker.number.int({ min: 0, max: 30 }),
            country: faker.helpers.arrayElement(['India', 'India', 'India', 'USA', 'UK', 'Dubai', 'Singapore']),
            reason: isSuspicious ? 'Generated Suspicious Pattern' : 'Regular Transfer',
            aiExplanation: isSuspicious ? 'High volume transaction detected.' : 'Normal activity.',
        });
    }

    await prisma.transaction.createMany({
        data: transactions as any,
    });

    console.log('✅ Seeding complete: 1000 Users, 5000 Transactions.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
