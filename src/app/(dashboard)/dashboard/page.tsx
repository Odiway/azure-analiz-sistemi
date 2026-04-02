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

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {greeting()}, {session?.user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 mt-1">Azure analiz sunucusu durumuna göz atın</p>
      </div>

      {/* Server Status + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ServerStatus />
        </div>
        <div className="space-y-3">
          <Link
            href="/calendar"
            className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-azure-200 transition-all group"
          >
            <div className="w-10 h-10 bg-azure-50 rounded-xl flex items-center justify-center group-hover:bg-azure-100 transition-colors">
              <Calendar className="w-5 h-5 text-azure-500" />
            </div>
            <div className="flex-1">
              <span className="text-sm font-semibold text-gray-900">Rezervasyon Yap</span>
              <p className="text-xs text-gray-400">Takvime git</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-azure-500 transition-colors" />
          </Link>
          <Link
            href="/activities"
            className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all group"
          >
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
              <ClipboardList className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="flex-1">
              <span className="text-sm font-semibold text-gray-900">İşlem Kaydet</span>
              <p className="text-xs text-gray-400">Yeni işlem gir</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 transition-colors" />
          </Link>
          <Link
            href="/reports"
            className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-purple-200 transition-all group"
          >
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center group-hover:bg-purple-100 transition-colors">
              <FileText className="w-5 h-5 text-purple-500" />
            </div>
            <div className="flex-1">
              <span className="text-sm font-semibold text-gray-900">Raporları Gör</span>
              <p className="text-xs text-gray-400">İstatistiklere bak</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-purple-500 transition-colors" />
          </Link>
        </div>
      </div>

      {/* Upcoming Reservations + Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Reservations */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-azure-500" />
              <h3 className="font-semibold text-gray-900">Yaklaşan Rezervasyonlar</h3>
            </div>
            <Link href="/calendar" className="text-xs text-azure-500 hover:text-azure-700 font-medium">
              Tümünü gör →
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? (
              <div className="p-6 text-center text-gray-400 text-sm">Yükleniyor...</div>
            ) : upcomingReservations.length === 0 ? (
              <div className="p-8 text-center">
                <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Yaklaşan rezervasyon yok</p>
              </div>
            ) : (
              upcomingReservations.map((r) => (
                <div key={r.id} className="px-6 py-3 flex items-center gap-4">
                  <div className="w-10 h-10 bg-azure-50 rounded-xl flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-azure-600">
                      {new Date(r.startTime).getDate()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{r.userName}</p>
                    <p className="text-xs text-gray-400">
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
                    <span className="text-xs text-gray-400 truncate max-w-[120px]">
                      {r.description}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              <h3 className="font-semibold text-gray-900">Son İşlemler</h3>
            </div>
            <Link href="/activities" className="text-xs text-azure-500 hover:text-azure-700 font-medium">
              Tümünü gör →
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? (
              <div className="p-6 text-center text-gray-400 text-sm">Yükleniyor...</div>
            ) : recentActivities.length === 0 ? (
              <div className="p-8 text-center">
                <ClipboardList className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Henüz işlem kaydı yok</p>
              </div>
            ) : (
              recentActivities.map((a) => (
                <div key={a.id} className="px-6 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">{a.userName}</span>
                    <span className="text-[10px] text-gray-400">
                      {new Date(a.createdAt).toLocaleString('tr-TR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{a.description}</p>
                  {a.category && (
                    <span className="text-[10px] text-azure-600 bg-azure-50 px-2 py-0.5 rounded-full mt-1 inline-block">
                      {a.category}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
