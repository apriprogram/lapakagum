'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { Eye, X } from 'lucide-react';
import { currency, number } from '@/lib/format';

interface StockDetailModalProps {
  product: {
    name: string;
    category: string;
    unit: string;
    imageUrl: string | null;
    buyPrice: number;
    price: number;
    remaining: number;
    purchased: number;
    sold: number;
    unitProfit: number;
    totalProfit: number;
  };
}

export default function StockDetailModal({ product }: StockDetailModalProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const modalContent = open ? (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60" onClick={() => setOpen(false)} />
      <div className="modal-enter relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-blue-100 bg-blue-50/50 px-5 py-4">
          <h2 className="text-sm font-semibold text-blue-950">Detail Stok Barang</h2>
          <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
            <X className="size-5" />
          </button>
        </div>
        
        <div className="p-5">
          <div className="flex gap-4">
            <span className="relative block size-20 shrink-0 overflow-hidden rounded-xl border border-blue-100 bg-blue-50">
              <Image src={product.imageUrl || '/lapak-udang-ikan-logo.png'} alt={product.name} fill sizes="80px" className="object-cover" />
            </span>
            <div>
              <h3 className="text-lg font-semibold text-blue-950">{product.name}</h3>
              <span className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 uppercase tracking-wide">
                {product.category}
              </span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-blue-50 bg-slate-50/50 p-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-wide">Sisa Stok</p>
              <p className="mt-1 text-sm font-semibold text-blue-950">{number(product.remaining)} {product.unit}</p>
            </div>
            <div className="rounded-xl border border-emerald-50 bg-emerald-50/30 p-3">
              <p className="text-[10px] text-emerald-600 uppercase tracking-wide">Total Keuntungan</p>
              <p className="mt-1 text-sm font-semibold text-emerald-700">{currency(product.totalProfit)}</p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex justify-between border-b border-dashed border-blue-100 pb-3">
              <span className="text-xs text-slate-500">Harga Beli</span>
              <span className="text-xs font-medium text-blue-950">{currency(product.buyPrice)}</span>
            </div>
            <div className="flex justify-between border-b border-dashed border-blue-100 pb-3">
              <span className="text-xs text-slate-500">Harga Jual</span>
              <span className="text-xs font-medium text-blue-950">{currency(product.price)}</span>
            </div>
            <div className="flex justify-between border-b border-dashed border-blue-100 pb-3">
              <span className="text-xs text-slate-500">Untung per Satuan</span>
              <span className="text-xs font-medium text-emerald-600">{currency(product.unitProfit)}</span>
            </div>
            <div className="flex justify-between border-b border-dashed border-blue-100 pb-3">
              <span className="text-xs text-slate-500">Total Pembelian</span>
              <span className="text-xs font-medium text-blue-950">{number(product.purchased)} {product.unit}</span>
            </div>
            <div className="flex justify-between pb-1">
              <span className="text-xs text-slate-500">Total Penjualan</span>
              <span className="text-xs font-medium text-blue-950">{number(product.sold)} {product.unit}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button 
        type="button" 
        onClick={() => setOpen(true)}
        aria-label={'Lihat ' + product.name} 
        title="Detail"
        className="text-blue-500 hover:text-blue-700"
      >
        <Eye className="size-4" />
      </button>

      {mounted && createPortal(modalContent, document.body)}
    </>
  );
}
