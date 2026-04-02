'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Calendar,
  FileText,
  ClipboardList,
  Bell,
  LogOut,
  Menu,
  X,
  Server,
  Settings,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Panel', icon: LayoutDashboard },
  { href: '/calendar', label: 'Takvim', icon: Calendar },
  { href: '/activities', label: 'İşlemler', icon: ClipboardList },
  { href: '/reports', label: 'Raporlar', icon: FileText },
];

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  async function fetchNotifications() {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch {}
  }

  async function markAllRead() {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    fetchNotifications();
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/70 backdrop-blur-2xl shadow-sm border-b border-navy-100/40'
          : 'bg-white/50 backdrop-blur-xl border-b border-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[60px]">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 bg-gradient-to-br from-azure-500 to-azure-700 rounded-xl flex items-center justify-center shadow-md shadow-azure-500/20 group-hover:shadow-azure-500/30 transition-shadow">
                <Server className="w-[18px] h-[18px] text-white" />
              </div>
              <div className="hidden sm:block">
                <span className="text-[15px] font-semibold text-navy-900 tracking-tight">Azure</span>
                <span className="text-[15px] font-light text-azure-500 ml-1">Analiz</span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-0.5 bg-navy-50/60 backdrop-blur-sm rounded-xl p-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-white text-navy-900 shadow-sm'
                        : 'text-navy-400 hover:text-navy-700'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
              {session?.user?.role === 'admin' && (
                <Link
                  href="/settings"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                    pathname === '/settings'
                      ? 'bg-white text-navy-900 shadow-sm'
                      : 'text-navy-400 hover:text-navy-700'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  Ayarlar
                </Link>
              )}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2.5 text-navy-400 hover:text-navy-700 hover:bg-navy-50/60 rounded-xl transition-all duration-200"
                >
                  <Bell className="w-[18px] h-[18px]" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-gradient-to-br from-red-500 to-red-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-sm shadow-red-500/30">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-elevated border border-navy-100/60 overflow-hidden animate-slide-down z-50">
                    <div className="px-4 py-3.5 border-b border-navy-100/40 flex items-center justify-between">
                      <h3 className="font-semibold text-navy-900 text-sm">Bildirimler</h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllRead}
                          className="text-xs text-azure-500 hover:text-azure-600 font-medium transition-colors"
                        >
                          Hepsini okundu işaretle
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-10 text-center">
                          <Bell className="w-8 h-8 text-navy-200 mx-auto mb-2" />
                          <p className="text-navy-400 text-sm">Bildirim yok</p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`px-4 py-3 border-b border-navy-50/60 transition-colors ${
                              !n.read ? 'bg-azure-50/30' : 'hover:bg-navy-50/40'
                            }`}
                          >
                            <p className="text-sm font-medium text-navy-800">{n.title}</p>
                            <p className="text-xs text-navy-400 mt-0.5">{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User */}
              <div className="hidden sm:flex items-center gap-2 pl-2 ml-1 border-l border-navy-100/60">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-azure-400 to-azure-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                  {session?.user?.name?.charAt(0) || '?'}
                </div>
                <div className="text-right mr-1">
                  <p className="text-[13px] font-medium text-navy-800 leading-tight">{session?.user?.name}</p>
                  <p className="text-[10px] text-navy-400 leading-tight">{session?.user?.email}</p>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="p-2 text-navy-300 hover:text-red-500 hover:bg-red-50/80 rounded-lg transition-all duration-200"
                  title="Çıkış Yap"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2.5 text-navy-400 hover:bg-navy-50/60 rounded-xl transition-colors"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-navy-100/40 bg-white/90 backdrop-blur-2xl animate-slide-down">
            <div className="px-4 py-3 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-azure-50/60 text-azure-600'
                        : 'text-navy-500 hover:bg-navy-50/60'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}
              {session?.user?.role === 'admin' && (
                <Link
                  href="/settings"
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    pathname === '/settings'
                      ? 'bg-azure-50/60 text-azure-600'
                      : 'text-navy-500 hover:bg-navy-50/60'
                  }`}
                >
                  <Settings className="w-5 h-5" />
                  Ayarlar
                </Link>
              )}
              <div className="pt-2 mt-2 border-t border-navy-100/40">
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50/60 w-full"
                >
                  <LogOut className="w-5 h-5" />
                  Çıkış Yap
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Click outside to close notifications */}
      {showNotifications && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowNotifications(false)}
        />
      )}
    </>
  );
}
