import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { message: 'Pembuatan akun pengelola melalui alamat publik telah dinonaktifkan.' },
    { status: 410 },
  );
}
