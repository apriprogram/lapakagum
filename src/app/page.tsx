import { prisma } from '@/lib/prisma';
import Storefront from '@/components/Storefront';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [products, purchaseCount] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true, stock: { gt: 0 } },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.order.count({ where: { status: { not: 'BATAL' } } }),
  ]);

  const stockCount = products.reduce((total, item) => total + Number(item.stock), 0);

  const categoryStats = products.reduce((acc, item) => {
    const cat = item.category.toLowerCase();
    if (!acc[cat]) {
      acc[cat] = { name: item.category, productCount: 0, stockCount: 0 };
    }
    acc[cat].productCount += 1;
    acc[cat].stockCount += Number(item.stock);
    return acc;
  }, {} as Record<string, { name: string; productCount: number; stockCount: number }>);

  return (
    <Storefront
      products={products.map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        imageUrl: item.imageUrl,
        description: item.description,
        unit: item.unit,
        price: Number(item.price),
        stock: Number(item.stock),
      }))}
      statistics={{
        productCount: products.length,
        purchaseCount,
        stockCount,
        categoryStats: Object.values(categoryStats),
      }}
    />
  );
}
