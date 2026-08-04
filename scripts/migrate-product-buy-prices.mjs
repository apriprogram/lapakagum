import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  const products = await db.product.findMany({ select: { id: true } });
  let updated = 0;
  for (const product of products) {
    const latestBatch = await db.stockBatch.findFirst({
      where: { productId: product.id },
      orderBy: [{ receivedAt: 'desc' }, { id: 'desc' }],
      select: { buyPrice: true },
    });
    if (!latestBatch) continue;
    await db.product.update({ where: { id: product.id }, data: { buyPrice: latestBatch.buyPrice } });
    updated += 1;
  }
  console.log(`Berhasil mengisi harga beli ${updated} barang.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => db.$disconnect());
