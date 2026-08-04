'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useMemo, useState } from 'react';
import { AdminThemeToggle } from '@/components/AdminThemeToggle';
import { AdminResetHistoryButton } from '@/components/AdminResetHistoryButton';
import {
  BarChart3, Bell, Boxes, CheckCircle2, ChevronDown, CircleDollarSign,
  ChevronLeft, ChevronRight, ClipboardList, LayoutDashboard, LogOut,
  Menu, PackagePlus, ReceiptText, Search, Store, UserRound, UsersRound,
  WalletCards, Tag
} from 'lucide-react';

const nav = [
  { label: '', items: [
    { name: 'Kas & Modal', href: '/admin/finance', icon: WalletCards },
    { name: 'Stok Barang', href: '/admin/stock', icon: Boxes },
  ] },
  { label: 'Operasional', items: [
    { name: 'Penjualan', href: '/admin/orders', icon: ClipboardList },
    { name: 'Pembelian', href: '/admin/purchases', icon: PackagePlus },
  ] },
  { label: 'Kategori', items: [
    { name: 'Kategori Pelanggan', href: '/admin/vendors', icon: UserRound },
    { name: 'Kategori Penjual', href: '/admin/resellers', icon: UsersRound },
    { name: 'Kategori Barang', href: '/admin/product-categories', icon: Tag },
    { name: 'Kategori Kas', href: '/admin/cash-categories', icon: CircleDollarSign },
  ] },
  { label: 'Keuangan', items: [
    { name: 'Hutang', href: '/admin/debts', icon: CircleDollarSign },
    { name: 'Laporan', href: '/admin/reports', icon: BarChart3 },
  ] },
];

const allItems = nav.flatMap((section) => section.items);

export default function AdminShell({ children, userName, userImage }: { children: React.ReactNode; userName: string; userImage?: string | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [categoryExpanded, setCategoryExpanded] = useState(() => {
    return nav.find(s => s.label === 'Kategori')?.items.some(item => pathname.startsWith(item.href)) || false;
  });
  const current = pathname.startsWith('/admin/profile') ? { name: 'Edit Profil' } : allItems.find((item) => pathname.startsWith(item.href));
  const results = useMemo(() => allItems.filter((item) => item.name.toLowerCase().includes(query.toLowerCase())), [query]);

  const closePanels = () => {
    setSearchOpen(false);
    setNoticeOpen(false);
    setProfileOpen(false);
  };

  const sidebar = (
    <>
      <div className="admin-brand">
        <Link href="/admin/finance" className="admin-brand-link" aria-label="Panel Admin">
          <span className="admin-logo admin-logo-image">
            <Image src="/lapak-udang-ikan-logo.png" alt="" width={30} height={30} />
          </span>
          <span className="admin-brand-copy">Panel Admin</span>
        </Link>

      </div>
      <nav className="admin-nav" aria-label="Navigasi pengelola">
        {nav.map((section) => {
          const isCategory = section.label === 'Kategori';
          const isCategoryActive = isCategory && section.items.some(item => pathname.startsWith(item.href));
          return (
            <div key={section.label} className="admin-nav-section">
              {section.label && (
                isCategory && !collapsed ? (
                  <button 
                    onClick={() => setCategoryExpanded(!categoryExpanded)} 
                    className="admin-nav-label flex w-full cursor-pointer items-center justify-between hover:text-blue-600 focus:outline-none"
                    style={{ paddingRight: '12px' }}
                  >
                    <span>{section.label}</span>
                    <ChevronDown className={`size-3 transition-transform ${categoryExpanded ? 'rotate-180' : ''}`} />
                  </button>
                ) : (
                  <p className="admin-nav-label">{section.label}</p>
                )
              )}
              
              <div 
                className="grid transition-all duration-300 ease-in-out" 
                style={{ gridTemplateRows: (isCategory && !categoryExpanded && !collapsed) ? '0fr' : '1fr' }}
              >
                <div className="overflow-hidden">
                  <div className="admin-nav-list">
                    {section.items.map((item) => {
                      const active = pathname.startsWith(item.href);
                      const Icon = item.icon;
                      return (
                        <Link key={item.href} href={item.href} title={collapsed ? item.name : undefined} onClick={() => setOpen(false)} className={`admin-nav-item ${active ? 'is-active' : ''}`}>
                          <Icon />
                          <span>{item.name}</span>
                          {active && <ChevronRight className="admin-nav-arrow" />}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </nav>
      <div className="admin-sidebar-footer">
        <Link href="/" className="admin-nav-item" title={collapsed ? 'Lihat toko' : undefined}><ReceiptText /><span>Lihat toko</span></Link>
        <button onClick={() => signOut({ callbackUrl: '/' })} className="admin-nav-item is-danger" title={collapsed ? 'Keluar' : undefined}><LogOut /><span>Keluar</span></button>
      </div>
    </>
  );

  return (
    <div className={`admin-app ${collapsed ? 'sidebar-collapsed' : ''}`} onClick={closePanels}>
      <aside className="admin-sidebar hidden md:flex">{sidebar}</aside>
      <button className="admin-collapse hidden md:flex" onClick={(event) => { event.stopPropagation(); setCollapsed((value) => !value); }} aria-label={collapsed ? 'Perbesar sidebar' : 'Perkecil sidebar'}>
        {collapsed ? <ChevronRight /> : <ChevronLeft />}
      </button>

      {open && <div className="admin-mobile-overlay md:hidden" onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}><aside className="admin-mobile-sidebar">{sidebar}</aside></div>}

      <div className="admin-workspace">
        <header className="admin-topbar">
          <div className="admin-topbar-title">
            <button onClick={() => setOpen(true)} className="admin-icon-button md:hidden" aria-label="Buka menu"><Menu /></button>
            <Link href="/admin/finance" className="admin-mobile-brand md:hidden" aria-label="Panel Admin">
              <Image src="/lapak-udang-ikan-logo.png" alt="" width={28} height={28} />
            </Link>
            <div className="admin-current-title"><p>Panel pengelola</p><h2>{current?.name || 'Pengelola'}</h2></div>
          </div>

          <div className="admin-topbar-actions">
            <AdminThemeToggle />
            <div className="admin-search-wrap" onClick={(event) => event.stopPropagation()}>
              <button className="admin-search-trigger" onClick={() => { setSearchOpen((value) => !value); setNoticeOpen(false); setProfileOpen(false); }} aria-label="Cari menu" aria-expanded={searchOpen}>
                <Search /><span>Cari menu...</span><kbd>Ctrl K</kbd>
              </button>
              {searchOpen && <div className="admin-popover admin-search-popover">
                <div className="admin-popover-search"><Search /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ketik nama halaman..." /></div>
                <div className="admin-command-list">
                  {results.map((item) => { const Icon = item.icon; return <Link href={item.href} key={item.href} onClick={closePanels}><span><Icon />{item.name}</span><ChevronRight /></Link>; })}
                  {!results.length && <p className="admin-empty">Menu tidak ditemukan.</p>}
                </div>
              </div>}
            </div>

            <div className="admin-relative" onClick={(event) => event.stopPropagation()}>
              <button className="admin-icon-button has-indicator" onClick={() => { setNoticeOpen((value) => !value); setSearchOpen(false); setProfileOpen(false); }} aria-label="Notifikasi" aria-expanded={noticeOpen}><Bell /></button>
              {noticeOpen && <div className="admin-popover admin-notifications">
                <div className="admin-popover-head"><div><h3>Notifikasi</h3><p>Kabar terbaru dari toko</p></div><span>Terbaru</span></div>
                <div className="admin-notice-item"><span><CheckCircle2 /></span><div><strong>Toko siap digunakan</strong><p>Data toko dan halaman pengelola sudah terhubung.</p><small>Baru saja</small></div></div>
                <Link href="/admin/orders" onClick={closePanels} className="admin-popover-link">Lihat pesanan terbaru <ChevronRight /></Link>
              </div>}
            </div>

            <div className="admin-relative" onClick={(event) => event.stopPropagation()}>
              <button className="admin-profile" onClick={() => { setProfileOpen((value) => !value); setSearchOpen(false); setNoticeOpen(false); }} aria-expanded={profileOpen}>
                <span className={`admin-avatar ${userImage ? 'has-image' : ''}`}>{userImage ? <Image src={userImage} alt="" width={32} height={32} /> : userName.slice(0, 2).toUpperCase()}</span>
                <span className="admin-profile-copy"><strong>{userName}</strong><small>Pengelola Utama</small></span>
                <ChevronDown />
              </button>
              {profileOpen && <div className="admin-popover admin-profile-menu">
                <div className="admin-profile-summary"><span className={`admin-avatar ${userImage ? 'has-image' : ''}`}>{userImage ? <Image src={userImage} alt="" width={32} height={32} /> : userName.slice(0, 2).toUpperCase()}</span><div><strong>{userName}</strong><p>Pengelola toko</p></div></div>
                <Link href="/admin/profile" onClick={closePanels}><UserRound /> Edit profil</Link>
                <Link href="/" onClick={closePanels}><Store /> Buka toko</Link>
                <AdminResetHistoryButton />
                <button onClick={() => signOut({ callbackUrl: '/' })}><LogOut /> Keluar</button>
              </div>}
            </div>
          </div>
        </header>
        <main className="admin-content page-enter">{children}</main>
      </div>
    </div>
  );
}









