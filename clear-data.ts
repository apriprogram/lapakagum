const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Clearing transaction data...');

  // Delete all transactional data
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.purchaseItem.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.vendorPayment.deleteMany();
  await prisma.standaloneDebtPayment.deleteMany();
  await prisma.standaloneDebt.deleteMany();
  
  await prisma.stockMovement.deleteMany();
  await prisma.stockBatch.deleteMany();
  await prisma.product.deleteMany();

  await prisma.cashTransaction.deleteMany();
  await prisma.capitalTransaction.deleteMany();
  await prisma.dailyClosing.deleteMany();
  await prisma.auditLog.deleteMany();

  console.log('Successfully cleared all transactional data and products.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
