'use client';

import { signOut, useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Server, LogOut, User, StickyNote, Monitor, Settings } from 'lucide-react';

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-2xl shadow-sm border-b border-navy-100/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[60px]">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-azure-500 to-azure-700 rounded-xl flex items-center justify-center shadow-md shadow-azure-500/20">
              <Server className="w-[18px] h-[18px] text-white" />
            </div>
            <div>
              <span className="text-base font-semibold text-navy-900">Azure</span>
              <span className="text-base font-light text-azure-500 ml-1">Sunucu</span>
            </div>
          </div>

          {/* Nav Links */}
          <div className="flex items-center gap-1">
            <Link
              href="/dashboard"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === '/dashboard'
                  ? 'bg-azure-50 text-azure-700'
                  : 'text-navy-500 hover:bg-gray-50 hover:text-navy-700'
              }`}
            >
              <Monitor className="w-4 h-4" />
              <span className="hidden sm:inline">Sunucular</span>
            </Link>
            <Link
              href="/notes"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === '/notes'
                  ? 'bg-amber-50 text-amber-700'
                  : 'text-navy-500 hover:bg-gray-50 hover:text-navy-700'
              }`}
            >
              <StickyNote className="w-4 h-4" />
              <span className="hidden sm:inline">Notlar</span>
            </Link>
            <Link
              href="/settings"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === '/settings'
                  ? 'bg-gray-100 text-gray-800'
                  : 'text-navy-500 hover:bg-gray-50 hover:text-navy-700'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Ayarlar</span>
            </Link>
          </div>

          {/* User Info & Logout */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-sm text-navy-600 bg-navy-50/60 px-3 py-1.5 rounded-lg">
              <User className="w-4 h-4" />
              <span className="font-medium">{session?.user?.name}</span>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Çıkış</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
