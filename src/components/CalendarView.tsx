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
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Takvim</h2>
          <p className="text-gray-500 text-sm mt-1">Azure sunucu rezervasyonlarını yönetin</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-4 py-2 text-sm font-medium text-azure-600 bg-azure-50 hover:bg-azure-100 rounded-lg transition-colors"
          >
            Bugün
          </button>
          <div className="flex items-center bg-white border border-gray-200 rounded-lg">
            <button
              onClick={() => navigateWeek(-1)}
              className="p-2 hover:bg-gray-50 rounded-l-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-4 py-2 text-sm font-medium text-gray-700 min-w-[200px] text-center">
              {weekLabel}
            </span>
            <button
              onClick={() => navigateWeek(1)}
              className="p-2 hover:bg-gray-50 rounded-r-lg transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-[80px_repeat(5,1fr)] border-b border-gray-100">
          <div className="p-3 bg-gray-50/50" />
          {weekDates.map((date, i) => {
            const isToday = date.toDateString() === new Date().toDateString();
            return (
              <div
                key={i}
                className={`p-3 text-center border-l border-gray-100 ${
                  isToday ? 'bg-azure-50/50' : 'bg-gray-50/50'
                }`}
              >
                <span className="text-xs text-gray-400 uppercase tracking-wider">
                  {DAY_NAMES[i]}
                </span>
                <div
                  className={`text-lg font-semibold mt-0.5 ${
                    isToday ? 'text-azure-600' : 'text-gray-700'
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
            <div key={hour} className="grid grid-cols-[80px_repeat(5,1fr)] border-b border-gray-50">
              <div className="p-3 text-right pr-4 text-xs text-gray-400 font-medium bg-gray-50/30">
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
                        className={`border-l border-gray-50 ${isToday ? 'bg-azure-50/20' : ''}`}
                      />
                    );
                  }

                  const span = getSlotSpan(reservation);
                  const colorClass = userColorMap.get(reservation.userId) || COLORS[0];

                  return (
                    <div
                      key={dayIndex}
                      className={`relative border-l border-gray-50 p-1 ${isToday ? 'bg-azure-50/20' : ''}`}
                      style={{ gridRow: `span ${span}` }}
                    >
                      <div
                        className={`absolute inset-1 rounded-lg border p-2 cursor-pointer group ${colorClass}`}
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
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
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
                    className={`border-l border-gray-50 p-1 transition-colors group ${
                      isToday ? 'bg-azure-50/20' : ''
                    } ${
                      isPast
                        ? 'bg-gray-50/50 cursor-not-allowed'
                        : 'hover:bg-azure-50 cursor-pointer'
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
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Yeni Rezervasyon</h3>
                <p className="text-sm text-gray-500 mt-1">
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
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Süre (dakika)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[30, 60, 120, 180].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setFormData({ ...formData, duration: d })}
                      className={`p-2 text-sm rounded-lg border transition-all ${
                        formData.duration === d
                          ? 'bg-azure-500 text-white border-azure-500 shadow-md'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-azure-300'
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
                  className="mt-2 w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-azure-500 focus:border-transparent outline-none"
                  placeholder="Özel süre (dakika)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Açıklama (opsiyonel)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-azure-500 focus:border-transparent outline-none resize-none"
                  rows={3}
                  placeholder="Yapılacak analiz hakkında kısa açıklama..."
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-azure-500 text-white rounded-lg text-sm font-medium hover:bg-azure-600 disabled:opacity-50 transition-all shadow-md shadow-azure-500/25"
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
