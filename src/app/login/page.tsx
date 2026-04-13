'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Server, User, Lock, LogIn, AlertCircle } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await signIn('credentials', {
      email: username,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.refresh();
      router.push('/dashboard');
    }
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/temsa-hero.jpg"
          alt="TEMSA"
          fill
          className="object-cover"
          priority
          quality={90}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-navy-950/95 via-navy-900/80 to-navy-950/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/90 via-transparent to-navy-950/40" />
      </div>

      {/* Left: Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative z-10 flex-col justify-between p-12">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Image
              src="/temsa-logo.jpg"
              alt="TEMSA Logo"
              width={48}
              height={48}
              className="rounded-lg"
            />
            <div>
              <h2 className="text-xl font-bold text-white">TEMSA</h2>
              <p className="text-white/50 text-xs">Ulaşım Araçları A.Ş.</p>
            </div>
          </div>
        </div>

        <div className="max-w-md">
          <h1 className="text-4xl font-extrabold text-white leading-tight mb-4">
            İnovasyonda Dönüşüm<br />
            <span className="text-azure-400">Her Zaman, Birlikte!</span>
          </h1>
          <p className="text-white/60 text-sm leading-relaxed">
            CAE Departmanı — Azure Sunucu Yönetim ve İş Takip Sistemi
          </p>
        </div>

        <div className="flex items-center gap-6 text-white/30 text-xs">
          <span>© {new Date().getFullYear()} TEMSA</span>
          <span>•</span>
          <span>CAE Departmanı</span>
          <span>•</span>
          <span>Gizli / Confidential</span>
        </div>
      </div>

      {/* Right: Login Form */}
      <div className="flex-1 flex items-center justify-center relative z-10 p-6">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-3">
              <Image
                src="/temsa-logo.jpg"
                alt="TEMSA Logo"
                width={40}
                height={40}
                className="rounded-lg"
              />
              <span className="text-xl font-bold text-white">TEMSA</span>
            </div>
            <p className="text-white/40 text-xs">İnovasyonda Dönüşüm, Her Zaman, Birlikte!</p>
          </div>

          {/* Form Card */}
          <div className="bg-white/[0.07] backdrop-blur-2xl rounded-3xl p-8 border border-white/10 shadow-2xl">
            <div className="text-center mb-7">
              <div className="w-14 h-14 bg-gradient-to-br from-azure-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-azure-500/20">
                <Server className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">Sunucu Yönetimi</h2>
              <p className="text-white/40 mt-1 text-sm">Giriş yaparak devam edin</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">
                  Kullanıcı Adı
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-azure-500/50 focus:ring-1 focus:ring-azure-500/50 transition-colors"
                    placeholder="Kullanıcı adınızı girin"
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">
                  Şifre
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-azure-500/50 focus:ring-1 focus:ring-azure-500/50 transition-colors"
                    placeholder="Şifrenizi girin"
                    autoComplete="current-password"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-azure-500 to-azure-600 hover:from-azure-600 hover:to-azure-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-azure-500/20 active:scale-[0.98]"
              >
                <LogIn className="w-5 h-5" />
                {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
              </button>
            </form>
          </div>

          {/* Bottom text - desktop only */}
          <p className="text-center text-white/20 text-xs mt-6 hidden lg:block">
            TEMSA Ulaşım Araçları A.Ş. — Dahili Kullanım
          </p>
        </div>
      </div>
    </div>
  );
}
