'use client';

import { signOut, useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Server, LogOut, User, Monitor, Settings, Sun, Moon, Briefcase, Users, Trophy } from 'lucide-react';
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
            <Link
              href="/quiz"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === '/quiz'
                  ? 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400'
                  : 'text-navy-500 dark:text-navy-300 hover:bg-gray-50 dark:hover:bg-navy-800 hover:text-navy-700 dark:hover:text-white'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">Yarışma</span>
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
                className={`group relative flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-sm font-extrabold tracking-wide transition-all duration-500 shadow-lg hover:shadow-2xl hover:scale-110 active:scale-95 ${
                  theme === 'dark'
                    ? 'bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400 text-white shadow-amber-400/40 hover:shadow-amber-400/60'
                    : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-indigo-500/40 hover:shadow-indigo-500/60'
                }`}
                title={theme === 'dark' ? 'Açık mod' : 'Koyu mod'}
              >
                <span className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
                  theme === 'dark'
                    ? 'bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-500'
                    : 'bg-gradient-to-r from-purple-400 via-pink-500 to-rose-500'
                }`} />
                <span className="relative flex items-center gap-2">
                  {theme === 'dark' ? (
                    <Sun className="w-5 h-5 group-hover:rotate-180 transition-transform duration-700" />
                  ) : (
                    <Moon className="w-5 h-5 group-hover:-rotate-12 transition-transform duration-700" />
                  )}
                  <span className="hidden sm:inline text-xs uppercase">{theme === 'dark' ? 'Açık' : 'Koyu'}</span>
                </span>
                <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    theme === 'dark' ? 'bg-yellow-300' : 'bg-pink-400'
                  }`} />
                  <span className={`relative inline-flex rounded-full h-3.5 w-3.5 border-2 border-white dark:border-navy-900 ${
                    theme === 'dark' ? 'bg-yellow-400' : 'bg-pink-500'
                  }`} />
                </span>
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
