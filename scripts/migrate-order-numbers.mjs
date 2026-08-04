import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

function formatOrderNumber(id, createdAt) {
  return `ORD${id}-${createdAt.getMonth() + 1}-${createdAt.getDate()}-${createdAt.getFullYear()}`;
}

async function renameReferences(tx, from, to) {
  await tx.cashTransaction.updateMany({ where: { referenceId: from }, data: { referenceId: to } });
  await tx.stockMovement.updateMany({ where: { referenceId: from }, data: { referenceId: to } });
  await tx.auditLog.updateMany({ where: { details: from }, data: { details: to } });
}

async function main() {
  const orders = await db.order.findMany({
    select: { id: true, orderNumber: true, createdAt: true },
    orderBy: { id: 'asc' },
  });

  await db.$transaction(async (tx) => {
    for (const order of orders) {
      const temporary = `TMP-MIGRATE-ORD-${order.id}`;
      await renameReferences(tx, order.orderNumber, temporary);
      await tx.order.update({ where: { id: order.id }, data: { orderNumber: temporary } });
    }

    for (const order of orders) {
      const temporary = `TMP-MIGRATE-ORD-${order.id}`;
      const finalNumber = formatOrderNumber(order.id, order.createdAt);
      await renameReferences(tx, temporary, finalNumber);
      await tx.order.update({ where: { id: order.id }, data: { orderNumber: finalNumber } });
    }
  }, { timeout: 60_000 });

  console.log(`Berhasil memperbarui ${orders.length} nomor pesanan.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
