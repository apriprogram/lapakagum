'use client';
import { Printer } from 'lucide-react';
export default function PrintButton() { return <button onClick={() => window.print()} className="interactive flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white print:hidden"><Printer className="size-4" /> Cetak nota</button>; }
