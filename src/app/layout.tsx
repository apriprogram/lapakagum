import type { Metadata } from 'next';
import localFont from 'next/font/local';
import Script from 'next/script';
import './globals.css';
import Providers from '@/components/Providers';

const poppins = localFont({
  src: [
    { path: './fonts/poppins-400.woff2', weight: '400', style: 'normal' },
    { path: './fonts/poppins-500.woff2', weight: '500', style: 'normal' },
    { path: './fonts/poppins-600.woff2', weight: '600', style: 'normal' },
  ],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Lapak Udang & Ikan',
    template: '%s | Lapak Udang & Ikan',
  },
  description: 'Udang dan ikan segar dengan stok dan harga terbaru setiap hari.',
  icons: {
    icon: [{ url: '/lapak-udang-ikan-logo.png', type: 'image/png' }],
    shortcut: '/lapak-udang-ikan-logo.png',
    apple: '/lapak-udang-ikan-logo.png',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={poppins.variable} suppressHydrationWarning>
      <head>
      </head>
      <body>
        <Script id="theme-script" strategy="beforeInteractive">
          {`(function(){try{var t=localStorage.getItem('admin-theme');var d=t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('admin-dark',d)}catch(e){}})()`}
        </Script>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
