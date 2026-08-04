import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { formatOrderNumber, temporaryOrderNumber } from '@/lib/order-number';

interface CheckoutItem {
  productId: number;
  quantity: number;
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      customerName?: string;
      customerPhone?: string;
      address?: string;
      notes?: string;
      items?: CheckoutItem[];
    };
    const customerName = body.customerName?.trim();
    const customerPhone = body.customerPhone?.replace(/[^0-9+]/g, '');
    if (!customerName || !customerPhone || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ message: 'Data pesanan belum lengkap' }, { status: 400 });
    }

    const requested = body.items
      .map((item) => ({ productId: Number(item.productId), quantity: Number(item.quantity) }))
      .filter((item) => Number.isInteger(item.productId) && Number.isFinite(item.quantity) && item.quantity > 0);
    if (requested.length !== body.items.length) {
      return NextResponse.json({ message: 'Item pesanan tidak valid' }, { status: 400 });
    }

    const products = await prisma.product.findMany({
      where: { id: { in: requested.map((item) => item.productId) }, isActive: true },
    });
    if (products.length !== requested.length) {
      return NextResponse.json({ message: 'Ada produk yang tidak lagi tersedia' }, { status: 409 });
    }

    let totalAmount = 0;
    const items = requested.map((requestedItem) => {
      const product = products.find((candidate) => candidate.id === requestedItem.productId)!;
      if (requestedItem.quantity > Number(product.stock)) {
        throw new Error(`Stok ${product.name} tidak mencukupi`);
      }
      const total = requestedItem.quantity * Number(product.price);
      totalAmount += total;
      return {
        productId: product.id,
        quantity: requestedItem.quantity,
        price: product.price,
        total,
      };
    });

    const session = await getServerSession(authOptions);
    const createdAt = new Date();
    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber: temporaryOrderNumber(),
          notes: body.notes?.trim() || null,
          paymentType: 'TRANSFER',
          totalAmount,
          createdAt,
          items: { create: items },
        },
      });
      return tx.order.update({
        where: { id: created.id },
        data: { orderNumber: formatOrderNumber(created.id, createdAt) },
        include: { items: { include: { product: true } } },
      });
    });

    const lines = order.items.map(
      (item) => `- ${item.product.name}: ${Number(item.quantity).toLocaleString('id-ID')} ${item.product.unit} x Rp ${Number(item.price).toLocaleString('id-ID')} = Rp ${Number(item.total).toLocaleString('id-ID')}`,
    );
    const message = [
      'Halo Lapak Udang & Ikan, saya ingin memesan:',
      '',
      `No. Pesanan: ${order.orderNumber}`,
      ...lines,
      '',
      `Total: Rp ${Number(order.totalAmount).toLocaleString('id-ID')}`,
      order.notes ? `Catatan: ${order.notes}` : '',
      '',
      'Mohon konfirmasi ketersediaan dan pembayarannya. Terima kasih.',
    ].filter(Boolean).join('\n');

    return NextResponse.json({
      orderNumber: order.orderNumber,
      whatsappUrl: `https://wa.me/${process.env.WHATSAPP_NUMBER || '6281234567890'}?text=${encodeURIComponent(message)}`,
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal membuat pesanan';
    return NextResponse.json({ message }, { status: 400 });
  }
}

