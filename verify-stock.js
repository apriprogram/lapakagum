const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany();
  products.forEach(p => console.log(`${p.name}: ${p.stock}`));
}

main().finally(() => prisma.$disconnect());
