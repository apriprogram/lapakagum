import Link from "next/link";
import { Plus, Trash2, Pencil, Search, Filter, TrendingDown, ShoppingBag, FileText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  currency,
  date,
  dateWithDay,
  number,
  orderStatusLabel,
  paymentTypeLabel,
} from "@/lib/format";
import AdminDataTable from "@/components/AdminDataTable";
import { OrderRowActions } from "@/components/OrderCrudModals";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const [orders, products] = await Promise.all([
    prisma.order.findMany({
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.product.findMany({
      where: { isActive: true, stock: { gt: 0 } },
      orderBy: { name: "asc" },
    }),
  ]);
  const productOptions = products.map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category,
    imageUrl: item.imageUrl,
    stock: Number(item.stock),
    unit: item.unit,
    buyPrice: Number(item.buyPrice),
    price: Number(item.price),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-blue-600">Operasional</p>
          <h1 className="mt-1 text-2xl font-semibold text-blue-950">
            Penjualan
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Kelola transaksi penjualan, pelanggan, status, dan nota dalam satu
            halaman.
          </p>
        </div>
        <Link
          href="/admin/orders/new"
          className="admin-data-action interactive inline-flex items-center justify-center gap-2"
        >
          <Plus /> Tambah penjualan
        </Link>
      </div>

      <section className="surface overflow-hidden">
        <div className="flex items-center gap-3 border-b border-blue-100 px-5 py-4">
          <span className="flex size-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <ShoppingBag className="size-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-blue-950">
              Daftar penjualan
            </h2>
            <p className="mt-1 text-[11px] text-slate-400">
              {orders.length} transaksi terakhir
            </p>
          </div>
        </div>
        <AdminDataTable title="Daftar penjualan">
          <table className="w-full min-w-[950px] text-left text-sm">
            <thead className="border-b border-blue-100 bg-blue-50/50 text-[10px] uppercase tracking-wider text-slate-400">
              <tr>
                <th data-table-control>
                  <input
                    type="checkbox"
                    data-select-all
                    className="admin-table-checkbox"
                    aria-label="Pilih semua penjualan"
                  />
                </th>
                <th className="px-3 py-3 w-10">No.</th>
                <th className="px-5 py-3 w-40">Tanggal & Transaksi</th>
                <th className="px-5 py-3">Detail Barang</th>
                <th className="px-5 py-3 w-28 text-right">Total Berat</th>
                <th className="px-5 py-3 w-32 text-right">Total Harga</th>
                <th className="px-5 py-3 w-40">Pembayaran & Status</th>
                <th className="px-5 py-3 text-right w-20">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-50">
              {orders.map((order) => {
                const productsLabel = order.items
                  .map(
                    (item) =>
                      item.product.name +
                      " (" +
                      number(Number(item.quantity)) +
                      " " +
                      item.product.unit +
                      ")",
                  )
                  .join(", ");
                const firstItem = order.items[0];
                const record = {
                  id: order.id,
                  orderNumber: order.orderNumber,
                  createdAt: order.createdAt.toISOString(),
                  notes: order.notes || "",
                  paymentType: order.paymentType,
                  paymentLabel: paymentTypeLabel(order.paymentType),
                  status: order.status,
                  statusLabel: orderStatusLabel(order.status),
                  totalLabel: currency(Number(order.totalAmount)),
                  profitLabel:
                    order.status === "SELESAI"
                      ? currency(Number(order.grossProfit))
                      : "-",
                  productsLabel,
                  productId: firstItem?.productId || 0,
                  quantity: Number(firstItem?.quantity || 0),
                  itemsRaw: order.items.map(i => ({ productId: i.productId, quantity: Number(i.quantity), price: Number(i.price) })),
                  canEditItem: true,
                };

                // Total berat semua item
                const totalQty = order.items.reduce((sum, i) => sum + Number(i.quantity), 0);
                const unit = order.items[0]?.product.unit ?? 'kg';

                return (
                  <tr
                    key={order.id}
                    data-table-row
                    className="hover:bg-blue-50/30 align-top"
                  >
                    <td data-table-control className="pt-4">
                      <input
                        type="checkbox"
                        data-row-select
                        value={order.id}
                        className="admin-table-checkbox"
                        aria-label={"Pilih " + order.orderNumber}
                      />
                    </td>
                    <td data-row-number className="px-3 pt-4" />
                    <td className="px-5 pt-4">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-slate-500 text-xs whitespace-nowrap">
                          {dateWithDay(order.createdAt)}
                        </span>
                        <div>
                          <span className="inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-medium text-rose-600 border border-rose-100">
                            <TrendingDown className="size-3" /> Pengurangan Stok
                          </span>
                        </div>
                      </div>
                    </td>
                    
                    {/* Detail barang per item */}
                    <td className="px-5 py-3">
                      <div className="space-y-1.5">
                        {/* Header kolom item */}
                        <div className="grid grid-cols-[1fr_60px_80px_90px] gap-2 text-[9px] font-semibold uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-100">
                          <span>Nama Barang</span>
                          <span className="text-right">Berat</span>
                          <span className="text-right">Harga Jual</span>
                          <span className="text-right">Subtotal</span>
                        </div>
                        {/* Rows per item */}
                        {order.items.map(oi => (
                          <div key={oi.id} className="grid grid-cols-[1fr_60px_80px_90px] gap-2 text-xs">
                            <span className="font-medium text-blue-700 whitespace-nowrap">{oi.product.name}</span>
                            <span className="text-right text-slate-600">{number(Number(oi.quantity))} {oi.product.unit}</span>
                            <span className="text-right text-slate-500">{currency(Number(oi.price))}</span>
                            <span className="text-right font-semibold text-slate-700">{currency(Number(oi.total))}</span>
                          </div>
                        ))}
                      </div>
                    </td>

                    {/* Total berat keseluruhan */}
                    <td className="px-5 pt-4 text-right total-highlight whitespace-nowrap text-xs">
                      {number(totalQty)} {unit}
                    </td>

                    {/* Total harga */}
                    <td className="px-5 pt-4 text-right total-highlight whitespace-nowrap">
                      {currency(Number(order.totalAmount))}
                    </td>

                    {/* Status pembayaran & pesanan */}
                    <td className="px-5 pt-4">
                      <div className="flex flex-col items-start gap-1.5">
                        <span
                          className={
                            order.paymentType === "TEMPO"
                              ? "admin-payment-pill is-warning"
                              : "admin-payment-pill is-success"
                          }
                        >
                          {paymentTypeLabel(order.paymentType)}
                        </span>
                        <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-[11px] font-medium border whitespace-nowrap ${
                          order.status === 'SELESAI' ? 'bg-green-50 text-green-600 border-green-200' : 
                          order.status === 'BATAL' ? 'bg-red-50 text-red-600 border-red-200' :
                          order.status === 'TUNDA' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' :
                          'bg-slate-50 text-slate-600 border-slate-200'
                        }`}>
                          {order.status === 'SELESAI' ? 'Selesai' : order.status === 'BATAL' ? 'Dibatalkan' : order.status === 'TUNDA' ? 'Tertunda' : order.status}
                        </span>
                      </div>
                    </td>

                    {/* Aksi */}
                    <td className="px-5 pt-4 text-right">
                      <OrderRowActions
                        order={record}
                        products={productOptions}
                      />
                    </td>
                  </tr>
                );
              })}
              {!!orders.length && (
                <tr className="bg-blue-50/60 border-t-2 border-blue-100 font-bold text-blue-950">
                  <td colSpan={4} className="px-5 py-4 text-right uppercase tracking-wider text-[11px] text-blue-700">
                    Total Keseluruhan
                  </td>
                  <td className="px-5 py-4 text-right whitespace-nowrap text-xs">
                    {number(orders.reduce((sum, order) => sum + order.items.reduce((s, i) => s + Number(i.quantity), 0), 0))} kg
                  </td>
                  <td className="px-5 py-4 text-right whitespace-nowrap text-sm text-emerald-700">
                    {currency(orders.reduce((sum, order) => sum + Number(order.totalAmount), 0))}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              )}
              {!orders.length && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-12 text-center text-slate-400"
                  >
                    Belum ada penjualan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </AdminDataTable>
      </section>
    </div>
  );
}
