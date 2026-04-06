'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Server, User, Lock, LogIn, AlertCircle } from 'lucide-react';

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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 mesh-gradient-dark" />
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[20%] left-[30%] w-64 h-64 bg-azure-500/10 rounded-full blur-[80px] animate-float" />
        <div className="absolute bottom-[20%] right-[20%] w-80 h-80 bg-azure-700/10 rounded-full blur-[100px] animate-float-delayed" />
        <div className="absolute top-[60%] left-[60%] w-48 h-48 bg-azure-400/5 rounded-full blur-[60px] animate-float-slow" />
      </div>
      <div className="absolute inset-0 dot-pattern opacity-20" />

      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-azure-500/20 backdrop-blur-xl rounded-2xl flex items-center justify-center mx-auto mb-4 border border-azure-500/20 shadow-lg shadow-azure-500/10">
            <Server className="w-8 h-8 text-azure-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Azure Sunucu Yönetimi</h1>
          <p className="text-white/40 mt-1 text-sm">Giriş yaparak devam edin</p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white/[0.06] backdrop-blur-xl rounded-2xl p-8 border border-white/10 space-y-5 shadow-2xl"
        >
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
            className="w-full py-3 bg-gradient-to-r from-azure-500 to-azure-600 hover:from-azure-600 hover:to-azure-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-azure-500/20"
          >
            <LogIn className="w-5 h-5" />
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>
      </div>
    </div>
  );
}
