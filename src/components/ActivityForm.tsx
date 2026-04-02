'use client';

import { useState, useEffect } from 'react';
import { Plus, ClipboardList, Filter } from 'lucide-react';
import { CATEGORIES } from '@/lib/utils';

interface Activity {
  id: number;
  userId: number;
  userName: string;
  reservationId: number | null;
  description: string;
  category: string | null;
  durationMinutes: number | null;
  createdAt: string;
}

interface Reservation {
  id: number;
  startTime: string;
  endTime: string;
  description: string | null;
}

export default function ActivityForm() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    category: '',
    durationMinutes: 30,
    reservationId: '',
  });

  useEffect(() => {
    fetchActivities();
    fetchReservations();
  }, []);

  async function fetchActivities() {
    try {
      const res = await fetch('/api/activities?limit=50');
      if (res.ok) {
        const data = await res.json();
        setActivities(data);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }

  async function fetchReservations() {
    const now = new Date();
    const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const end = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    try {
      const res = await fetch(`/api/reservations?start=${start}&end=${end}&status=active`);
      if (res.ok) {
        const data = await res.json();
        setReservations(data);
      }
    } catch {}
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.description) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: formData.description,
          category: formData.category || null,
          durationMinutes: formData.durationMinutes || null,
          reservationId: formData.reservationId ? parseInt(formData.reservationId) : null,
        }),
      });

      if (res.ok) {
        setFormData({ description: '', category: '', durationMinutes: 30, reservationId: '' });
        setShowForm(false);
        fetchActivities();
      }
    } catch {
    } finally {
      setSubmitting(false);
    }
  }

  const categoryColors: Record<string, string> = {
    'Yapısal Analiz': 'bg-blue-100 text-blue-800',
    'Termal Analiz': 'bg-red-100 text-red-800',
    'Akış Analizi': 'bg-cyan-100 text-cyan-800',
    'Titreşim Analizi': 'bg-purple-100 text-purple-800',
    'Yorulma Analizi': 'bg-orange-100 text-orange-800',
    'Optimizasyon': 'bg-green-100 text-green-800',
    'Diğer': 'bg-gray-100 text-gray-800',
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">İşlem Kayıtları</h2>
          <p className="text-gray-500 text-sm mt-1">Sunucuda yapılan işlemleri kaydedin ve takip edin</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 bg-azure-500 text-white rounded-lg text-sm font-medium hover:bg-azure-600 transition-all shadow-md shadow-azure-500/25"
        >
          <Plus className="w-4 h-4" />
          Yeni İşlem Kaydı
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">İşlem Kaydı Oluştur</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Kategori</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-azure-500 focus:border-transparent outline-none bg-white"
                >
                  <option value="">Kategori seçin</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Süre (dakika)</label>
                <input
                  type="number"
                  min="1"
                  value={formData.durationMinutes}
                  onChange={(e) =>
                    setFormData({ ...formData, durationMinutes: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-azure-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                İlgili Rezervasyon (opsiyonel)
              </label>
              <select
                value={formData.reservationId}
                onChange={(e) => setFormData({ ...formData, reservationId: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-azure-500 focus:border-transparent outline-none bg-white"
              >
                <option value="">Rezervasyon seçin</option>
                {reservations.map((r) => (
                  <option key={r.id} value={r.id}>
                    {new Date(r.startTime).toLocaleString('tr-TR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    - {r.description || 'Açıklama yok'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Açıklama *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-azure-500 focus:border-transparent outline-none resize-none"
                placeholder="Yapılan işlemin detaylı açıklaması..."
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-azure-500 text-white rounded-lg text-sm font-medium hover:bg-azure-600 disabled:opacity-50 transition-all shadow-md shadow-azure-500/25"
              >
                {submitting ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Activity List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Yükleniyor...</div>
        ) : activities.length === 0 ? (
          <div className="p-12 text-center">
            <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Henüz işlem kaydı yok</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {activities.map((activity) => (
              <div key={activity.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {activity.userName}
                      </span>
                      {activity.category && (
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                            categoryColors[activity.category] || 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {activity.category}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{activity.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-400">
                      {new Date(activity.createdAt).toLocaleDateString('tr-TR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    {activity.durationMinutes && (
                      <p className="text-xs text-gray-500 mt-1">
                        {activity.durationMinutes >= 60
                          ? `${Math.floor(activity.durationMinutes / 60)}s ${activity.durationMinutes % 60}dk`
                          : `${activity.durationMinutes}dk`}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
