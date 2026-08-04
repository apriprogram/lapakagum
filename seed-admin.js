const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const adminExists = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });

  if (adminExists) {
    console.log('Admin sudah ada');
    return;
  }

  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'admin@lapak.com',
      password: hashedPassword,
      role: 'ADMIN',
    }
  });

  console.log('Admin berhasil dibuat!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
