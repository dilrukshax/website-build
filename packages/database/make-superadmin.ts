import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // 1. Remove super admin from dilandilruksha0@gmail.com
    await prisma.user.updateMany({
        where: { email: 'dilandilruksha0@gmail.com' },
        data: { isSuperAdmin: false }
    });
    console.log('Removed super admin from dilandilruksha0@gmail.com');

    // 2. Fetch the password hash from the existing user so the superadmin can use the same password
    const existingUser = await prisma.user.findFirst({
        where: { email: 'dilandilruksha0@gmail.com' }
    });

    if (existingUser) {
        const superadminEmail =
            process.env.SUPERADMIN_EMAIL || 'admin@buildmyonlineweb.site';
        
        await prisma.user.upsert({
            where: { email: superadminEmail },
            update: { 
                isSuperAdmin: true,
                passwordHash: existingUser.passwordHash
            },
            create: {
                email: superadminEmail,
                passwordHash: existingUser.passwordHash,
                fullName: 'System Super Admin',
                isSuperAdmin: true,
                status: 'active'
            }
        });
        
        console.log(`Created/updated super admin account: ${superadminEmail}`);
        console.log('You can log into this account using the exact same password as dilandilruksha0@gmail.com.');
    } else {
        console.log('Could not find dilandilruksha0@gmail.com to copy password hash.');
    }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
