'use client';

import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Clock, User } from 'lucide-react';

interface Reservation {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  startTime: string;
  endTime: string;
  description: string | null;
  status: string;
}

const DAY_NAMES = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum'];
const DAY_NAMES_FULL = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'];
const HOURS = Array.from({ length: 11 }, (_, i) => i + 8); // 08:00 - 18:00

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekDates(weekStart: Date): Date[] {
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });
}

const COLORS = [
  'bg-azure-500/15 border-azure-500/30 text-azure-800',
  'bg-purple-500/15 border-purple-500/30 text-purple-800',
  'bg-emerald-500/15 border-emerald-500/30 text-emerald-800',
  'bg-amber-500/15 border-amber-500/30 text-amber-800',
  'bg-rose-500/15 border-rose-500/30 text-rose-800',
  'bg-cyan-500/15 border-cyan-500/30 text-cyan-800',
  'bg-indigo-500/15 border-indigo-500/30 text-indigo-800',
];

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date; hour: number } | null>(null);
  const [formData, setFormData] = useState({ description: '', duration: 60 });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const weekStart = useMemo(() => getWeekStart(currentDate), [currentDate]);
  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart]);

  useEffect(() => {
    fetchReservations();
  }, [weekStart]);

  async function fetchReservations() {
    const start = weekStart.toISOString();
    const endDate = new Date(weekStart);
    endDate.setDate(weekStart.getDate() + 5);
    const end = endDate.toISOString();

    try {
      const res = await fetch(`/api/reservations?start=${start}&end=${end}&status=active`);
      if (res.ok) {
        const data = await res.json();
        setReservations(data);
      }
    } catch {}
  }

  function navigateWeek(direction: number) {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + direction * 7);
    setCurrentDate(newDate);
  }

  function goToToday() {
    setCurrentDate(new Date());
  }

  function handleSlotClick(date: Date, hour: number) {
    const now = new Date();
    const slotTime = new Date(date);
    slotTime.setHours(hour, 0, 0, 0);
    if (slotTime < now) return;

    setSelectedSlot({ date, hour });
    setFormData({ description: '', duration: 60 });
    setError('');
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSlot) return;

    setSubmitting(true);
    setError('');

    const startTime = new Date(selectedSlot.date);
    startTime.setHours(selectedSlot.hour, 0, 0, 0);

    const endTime = new Date(startTime.getTime() + formData.duration * 60 * 1000);

    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          description: formData.description,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        fetchReservations();
      } else {
        const data = await res.json();
        setError(data.error || 'Bir hata oluştu');
      }
    } catch {
      setError('Bağlantı hatası');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel(id: number) {
    if (!confirm('Rezervasyonu iptal etmek istediğinize emin misiniz?')) return;
    try {
      await fetch(`/api/reservations/${id}`, { method: 'DELETE' });
      fetchReservations();
    } catch {}
  }

  // Create a map of user colors
  const userColorMap = useMemo(() => {
    const map = new Map<number, string>();
    const uniqueUsers = Array.from(new Set(reservations.map((r) => r.userId)));
    uniqueUsers.forEach((userId, i) => {
      map.set(userId, COLORS[i % COLORS.length]);
    });
    return map;
  }, [reservations]);

  function getReservationForSlot(date: Date, hour: number): Reservation | null {
    return (
      reservations.find((r) => {
        const start = new Date(r.startTime);
        const end = new Date(r.endTime);
        const slotStart = new Date(date);
        slotStart.setHours(hour, 0, 0, 0);
        const slotEnd = new Date(date);
        slotEnd.setHours(hour + 1, 0, 0, 0);
        return start < slotEnd && end > slotStart;
      }) || null
    );
  }

  function isSlotStart(date: Date, hour: number, reservation: Reservation): boolean {
    const start = new Date(reservation.startTime);
    return start.getHours() === hour && start.toDateString() === date.toDateString();
  }

  function getSlotSpan(reservation: Reservation): number {
    const start = new Date(reservation.startTime);
    const end = new Date(reservation.endTime);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60));
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekEndDate = new Date(weekStart);
  weekEndDate.setDate(weekStart.getDate() + 4);
  const weekLabel = `${weekStart.getDate()} ${weekStart.toLocaleDateString('tr-TR', { month: 'short' })} - ${weekEndDate.getDate()} ${weekEndDate.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' })}`;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-[26px] font-bold text-navy-900 tracking-tight">Takvim</h2>
          <p className="text-navy-400 text-sm mt-1">Azure sunucu rezervasyonlarını yönetin</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-4 py-2.5 text-sm font-medium text-azure-600 bg-azure-50/60 hover:bg-azure-100/60 rounded-xl transition-colors border border-azure-100/40"
          >
            Bugün
          </button>
          <div className="flex items-center bg-white/70 backdrop-blur-sm border border-navy-100/40 rounded-xl">
            <button
              onClick={() => navigateWeek(-1)}
              className="p-2.5 hover:bg-navy-50/60 rounded-l-xl transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-navy-400" />
            </button>
            <span className="px-4 py-2 text-sm font-medium text-navy-700 min-w-[200px] text-center">
              {weekLabel}
            </span>
            <button
              onClick={() => navigateWeek(1)}
              className="p-2.5 hover:bg-navy-50/60 rounded-r-xl transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-navy-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-navy-100/40 overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-[80px_repeat(5,1fr)] border-b border-navy-100/30">
          <div className="p-3 bg-navy-50/30" />
          {weekDates.map((date, i) => {
            const isToday = date.toDateString() === new Date().toDateString();
            return (
              <div
                key={i}
                className={`p-3 text-center border-l border-navy-100/20 ${
                  isToday ? 'bg-azure-50/30' : 'bg-navy-50/20'
                }`}
              >
                <span className="text-[10px] text-navy-400 uppercase tracking-widest font-medium">
                  {DAY_NAMES[i]}
                </span>
                <div
                  className={`text-lg font-semibold mt-0.5 ${
                    isToday ? 'text-azure-600' : 'text-navy-700'
                  }`}
                >
                  {date.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        {/* Time slots */}
        <div className="max-h-[600px] overflow-y-auto">
          {HOURS.map((hour) => (
            <div key={hour} className="grid grid-cols-[80px_repeat(5,1fr)] border-b border-navy-50/30">
              <div className="p-3 text-right pr-4 text-xs text-navy-300 font-medium bg-navy-50/15">
                {`${hour.toString().padStart(2, '0')}:00`}
              </div>
              {weekDates.map((date, dayIndex) => {
                const reservation = getReservationForSlot(date, hour);
                const isPast =
                  new Date(date).setHours(hour, 0, 0, 0) < new Date().getTime();
                const isToday = date.toDateString() === new Date().toDateString();

                if (reservation) {
                  const isStart = isSlotStart(date, hour, reservation);
                  if (!isStart) {
                    return (
                      <div
                        key={dayIndex}
                        className={`border-l border-navy-50/20 ${isToday ? 'bg-azure-50/10' : ''}`}
                      />
                    );
                  }

                  const span = getSlotSpan(reservation);
                  const colorClass = userColorMap.get(reservation.userId) || COLORS[0];

                  return (
                    <div
                      key={dayIndex}
                      className={`relative border-l border-navy-50/20 p-1 ${isToday ? 'bg-azure-50/10' : ''}`}
                      style={{ gridRow: `span ${span}` }}
                    >
                      <div
                        className={`absolute inset-1 rounded-xl border p-2.5 cursor-pointer group transition-all hover:shadow-sm ${colorClass}`}
                        style={{
                          height: `${span * 100}%`,
                          maxHeight: `calc(${span * 100}% - 8px)`,
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold truncate">
                            {reservation.userName}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancel(reservation.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-black/5 rounded"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="text-[10px] opacity-70 block mt-0.5">
                          {new Date(reservation.startTime).toLocaleTimeString('tr-TR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          -{' '}
                          {new Date(reservation.endTime).toLocaleTimeString('tr-TR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {reservation.description && (
                          <p className="text-[10px] opacity-60 mt-1 truncate">
                            {reservation.description}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={dayIndex}
                    onClick={() => !isPast && handleSlotClick(date, hour)}
                    className={`border-l border-navy-50/20 p-1 transition-all duration-200 group ${
                      isToday ? 'bg-azure-50/10' : ''
                    } ${
                      isPast
                        ? 'bg-navy-50/20 cursor-not-allowed'
                        : 'hover:bg-azure-50/30 cursor-pointer'
                    }`}
                  >
                    {!isPast && (
                      <div className="w-full h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus className="w-4 h-4 text-azure-400" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Reservation Modal */}
      {showModal && selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-navy-900/30 backdrop-blur-md" onClick={() => setShowModal(false)} />
          <div className="relative bg-white/95 backdrop-blur-2xl rounded-2xl shadow-elevated border border-navy-100/40 w-full max-w-md p-6 z-10 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-navy-900">Yeni Rezervasyon</h3>
                <p className="text-sm text-navy-400 mt-1">
                  {selectedSlot.date.toLocaleDateString('tr-TR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}{' '}
                  - {selectedSlot.hour.toString().padStart(2, '0')}:00
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2.5 hover:bg-navy-50/60 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-navy-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
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
                      onClick={() => setFormData({ ...formData, duration: d })}
                      className={`p-2.5 text-sm rounded-xl border transition-all duration-200 ${
                        formData.duration === d
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
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData({ ...formData, duration: parseInt(e.target.value) || 60 })
                  }
                  className="mt-2 w-full px-4 py-2.5 bg-white/80 border border-navy-200/50 rounded-xl text-sm text-navy-900 focus:ring-2 focus:ring-azure-500/20 focus:border-azure-500/40 outline-none transition-all"
                  placeholder="Özel süre (dakika)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-navy-700 mb-2">
                  Açıklama (opsiyonel)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-white/80 border border-navy-200/50 rounded-xl text-sm text-navy-900 focus:ring-2 focus:ring-azure-500/20 focus:border-azure-500/40 outline-none resize-none transition-all"
                  rows={3}
                  placeholder="Yapılacak analiz hakkında kısa açıklama..."
                />
              </div>

              {error && (
                <div className="p-3.5 bg-red-50/80 border border-red-200/60 rounded-xl text-sm text-red-700 animate-slide-down">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 border border-navy-200/50 text-navy-600 rounded-xl text-sm font-medium hover:bg-navy-50/60 transition-all duration-200"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-azure-500 to-azure-600 text-white rounded-xl text-sm font-semibold hover:from-azure-600 hover:to-azure-700 disabled:opacity-60 transition-all duration-300 shadow-lg shadow-azure-500/20"
                >
                  {submitting ? 'Oluşturuluyor...' : 'Rezerve Et'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
