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
                <div key={r.id} className="px-6 py-3.5 flex items-center gap-4 hover:bg-navy-50/30 transition-colors">
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
                    <span className="text-xs text-navy-300 truncate max-w-[120px]">
                      {r.description}
                    </span>
                  )}
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
    </div>
  );
}
