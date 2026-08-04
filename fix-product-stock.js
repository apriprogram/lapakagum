const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    include: {
      stockBatches: true
    }
  });

  for (const product of products) {
    const actualStock = product.stockBatches.reduce((sum, batch) => sum + Number(batch.remainingQty), 0);
    
    if (Number(product.stock) !== actualStock) {
      console.log(`Product ${product.name} (ID: ${product.id}): Stock is ${product.stock}, but sum of batches is ${actualStock}. Fixing...`);
      await prisma.product.update({
        where: { id: product.id },
        data: { stock: actualStock }
      });
    }
  }
  console.log("Done checking product stocks.");
}

main().finally(() => prisma.$disconnect());
