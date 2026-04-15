const { PrismaClient } = require('./packages/database/node_modules/@prisma/client');
const prisma = new PrismaClient();
prisma.service.findMany({ select: { id: true, name: true, isActive: true, tenantId: true } }).then(s => { console.log(s); process.exit(0); });
