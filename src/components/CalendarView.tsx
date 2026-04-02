'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Clock, Pencil, Trash2, CalendarDays } from 'lucide-react';

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

type ViewMode = 'daily' | 'weekly' | 'monthly';

const DAY_NAMES_SHORT = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const DAY_NAMES_FULL = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
const HOURS_24 = Array.from({ length: 24 }, (_, i) => i);
const WORK_HOURS = Array.from({ length: 11 }, (_, i) => i + 8);

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekDates(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });
}

function getMonthDates(date: Date): Date[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  let startDay = firstDay.getDay() - 1;
  if (startDay < 0) startDay = 6;

  const dates: Date[] = [];
  const start = new Date(firstDay);
  start.setDate(start.getDate() - startDay);

  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(d);
    if (i >= 35 && d.getMonth() !== month) break;
  }
  return dates;
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

const COLOR_DOTS = [
  'bg-azure-500',
  'bg-purple-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-indigo-500',
];

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('weekly');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date; hour: number } | null>(null);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [formData, setFormData] = useState({ description: '', duration: 60 });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const weekStart = useMemo(() => getWeekStart(currentDate), [currentDate]);
  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart]);
  const monthDates = useMemo(() => getMonthDates(currentDate), [currentDate]);

  const fetchRange = useMemo(() => {
    if (viewMode === 'daily') {
      const start = new Date(currentDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(currentDate);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    } else if (viewMode === 'weekly') {
      const start = new Date(weekStart);
      const end = new Date(weekStart);
      end.setDate(end.getDate() + 7);
      return { start, end };
    } else {
      const start = new Date(monthDates[0]);
      const end = new Date(monthDates[monthDates.length - 1]);
      end.setDate(end.getDate() + 1);
      return { start, end };
    }
  }, [viewMode, currentDate, weekStart, monthDates]);

  const fetchReservations = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/reservations?start=${fetchRange.start.toISOString()}&end=${fetchRange.end.toISOString()}&status=active`
      );
      if (res.ok) {
        const data = await res.json();
        setReservations(data);
      }
    } catch {}
  }, [fetchRange]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  function navigate(direction: number) {
    const newDate = new Date(currentDate);
    if (viewMode === 'daily') {
      newDate.setDate(newDate.getDate() + direction);
    } else if (viewMode === 'weekly') {
      newDate.setDate(newDate.getDate() + direction * 7);
    } else {
      newDate.setMonth(newDate.getMonth() + direction);
    }
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

    setEditingReservation(null);
    setSelectedSlot({ date, hour });
    setFormData({ description: '', duration: 60 });
    setError('');
    setShowModal(true);
  }

  function handleCreateClick() {
    const now = new Date();
    const nextHour = new Date(now);
    nextHour.setHours(now.getHours() + 1, 0, 0, 0);

    setEditingReservation(null);
    setSelectedSlot({ date: nextHour, hour: nextHour.getHours() });
    setFormData({ description: '', duration: 60 });
    setError('');
    setShowModal(true);
  }

  function handleEditClick(reservation: Reservation) {
    const start = new Date(reservation.startTime);
    const end = new Date(reservation.endTime);
    const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60));

    setEditingReservation(reservation);
    setSelectedSlot({ date: start, hour: start.getHours() });
    setFormData({ description: reservation.description || '', duration });
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
      if (editingReservation) {
        const res = await fetch(`/api/reservations/${editingReservation.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            description: formData.description,
          }),
        });
        if (res.ok) {
          setShowModal(false);
          setEditingReservation(null);
          fetchReservations();
        } else {
          const data = await res.json();
          setError(data.error || 'Bir hata oluştu');
        }
      } else {
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

  const userColorMap = useMemo(() => {
    const map = new Map<number, number>();
    const uniqueUsers = Array.from(new Set(reservations.map((r) => r.userId)));
    uniqueUsers.forEach((userId, i) => {
      map.set(userId, i % COLORS.length);
    });
    return map;
  }, [reservations]);

  function getReservationsForSlot(date: Date, hour: number): Reservation[] {
    return reservations.filter((r) => {
      const start = new Date(r.startTime);
      const end = new Date(r.endTime);
      const slotStart = new Date(date);
      slotStart.setHours(hour, 0, 0, 0);
      const slotEnd = new Date(date);
      slotEnd.setHours(hour + 1, 0, 0, 0);
      return start < slotEnd && end > slotStart;
    });
  }

  function getReservationsForDay(date: Date): Reservation[] {
    return reservations.filter((r) => {
      const start = new Date(r.startTime);
      return start.toDateString() === date.toDateString();
    });
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

  // Navigation label
  const navLabel = useMemo(() => {
    if (viewMode === 'daily') {
      return currentDate.toLocaleDateString('tr-TR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } else if (viewMode === 'weekly') {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return `${weekStart.getDate()} ${weekStart.toLocaleDateString('tr-TR', { month: 'short' })} - ${weekEnd.getDate()} ${weekEnd.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' })}`;
    } else {
      return currentDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
    }
  }, [viewMode, currentDate, weekStart]);

  function renderReservationBlock(reservation: Reservation, compact = false) {
    const colorIdx = userColorMap.get(reservation.userId) ?? 0;
    const colorClass = COLORS[colorIdx];

    if (compact) {
      return (
        <div
          key={reservation.id}
          className={`rounded-lg border px-2 py-1 text-[10px] cursor-pointer group/item flex items-center gap-1 ${colorClass}`}
          onClick={(e) => {
            e.stopPropagation();
            handleEditClick(reservation);
          }}
        >
          <span className="truncate flex-1 font-medium">{reservation.userName}</span>
          <span className="opacity-60 shrink-0">
            {new Date(reservation.startTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      );
    }

    return null;
  }

  function renderTimeGrid(dates: Date[], hours: number[]) {
    const colCount = dates.length;

    return (
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-navy-100/40 overflow-hidden">
        {/* Day headers */}
        <div
          className="grid border-b border-navy-100/30"
          style={{ gridTemplateColumns: `80px repeat(${colCount}, 1fr)` }}
        >
          <div className="p-3 bg-navy-50/30" />
          {dates.map((date, i) => {
            const isToday = date.toDateString() === new Date().toDateString();
            const dayIdx = (date.getDay() + 6) % 7;
            return (
              <div
                key={i}
                className={`p-3 text-center border-l border-navy-100/20 ${
                  isToday ? 'bg-azure-50/30' : 'bg-navy-50/20'
                }`}
              >
                <span className="text-[10px] text-navy-400 uppercase tracking-widest font-medium">
                  {DAY_NAMES_SHORT[dayIdx]}
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
          {hours.map((hour) => (
            <div
              key={hour}
              className="grid border-b border-navy-50/30"
              style={{ gridTemplateColumns: `80px repeat(${colCount}, 1fr)` }}
            >
              <div className="p-3 text-right pr-4 text-xs text-navy-300 font-medium bg-navy-50/15">
                {`${hour.toString().padStart(2, '0')}:00`}
              </div>
              {dates.map((date, dayIndex) => {
                const slotReservations = getReservationsForSlot(date, hour);
                const reservation = slotReservations[0] || null;
                const isPast = new Date(date).setHours(hour, 0, 0, 0) < new Date().getTime();
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
                  const colorIdx = userColorMap.get(reservation.userId) ?? 0;
                  const colorClass = COLORS[colorIdx];

                  return (
                    <div
                      key={dayIndex}
                      className={`relative border-l border-navy-50/20 p-1 ${isToday ? 'bg-azure-50/10' : ''}`}
                      style={{ gridRow: `span ${span}` }}
                    >
                      <div
                        className={`absolute inset-1 rounded-xl border p-2.5 cursor-pointer group transition-all hover:shadow-md ${colorClass}`}
                        style={{
                          height: `${span * 100}%`,
                          maxHeight: `calc(${span * 100}% - 8px)`,
                        }}
                        onClick={() => handleEditClick(reservation)}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-semibold truncate">
                            {reservation.userName}
                          </span>
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditClick(reservation);
                              }}
                              className="p-1 hover:bg-black/10 rounded-lg transition-colors"
                              title="Düzenle"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancel(reservation.id);
                              }}
                              className="p-1 hover:bg-red-500/20 rounded-lg transition-colors text-red-600"
                              title="İptal Et"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
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
    );
  }

  function renderMonthView() {
    const currentMonth = currentDate.getMonth();
    return (
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-navy-100/40 overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-navy-100/30">
          {DAY_NAMES_SHORT.map((day) => (
            <div key={day} className="p-3 text-center bg-navy-50/20">
              <span className="text-[10px] text-navy-400 uppercase tracking-widest font-medium">
                {day}
              </span>
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7">
          {monthDates.map((date, i) => {
            const isToday = date.toDateString() === new Date().toDateString();
            const isCurrentMonth = date.getMonth() === currentMonth;
            const dayReservations = getReservationsForDay(date);
            const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));

            return (
              <div
                key={i}
                className={`min-h-[100px] border-b border-r border-navy-50/30 p-2 transition-colors ${
                  !isCurrentMonth ? 'bg-navy-50/20 opacity-50' : ''
                } ${isToday ? 'bg-azure-50/20' : ''} ${
                  !isPast && isCurrentMonth ? 'hover:bg-azure-50/10 cursor-pointer' : ''
                }`}
                onClick={() => {
                  if (!isPast && isCurrentMonth) {
                    setCurrentDate(date);
                    setViewMode('daily');
                  }
                }}
              >
                <div
                  className={`text-sm font-semibold mb-1 ${
                    isToday
                      ? 'w-7 h-7 bg-azure-500 text-white rounded-full flex items-center justify-center'
                      : isCurrentMonth
                      ? 'text-navy-700'
                      : 'text-navy-300'
                  }`}
                >
                  {date.getDate()}
                </div>
                <div className="space-y-0.5">
                  {dayReservations.slice(0, 3).map((r) => renderReservationBlock(r, true))}
                  {dayReservations.length > 3 && (
                    <span className="text-[10px] text-navy-400 font-medium pl-1">
                      +{dayReservations.length - 3} daha
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-[26px] font-bold text-navy-900 tracking-tight">Takvim</h2>
          <p className="text-navy-400 text-sm mt-1">Azure sunucu rezervasyonlarını yönetin</p>
        </div>
        <button
          onClick={handleCreateClick}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-azure-500 to-azure-600 text-white rounded-xl text-sm font-semibold hover:from-azure-600 hover:to-azure-700 transition-all duration-300 shadow-lg shadow-azure-500/20"
        >
          <Plus className="w-4 h-4" />
          Rezervasyon Oluştur
        </button>
      </div>

      {/* View Switcher + Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
        {/* View mode tabs */}
        <div className="flex items-center bg-white/70 backdrop-blur-sm border border-navy-100/40 rounded-xl p-1">
          {([
            { key: 'daily' as ViewMode, label: 'Günlük' },
            { key: 'weekly' as ViewMode, label: 'Haftalık' },
            { key: 'monthly' as ViewMode, label: 'Aylık' },
          ]).map((v) => (
            <button
              key={v.key}
              onClick={() => setViewMode(v.key)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                viewMode === v.key
                  ? 'bg-azure-500 text-white shadow-md shadow-azure-500/20'
                  : 'text-navy-500 hover:text-navy-700 hover:bg-navy-50/60'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* Date navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-4 py-2.5 text-sm font-medium text-azure-600 bg-azure-50/60 hover:bg-azure-100/60 rounded-xl transition-colors border border-azure-100/40"
          >
            Bugün
          </button>
          <div className="flex items-center bg-white/70 backdrop-blur-sm border border-navy-100/40 rounded-xl">
            <button
              onClick={() => navigate(-1)}
              className="p-2.5 hover:bg-navy-50/60 rounded-l-xl transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-navy-400" />
            </button>
            <span className="px-4 py-2 text-sm font-medium text-navy-700 min-w-[200px] text-center">
              {navLabel}
            </span>
            <button
              onClick={() => navigate(1)}
              className="p-2.5 hover:bg-navy-50/60 rounded-r-xl transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-navy-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Views */}
      {viewMode === 'daily' && renderTimeGrid([currentDate], HOURS_24)}
      {viewMode === 'weekly' && renderTimeGrid(weekDates, WORK_HOURS)}
      {viewMode === 'monthly' && renderMonthView()}

      {/* Reservation Modal (Create / Edit) */}
      {showModal && selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-navy-900/30 backdrop-blur-md" onClick={() => { setShowModal(false); setEditingReservation(null); }} />
          <div className="relative bg-white/95 backdrop-blur-2xl rounded-2xl shadow-elevated border border-navy-100/40 w-full max-w-md p-6 z-10 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-navy-900">
                  {editingReservation ? 'Rezervasyonu Düzenle' : 'Yeni Rezervasyon'}
                </h3>
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
                onClick={() => { setShowModal(false); setEditingReservation(null); }}
                className="p-2.5 hover:bg-navy-50/60 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-navy-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Time selector */}
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-2">
                  <CalendarDays className="w-4 h-4 inline mr-1" />
                  Tarih ve Saat
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={selectedSlot.date.toISOString().split('T')[0]}
                    onChange={(e) => {
                      const newDate = new Date(e.target.value);
                      if (!isNaN(newDate.getTime())) {
                        setSelectedSlot({ ...selectedSlot, date: newDate });
                      }
                    }}
                    className="px-3 py-2.5 bg-white/80 border border-navy-200/50 rounded-xl text-sm text-navy-900 focus:ring-2 focus:ring-azure-500/20 focus:border-azure-500/40 outline-none transition-all"
                  />
                  <select
                    value={selectedSlot.hour}
                    onChange={(e) =>
                      setSelectedSlot({ ...selectedSlot, hour: parseInt(e.target.value) })
                    }
                    className="px-3 py-2.5 bg-white/80 border border-navy-200/50 rounded-xl text-sm text-navy-900 focus:ring-2 focus:ring-azure-500/20 focus:border-azure-500/40 outline-none transition-all"
                  >
                    {HOURS_24.map((h) => (
                      <option key={h} value={h}>
                        {h.toString().padStart(2, '0')}:00
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
                {editingReservation && (
                  <button
                    type="button"
                    onClick={() => {
                      handleCancel(editingReservation.id);
                      setShowModal(false);
                      setEditingReservation(null);
                    }}
                    className="px-4 py-3 border border-red-200/50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50/60 transition-all duration-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingReservation(null); }}
                  className="flex-1 px-4 py-3 border border-navy-200/50 text-navy-600 rounded-xl text-sm font-medium hover:bg-navy-50/60 transition-all duration-200"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-azure-500 to-azure-600 text-white rounded-xl text-sm font-semibold hover:from-azure-600 hover:to-azure-700 disabled:opacity-60 transition-all duration-300 shadow-lg shadow-azure-500/20"
                >
                  {submitting
                    ? (editingReservation ? 'Güncelleniyor...' : 'Oluşturuluyor...')
                    : (editingReservation ? 'Güncelle' : 'Rezerve Et')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
