import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  currency,
  date,
  number,
  orderStatusLabel,
  paymentTypeLabel,
} from "@/lib/format";
import PrintButton from "@/components/PrintButton";

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = Number((await params).id);
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { product: true } } },
  });
  if (!order) notFound();
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex justify-end">
        <PrintButton />
      </div>
      <article className="surface bg-white p-8 sm:p-12">
        <div className="flex flex-col justify-between gap-6 border-b border-blue-100 pb-8 sm:flex-row">
          <div>
            <p className="text-sm font-semibold text-blue-600">
              LAPAK UDANG & IKAN
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-blue-950">
              Nota penjualan
            </h1>
            <p className="mt-2 text-sm text-slate-500">{order.orderNumber}</p>
          </div>
          <div className="text-sm sm:text-right">
            <p className="font-medium text-blue-950">{date(order.createdAt)}</p>
            <p className="mt-2 text-slate-500">
              Status: {orderStatusLabel(order.status)}
            </p>
          </div>
        </div>
        <div className="grid gap-6 py-8 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Pelanggan
            </p>
            <p className="mt-3 font-semibold text-blue-950">
              Umum
            </p>
            <p className="mt-1 text-sm text-slate-500">-</p>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              -
            </p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Pembayaran
            </p>
            <p className="mt-3 font-semibold text-blue-950">
              {paymentTypeLabel(order.paymentType)}
            </p>
          </div>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="border-y border-blue-100 bg-blue-50/50 text-[10px] uppercase tracking-wider text-slate-400">
            <tr>
              <th className="py-3 pl-3">Produk</th>
              <th className="py-3">Jumlah</th>
              <th className="py-3">Harga</th>
              <th className="py-3 pr-3 text-right">Jumlah harga</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-blue-50">
            {order.items.map((item) => (
              <tr key={item.id}>
                <td className="py-4 pl-3 font-medium text-blue-950">
                  {item.product.name}
                </td>
                <td className="py-4 text-slate-600">
                  {number(Number(item.quantity))} {item.product.unit}
                </td>
                <td className="py-4 text-slate-600">
                  {currency(Number(item.price))}
                </td>
                <td className="py-4 pr-3 text-right font-medium text-blue-950">
                  {currency(Number(item.total))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-8 flex justify-end">
          <div className="w-full max-w-xs rounded-xl bg-blue-50 p-5">
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">Total</span>
              <span className="text-xl font-semibold text-blue-950">
                {currency(Number(order.totalAmount))}
              </span>
            </div>
          </div>
        </div>
        <p className="mt-10 border-t border-blue-100 pt-6 text-center text-xs text-slate-400">
          Terima kasih telah berbelanja di Lapak Udang & Ikan.
        </p>
      </article>
    </div>
  );
}
