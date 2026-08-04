'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Fish, ListFilter, Menu, Search, X, LockKeyhole, Loader2, PackageCheck, Package, Boxes, Eye, EyeOff, ShoppingCart, Bell, ArrowRight, CheckCircle2
} from 'lucide-react';
import UserMenu from '@/components/UserMenu';
import { AdminThemeToggle } from '@/components/AdminThemeToggle';
import AppSelect from '@/components/AppSelect';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import CountUp from 'react-countup';
import { PieChart, Pie, Cell, Tooltip } from 'recharts';

export interface StoreProduct {
  id: number;
  name: string;
  category: string;
  imageUrl: string | null;
  description: string | null;
  unit: string;
  price: number;
  stock: number;
}

interface StoreStatistics {
  productCount: number;
  purchaseCount: number;
  stockCount: number;
  categoryStats: { name: string; productCount: number; stockCount: number }[];
}

const COLORS = ['#1e40af', '#3b82f6', '#93c5fd', '#e0f2fe', '#f3f4f6'];

const money = (value: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);

const heroImages = [
  '/hero-seafood-farm.png',
  '/hero-seafood-farm2.png',
  '/hero-seafood-farm3.png',
];

export default function Storefront({
  products,
  statistics,
}: {
  products: StoreProduct[];
  statistics: StoreStatistics;
}) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('semua');
  const [filterOpen, setFilterOpen] = useState(false);
  const { data: session } = useSession();

  // 3D Hover Tilt Logic
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 150 };
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);

  const rotateX = useTransform(springY, [-0.5, 0.5], ["15deg", "-15deg"]);
  const rotateY = useTransform(springX, [-0.5, 0.5], ["-15deg", "15deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };
  
  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };
  const [sort, setSort] = useState('terbaru');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [selected, setSelected] = useState<StoreProduct | null>(null);

  // Login state
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const categories = useMemo(
    () => ['semua', ...Array.from(new Set(products.map((item) => item.category.toLowerCase())))],
    [products],
  );

  const visibleProducts = useMemo(() => {
    const result = products.filter((item) =>
      (category === 'semua' || item.category.toLowerCase() === category) &&
      item.name.toLowerCase().includes(search.toLowerCase()),
    );
    if (sort === 'termurah') return result.toSorted((a, b) => a.price - b.price);
    if (sort === 'termahal') return result.toSorted((a, b) => b.price - a.price);
    if (sort === 'stok') return result.toSorted((a, b) => b.stock - a.stock);
    return result;
  }, [products, category, search, sort]);

  const submitLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    const form = new FormData(event.currentTarget);

    try {
      const response = await signIn('credentials', {
        redirect: false,
        email: form.get('email'),
        password: form.get('password'),
      });
      if (response?.error) throw new Error('Email atau kata sandi tidak sesuai.');

      window.localStorage.setItem('lapak:last-activity', String(Date.now()));
      router.push('/admin/finance');
      router.refresh();
    } catch (caught) {
      setLoginError(caught instanceof Error ? caught.message : 'Tidak dapat masuk.');
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="storefront-app min-h-screen bg-[#eef6fc]" onClick={() => setCategoryOpen(false)}>
      <header className="fixed top-6 left-0 right-0 z-50 mx-auto w-full max-w-[900px] px-4">
        <div className="flex h-14 items-center justify-between rounded-full bg-white/70 px-6 shadow-sm border border-white/40 backdrop-blur-md">
          
          {/* Kiri: Logo & Judul */}
          <Link href="/" className="interactive flex items-center gap-3" aria-label="Lapak Udang dan Ikan">
             <Image src="/lapak-udang-ikan-logo.png" alt="" width={32} height={32} className="object-contain" />
             <span className="leading-tight">
               <span className="block whitespace-nowrap text-sm font-bold tracking-wide text-blue-700">LAPAK UDANG &amp; IKAN</span>
               <span className="mt-0.5 block text-[8px] font-bold tracking-[.1em] text-slate-600">AGUMJAYA NJ</span>
             </span>
          </Link>

          {/* Tengah: Search */}
          <div className="hidden lg:flex flex-1 items-center justify-center px-10">
            <label className="flex h-9 w-full max-w-sm items-center gap-2 rounded-full border border-slate-100/50 bg-[#f4f7fb]/80 px-4 backdrop-blur-md">
              <Search className="size-3.5 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400"
                placeholder="Pencarian..."
              />
            </label>
          </div>

          {/* Kanan: Icons */}
          <div className="flex h-9 items-center gap-2.5 rounded-full bg-[#f4f7fb]/80 px-4 text-slate-500 backdrop-blur-md relative">
            <button onClick={() => setFilterOpen(!filterOpen)} className="flex items-center justify-center hover:text-slate-800" title="Filter Produk">
              <ListFilter className="size-4" />
            </button>
            
            {filterOpen && (
              <div className="account-menu modal-enter absolute right-0 top-12 z-50 min-w-[150px]" role="menu">
                <div className="account-menu__header">
                  <p className="!font-bold">Kategori Produk</p>
                </div>
                {categories.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setCategory(item);
                      setFilterOpen(false);
                      document.getElementById('produk')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`account-menu__item flex justify-between ${category === item ? '!text-blue-600 !font-semibold admin-dark:!text-blue-400' : ''}`}
                    role="menuitem"
                  >
                    <span className="capitalize">{item}</span>
                    {category === item && <CheckCircle2 className="size-3.5" />}
                  </button>
                ))}
              </div>
            )}
            {session?.user && (
              <>
                <div className="h-4 w-px bg-slate-200" />
                <UserMenu storefront />
              </>
            )}
            <div className="h-4 w-px bg-slate-200" />
            <AdminThemeToggle storefront />
          </div>
        </div>
      </header>

      <main>
        {/* HERO SECTION */}
        <section className="relative overflow-hidden bg-[#eef6fc] min-h-screen pt-24 lg:pt-32 pb-0">
          <div className="mx-auto grid max-w-[1300px] grid-cols-1 xl:grid-cols-12 gap-6 xl:gap-10 px-5 xl:px-10 mt-6 xl:mt-10 items-start">
            
            {/* Teks Judul */}
            <div className="xl:col-span-7 xl:row-start-1 flex w-full flex-col items-center xl:items-start pt-4 xl:pt-8">
              <div className="page-enter mb-2 xl:mb-12 text-center xl:text-left flex flex-col items-center xl:items-start">
                <h1 className="text-5xl md:text-6xl lg:text-[80px] xl:text-[100px] font-extrabold leading-[1.05] tracking-tight text-[#333333]">
                  Management <br />
                  <span className="text-[#d13b3b]">Pembelian</span> &amp; <span className="text-[#20a83e]">Penjualan</span> <br />
                  Stok Barang
                </h1>
                
                <div className="mt-5 xl:mt-10">
                  <a href="#produk" className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0066ff] px-6 py-3 xl:px-8 xl:py-4 text-sm xl:text-base font-semibold text-white transition-colors hover:bg-blue-700">
                    <span>Lihat Stok Barang</span>
                    <ArrowRight className="size-4 xl:size-5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Form Login */}
            <div className="xl:col-span-5 xl:row-start-1 xl:row-span-2 w-full flex justify-center xl:justify-end mt-2 xl:mt-0">
              <section className="group w-full max-w-md rounded-[16px] border border-transparent bg-white p-6 xl:p-10 transition-all duration-300 hover:border-blue-400 hover:ring-4 hover:ring-blue-100">
                <div className="text-center">
                  <div className="mx-auto mb-6 flex size-24 items-center justify-center">
                     <Image src="/lapak-udang-ikan-logo.png" alt="Logo" width={84} height={84} className="object-contain transition-transform duration-300 group-hover:scale-110" />
                  </div>
                  <h2 className="text-4xl font-bold tracking-tight text-[#333333]">Login</h2>
                  <p className="mt-3 text-base text-slate-600">Masuk Kehalaman Admin Panel</p>
                </div>
                
                {loginError && <p className="mt-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">{loginError}</p>}
                
                <form onSubmit={submitLogin} className="mt-8 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-[#333333]">User</label>
                    <input name="email" type="email" required maxLength={254} autoComplete="email" placeholder="nama@email.com" className="mt-2 h-12 w-full rounded-lg border-none bg-[#f4f7fb] px-4 text-base text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#333333]">Password</label>
                    <div className="relative mt-2">
                      <input name="password" type={showPassword ? "text" : "password"} required minLength={8} maxLength={128} autoComplete="current-password" placeholder="Min. 8 karakter" className="h-12 w-full rounded-lg border-none bg-[#f4f7fb] px-4 pr-11 text-base text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:ring-1 focus:ring-blue-500" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center justify-center px-4 text-slate-400 hover:text-slate-600 focus:outline-none">
                        {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                      </button>
                    </div>
                  </div>
                  
                  <button disabled={loginLoading} className="interactive mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#0066ff] text-base font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60">
                    {loginLoading ? <Loader2 className="size-5 animate-spin" /> : null}
                    {loginLoading ? 'Memeriksa...' : 'Login'}
                  </button>
                </form>
              </section>
            </div>

            {/* Statistik */}
            <div className="xl:col-span-7 xl:row-start-2 w-full mt-2 xl:-mt-12 flex justify-center xl:justify-start">
              <div className="grid w-full max-w-[900px] xl:max-w-3xl grid-cols-1 sm:grid-cols-2 gap-6 xl:gap-8">
                {/* Card Total Produk */}
                <div className="flex flex-col rounded-[16px] bg-white p-8">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-slate-800">Total Produk</span>
                    <Fish className="size-6 text-slate-600" />
                  </div>
                  <div className="mt-8 flex items-center justify-between pr-4">
                    <div className="relative flex size-[140px] items-center justify-center">
                      <PieChart width={140} height={140} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                        <Pie
                          data={statistics.categoryStats}
                          cx={70}
                          cy={70}
                          innerRadius={45}
                          outerRadius={60}
                          paddingAngle={2}
                          dataKey="productCount"
                          stroke="none"
                        >
                          {statistics.categoryStats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value, name, props) => [`${value} produk`, props.payload.name]}
                          contentStyle={{ borderRadius: '8px', fontSize: '12px', padding: '6px 10px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                      </PieChart>
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold text-slate-800">{statistics.productCount}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2.5 text-xs text-slate-600 font-medium">
                      {statistics.categoryStats.map((cat, i) => (
                        <div key={cat.name} className="flex items-center gap-2">
                          <span className="size-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="capitalize">{cat.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Total Stok */}
                <div className="flex flex-col rounded-[16px] bg-white p-8">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-slate-800">Total Stok (Kg)</span>
                    <ShoppingCart className="size-6 text-slate-600" />
                  </div>
                  <div className="mt-8 flex items-center justify-between pr-4">
                    <div className="relative flex size-[140px] items-center justify-center">
                      <PieChart width={140} height={140} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                        <Pie
                          data={statistics.categoryStats}
                          cx={70}
                          cy={70}
                          innerRadius={45}
                          outerRadius={60}
                          paddingAngle={2}
                          dataKey="stockCount"
                          stroke="none"
                        >
                          {statistics.categoryStats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value, name, props) => [`${value} Kg`, props.payload.name]}
                          contentStyle={{ borderRadius: '8px', fontSize: '12px', padding: '6px 10px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                      </PieChart>
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <span className="text-lg font-bold text-slate-800">
                          {statistics.stockCount > 1000 ? (statistics.stockCount/1000).toFixed(1) + 'k' : statistics.stockCount} Kg
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2.5 text-xs text-slate-600 font-medium">
                      {statistics.categoryStats.map((cat, i) => (
                        <div key={cat.name} className="flex items-center gap-2">
                          <span className="size-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="capitalize">{cat.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* PRODUCTS SECTION */}
        <section id="produk" className="mx-auto max-w-[1600px] px-5 py-12 lg:px-8 lg:py-16">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <p className="text-sm font-medium text-blue-600">Katalog & Stok</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-.025em] text-blue-950">Informasi Produk</h2>
              <p className="mt-2 text-sm text-slate-600">{visibleProducts.length} produk ditampilkan.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="flex flex-1 items-center gap-2 rounded-xl border border-blue-100 bg-white px-4">
                <Search className="size-4 text-slate-400" />
                <input value={search} onChange={(event) => setSearch(event.target.value)} className="h-11 w-full bg-transparent text-sm outline-none" placeholder="Cari udang atau ikan..." />
              </label>
              <div className="w-full sm:w-48 shrink-0">
                <AppSelect
                  ariaLabel="Urutkan produk"
                  value={sort}
                  onValueChange={setSort}
                  options={[
                    { value: 'terbaru', label: 'Terbaru' },
                    { value: 'termurah', label: 'Harga termurah' },
                    { value: 'termahal', label: 'Harga termahal' },
                    { value: 'stok', label: 'Stok terbanyak' },
                  ]}
                  className="h-11 w-full rounded-xl border border-blue-100 bg-white px-4 text-sm font-medium outline-none"
                />
              </div>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap gap-2">
            {categories.map((item) => (
              <button key={item} onClick={() => setCategory(item)} className={`interactive rounded-full border px-4 py-2 text-sm font-medium capitalize ${category === item ? 'border-transparent bg-blue-600 text-white' : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'}`}>
                {item}
              </button>
            ))}
          </div>

          {visibleProducts.length ? (
            <div className="stagger mt-6 xl:mt-8 grid gap-2 md:gap-3 xl:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-5">
              {visibleProducts.map((product) => (
                <article key={product.id} className="surface group overflow-hidden">
                  <button onClick={() => setSelected(product)} className="relative block aspect-[4/3] w-full overflow-hidden bg-blue-50 text-left">
                    {product.imageUrl ? (
                      <Image src={product.imageUrl} alt={product.name} fill sizes="(max-width: 640px) 100vw, 25vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                    ) : (
                      <Fish className="absolute inset-0 m-auto size-20 text-blue-200 transition-transform duration-500 group-hover:scale-110" strokeWidth={1.2} />
                    )}
                    <span className="absolute left-3 top-3 xl:left-4 xl:top-4 rounded-full bg-blue-600 px-3 py-1 xl:px-4 xl:py-1.5 text-xs xl:text-sm font-semibold capitalize text-white shadow-sm">{product.category}</span>
                  </button>
                  <div className="px-3 pb-3 pt-1 md:px-4 md:pb-4 md:pt-2 xl:px-5 xl:pb-5 xl:pt-3">
                    <button onClick={() => setSelected(product)} className="text-left w-full">
                      <h3 className="text-base md:text-lg xl:text-xl font-semibold text-blue-950 transition-colors group-hover:text-blue-600 line-clamp-2">{product.name}</h3>
                      {product.description && <p className="mt-1 line-clamp-2 min-h-10 text-xs leading-5 text-slate-500">{product.description}</p>}
                    </button>
                    <div className="mt-0.5 xl:mt-1.5 flex flex-col xl:flex-row xl:items-end justify-between gap-1 xl:gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-600">{money(product.price)}</p>
                      </div>
                      <div className="text-left xl:text-right">
                        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600">
                          <PackageCheck className="size-4" />
                          {product.stock <= 0 ? 'Habis' : <span className="truncate">{`${product.stock.toLocaleString('id-ID')} ${product.unit}`}</span>}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="surface mt-8 flex flex-col items-center py-16 text-center">
              <Search className="size-10 text-blue-200" />
              <h3 className="mt-4 font-semibold text-blue-950">Produk tidak ditemukan</h3>
              <p className="mt-2 text-sm text-slate-500">Coba kata kunci atau kategori yang berbeda.</p>
            </div>
          )}
        </section>
      </main>

      <footer className="bg-blue-950 text-blue-100">
        <div className="mx-auto flex max-w-[1600px] flex-col justify-between gap-6 px-5 py-10 sm:flex-row sm:items-center lg:px-8">
          <div className="flex items-center gap-3">
            <Fish className="size-5" />
            <span className="text-sm font-semibold">Lapak Udang & Ikan</span>
          </div>
          <p className="text-xs text-blue-200">Katalog dan informasi stok terbaru.</p>
        </div>
      </footer>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-blue-950/35 p-0 sm:items-center sm:p-5" onMouseDown={(event) => event.target === event.currentTarget && setSelected(null)}>
          <div className="modal-enter relative max-h-[92vh] w-full max-w-lg overflow-hidden overflow-y-auto rounded-t-[28px] border border-blue-100 bg-white sm:rounded-[28px]">
            <button onClick={() => setSelected(null)} aria-label="Tutup detail produk" className="interactive absolute right-4 top-4 z-10 flex size-10 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm backdrop-blur-md hover:bg-white"><X className="size-5" /></button>
            <div className="flex flex-col">
              <div className="relative aspect-[4/3] w-full bg-blue-50 sm:aspect-[3/2]">
                {selected.imageUrl ? <Image src={selected.imageUrl} alt={selected.name} fill sizes="(max-width: 640px) 100vw, 600px" className="object-cover" /> : <Fish className="absolute inset-0 m-auto size-24 text-blue-200" strokeWidth={1.2} />}
              </div>
              <div className="flex flex-col p-6 sm:p-8">
                <div>
                  <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-600">
                    {selected.category}
                  </span>
                  <h2 className="mt-4 text-3xl font-bold text-blue-950">{selected.name}</h2>
                  {selected.description && (
                    <p className="mt-4 text-sm leading-7 text-slate-600">{selected.description}</p>
                  )}
                  <div className="mt-8 flex flex-wrap items-center gap-4">
                    <p className="text-2xl font-bold text-blue-950">
                      {money(selected.price)} <span className="text-sm font-medium text-slate-500">/{selected.unit}</span>
                    </p>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                      <PackageCheck className="size-5" />
                      {selected.stock <= 0 ? 'Stok habis' : `${selected.stock.toLocaleString('id-ID')} ${selected.unit} tersedia`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
