'use client';

import { useEffect, useState } from 'react';
import { Server, User, Clock, Zap } from 'lucide-react';

interface Reservation {
  id: number;
  userId: number;
  userName: string;
  startTime: string;
  endTime: string;
  description: string | null;
  status: string;
}

export default function ServerStatus() {
  const [currentReservation, setCurrentReservation] = useState<Reservation | null>(null);
  const [nextReservation, setNextReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!currentReservation) return;
    const timer = setInterval(() => {
      const end = new Date(currentReservation.endTime);
      const now = new Date();
      const diff = end.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeLeft('Süre doldu');
        fetchStatus();
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft(hours > 0 ? `${hours}s ${minutes}dk` : `${minutes}dk`);
    }, 1000);
    return () => clearInterval(timer);
  }, [currentReservation]);

  async function fetchStatus() {
    try {
      const now = new Date();
      const start = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      const end = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
      const res = await fetch(`/api/reservations?start=${start}&end=${end}&status=active`);
      if (res.ok) {
        const data: Reservation[] = await res.json();
        const current = data.find(
          (r) => new Date(r.startTime) <= now && new Date(r.endTime) >= now
        );
        const upcoming = data
          .filter((r) => new Date(r.startTime) > now)
          .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
        setCurrentReservation(current || null);
        setNextReservation(upcoming[0] || null);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }

  const isInUse = !!currentReservation;

  if (loading) {
    return (
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-navy-100/40 animate-pulse">
        <div className="h-24 bg-navy-50/50 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl p-6 border backdrop-blur-sm transition-all duration-300">
      {/* Background styling based on state */}
      {isInUse ? (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50/90 via-orange-50/80 to-red-50/70 backdrop-blur-sm" />
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-orange-500/[0.06] rounded-full blur-2xl" />
          <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-amber-500/[0.04] rounded-full blur-xl" />
          <div className="absolute inset-0 border border-orange-200/60 rounded-2xl" />
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/90 via-green-50/80 to-teal-50/70 backdrop-blur-sm" />
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-emerald-500/[0.06] rounded-full blur-2xl" />
          <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-green-500/[0.04] rounded-full blur-xl" />
          <div className="absolute inset-0 border border-emerald-200/60 rounded-2xl" />
        </>
      )}

      <div className="relative">
        <div className="flex items-center gap-3.5 mb-5">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center ${
              isInUse ? 'bg-orange-500/10' : 'bg-emerald-500/10'
            }`}
          >
            <Server
              className={`w-5 h-5 ${isInUse ? 'text-orange-600' : 'text-emerald-600'}`}
            />
          </div>
          <div>
            <h3 className="font-semibold text-navy-800 text-[15px]">Azure Sunucu Durumu</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="relative flex items-center justify-center">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isInUse ? 'bg-orange-500' : 'bg-emerald-500'
                  }`}
                />
                <div
                  className={`absolute w-2 h-2 rounded-full animate-ping ${
                    isInUse ? 'bg-orange-500' : 'bg-emerald-500'
                  }`}
                />
              </div>
              <span
                className={`text-sm font-medium ${
                  isInUse ? 'text-orange-700' : 'text-emerald-700'
                }`}
              >
                {isInUse ? 'Kullanımda' : 'Müsait'}
              </span>
            </div>
          </div>
        </div>

        {isInUse && currentReservation && (
          <div className="space-y-3 bg-white/40 rounded-xl p-4 border border-white/60">
            <div className="flex items-center gap-2.5 text-sm text-navy-700">
              <User className="w-4 h-4 text-orange-500" />
              <span className="font-medium">{currentReservation.userName}</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm text-navy-600">
              <Clock className="w-4 h-4 text-orange-400" />
              <span>Kalan süre: <strong className="text-orange-700">{timeLeft}</strong></span>
            </div>
            {currentReservation.description && (
              <p className="text-xs text-navy-500 bg-white/50 rounded-lg px-3 py-2">
                {currentReservation.description}
              </p>
            )}
          </div>
        )}

        {!isInUse && nextReservation && (
          <div className="mt-1 flex items-center gap-2.5 text-sm text-navy-600 bg-white/40 rounded-xl px-4 py-3 border border-white/60">
            <Zap className="w-4 h-4 text-emerald-500" />
            <span>
              Sonraki rezervasyon:{' '}
              <strong className="text-navy-800">
                {new Intl.DateTimeFormat('tr-TR', {
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZone: 'Europe/Istanbul',
                }).format(new Date(nextReservation.startTime))}
              </strong>
              {' '} - {nextReservation.userName}
            </span>
          </div>
        )}

        {!isInUse && !nextReservation && (
          <p className="text-sm text-emerald-600 mt-1 bg-white/40 rounded-xl px-4 py-3 border border-white/60">
            Bugün için planlanmış rezervasyon yok. Hemen kullanabilirsiniz!
          </p>
        )}
      </div>
    </div>
  );
}
