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
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse">
        <div className="h-20 bg-gray-100 rounded-lg" />
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-6 shadow-sm border transition-all ${
        isInUse
          ? 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-200'
          : 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200'
      }`}
    >
      {/* Decorative circles */}
      <div
        className={`absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-10 ${
          isInUse ? 'bg-orange-500' : 'bg-emerald-500'
        }`}
      />
      <div
        className={`absolute -bottom-4 -left-4 w-20 h-20 rounded-full opacity-5 ${
          isInUse ? 'bg-red-500' : 'bg-green-500'
        }`}
      />

      <div className="relative">
        <div className="flex items-center gap-3 mb-4">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isInUse ? 'bg-orange-500/10' : 'bg-emerald-500/10'
            }`}
          >
            <Server
              className={`w-5 h-5 ${isInUse ? 'text-orange-600' : 'text-emerald-600'}`}
            />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Azure Sunucu Durumu</h3>
            <div className="flex items-center gap-1.5">
              <div
                className={`w-2 h-2 rounded-full ${
                  isInUse ? 'bg-orange-500 animate-pulse' : 'bg-emerald-500'
                }`}
              />
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
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <User className="w-4 h-4 text-orange-500" />
              <span className="font-medium">{currentReservation.userName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4 text-orange-400" />
              <span>Kalan süre: <strong className="text-orange-700">{timeLeft}</strong></span>
            </div>
            {currentReservation.description && (
              <p className="text-xs text-gray-500 bg-white/50 rounded-lg px-3 py-2">
                {currentReservation.description}
              </p>
            )}
          </div>
        )}

        {!isInUse && nextReservation && (
          <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
            <Zap className="w-4 h-4 text-emerald-500" />
            <span>
              Sonraki rezervasyon:{' '}
              <strong>
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
          <p className="text-sm text-emerald-600 mt-1">
            Bugün için planlanmış rezervasyon yok. Hemen kullanabilirsiniz!
          </p>
        )}
      </div>
    </div>
  );
}
