"use server";

import { prisma } from "@/lib/prisma";
import { assertAdmin } from "@/lib/admin";
import {
  dateValue,
  optionalText,
  positiveNumber,
  textValue,
} from "@/lib/validation";
import { endOfDay, startOfDay } from "@/lib/format";
import { formatOrderNumber, temporaryOrderNumber } from "@/lib/order-number";
import { revalidatePath } from "next/cache";
import {
  OrderStatus,
  PaymentType,
  Prisma,
  PurchaseStatus,
  StockMovementType,
} from "@prisma/client";

const refreshAdmin = () => {
  revalidatePath("/");
  revalidatePath("/admin", "layout");
};

const code = (prefix: string) =>
  `${prefix}-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;

async function ensureOpenDay(date: Date) {
  const normalized = startOfDay(date);
  const closing = await prisma.dailyClosing.findUnique({
    where: { date: normalized },
  });
  if (closing)
    throw new Error(
      "Tanggal tersebut sudah ditutup. Gunakan penyesuaian pada hari yang masih terbuka.",
    );
}

async function allocateFifo(tx: Prisma.TransactionClient, orderId: number) {
  const order = await tx.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { items: true },
  });
  let totalHpp = 0;

  for (const item of order.items) {
    let needed = Number(item.quantity);
    const batches = await tx.stockBatch.findMany({
      where: {
        productId: item.productId,
        remainingQty: { gt: 0 },
        status: "AKTIF",
      },
      orderBy: [{ receivedAt: "asc" }, { id: "asc" }],
    });
    if (
      batches.reduce((sum, batch) => sum + Number(batch.remainingQty), 0) +
        0.0001 <
      needed
    ) {
      throw new Error(
        "Jumlah stok pada kelompok ini tidak mencukupi untuk menyelesaikan pesanan",
      );
    }
    let itemHpp = 0;
    for (const batch of batches) {
      if (needed <= 0) break;
      const used = Math.min(needed, Number(batch.remainingQty));
      const cost = used * Number(batch.buyPrice);
      itemHpp += cost;
      needed -= used;
      await tx.stockBatch.update({
        where: { id: batch.id },
        data: {
          remainingQty: { decrement: used },
          status: Number(batch.remainingQty) === used ? "HABIS" : "AKTIF",
        },
      });
      await tx.stockMovement.create({
        data: {
          date: new Date(),
          productId: item.productId,
          batchId: batch.id,
          type: "PENJUALAN",
          quantity: used,
          unitCost: batch.buyPrice,
          referenceId: order.orderNumber,
          description: `FIFO pesanan ${order.orderNumber}`,
        },
      });
    }
    await tx.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: Number(item.quantity) } },
    });
    await tx.orderItem.update({
      where: { id: item.id },
      data: { hpp: itemHpp },
    });
    totalHpp += itemHpp;
  }
  return totalHpp;
}

async function reverseCompletedOrder(
  tx: Prisma.TransactionClient,
  orderId: number,
) {
  const order = await tx.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { items: true },
  });
  const movements = await tx.stockMovement.findMany({
    where: { referenceId: order.orderNumber, type: "PENJUALAN" },
  });
  for (const movement of movements) {
    const qty = Number(movement.quantity);
    await tx.product.update({
      where: { id: movement.productId },
      data: { stock: { increment: qty } },
    });
    if (movement.batchId) {
      await tx.stockBatch.update({
        where: { id: movement.batchId },
        data: { remainingQty: { increment: qty }, status: "AKTIF" },
      });
    }
    await tx.stockMovement.create({
      data: {
        date: new Date(),
        productId: movement.productId,
        batchId: movement.batchId,
        type: "PENYESUAIAN_MASUK",
        quantity: qty,
        unitCost: movement.unitCost,
        referenceId: order.orderNumber,
        description: "Pengembalian stok karena pesanan dibatalkan",
      },
    });
  }
  await tx.stockMovement.deleteMany({
    where: { referenceId: order.orderNumber, type: "PENJUALAN" },
  });
  await tx.cashTransaction.deleteMany({
    where: { 
      referenceId: order.orderNumber, 
      category: { in: ["Penjualan", "Penjualan stok"] } 
    },
  });
}

type BulkDeleteResource =
  "orders" | "products" | "purchases" | "stock-batches" | "daily-closings";

export async function closeDay(formData: FormData) {
  await assertAdmin();
  const date = dateValue(formData, "date", "Tanggal");
  const from = startOfDay(date);
  const to = endOfDay(date);
  const [purchases, sales, expenses, products] = await Promise.all([
    prisma.purchase.aggregate({
      where: { date: { gte: from, lte: to } },
      _sum: { totalAmount: true },
    }),
    prisma.order.aggregate({
      where: { completedAt: { gte: from, lte: to }, status: "SELESAI" },
      _sum: { totalAmount: true, hppAmount: true },
    }),
    prisma.cashTransaction.aggregate({
      where: {
        date: { gte: from, lte: to },
        type: "KELUAR",
        category: { not: "Pembelian stok" },
      },
      _sum: { amount: true },
    }),
    prisma.product.aggregate({ _sum: { stock: true } }),
  ]);
  const purchaseAmount = Number(purchases._sum.totalAmount || 0);
  const salesAmount = Number(sales._sum.totalAmount || 0);
  const hppAmount = Number(sales._sum.hppAmount || 0);
  const expenseAmount = Number(expenses._sum.amount || 0);
  const grossProfit = salesAmount - hppAmount;

  await prisma.dailyClosing.upsert({
    where: { date: from },
    create: {
      date: from,
      purchaseAmount,
      salesAmount,
      hppAmount,
      expenseAmount,
      grossProfit,
      netProfit: grossProfit - expenseAmount,
      remainingStock: Number(products._sum.stock || 0),
      notes: optionalText(formData, "notes"),
    },
    update: {
      purchaseAmount,
      salesAmount,
      hppAmount,
      expenseAmount,
      grossProfit,
      netProfit: grossProfit - expenseAmount,
      remainingStock: Number(products._sum.stock || 0),
      notes: optionalText(formData, "notes"),
      closedAt: new Date(),
    },
  });
  refreshAdmin();
}

export async function createPurchase(formData: FormData) {
  await assertAdmin();
  const date = dateValue(formData, "date", "Tanggal");
  const vendorId = positiveNumber(formData, "vendorId", "Pemasok");
  const productId = positiveNumber(formData, "productId", "Produk");
  const quantity = positiveNumber(formData, "quantity", "Berat");
  const buyPrice = positiveNumber(formData, "buyPrice", "Harga beli");
  const sellPrice = positiveNumber(formData, "sellPrice", "Harga jual");
  const paymentType = textValue(
    formData,
    "paymentType",
    "Pembayaran",
  ) as PaymentType;
  const ownership = textValue(formData, "ownership", "Kepemilikan") as
    "BELI_PUTUS" | "KONSINYASI" | "DAPAT_DIRETUR";
  const total = quantity * buyPrice;
  const invoiceNumber = code("BELI");
  await ensureOpenDay(date);

  await prisma.$transaction(async (tx) => {
    const purchase = await tx.purchase.create({
      data: {
        invoiceNumber,
        date,
        
        paymentType,
        totalAmount: total,
        notes: optionalText(formData, "notes"),
      },
    });
    const item = await tx.purchaseItem.create({
      data: {
        purchaseId: purchase.id,
        productId,
        quantity,
        buyPrice,
        sellPrice,
        total,
        ownership,
      },
    });
    const batch = await tx.stockBatch.create({
      data: {
        code: code("BATCH"),
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
        type: "PEMBELIAN",
        quantity,
        unitCost: buyPrice,
        referenceId: invoiceNumber,
        description: "Barang masuk dari pembelian harian",
      },
    });
    await tx.product.update({
      where: { id: productId },
      data: {
        stock: { increment: quantity },
        buyPrice,
        price: sellPrice,
        isActive: true,
      },
    });
    if (paymentType !== "TEMPO") {
      await tx.cashTransaction.create({
        data: {
          date,
          type: "KELUAR",
          category: "Pembelian stok",
          amount: total,
          referenceId: invoiceNumber,
          description: `Pembelian ${invoiceNumber}`,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        action: "CREATE",
        entity: "Purchase",
        entityId: String(purchase.id),
        details: invoiceNumber,
      },
    });
  });
  refreshAdmin();
}

export async function createCapitalTransaction(formData: FormData) {
  await assertAdmin();
  const date = dateValue(formData, "date", "Tanggal");
  const type = textValue(formData, "type", "Jenis") as any;
  const amount = positiveNumber(formData, "amount", "Jumlah");
  const description = optionalText(formData, "description");

  await prisma.$transaction(async (tx) => {
    await tx.capitalTransaction.create({
      data: { date, type, amount, description },
    });

    // SETORAN & TAMBAHAN masuk ke saldo kas sebagai kas masuk
    if (type === "SETORAN" || type === "TAMBAHAN") {
      const label = type === "SETORAN" ? "Modal awal" : "Tambahan modal";
      await tx.cashTransaction.create({
        data: {
          date,
          type: "MASUK",
          category: label,
          amount,
          description: description || label,
        },
      });
    }

    // PRIVE (penarikan pemilik) keluar dari kas
    if (type === "PRIVE") {
      await tx.cashTransaction.create({
        data: {
          date,
          type: "KELUAR",
          category: "Penarikan pemilik (prive)",
          amount,
          description: description || "Prive",
        },
      });
    }
  });

  refreshAdmin();
}

export async function createCashTransaction(formData: FormData) {
  await assertAdmin();
  const date = dateValue(formData, "date", "Tanggal");
  const type = textValue(formData, "type", "Jenis") as any;
  const amount = positiveNumber(formData, "amount", "Jumlah");
  const category = textValue(formData, "category", "Kategori");
  const description = optionalText(formData, "description");
  await prisma.cashTransaction.create({
    data: { date, type, amount, category, description },
  });
  refreshAdmin();
}

export async function deleteCashTransaction(id: number) {
  await assertAdmin();
  await prisma.cashTransaction.delete({ where: { id } });
  refreshAdmin();
}

export async function deleteCapitalTransaction(id: number) {
  await assertAdmin();

  // Cek apakah ada kas yang terkait, hapus juga
  const cap = await prisma.capitalTransaction.findUniqueOrThrow({ where: { id } });
  const category =
    cap.type === "SETORAN"
      ? "Modal awal"
      : cap.type === "TAMBAHAN"
      ? "Tambahan modal"
      : "Penarikan pemilik (prive)";

  await prisma.$transaction(async (tx) => {
    await tx.capitalTransaction.delete({ where: { id } });
    // Hapus kas terkait (cocokkan tanggal, kategori, dan jumlah)
    await tx.cashTransaction.deleteMany({
      where: {
        category,
        amount: cap.amount,
        date: cap.date,
      },
    });
  });
  refreshAdmin();
}

export async function resetAllTransactionHistory() {
  await assertAdmin();
  await prisma.$transaction([
    prisma.cashTransaction.deleteMany(),
    prisma.capitalTransaction.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.purchaseItem.deleteMany(),
    prisma.purchase.deleteMany(),
    prisma.stockMovement.deleteMany(),
    prisma.stockBatch.deleteMany(),
    prisma.dailyClosing.deleteMany(),
    prisma.auditLog.deleteMany(),
  ]);
  refreshAdmin();
}

export async function createVendor(formData: FormData) {
  await assertAdmin();
  const name = textValue(formData, "name", "Nama");
  await prisma.vendor.create({
    data: {
      name,
      phone: optionalText(formData, "phone"),
      address: optionalText(formData, "address"),
    },
  });
  refreshAdmin();
}

export async function deleteVendor(id: number) {
  await assertAdmin();
  await prisma.vendor.delete({ where: { id } });
  refreshAdmin();
}

export async function toggleVendor(id: number) {
  await assertAdmin();
  const v = await prisma.vendor.findUniqueOrThrow({ where: { id } });
  await prisma.vendor.update({
    where: { id },
    data: { isActive: !v.isActive },
  });
  refreshAdmin();
}

export async function updateVendor(id: number, formData: FormData) {
  await assertAdmin();
  const name = textValue(formData, "name", "Nama");
  await prisma.vendor.update({
    where: { id },
    data: {
      name,
      phone: optionalText(formData, "phone"),
      address: optionalText(formData, "address"),
    },
  });
  refreshAdmin();
}

export async function createReseller(formData: FormData) {
  await assertAdmin();
  const name = textValue(formData, "name", "Nama");
  await prisma.reseller.create({
    data: {
      name,
      phone: optionalText(formData, "phone"),
      address: optionalText(formData, "address"),
    },
  });
  refreshAdmin();
}

export async function deleteReseller(id: number) {
  await assertAdmin();
  await prisma.reseller.delete({ where: { id } });
  refreshAdmin();
}

export async function toggleReseller(id: number) {
  await assertAdmin();
  const r = await prisma.reseller.findUniqueOrThrow({ where: { id } });
  await prisma.reseller.update({
    where: { id },
    data: { isActive: !r.isActive },
  });
  refreshAdmin();
}

export async function updateReseller(id: number, formData: FormData) {
  await assertAdmin();
  const name = textValue(formData, "name", "Nama");
  await prisma.reseller.update({
    where: { id },
    data: {
      name,
      phone: optionalText(formData, "phone"),
      address: optionalText(formData, "address"),
    },
  });
  refreshAdmin();
}

export async function bulkDeleteRecords(resource: any, formData: FormData) {
  await assertAdmin();
  refreshAdmin();
}

export async function createBulkOrder(formData: FormData) {
  await assertAdmin();

  const date = dateValue(formData, 'date', 'Tanggal');
  const paymentType = textValue(formData, 'paymentType', 'Pembayaran') as PaymentType;
  const status = textValue(formData, 'status', 'Status') as OrderStatus;
  const notes = optionalText(formData, 'notes');

  // Parse item entries: items[productId][quantity] and items[productId][price]
  const itemsRaw: Record<number, { quantity: number; price?: number }> = {};
  for (const [key, val] of formData.entries()) {
    const qtyMatch = key.match(/^items\[(\d+)\]\[quantity\]$/);
    if (qtyMatch) {
      const id = Number(qtyMatch[1]);
      if (!itemsRaw[id]) itemsRaw[id] = { quantity: 0 };
      itemsRaw[id].quantity = Number(val);
    }
    const priceMatch = key.match(/^items\[(\d+)\]\[price\]$/);
    if (priceMatch) {
      const id = Number(priceMatch[1]);
      if (!itemsRaw[id]) itemsRaw[id] = { quantity: 0 };
      itemsRaw[id].price = Number(val);
    }
  }

  const items = Object.entries(itemsRaw)
    .map(([id, v]) => ({ productId: Number(id), quantity: v.quantity, price: v.price }))
    .filter(i => i.quantity > 0);

  if (items.length === 0) {
    return { ok: false, message: 'Pilih minimal satu barang dan masukkan jumlahnya terlebih dahulu.' };
  }

  // Pre-calculate to ensure there is enough stock
  const dbProducts = await prisma.product.findMany({
    where: { id: { in: items.map(i => i.productId) } },
  });

  let totalAmount = 0;
  const orderItemsData = items.map(item => {
    const product = dbProducts.find(p => p.id === item.productId);
    if (!product) throw new Error('Produk tidak ditemukan');
    if (Number(product.stock) < item.quantity) {
      throw new Error(`Stok ${product.name} tidak mencukupi (sisa ${product.stock})`);
    }
    const sellPrice = item.price !== undefined && !isNaN(item.price) ? item.price : Number(product.price);
    const itemTotal = item.quantity * sellPrice;
    totalAmount += itemTotal;
    return {
      productId: item.productId,
      quantity: item.quantity,
      price: sellPrice,
      total: itemTotal,
      hpp: 0, // Will be updated by allocateFifo
    };
  });

  const orderNumber = code('JUAL-BULK');
  await ensureOpenDay(date);

  await prisma.$transaction(async (tx) => {
    // Create order header (Status defaults to SELESAI for bulk orders)
    const order = await tx.order.create({
      data: {
        orderNumber,
        status,
        paymentType,
        totalAmount,
        grossProfit: 0, // Will calculate later
        notes,
        createdAt: date,
        items: {
          create: orderItemsData,
        }
      },
      include: { items: true },
    });

    // Run FIFO allocation which deducts stock and calculates HPP
    await allocateFifo(tx, order.id);

    // After FIFO, calculate gross profit
    const updatedItems = await tx.orderItem.findMany({ where: { orderId: order.id } });
    const totalHpp = updatedItems.reduce((sum, item) => sum + Number(item.hpp), 0);
    const grossProfit = totalAmount - totalHpp;

    await tx.order.update({
      where: { id: order.id },
      data: { grossProfit },
    });

    // Record cash inflow if not TEMPO and status is SELESAI
    if (paymentType !== 'TEMPO' && status === 'SELESAI') {
      await tx.cashTransaction.create({
        data: {
          date,
          type: 'MASUK',
          category: 'Penjualan stok',
          amount: totalAmount,
          referenceId: orderNumber,
          description: `Penjualan massal ${orderNumber}`,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'BulkOrder',
        entityId: String(order.id),
        details: orderNumber,
      },
    });
  });

  refreshAdmin();
}

export async function createBulkPurchase(formData: FormData) {
  await assertAdmin();

  const date = dateValue(formData, 'date', 'Tanggal');
  const paymentType = textValue(formData, 'paymentType', 'Pembayaran') as PaymentType;
  const status = textValue(formData, 'status', 'Status') as PurchaseStatus;
  const notes = optionalText(formData, 'notes');

  // Parse item entries: items[productId][quantity] and items[productId][buyPrice]
  const itemsRaw: Record<number, { quantity: number; buyPrice: number }> = {};
  for (const [key, val] of formData.entries()) {
    const qtyMatch = key.match(/^items\[(\d+)\]\[quantity\]$/);
    const priceMatch = key.match(/^items\[(\d+)\]\[buyPrice\]$/);
    if (qtyMatch) {
      const id = Number(qtyMatch[1]);
      if (!itemsRaw[id]) itemsRaw[id] = { quantity: 0, buyPrice: 0 };
      itemsRaw[id].quantity = Number(val);
    }
    if (priceMatch) {
      const id = Number(priceMatch[1]);
      if (!itemsRaw[id]) itemsRaw[id] = { quantity: 0, buyPrice: 0 };
      itemsRaw[id].buyPrice = Number(val);
    }
  }

  const items = Object.entries(itemsRaw)
    .map(([id, v]) => ({ productId: Number(id), quantity: v.quantity, buyPrice: v.buyPrice }))
    .filter(i => i.quantity > 0);

  if (items.length === 0) {
    return { ok: false, message: 'Pilih minimal satu barang dan masukkan jumlahnya terlebih dahulu.' };
  }

  // Calculate total
  const total = items.reduce((sum, i) => sum + i.quantity * i.buyPrice, 0);

  // Check cash balance if payment is not TEMPO and status is SELESAI
  if (paymentType !== 'TEMPO' && status === 'SELESAI') {
    const cashTotals = await prisma.cashTransaction.groupBy({
      by: ['type'],
      _sum: { amount: true },
    });
    const incoming = Number(cashTotals.find(r => r.type === 'MASUK')?._sum.amount || 0);
    const outgoing = Number(cashTotals.find(r => r.type === 'KELUAR')?._sum.amount || 0);
    const balance = incoming - outgoing;

    if (balance <= 0 || balance < total) {
      const formatted = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(total);
      const balFormatted = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Math.max(0, balance));
      return {
        ok: false,
        message: `Pembelian gagal! Saldo kas tidak mencukupi.\n\nTotal pembelian: ${formatted}\nSaldo kas saat ini: ${balFormatted}\n\nSilakan tambah modal terlebih dahulu melalui halaman Kas & Modal sebelum melakukan pembelian.`,
      };
    }
  }

  const invoiceNumber = code('BELI-BULK');
  await ensureOpenDay(date);

  await prisma.$transaction(async (tx) => {
    // Create purchase header
    const purchase = await tx.purchase.create({
      data: {
        invoiceNumber,
        date,
        status,
        paymentType,
        totalAmount: total,
        notes,
      },
    });

    for (const item of items) {
      const product = await tx.product.findUniqueOrThrow({ where: { id: item.productId } });
      const buyPrice = item.buyPrice > 0 ? item.buyPrice : Number(product.buyPrice);
      const sellPrice = Number(product.price);
      const itemTotal = item.quantity * buyPrice;

      const purchaseItem = await tx.purchaseItem.create({
        data: {
          purchaseId: purchase.id,
          productId: item.productId,
          quantity: item.quantity,
          buyPrice,
          sellPrice,
          total: itemTotal,
          ownership: 'BELI_PUTUS',
        },
      });

      if (status === 'SELESAI') {
        const batch = await tx.stockBatch.create({
          data: {
            code: code('BATCH'),
            receivedAt: date,
            productId: item.productId,
            purchaseItemId: purchaseItem.id,
            initialQty: item.quantity,
            remainingQty: item.quantity,
            buyPrice,
            sellPrice,
            ownership: 'BELI_PUTUS',
          },
        });

        await tx.stockMovement.create({
          data: {
            date,
            productId: item.productId,
            batchId: batch.id,
            type: 'PEMBELIAN',
            quantity: item.quantity,
            unitCost: buyPrice,
            referenceId: invoiceNumber,
            description: `Pembelian massal ${invoiceNumber}`,
          },
        });

        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { increment: item.quantity },
            buyPrice,
            isActive: true,
          },
        });
      }
    }

    // Record cash outflow if not TEMPO and status is SELESAI
    if (paymentType !== 'TEMPO' && status === 'SELESAI') {
      await tx.cashTransaction.create({
        data: {
          date,
          type: 'KELUAR',
          category: 'Pembelian stok',
          amount: total,
          referenceId: invoiceNumber,
          description: `Pembelian massal ${invoiceNumber}`,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'BulkPurchase',
        entityId: String(purchase.id),
        details: invoiceNumber,
      },
    });
  });

  refreshAdmin();
}

export async function deleteOrder(id: number) {
  await assertAdmin();
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({ where: { id }, include: { items: true } });
    if (order.status === 'SELESAI') {
      await reverseCompletedOrder(tx, id);
    }
    await tx.order.delete({ where: { id } });
  });
  refreshAdmin();
}

export async function updateOrder(id: number, formData: FormData) {
  await assertAdmin();
  const date = dateValue(formData, 'date', 'Tanggal');
  const status = textValue(formData, 'status', 'Status') as OrderStatus;
  const paymentType = textValue(formData, 'paymentType', 'Pembayaran') as PaymentType;
  const notes = optionalText(formData, 'notes');

  const itemsRaw: Record<number, { quantity: number; price?: number }> = {};
  for (const [key, val] of formData.entries()) {
    const qtyMatch = key.match(/^items\[(\d+)\]\[quantity\]$/);
    const priceMatch = key.match(/^items\[(\d+)\]\[price\]$/);
    if (qtyMatch) {
      const pId = Number(qtyMatch[1]);
      if (!itemsRaw[pId]) itemsRaw[pId] = { quantity: 0 };
      itemsRaw[pId].quantity = Number(val);
    }
    if (priceMatch) {
      const pId = Number(priceMatch[1]);
      if (!itemsRaw[pId]) itemsRaw[pId] = { quantity: 0 };
      itemsRaw[pId].price = Number(val);
    }
  }
  
  const items = Object.entries(itemsRaw)
    .map(([pId, v]) => ({ productId: Number(pId), quantity: v.quantity, price: v.price }))
    .filter(i => i.quantity > 0);

  if (items.length === 0) {
    throw new Error('Pesanan harus memiliki minimal satu barang.');
  }

  await prisma.$transaction(async (tx) => {
    const oldOrder = await tx.order.findUniqueOrThrow({ where: { id }, include: { items: true } });
    
    if (oldOrder.status === 'SELESAI') {
      await reverseCompletedOrder(tx, id);
    }
    
    await tx.orderItem.deleteMany({ where: { orderId: id } });

    const dbProducts = await tx.product.findMany({
      where: { id: { in: items.map(i => i.productId) } },
    });
    
    let totalAmount = 0;
    const orderItemsData = items.map(item => {
      const product = dbProducts.find(p => p.id === item.productId);
      if (!product) throw new Error('Produk tidak ditemukan');
      
      const sellPrice = item.price !== undefined && !isNaN(item.price) ? item.price : Number(product.price);
      const itemTotal = item.quantity * sellPrice;
      totalAmount += itemTotal;
      return {
        productId: item.productId,
        quantity: item.quantity,
        price: sellPrice,
        total: itemTotal,
        hpp: 0,
      };
    });

    await tx.order.update({
      where: { id },
      data: {
        createdAt: date,
        status,
        paymentType,
        notes,
        totalAmount,
        grossProfit: 0,
        items: {
          create: orderItemsData,
        }
      }
    });

    if (status === 'SELESAI') {
      await allocateFifo(tx, id);
      
      const updatedItems = await tx.orderItem.findMany({ where: { orderId: id } });
      const totalHpp = updatedItems.reduce((sum, item) => sum + Number(item.hpp), 0);
      const grossProfit = totalAmount - totalHpp;
      
      await tx.order.update({
        where: { id },
        data: { grossProfit, completedAt: oldOrder.completedAt || new Date() }
      });
      
      if (paymentType !== 'TEMPO') {
        await tx.cashTransaction.create({
          data: {
            date,
            type: 'MASUK',
            category: 'Penjualan stok',
            amount: totalAmount,
            referenceId: oldOrder.orderNumber,
            description: `Penjualan massal ${oldOrder.orderNumber}`,
          }
        });
      }
    }
  });

  refreshAdmin();
}

export async function deletePurchase(id: number) {
  await assertAdmin();
  await prisma.$transaction(async (tx) => {
    const oldPurchase = await tx.purchase.findUniqueOrThrow({ 
      where: { id }, 
      include: { items: { include: { batch: true } } } 
    });

    for (const oldItem of oldPurchase.items) {
      if (oldItem.batch && Number(oldItem.batch.remainingQty) !== Number(oldItem.batch.initialQty)) {
        throw new Error(`Tidak dapat menghapus: Barang dari pembelian ini sudah ada yang terjual.`);
      }
    }

    for (const oldItem of oldPurchase.items) {
      if (oldPurchase.status === 'SELESAI') {
        await tx.product.update({
          where: { id: oldItem.productId },
          data: { stock: { decrement: Number(oldItem.quantity) } }
        });
      }
      if (oldItem.batch) {
        await tx.stockMovement.deleteMany({ where: { batchId: oldItem.batch.id } });
        await tx.stockBatch.delete({ where: { id: oldItem.batch.id } });
      }
    }
    if (oldPurchase.status === 'SELESAI') {
      await tx.cashTransaction.deleteMany({ 
        where: { referenceId: oldPurchase.invoiceNumber, category: 'Pembelian stok' } 
      });
    }
    await tx.purchase.delete({ where: { id } });
  });
  refreshAdmin();
}

export async function updatePurchase(id: number, formData: FormData) {
  await assertAdmin();

  const date = dateValue(formData, 'date', 'Tanggal');
  const paymentType = textValue(formData, 'paymentType', 'Pembayaran') as PaymentType;
  const status = textValue(formData, 'status', 'Status') as PurchaseStatus;
  const notes = optionalText(formData, 'notes');

  const itemsRaw: Record<number, { quantity: number; buyPrice: number }> = {};
  for (const [key, val] of formData.entries()) {
    const qtyMatch = key.match(/^items\[(\d+)\]\[quantity\]$/);
    const priceMatch = key.match(/^items\[(\d+)\]\[buyPrice\]$/);
    if (qtyMatch) {
      const pId = Number(qtyMatch[1]);
      if (!itemsRaw[pId]) itemsRaw[pId] = { quantity: 0, buyPrice: 0 };
      itemsRaw[pId].quantity = Number(val);
    }
    if (priceMatch) {
      const pId = Number(priceMatch[1]);
      if (!itemsRaw[pId]) itemsRaw[pId] = { quantity: 0, buyPrice: 0 };
      itemsRaw[pId].buyPrice = Number(val);
    }
  }

  const items = Object.entries(itemsRaw)
    .map(([pId, v]) => ({ productId: Number(pId), quantity: v.quantity, buyPrice: v.buyPrice }))
    .filter(i => i.quantity > 0);

  if (items.length === 0) {
    throw new Error('Pembelian harus memiliki minimal satu barang.');
  }

  await prisma.$transaction(async (tx) => {
    const oldPurchase = await tx.purchase.findUniqueOrThrow({ 
      where: { id }, 
      include: { items: { include: { batch: true } } } 
    });

    // Validasi apakah batch sudah dipakai
    for (const oldItem of oldPurchase.items) {
      if (oldItem.batch) {
        if (Number(oldItem.batch.remainingQty) !== Number(oldItem.batch.initialQty)) {
          throw new Error(`Tidak dapat mengedit: Barang dari pembelian ini sudah terjual.`);
        }
      }
    }

    // Revert old purchase
    for (const oldItem of oldPurchase.items) {
      if (oldPurchase.status === 'SELESAI') {
        await tx.product.update({
          where: { id: oldItem.productId },
          data: { stock: { decrement: Number(oldItem.quantity) } }
        });
      }
      if (oldItem.batch) {
        await tx.stockMovement.deleteMany({ where: { batchId: oldItem.batch.id } });
        await tx.stockBatch.delete({ where: { id: oldItem.batch.id } });
      }
    }
    await tx.purchaseItem.deleteMany({ where: { purchaseId: id } });
    if (oldPurchase.status === 'SELESAI') {
      await tx.cashTransaction.deleteMany({ 
        where: { referenceId: oldPurchase.invoiceNumber, category: 'Pembelian stok' } 
      });
    }


    // Apply new purchase
    const total = items.reduce((sum, i) => sum + i.quantity * i.buyPrice, 0);

    // Update header
    const purchase = await tx.purchase.update({
      where: { id },
      data: {
        date,
        status,
        paymentType,
        totalAmount: total,
        notes,
      },
    });

    for (const item of items) {
      const product = await tx.product.findUniqueOrThrow({ where: { id: item.productId } });
      const buyPrice = item.buyPrice > 0 ? item.buyPrice : Number(product.buyPrice);
      const sellPrice = Number(product.price);
      const itemTotal = item.quantity * buyPrice;

      const purchaseItem = await tx.purchaseItem.create({
        data: {
          purchaseId: purchase.id,
          productId: item.productId,
          quantity: item.quantity,
          buyPrice,
          sellPrice,
          total: itemTotal,
          ownership: 'BELI_PUTUS',
        },
      });

      if (status === 'SELESAI') {
        const batch = await tx.stockBatch.create({
          data: {
            code: code('BATCH'),
            receivedAt: date,
            productId: item.productId,
            purchaseItemId: purchaseItem.id,
            initialQty: item.quantity,
            remainingQty: item.quantity,
            buyPrice,
            sellPrice,
            ownership: 'BELI_PUTUS',
          },
        });

        await tx.stockMovement.create({
          data: {
            date,
            productId: item.productId,
            batchId: batch.id,
            type: 'PEMBELIAN',
            quantity: item.quantity,
            unitCost: buyPrice,
            referenceId: oldPurchase.invoiceNumber,
            description: `Update pembelian massal ${oldPurchase.invoiceNumber}`,
          },
        });

        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { increment: item.quantity },
            buyPrice,
            isActive: true,
          },
        });
      }
    }

    if (paymentType !== 'TEMPO' && status === 'SELESAI') {
      await tx.cashTransaction.create({
        data: {
          date,
          type: 'KELUAR',
          category: 'Pembelian stok',
          amount: total,
          referenceId: oldPurchase.invoiceNumber,
          description: `Pembelian massal ${oldPurchase.invoiceNumber}`,
        },
      });
    }
  });

  refreshAdmin();
}
