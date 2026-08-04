const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const batches = await prisma.stockBatch.findMany();
  for (const batch of batches) {
    if (Number(batch.remainingQty) > Number(batch.initialQty)) {
      await prisma.stockBatch.update({
        where: { id: batch.id },
        data: { remainingQty: batch.initialQty }
      });
      console.log(`Fixed batch ${batch.id}: remainingQty set to ${batch.initialQty}`);
    }
  }
}

main().finally(() => prisma.$disconnect());
