import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const batches = await prisma.stockBatch.findMany();
  const diffs = batches.map(b => ({
    id: b.id, 
    initialQty: Number(b.initialQty), 
    remainingQty: Number(b.remainingQty),
    diff: Number(b.initialQty) - Number(b.remainingQty)
  })).filter(b => b.diff !== 0);
  console.log(JSON.stringify(diffs, null, 2));

  const tundaOrders = await prisma.order.findMany({ where: { status: 'TUNDA' } });
  console.log('Tunda Orders:', tundaOrders.length);
}

main().finally(() => prisma.$disconnect());
