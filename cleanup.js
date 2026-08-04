const fs = require('fs');
let code = fs.readFileSync('src/app/actions/business.ts', 'utf8');

const functionsToKeep = {};
const lines = code.split('\n');

let currentFnName = null;
let currentFnBody = [];
let insideFn = false;

let newLines = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  if (line.startsWith('export async function ')) {
    const fnName = line.split(' ')[2].split('(')[0];
    currentFnName = fnName;
    insideFn = true;
    currentFnBody = [line];
  } else if (insideFn) {
    currentFnBody.push(line);
    if (line === '}') {
      functionsToKeep[currentFnName] = currentFnBody.join('\n');
      insideFn = false;
    }
  } else {
    newLines.push(line);
  }
}

// Ensure createPurchase is there
functionsToKeep['createPurchase'] = `export async function createPurchase(formData: FormData) {
  await assertAdmin();
  const date = dateValue(formData, 'date', 'Tanggal');
  const vendorId = positiveNumber(formData, 'vendorId', 'Pemasok');
  const productId = positiveNumber(formData, 'productId', 'Produk');
  const quantity = positiveNumber(formData, 'quantity', 'Berat');
  const buyPrice = positiveNumber(formData, 'buyPrice', 'Harga beli');
  const sellPrice = positiveNumber(formData, 'sellPrice', 'Harga jual');
  const paymentType = textValue(formData, 'paymentType', 'Pembayaran') as PaymentType;
  const ownership = textValue(formData, 'ownership', 'Kepemilikan') as 'BELI_PUTUS' | 'KONSINYASI' | 'DAPAT_DIRETUR';
  const total = quantity * buyPrice;
  const invoiceNumber = code('BELI');
  await ensureOpenDay(date);

  await prisma.$transaction(async (tx) => {
    const purchase = await tx.purchase.create({
      data: {
        invoiceNumber,
        date,
        vendorId,
        paymentType,
        dueDate: paymentType === 'TEMPO'
          ? new Date(date.getTime() + 14 * 24 * 60 * 60 * 1000)
          : null,
        totalAmount: total,
        paidAmount: paymentType === 'TEMPO' ? 0 : total,
        notes: optionalText(formData, 'notes'),
      },
    });
    const item = await tx.purchaseItem.create({
      data: { purchaseId: purchase.id, productId, quantity, buyPrice, sellPrice, total, ownership },
    });
    const batch = await tx.stockBatch.create({
      data: {
        code: code('BATCH'),
        receivedAt: date,
        productId,
        purchaseItemId: item.id,
        initialQty: quantity,
        remainingQty: quantity,
        buyPrice,
        sellPrice,
        ownership,
      },
    });
    await tx.stockMovement.create({
      data: {
        date,
        productId,
        batchId: batch.id,
        type: 'PEMBELIAN',
        quantity,
        unitCost: buyPrice,
        referenceId: invoiceNumber,
        description: 'Barang masuk dari pembelian harian',
      },
    });
    await tx.product.update({
      where: { id: productId },
      data: { stock: { increment: quantity }, buyPrice, price: sellPrice, isActive: true },
    });
    if (paymentType !== 'TEMPO') {
      await tx.cashTransaction.create({
        data: {
          date,
          type: 'KELUAR',
          category: 'Pembelian stok',
          amount: total,
          referenceId: invoiceNumber,
          description: \`Pembelian \${invoiceNumber}\`,
        },
      });
    }

    await tx.auditLog.create({
      data: { action: 'CREATE', entity: 'Purchase', entityId: String(purchase.id), details: invoiceNumber },
    });
  });
  refreshAdmin();
}`;

let finalCode = newLines.join('\n') + '\n\n' + Object.values(functionsToKeep).join('\n\n');

fs.writeFileSync('src/app/actions/business.ts', finalCode);
