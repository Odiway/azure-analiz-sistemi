'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Server, Mail, Lock, ArrowRight, AlertCircle, Shield, Zap, BarChart3 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await signIn('credentials', {
      email,
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
      {/* Left side - Immersive 3D Background */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-navy-950">
        {/* Animated mesh gradient */}
        <div className="absolute inset-0 mesh-gradient-dark" />

        {/* 3D Floating orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-[15%] left-[20%] w-64 h-64 bg-azure-500/20 rounded-full blur-[80px] animate-float" />
          <div className="absolute top-[50%] right-[15%] w-80 h-80 bg-azure-700/15 rounded-full blur-[100px] animate-float-delayed" />
          <div className="absolute bottom-[10%] left-[30%] w-48 h-48 bg-azure-400/10 rounded-full blur-[60px] animate-float-slow" />

          {/* Orbiting elements */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="relative w-[300px] h-[300px]">
              {/* Central glow */}
              <div className="absolute inset-[80px] bg-azure-500/20 rounded-full blur-[40px] animate-glow" />
              
              {/* Orbit ring 1 */}
              <div className="absolute inset-0 border border-azure-500/10 rounded-full" />
              <div className="absolute inset-0 animate-orbit">
                <div className="w-3 h-3 bg-azure-400/60 rounded-full blur-[2px]" />
              </div>

              {/* Orbit ring 2 */}
              <div className="absolute inset-[-40px] border border-azure-500/5 rounded-full" />
              <div className="absolute inset-[-40px] animate-orbit-reverse">
                <div className="w-2 h-2 bg-azure-300/40 rounded-full blur-[1px]" />
              </div>

              {/* Orbit ring 3 */}
              <div className="absolute inset-[-90px] border border-azure-500/[0.03] rounded-full" />
            </div>
          </div>

          {/* Floating particles */}
          <div className="absolute top-[20%] left-[60%] w-1.5 h-1.5 bg-azure-400/50 rounded-full animate-pulse-soft" />
          <div className="absolute top-[40%] left-[15%] w-1 h-1 bg-azure-300/40 rounded-full animate-pulse-soft animation-delay-2000" />
          <div className="absolute top-[70%] left-[70%] w-2 h-2 bg-azure-500/30 rounded-full animate-pulse-soft animation-delay-4000" />
          <div className="absolute top-[80%] left-[25%] w-1 h-1 bg-azure-400/40 rounded-full animate-pulse-soft" />
          <div className="absolute top-[30%] left-[80%] w-1.5 h-1.5 bg-azure-300/30 rounded-full animate-pulse-soft animation-delay-2000" />
        </div>

        {/* Grid overlay */}
        <div className="absolute inset-0 dot-pattern opacity-30" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white/[0.08] backdrop-blur-xl rounded-xl flex items-center justify-center border border-white/[0.08]">
              <Server className="w-5 h-5 text-azure-400" />
            </div>
            <div>
              <span className="text-lg font-semibold text-white tracking-tight">Azure</span>
              <span className="text-lg font-light text-azure-400 ml-1.5">Analiz</span>
            </div>
          </div>

          {/* Center content */}
          <div className="max-w-md">
            <h1 className="text-4xl font-bold text-white leading-tight tracking-tight mb-4">
              Analiz süreçlerinizi
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-azure-400 to-azure-300 mt-1">
                akıllıca yönetin.
              </span>
            </h1>
            <p className="text-white/40 text-base leading-relaxed mb-10">
              Azure sunucu kaynaklarınızı verimli kullanın, ekibinizle koordineli çalışın.
            </p>

            {/* Feature cards */}
            <div className="space-y-3">
              {[
                { icon: Shield, title: 'Çakışma Önleme', desc: 'Eşzamanlı kullanımı engelleyin' },
                { icon: Zap, title: 'Anlık Bildirim', desc: 'E-posta ile otomatik uyarılar' },
                { icon: BarChart3, title: 'Detaylı Rapor', desc: 'Kullanım istatistikleri' },
              ].map((feature, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.05] backdrop-blur-sm group hover:bg-white/[0.06] transition-all duration-300"
                >
                  <div className="w-9 h-9 rounded-lg bg-azure-500/10 flex items-center justify-center group-hover:bg-azure-500/20 transition-colors">
                    <feature.icon className="w-4 h-4 text-azure-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white/90">{feature.title}</h3>
                    <p className="text-xs text-white/30">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom */}
          <p className="text-white/20 text-xs">
            &copy; {new Date().getFullYear()} TEMSA Yapısal Analiz Ekibi
          </p>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 mesh-gradient relative">
        <div className="absolute inset-0 dot-pattern opacity-40" />

        <div className="w-full max-w-[420px] relative z-10">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-12">
            <div className="w-11 h-11 bg-gradient-to-br from-azure-500 to-azure-700 rounded-xl flex items-center justify-center shadow-glow">
              <Server className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-navy-900">Azure</span>
              <span className="text-xl font-light text-azure-500 ml-1.5">Analiz</span>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-[28px] font-bold text-navy-900 tracking-tight">
              Hoş Geldiniz
            </h2>
            <p className="text-navy-400 mt-2 text-[15px]">
              Hesabınıza giriş yapın
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-navy-700">Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-navy-300 group-focus-within:text-azure-500 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-white/80 border border-navy-200/60 rounded-xl text-sm text-navy-900 placeholder:text-navy-300 focus:ring-2 focus:ring-azure-500/20 focus:border-azure-500/40 focus:bg-white outline-none transition-all duration-200"
                  placeholder="ornek@temsa.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-navy-700">Şifre</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-navy-300 group-focus-within:text-azure-500 transition-colors" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-white/80 border border-navy-200/60 rounded-xl text-sm text-navy-900 placeholder:text-navy-300 focus:ring-2 focus:ring-azure-500/20 focus:border-azure-500/40 focus:bg-white outline-none transition-all duration-200"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2.5 p-3.5 bg-red-50/80 border border-red-200/60 rounded-xl text-sm text-red-700 animate-slide-down backdrop-blur-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-azure-500 to-azure-600 text-white rounded-xl text-sm font-semibold hover:from-azure-600 hover:to-azure-700 disabled:opacity-60 transition-all duration-300 shadow-lg shadow-azure-500/20 hover:shadow-azure-500/30 flex items-center justify-center gap-2 group mt-1"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Giriş Yap
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-navy-100/60">
            <p className="text-center text-sm text-navy-400">
              Hesabınız yok mu?{' '}
              <Link href="/register" className="text-azure-500 hover:text-azure-600 font-semibold transition-colors">
                Kayıt Olun
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
