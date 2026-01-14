"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const faker_1 = require("@faker-js/faker");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('🌱 Starting seed...');
        // 1. Clean existing data (optional, maybe keep admin)
        // await prisma.transaction.deleteMany();
        // await prisma.kYCRecord.deleteMany();
        // await prisma.user.deleteMany();
        // 2. Create Admin
        const adminEmail = 'officer@trustshield.com';
        const existingAdmin = yield prisma.user.findUnique({ where: { email: adminEmail } });
        if (!existingAdmin) {
            const passwordHash = yield bcrypt_1.default.hash('admin123', 10);
            yield prisma.user.create({
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
        const existingDemo = yield prisma.user.findUnique({ where: { email: demoEmail } });
        if (!existingDemo) {
            const passwordHash = yield bcrypt_1.default.hash('demo123', 10);
            yield prisma.user.create({
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
        const passwordHash = yield bcrypt_1.default.hash('password123', 10); // Same password for speed
        console.log('Generating 1000 users...');
        for (let i = 0; i < 1000; i++) {
            const firstName = faker_1.faker.person.firstName();
            const lastName = faker_1.faker.person.lastName();
            const email = faker_1.faker.internet.email({ firstName, lastName });
            // Mix of statuses
            const kycStatus = faker_1.faker.helpers.arrayElement(['approved', 'pending', 'processing', 'manual-review']);
            const riskScore = faker_1.faker.number.int({ min: 0, max: 99 });
            users.push({
                email,
                passwordHash,
                name: `${firstName} ${lastName}`,
                role: 'customer',
                kycStatus,
                riskScore,
                balance: parseFloat(faker_1.faker.finance.amount({ min: 1000, max: 1000000 })),
            });
        }
        // Batch insert users
        yield prisma.user.createMany({
            data: users,
        });
        // 4. Generate Transactions (Web of Trust)
        console.log('Generating transactions...');
        const allUsers = yield prisma.user.findMany({ select: { id: true } });
        const transactions = [];
        for (let i = 0; i < 5000; i++) {
            const fromUser = faker_1.faker.helpers.arrayElement(allUsers);
            let toUser = faker_1.faker.helpers.arrayElement(allUsers);
            while (toUser.id === fromUser.id) {
                toUser = faker_1.faker.helpers.arrayElement(allUsers);
            }
            const amount = parseFloat(faker_1.faker.finance.amount({ min: 100, max: 500000 }));
            const isSuspicious = amount > 200000;
            transactions.push({
                amount,
                fromUserId: fromUser.id,
                toUserId: toUser.id,
                timestamp: faker_1.faker.date.recent({ days: 30 }),
                status: isSuspicious ? 'flagged' : 'clear',
                riskScore: isSuspicious ? faker_1.faker.number.int({ min: 60, max: 99 }) : faker_1.faker.number.int({ min: 0, max: 30 }),
                country: faker_1.faker.helpers.arrayElement(['India', 'India', 'India', 'USA', 'UK', 'Dubai', 'Singapore']),
                reason: isSuspicious ? 'Generated Suspicious Pattern' : 'Regular Transfer',
                aiExplanation: isSuspicious ? 'High volume transaction detected.' : 'Normal activity.',
            });
        }
        yield prisma.transaction.createMany({
            data: transactions,
        });
        console.log('✅ Seeding complete: 1000 Users, 5000 Transactions.');
    });
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(() => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma.$disconnect();
}));
