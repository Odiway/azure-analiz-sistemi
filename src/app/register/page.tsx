'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Server, Mail, Lock, User, Building, ArrowRight, AlertCircle, CheckCircle, Calendar, BarChart3, Bell, Shield } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: '',
    role: 'user',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Şifreler eşleşmiyor');
      return;
    }

    if (formData.password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          department: formData.department,
          role: formData.role,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push('/login?registered=true');
      } else {
        setError(data.error || 'Kayıt sırasında bir hata oluştu');
      }
    } catch {
      setError('Bağlantı hatası');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Left side - Immersive */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-navy-950">
        <div className="absolute inset-0 mesh-gradient-dark" />

        {/* 3D Floating orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-[20%] right-[20%] w-72 h-72 bg-azure-500/15 rounded-full blur-[90px] animate-float" />
          <div className="absolute bottom-[20%] left-[15%] w-64 h-64 bg-azure-700/10 rounded-full blur-[80px] animate-float-delayed" />
          <div className="absolute top-[60%] right-[40%] w-40 h-40 bg-azure-400/10 rounded-full blur-[50px] animate-float-slow" />
        </div>

        {/* Orbiting elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="relative w-[280px] h-[280px]">
            <div className="absolute inset-[70px] bg-azure-500/15 rounded-full blur-[35px] animate-glow" />
            <div className="absolute inset-0 border border-azure-500/10 rounded-full" />
            <div className="absolute inset-0 animate-orbit">
              <div className="w-3 h-3 bg-azure-400/50 rounded-full blur-[2px]" />
            </div>
            <div className="absolute inset-[-50px] border border-azure-500/5 rounded-full" />
            <div className="absolute inset-[-50px] animate-orbit-reverse">
              <div className="w-2 h-2 bg-azure-300/30 rounded-full blur-[1px]" />
            </div>
          </div>
        </div>

        <div className="absolute inset-0 dot-pattern opacity-30" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white/[0.08] backdrop-blur-xl rounded-xl flex items-center justify-center border border-white/[0.08]">
              <Server className="w-5 h-5 text-azure-400" />
            </div>
            <div>
              <span className="text-lg font-semibold text-white tracking-tight">Azure</span>
              <span className="text-lg font-light text-azure-400 ml-1.5">Analiz</span>
            </div>
          </div>

          <div className="max-w-md">
            <h1 className="text-4xl font-bold text-white leading-tight tracking-tight mb-4">
              Ekibinize katılın,
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-azure-400 to-azure-300 mt-1">
                verimliliği artırın.
              </span>
            </h1>
            <p className="text-white/40 text-base leading-relaxed mb-10">
              Kayıt olduktan sonra hemen rezervasyon yapmaya başlayabilirsiniz.
            </p>

            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Calendar, title: 'Takvim Erişimi', desc: 'Anlık slot yönetimi' },
                { icon: Bell, title: 'Bildirimler', desc: 'Otomatik e-posta uyarıları' },
                { icon: BarChart3, title: 'Raporlar', desc: 'Kullanım istatistikleri' },
                { icon: CheckCircle, title: 'Kolay Kullanım', desc: 'Sezgisel arayüz' },
              ].map((feature, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.05] backdrop-blur-sm group hover:bg-white/[0.06] transition-all duration-300"
                >
                  <feature.icon className="w-4 h-4 text-azure-400 mb-2" />
                  <h3 className="text-sm font-medium text-white/90">{feature.title}</h3>
                  <p className="text-xs text-white/30 mt-0.5">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-white/20 text-xs">
            &copy; {new Date().getFullYear()} TEMSA Yapısal Analiz Ekibi
          </p>
        </div>
      </div>

      {/* Right side - Register Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 mesh-gradient relative">
        <div className="absolute inset-0 dot-pattern opacity-40" />

        <div className="w-full max-w-[420px] relative z-10">
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
              Hesap Oluşturun
            </h2>
            <p className="text-navy-400 mt-2 text-[15px]">
              Hemen kayıt olun ve rezervasyon yapmaya başlayın
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-navy-700">Ad Soyad *</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-navy-300 group-focus-within:text-azure-500 transition-colors" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full pl-11 pr-4 py-3.5 bg-white/80 border border-navy-200/60 rounded-xl text-sm text-navy-900 placeholder:text-navy-300 focus:ring-2 focus:ring-azure-500/20 focus:border-azure-500/40 focus:bg-white outline-none transition-all duration-200"
                    placeholder="Ad Soyad"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-navy-700">Departman</label>
                <div className="relative group">
                  <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-navy-300 group-focus-within:text-azure-500 transition-colors" />
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full pl-11 pr-4 py-3.5 bg-white/80 border border-navy-200/60 rounded-xl text-sm text-navy-900 placeholder:text-navy-300 focus:ring-2 focus:ring-azure-500/20 focus:border-azure-500/40 focus:bg-white outline-none transition-all duration-200"
                    placeholder="Yapısal Analiz"
                  />
                </div>
              </div>
            </div>

            {/* Role Selection */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-navy-700">Rol</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'user' })}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-200 ${
                    formData.role === 'user'
                      ? 'bg-azure-50/60 border-azure-500/40 ring-2 ring-azure-500/20'
                      : 'bg-white/80 border-navy-200/60 hover:border-azure-300'
                  }`}
                >
                  <User className={`w-5 h-5 ${formData.role === 'user' ? 'text-azure-500' : 'text-navy-300'}`} />
                  <div className="text-left">
                    <span className={`text-sm font-medium ${formData.role === 'user' ? 'text-azure-700' : 'text-navy-700'}`}>Kullanıcı</span>
                    <p className="text-[10px] text-navy-400">Standart erişim</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'admin' })}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-200 ${
                    formData.role === 'admin'
                      ? 'bg-purple-50/60 border-purple-500/40 ring-2 ring-purple-500/20'
                      : 'bg-white/80 border-navy-200/60 hover:border-purple-300'
                  }`}
                >
                  <Shield className={`w-5 h-5 ${formData.role === 'admin' ? 'text-purple-500' : 'text-navy-300'}`} />
                  <div className="text-left">
                    <span className={`text-sm font-medium ${formData.role === 'admin' ? 'text-purple-700' : 'text-navy-700'}`}>Admin</span>
                    <p className="text-[10px] text-navy-400">Tam yönetim</p>
                  </div>
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-navy-700">Email *</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-navy-300 group-focus-within:text-azure-500 transition-colors" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-white/80 border border-navy-200/60 rounded-xl text-sm text-navy-900 placeholder:text-navy-300 focus:ring-2 focus:ring-azure-500/20 focus:border-azure-500/40 focus:bg-white outline-none transition-all duration-200"
                  placeholder="ornek@temsa.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-navy-700">Şifre *</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-navy-300 group-focus-within:text-azure-500 transition-colors" />
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={6}
                    className="w-full pl-11 pr-4 py-3.5 bg-white/80 border border-navy-200/60 rounded-xl text-sm text-navy-900 placeholder:text-navy-300 focus:ring-2 focus:ring-azure-500/20 focus:border-azure-500/40 focus:bg-white outline-none transition-all duration-200"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-navy-700">Şifre Tekrar *</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-navy-300 group-focus-within:text-azure-500 transition-colors" />
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                    minLength={6}
                    className="w-full pl-11 pr-4 py-3.5 bg-white/80 border border-navy-200/60 rounded-xl text-sm text-navy-900 placeholder:text-navy-300 focus:ring-2 focus:ring-azure-500/20 focus:border-azure-500/40 focus:bg-white outline-none transition-all duration-200"
                    placeholder="••••••••"
                  />
                </div>
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
                  Kayıt Ol
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-navy-100/60">
            <p className="text-center text-sm text-navy-400">
              Zaten hesabınız var mı?{' '}
              <Link href="/login" className="text-azure-500 hover:text-azure-600 font-semibold transition-colors">
                Giriş Yapın
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
