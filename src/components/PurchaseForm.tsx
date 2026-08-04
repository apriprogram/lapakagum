"use client";

import { useMemo, useState } from "react";
import { Calculator, Save } from "lucide-react";
import { createPurchase } from "@/app/actions/business";
import AppSelect from "@/components/AppSelect";
import AdminDatePicker from "@/components/AdminDatePicker";
import AdminActionForm from "@/components/AdminActionForm";
import CurrencyInput from "@/components/CurrencyInput";

interface Option {
  id: number;
  name: string;
  unit?: string;
}

const money = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

export default function PurchaseForm({
  vendors,
  products,
}: {
  vendors: Option[];
  products: Option[];
}) {
  const [quantity, setQuantity] = useState(0);
  const [buyPrice, setBuyPrice] = useState(0);
  const [sellPrice, setSellPrice] = useState(0);
  const calculations = useMemo(
    () => ({
      total: quantity * buyPrice,
      potential: quantity * sellPrice,
      margin: sellPrice - buyPrice,
      profit: quantity * (sellPrice - buyPrice),
    }),
    [quantity, buyPrice, sellPrice],
  );
  const input =
    "mt-2 h-11 w-full rounded-xl border border-blue-100 bg-white px-3 text-sm outline-none focus:border-blue-500";

  return (
    <AdminActionForm
      action={createPurchase}
      successMessage="Pembelian berhasil ditambahkan."
      resetOnSuccess
      onReset={() => {
        setQuantity(0);
        setBuyPrice(0);
        setSellPrice(0);
      }}
      className="grid gap-5 lg:grid-cols-[1fr_310px]"
    >
      <div className="surface grid gap-5 p-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <h2 className="text-sm font-semibold text-blue-950">
            Informasi pembelian
          </h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Isi barang yang datang, pemasok, harga beli, dan rencana harga jual.
          </p>
        </div>
        <label className="text-xs font-medium text-slate-600">
          Tanggal
          <AdminDatePicker
            name="date"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
            className="mt-2"
          />
        </label>

        <label className="text-xs font-medium text-slate-600">
          Produk
          <AppSelect
            name="productId"
            required
            className={input}
            placeholder="Pilih produk"
            options={[
              { value: "", label: "Pilih produk" },
              ...products.map((item) => ({
                value: String(item.id),
                label: item.name,
              })),
            ]}
          />
        </label>
        <label className="text-xs font-medium text-slate-600">
          Berat / jumlah
          <input
            name="quantity"
            type="number"
            required
            min="0.001"
            step="0.001"
            value={quantity || ""}
            onChange={(event) => setQuantity(Number(event.target.value))}
            className={input}
            placeholder="0"
          />
        </label>
        <label className="text-xs font-medium text-slate-600">
          Harga beli per satuan
          <CurrencyInput
            name="buyPrice"
            required
            value={buyPrice}
            onValueChange={setBuyPrice}
            className={input}
          />
        </label>
        <label className="text-xs font-medium text-slate-600">
          Harga jual per satuan
          <CurrencyInput
            name="sellPrice"
            required
            value={sellPrice}
            onValueChange={setSellPrice}
            className={input}
          />
        </label>
        <label className="text-xs font-medium text-slate-600">
          Pembayaran
          <AppSelect
            name="paymentType"
            defaultValue="TUNAI"
            className={input}
            options={[
              { value: "TUNAI", label: "Tunai" },
              { value: "TRANSFER", label: "Transfer" },
              { value: "TEMPO", label: "Bayar nanti / hutang" },
            ]}
          />
        </label>
        <label className="text-xs font-medium text-slate-600">
          Kepemilikan
          <AppSelect
            name="ownership"
            defaultValue="BELI_PUTUS"
            className={input}
            options={[
              { value: "BELI_PUTUS", label: "Dibeli penuh" },
              {
                value: "KONSINYASI",
                label: "Titip jual, dibayar setelah laku",
              },
              {
                value: "DAPAT_DIRETUR",
                label: "Boleh dikembalikan ke pemasok",
              },
            ]}
          />
        </label>
        <label className="text-xs font-medium text-slate-600 sm:col-span-2">
          Catatan tambahan
          <textarea
            name="notes"
            rows={2}
            placeholder="Contoh: ukuran campur atau pembayaran minggu depan"
            className="mt-2 w-full rounded-xl border border-blue-100 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
        </label>
      </div>
      <aside className="surface h-fit p-5">
        <div className="flex items-center gap-2">
          <Calculator className="size-4 text-blue-600" />
          <h2 className="text-sm font-semibold text-blue-950">
            Perkiraan otomatis
          </h2>
        </div>
        <div className="mt-5 space-y-3">
          {[
            ["Nilai pembelian", calculations.total],
            ["Potensi penjualan", calculations.potential],
            ["Selisih harga per satuan", calculations.margin],
            ["Perkiraan keuntungan", calculations.profit],
          ].map(([label, value]) => (
            <div
              key={String(label)}
              className="flex items-center justify-between border-b border-blue-50 pb-3 text-xs"
            >
              <span className="text-slate-500">{String(label)}</span>
              <span
                className={`font-semibold ${Number(value) < 0 ? "text-red-600" : "text-blue-950"}`}
              >
                {money(Number(value))}
              </span>
            </div>
          ))}
        </div>
        {calculations.margin < 0 && (
          <p className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3 text-xs text-red-700">
            Harga jual lebih rendah dari harga beli.
          </p>
        )}
        <button
          disabled={!vendors.length || !products.length}
          className="admin-data-action interactive mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-slate-300"
        >
          <Save className="size-4" /> Simpan pembelian
        </button>
      </aside>
    </AdminActionForm>
  );
}
