'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import ServerStatus from '@/components/ServerStatus';
import {
  Calendar,
  ClipboardList,
  FileText,
  ArrowRight,
  Clock,
  Activity,
  Sparkles,
  Pencil,
  Trash2,
  X,
  CalendarDays,
} from 'lucide-react';

interface Reservation {
  id: number;
  userName: string;
  startTime: string;
  endTime: string;
  description: string | null;
  status: string;
}

interface ActivityItem {
  id: number;
  userName: string;
  description: string;
  category: string | null;
  createdAt: string;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [upcomingReservations, setUpcomingReservations] = useState<Reservation[]>([]);
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ description: '', duration: 60, date: '', hour: 0 });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const now = new Date().toISOString();
      const weekLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const [resRes, actRes] = await Promise.all([
        fetch(`/api/reservations?start=${now}&end=${weekLater}&status=active`),
        fetch('/api/activities?limit=5'),
      ]);

      if (resRes.ok) {
        const data = await resRes.json();
        setUpcomingReservations(
          data
            .filter((r: Reservation) => new Date(r.startTime) > new Date())
            .sort(
              (a: Reservation, b: Reservation) =>
                new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
            )
            .slice(0, 5)
        );
      }

      if (actRes.ok) {
        const data = await actRes.json();
        setRecentActivities(data.slice(0, 5));
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Günaydın';
    if (hour < 18) return 'İyi günler';
    return 'İyi akşamlar';
  };

  async function handleCancel(id: number) {
    if (!confirm('Rezervasyonu iptal etmek istediğinize emin misiniz?')) return;
    try {
      await fetch(`/api/reservations/${id}`, { method: 'DELETE' });
      fetchData();
    } catch {}
  }

  function handleEdit(reservation: Reservation) {
    const start = new Date(reservation.startTime);
    const end = new Date(reservation.endTime);
    const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
    setEditingReservation(reservation);
    setEditForm({
      description: reservation.description || '',
      duration,
      date: start.toISOString().split('T')[0],
      hour: start.getHours(),
    });
    setEditError('');
    setShowEditModal(true);
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingReservation) return;

    setEditSubmitting(true);
    setEditError('');

    const startTime = new Date(editForm.date);
    startTime.setHours(editForm.hour, 0, 0, 0);
    const endTime = new Date(startTime.getTime() + editForm.duration * 60 * 1000);

    try {
      const res = await fetch(`/api/reservations/${editingReservation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          description: editForm.description,
        }),
      });
      if (res.ok) {
        setShowEditModal(false);
        setEditingReservation(null);
        fetchData();
      } else {
        const data = await res.json();
        setEditError(data.error || 'Bir hata oluştu');
      }
    } catch {
      setEditError('Bağlantı hatası');
    } finally {
      setEditSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[26px] font-bold text-navy-900 tracking-tight">
            {greeting()}, {session?.user?.name?.split(' ')[0]}
          </h1>
          <p className="text-navy-400 mt-1 text-sm">Azure analiz sunucusu durumuna göz atın</p>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-navy-300 bg-white/60 backdrop-blur-sm px-3 py-1.5 rounded-full border border-navy-100/40">
          <Sparkles className="w-3 h-3" />
          <span>{new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        </div>
      </div>

      {/* Server Status + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <ServerStatus />
        </div>
        <div className="space-y-2.5">
          {[
            { href: '/calendar', icon: Calendar, title: 'Rezervasyon Yap', desc: 'Takvime git', color: 'azure' },
            { href: '/activities', icon: ClipboardList, title: 'İşlem Kaydet', desc: 'Yeni işlem gir', color: 'emerald' },
            { href: '/reports', icon: FileText, title: 'Raporları Gör', desc: 'İstatistiklere bak', color: 'purple' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-4 p-4 bg-white/70 backdrop-blur-sm rounded-2xl border border-navy-100/40 hover:bg-white/90 hover:border-navy-200/50 hover:shadow-card transition-all duration-300 group"
            >
              <div className={`w-10 h-10 bg-${item.color}-50/80 rounded-xl flex items-center justify-center group-hover:bg-${item.color}-100/80 transition-colors`}>
                <item.icon className={`w-[18px] h-[18px] text-${item.color}-500`} />
              </div>
              <div className="flex-1">
                <span className="text-sm font-semibold text-navy-800">{item.title}</span>
                <p className="text-xs text-navy-400">{item.desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-navy-200 group-hover:text-azure-500 group-hover:translate-x-0.5 transition-all" />
            </Link>
          ))}
        </div>
      </div>

      {/* Upcoming Reservations + Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Upcoming Reservations */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-navy-100/40 overflow-hidden">
          <div className="px-6 py-4 border-b border-navy-50/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-azure-50/80 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5 text-azure-500" />
              </div>
              <h3 className="font-semibold text-navy-800 text-[15px]">Yaklaşan Rezervasyonlar</h3>
            </div>
            <Link href="/calendar" className="text-xs text-azure-500 hover:text-azure-600 font-medium transition-colors">
              Tümünü gör
            </Link>
          </div>
          <div className="divide-y divide-navy-50/40">
            {loading ? (
              <div className="p-8 text-center">
                <div className="w-6 h-6 border-2 border-navy-200 border-t-azure-500 rounded-full animate-spin mx-auto" />
              </div>
            ) : upcomingReservations.length === 0 ? (
              <div className="p-10 text-center">
                <Calendar className="w-10 h-10 text-navy-200 mx-auto mb-2" />
                <p className="text-sm text-navy-400">Yaklaşan rezervasyon yok</p>
              </div>
            ) : (
              upcomingReservations.map((r) => (
                <div key={r.id} className="px-6 py-3.5 flex items-center gap-4 hover:bg-navy-50/30 transition-colors group">
                  <div className="w-10 h-10 bg-azure-50/60 rounded-xl flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-azure-600">
                      {new Date(r.startTime).getDate()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-navy-800 truncate">{r.userName}</p>
                    <p className="text-xs text-navy-400">
                      {new Date(r.startTime).toLocaleString('tr-TR', {
                        weekday: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      -{' '}
                      {new Date(r.endTime).toLocaleTimeString('tr-TR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  {r.description && (
                    <span className="text-xs text-navy-300 truncate max-w-[120px] hidden sm:block">
                      {r.description}
                    </span>
                  )}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={() => handleEdit(r)}
                      className="p-1.5 hover:bg-azure-50/80 rounded-lg transition-colors"
                      title="Düzenle"
                    >
                      <Pencil className="w-3.5 h-3.5 text-azure-500" />
                    </button>
                    <button
                      onClick={() => handleCancel(r.id)}
                      className="p-1.5 hover:bg-red-50/80 rounded-lg transition-colors"
                      title="İptal Et"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-navy-100/40 overflow-hidden">
          <div className="px-6 py-4 border-b border-navy-50/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-50/80 flex items-center justify-center">
                <Activity className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <h3 className="font-semibold text-navy-800 text-[15px]">Son İşlemler</h3>
            </div>
            <Link href="/activities" className="text-xs text-azure-500 hover:text-azure-600 font-medium transition-colors">
              Tümünü gör
            </Link>
          </div>
          <div className="divide-y divide-navy-50/40">
            {loading ? (
              <div className="p-8 text-center">
                <div className="w-6 h-6 border-2 border-navy-200 border-t-azure-500 rounded-full animate-spin mx-auto" />
              </div>
            ) : recentActivities.length === 0 ? (
              <div className="p-10 text-center">
                <ClipboardList className="w-10 h-10 text-navy-200 mx-auto mb-2" />
                <p className="text-sm text-navy-400">Henüz işlem kaydı yok</p>
              </div>
            ) : (
              recentActivities.map((a) => (
                <div key={a.id} className="px-6 py-3.5 hover:bg-navy-50/30 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-navy-800">{a.userName}</span>
                    <span className="text-[10px] text-navy-300">
                      {new Date(a.createdAt).toLocaleString('tr-TR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-navy-500 truncate">{a.description}</p>
                  {a.category && (
                    <span className="text-[10px] text-azure-600 bg-azure-50/60 px-2 py-0.5 rounded-full mt-1.5 inline-block font-medium">
                      {a.category}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Edit Reservation Modal */}
      {showEditModal && editingReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-navy-900/30 backdrop-blur-md" onClick={() => { setShowEditModal(false); setEditingReservation(null); }} />
          <div className="relative bg-white/95 backdrop-blur-2xl rounded-2xl shadow-elevated border border-navy-100/40 w-full max-w-md p-6 z-10 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-navy-900">Rezervasyonu Düzenle</h3>
                <p className="text-sm text-navy-400 mt-1">{editingReservation.userName}</p>
              </div>
              <button
                onClick={() => { setShowEditModal(false); setEditingReservation(null); }}
                className="p-2.5 hover:bg-navy-50/60 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-navy-400" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-2">
                  <CalendarDays className="w-4 h-4 inline mr-1" />
                  Tarih ve Saat
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={editForm.date}
                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                    className="px-3 py-2.5 bg-white/80 border border-navy-200/50 rounded-xl text-sm text-navy-900 focus:ring-2 focus:ring-azure-500/20 focus:border-azure-500/40 outline-none transition-all"
                  />
                  <select
                    value={editForm.hour}
                    onChange={(e) => setEditForm({ ...editForm, hour: parseInt(e.target.value) })}
                    className="px-3 py-2.5 bg-white/80 border border-navy-200/50 rounded-xl text-sm text-navy-900 focus:ring-2 focus:ring-azure-500/20 focus:border-azure-500/40 outline-none transition-all"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>
                        {i.toString().padStart(2, '0')}:00
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-navy-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Süre (dakika)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[30, 60, 120, 180].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setEditForm({ ...editForm, duration: d })}
                      className={`p-2.5 text-sm rounded-xl border transition-all duration-200 ${
                        editForm.duration === d
                          ? 'bg-gradient-to-r from-azure-500 to-azure-600 text-white border-azure-500 shadow-md shadow-azure-500/20'
                          : 'bg-white/80 text-navy-600 border-navy-200/50 hover:border-azure-300'
                      }`}
                    >
                      {d >= 60 ? `${d / 60} saat` : `${d} dk`}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="15"
                  max="480"
                  step="15"
                  value={editForm.duration}
                  onChange={(e) => setEditForm({ ...editForm, duration: parseInt(e.target.value) || 60 })}
                  className="mt-2 w-full px-4 py-2.5 bg-white/80 border border-navy-200/50 rounded-xl text-sm text-navy-900 focus:ring-2 focus:ring-azure-500/20 focus:border-azure-500/40 outline-none transition-all"
                  placeholder="Özel süre (dakika)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-navy-700 mb-2">
                  Açıklama (opsiyonel)
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-4 py-3 bg-white/80 border border-navy-200/50 rounded-xl text-sm text-navy-900 focus:ring-2 focus:ring-azure-500/20 focus:border-azure-500/40 outline-none resize-none transition-all"
                  rows={3}
                  placeholder="Yapılacak analiz hakkında kısa açıklama..."
                />
              </div>

              {editError && (
                <div className="p-3.5 bg-red-50/80 border border-red-200/60 rounded-xl text-sm text-red-700 animate-slide-down">
                  {editError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    handleCancel(editingReservation.id);
                    setShowEditModal(false);
                    setEditingReservation(null);
                  }}
                  className="px-4 py-3 border border-red-200/50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50/60 transition-all duration-200"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); setEditingReservation(null); }}
                  className="flex-1 px-4 py-3 border border-navy-200/50 text-navy-600 rounded-xl text-sm font-medium hover:bg-navy-50/60 transition-all duration-200"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-azure-500 to-azure-600 text-white rounded-xl text-sm font-semibold hover:from-azure-600 hover:to-azure-700 disabled:opacity-60 transition-all duration-300 shadow-lg shadow-azure-500/20"
                >
                  {editSubmitting ? 'Güncelleniyor...' : 'Güncelle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
