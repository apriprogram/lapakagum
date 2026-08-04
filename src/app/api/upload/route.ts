import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const allowed = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
  ['image/gif', '.gif'],
]);

function matchesSignature(buffer: Buffer, type: string) {
  if (type === 'image/jpeg') return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (type === 'image/png') return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (type === 'image/gif') return buffer.subarray(0, 3).toString() === 'GIF';
  if (type === 'image/webp') return buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP';
  return false;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
  }
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 });
    const extension = allowed.get(file.type);
    if (!extension) return NextResponse.json({ error: 'Format gambar tidak didukung' }, { status: 415 });
    if (file.size <= 0 || file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'Ukuran gambar maksimal 5 MB' }, { status: 413 });
    const buffer = Buffer.from(await file.arrayBuffer());
    if (!matchesSignature(buffer, file.type)) return NextResponse.json({ error: 'Isi file tidak sesuai format gambar' }, { status: 415 });
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });
    const fileName = `${Date.now()}-${crypto.randomUUID()}${extension}`;
    await fs.writeFile(path.join(uploadDir, fileName), buffer, { flag: 'wx' });
    return NextResponse.json({ url: `/uploads/${fileName}` }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Gagal mengunggah gambar' }, { status: 500 });
  }
}
