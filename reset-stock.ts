import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Update all products stock to 0
  await prisma.product.updateMany({
    data: {
      stock: 0
    }
  });

  // Delete all orphaned stock batches and movements
  await prisma.stockMovement.deleteMany();
  await prisma.stockBatch.deleteMany();

  console.log("Stock reset successfully.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
