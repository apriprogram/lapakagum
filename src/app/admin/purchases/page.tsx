import Link from "next/link";
import { Plus, ShoppingCart, TrendingUp } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { currency, date, dateWithDay, number, paymentTypeLabel } from "@/lib/format";
import AdminDataTable from "@/components/AdminDataTable";
import { PurchaseRowActions } from "@/components/PurchaseCrudModals";

export const dynamic = "force-dynamic";

const ownershipLabel = (value: string) =>
  (
    ({
      BELI_PUTUS: "Dibeli penuh",
      KONSINYASI: "Titip jual",
      DAPAT_DIRETUR: "Dapat diretur",
    }) as Record<string, string>
  )[value] || value;

export default async function PurchasesPage() {
  const [products, purchases] = await Promise.all([
    prisma.product.findMany({ orderBy: { name: "asc" } }),
    prisma.purchase.findMany({
      include: {
        payments: { select: { id: true } },
        items: { include: { product: true, batch: true } },
      },
      orderBy: { date: "desc" },
      take: 30,
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
            Pembelian
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Kelola barang masuk, pemasok, harga, stok, dan pembayaran pembelian.
          </p>
        </div>
        <Link
          href="/admin/purchases/new"
          className="admin-data-action interactive inline-flex items-center justify-center gap-2"
        >
          <Plus /> Tambah pembelian
        </Link>
      </div>
      {!products.length && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Tambahkan minimal satu produk sebelum mencatat pembelian.
        </div>
      )}

      <section className="surface overflow-hidden">
        <div className="flex items-center gap-3 border-b border-blue-100 px-5 py-4">
          <span className="flex size-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <ShoppingCart className="size-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-blue-950">
              Daftar pembelian
            </h2>
            <p className="mt-1 text-[11px] text-slate-400">
              {purchases.length} transaksi terakhir
            </p>
          </div>
        </div>
        <AdminDataTable title="Daftar pembelian">
          <table className="w-full min-w-[950px] text-left text-sm">
            <thead className="border-b border-blue-100 bg-blue-50/50 text-[10px] font-medium uppercase tracking-wider text-slate-400">
              <tr>
                <th data-table-control>
                  <input
                    type="checkbox"
                    data-select-all
                    className="admin-table-checkbox"
                    aria-label="Pilih semua pembelian"
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
              {purchases.map((purchase) => {
                const item = purchase.items[0];
                if (!item) return null;
                const editable =
                  purchase.payments.length === 0 &&
                  purchase.items.every(
                    (item) =>
                      Boolean(item.batch) &&
                      Math.abs(
                        Number(item.batch?.remainingQty || 0) -
                          Number(item.batch?.initialQty || 0),
                      ) <= 0.0001
                  );
                const totalQty = purchase.items.reduce((sum, i) => sum + Number(i.quantity), 0);
                const calculatedTotalAmount = purchase.items.reduce((sum, i) => sum + Number(i.total), 0);
                const unit = purchase.items[0]?.product.unit ?? 'kg';

                const record = {
                  id: purchase.id,
                  invoiceNumber: purchase.invoiceNumber,
                  date: purchase.date.toISOString().slice(0, 10),
                  productId: item.productId,
                  productName: item.product.name,
                  unit: item.product.unit,
                  quantity: Number(item.quantity),
                  buyPrice: Number(item.buyPrice),
                  sellPrice: Number(item.sellPrice),
                  totalLabel: currency(calculatedTotalAmount),
                  paymentType: purchase.paymentType,
                  paymentLabel: paymentTypeLabel(purchase.paymentType),
                  status: purchase.status,
                  ownership: item.ownership,
                  ownershipLabel: item.ownership === 'KONSINYASI' ? 'Titipan' : 'Beli Putus',
                  notes: purchase.notes || "",
                  itemsRaw: purchase.items.map(i => ({ productId: i.productId, quantity: Number(i.quantity), buyPrice: Number(i.buyPrice) })),
                  editable,
                };

                return (
                  <tr
                    key={purchase.id}
                    data-table-row
                    className="hover:bg-blue-50/30 align-top"
                  >
                    <td data-table-control className="pt-4">
                      <input
                        type="checkbox"
                        data-row-select
                        value={purchase.id}
                        className="admin-table-checkbox"
                        aria-label={"Pilih " + purchase.invoiceNumber}
                      />
                    </td>
                    <td data-row-number className="px-3 pt-4" />
                    <td className="px-5 pt-4">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-slate-500 text-xs whitespace-nowrap">
                          {dateWithDay(purchase.date)}
                        </span>
                        <div>
                          <span className="inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-600 border border-emerald-100">
                            <TrendingUp className="size-3" /> Penambahan Stok
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
                          <span className="text-right">Harga/Sat.</span>
                          <span className="text-right">Subtotal</span>
                        </div>
                        {/* Rows per item */}
                        {purchase.items.map(pi => (
                          <div key={pi.id} className="grid grid-cols-[1fr_60px_80px_90px] gap-2 text-xs">
                            <span className="font-medium text-blue-700 whitespace-nowrap">{pi.product.name}</span>
                            <span className="text-right text-slate-600">{number(Number(pi.quantity))} {pi.product.unit}</span>
                            <span className="text-right text-slate-500">{currency(Number(pi.buyPrice))}</span>
                            <span className="text-right font-semibold text-slate-700">{currency(Number(pi.total))}</span>
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
                      {currency(calculatedTotalAmount)}
                    </td>

                    {/* Status pembayaran & pesanan */}
                    <td className="px-5 pt-4">
                      <div className="flex flex-col items-start gap-1.5">
                        <span
                          className={
                            purchase.paymentType === "TEMPO"
                              ? "admin-payment-pill is-warning"
                              : "admin-payment-pill is-success"
                          }
                        >
                          {paymentTypeLabel(purchase.paymentType)}
                        </span>
                        <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-[11px] font-medium border whitespace-nowrap ${
                          purchase.status === 'SELESAI' ? 'bg-green-50 text-green-600 border-green-200' : 
                          purchase.status === 'BATAL' ? 'bg-red-50 text-red-600 border-red-200' :
                          purchase.status === 'TUNDA' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' :
                          'bg-slate-50 text-slate-600 border-slate-200'
                        }`}>
                          {purchase.status === 'SELESAI' ? 'Selesai' : purchase.status === 'BATAL' ? 'Dibatalkan' : purchase.status === 'TUNDA' ? 'Tertunda' : purchase.status}
                        </span>
                      </div>
                    </td>

                    {/* Aksi */}
                    <td className="px-5 pt-4 text-right">
                      <PurchaseRowActions
                        purchase={record}
                        products={productOptions}
                      />
                    </td>
                  </tr>
                );
              })}
              {!!purchases.length && (
                <tr className="bg-blue-50/60 border-t-2 border-blue-100 font-bold text-blue-950">
                  <td colSpan={4} className="px-5 py-4 text-right uppercase tracking-wider text-[11px] text-blue-700">
                    Total Keseluruhan
                  </td>
                  <td className="px-5 py-4 text-right whitespace-nowrap text-xs">
                    {number(purchases.reduce((sum, purchase) => sum + purchase.items.reduce((s, i) => s + Number(i.quantity), 0), 0))} kg
                  </td>
                  <td className="px-5 py-4 text-right whitespace-nowrap text-sm text-emerald-700">
                    {currency(purchases.reduce((sum, purchase) => sum + purchase.items.reduce((s, i) => s + Number(i.total), 0), 0))}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              )}
              {!purchases.length && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-12 text-center text-slate-400"
                  >
                    Belum ada pembelian.
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
