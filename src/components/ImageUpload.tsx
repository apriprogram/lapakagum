'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2, UploadCloud } from 'lucide-react';

export default function ImageUpload({ name, defaultValue }: { name: string; defaultValue?: string }) {
  const [url, setUrl] = useState(defaultValue || '');
  const [fileName, setFileName] = useState(defaultValue?.split('/').pop() || '');
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const input = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    setError('');
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setError('Gunakan gambar JPG, PNG, WEBP, atau GIF.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran gambar maksimal 5 MB.');
      return;
    }
    setLoading(true);
    const body = new FormData();
    body.append('file', file);
    try {
      const response = await fetch('/api/upload', { method: 'POST', body });
      const result = await response.json() as { url?: string; error?: string };
      if (!response.ok || !result.url) throw new Error(result.error || 'Gagal mengunggah gambar');
      setUrl(result.url);
      setFileName(file.name);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Gagal mengunggah gambar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input type="hidden" name={name} value={url} />
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(event) => event.target.files?.[0] && upload(event.target.files[0])} />
      <div
        onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => { event.preventDefault(); setDragging(false); const file = event.dataTransfer.files[0]; if (file) upload(file); }}
        className={`flex min-h-40 flex-col items-center justify-center rounded-2xl border border-dashed p-6 text-center transition-colors ${dragging ? 'border-blue-500 bg-blue-50' : 'border-blue-200 bg-blue-50/30'}`}
      >
        {loading ? <><Loader2 className="size-7 animate-spin text-blue-600" /><p className="mt-3 text-sm font-medium text-blue-950">Mengunggah gambar...</p></> : (
          <><span className="flex size-11 items-center justify-center rounded-xl bg-white text-blue-600"><UploadCloud className="size-5" /></span><p className="mt-3 text-sm font-medium text-blue-950">Tarik gambar ke sini, atau pilih dari perangkat</p><p className="mt-1 text-xs text-slate-400">JPG, PNG, WEBP, GIF - maksimal 5 MB</p><button type="button" onClick={() => input.current?.click()} className="interactive mt-4 rounded-xl border border-blue-200 bg-white px-4 py-2 text-xs font-medium text-blue-700 hover:border-blue-400">Pilih gambar dari perangkat</button></>
        )}
      </div>
      {url && <div className="mt-3 flex items-center gap-3 rounded-xl border border-blue-100 p-3"><span className="relative flex size-12 overflow-hidden rounded-lg bg-blue-50"><Image src={url} alt="Pratinjau" fill sizes="48px" className="object-cover" /></span><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium text-blue-950">{fileName}</p><p className="mt-1 text-[10px] text-emerald-600">Gambar siap digunakan</p></div><button type="button" onClick={() => { setUrl(''); setFileName(''); if (input.current) input.current.value = ''; }} className="interactive flex size-9 items-center justify-center rounded-lg text-red-500 hover:bg-red-50"><Trash2 className="size-4" /></button></div>}
      {!url && !loading && <div className="sr-only"><ImagePlus /></div>}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
