'use client';

import { signOut, useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Server, LogOut, User, Monitor, Settings, Sun, Moon, Briefcase, Users } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 dark:bg-navy-900/80 backdrop-blur-2xl shadow-sm border-b border-navy-100/40 dark:border-navy-700/40 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[60px]">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-azure-500 to-azure-700 rounded-xl flex items-center justify-center shadow-md shadow-azure-500/20">
              <Server className="w-[18px] h-[18px] text-white" />
            </div>
            <div>
              <span className="text-base font-semibold text-navy-900 dark:text-white">Azure</span>
              <span className="text-base font-light text-azure-500 dark:text-azure-400 ml-1">Sunucu</span>
            </div>
          </div>

          {/* Nav Links */}
          <div className="flex items-center gap-1">
            <Link
              href="/dashboard"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === '/dashboard'
                  ? 'bg-azure-50 dark:bg-azure-500/15 text-azure-700 dark:text-azure-400'
                  : 'text-navy-500 dark:text-navy-300 hover:bg-gray-50 dark:hover:bg-navy-800 hover:text-navy-700 dark:hover:text-white'
              }`}
            >
              <Monitor className="w-4 h-4" />
              <span className="hidden sm:inline">Sunucular</span>
            </Link>
            <Link
              href="/work-tracking"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === '/work-tracking'
                  ? 'bg-azure-50 dark:bg-azure-500/15 text-azure-700 dark:text-azure-400'
                  : 'text-navy-500 dark:text-navy-300 hover:bg-gray-50 dark:hover:bg-navy-800 hover:text-navy-700 dark:hover:text-white'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span className="hidden sm:inline">İş Takip</span>
            </Link>
            <Link
              href="/workforce"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === '/workforce'
                  ? 'bg-azure-50 dark:bg-azure-500/15 text-azure-700 dark:text-azure-400'
                  : 'text-navy-500 dark:text-navy-300 hover:bg-gray-50 dark:hover:bg-navy-800 hover:text-navy-700 dark:hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Analiz İş Gücü</span>
            </Link>
            <Link
              href="/settings"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === '/settings'
                  ? 'bg-gray-100 dark:bg-navy-800 text-gray-800 dark:text-white'
                  : 'text-navy-500 dark:text-navy-300 hover:bg-gray-50 dark:hover:bg-navy-800 hover:text-navy-700 dark:hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Ayarlar</span>
            </Link>
          </div>

          {/* User Info, Theme Toggle & Logout */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden sm:flex items-center gap-2 text-sm text-navy-600 dark:text-navy-300 bg-navy-50/60 dark:bg-navy-800/60 px-3 py-1.5 rounded-lg">
              <User className="w-4 h-4" />
              <span className="font-medium">{session?.user?.name}</span>
            </div>
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="flex items-center justify-center w-9 h-9 rounded-lg text-navy-500 dark:text-navy-300 hover:bg-gray-100 dark:hover:bg-navy-800 transition-colors"
                title={theme === 'dark' ? 'Açık mod' : 'Koyu mod'}
              >
                {theme === 'dark' ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
              </button>
            )}
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
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
