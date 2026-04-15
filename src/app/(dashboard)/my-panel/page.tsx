'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useCallback } from 'react';
import {
  LayoutDashboard, Clock, AlertTriangle, Bell, CheckCircle2, Loader2,
  TrendingDown, Calendar, Play, Plus, Trash2, ChevronLeft, ChevronRight,
  Briefcase, Target, PauseCircle, CircleDot, ArrowUpRight, X
} from 'lucide-react';

interface WorkItem {
  id: number;
  project_code: string;
  project_name: string;
  task_name: string;
  status: string;
  priority: number;
  category: string;
  due_date: string | null;
  created_at: string;
}

interface Alert {
  type: string;
  severity: 'info' | 'warning' | 'urgent';
  message: string;
  icon: string;
}

interface Reminder {
  id: number;
  user_name: string;
  title: string;
  description: string | null;
  remind_at: string;
  color: string;
  is_done: boolean;
  created_at: string;
}

interface DashboardData {
  userName: string;
  currentWeek: number;
  year: number;
  myItems: WorkItem[];
  thisWeekHours: number;
  lastWeekHours: number;
  statusSummary: {
    devamEdiyor: number;
    baslanmadi: number;
    dataBekleniyor: number;
    tamamlandi: number;
  };
  alerts: Alert[];
  reminders: Reminder[];
}

const statusConfig: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
  'Devam Ediyor': { color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-500/20', icon: <Play className="w-3.5 h-3.5" /> },
  'Data Bekleniyor': { color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-500/20', icon: <PauseCircle className="w-3.5 h-3.5" /> },
  'Baslanmadi': { color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-500/20', icon: <CircleDot className="w-3.5 h-3.5" /> },
  'Tamamlandi': { color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-500/20', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
};

const alertIconMap: Record<string, React.ReactNode> = {
  'clock': <Clock className="w-5 h-5" />,
  'trending-down': <TrendingDown className="w-5 h-5" />,
  'alert-triangle': <AlertTriangle className="w-5 h-5" />,
  'calendar': <Calendar className="w-5 h-5" />,
  'play': <Play className="w-5 h-5" />,
  'bell': <Bell className="w-5 h-5" />,
};

const severityStyles = {
  urgent: 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 text-red-800 dark:text-red-300',
  warning: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300',
  info: 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 text-blue-800 dark:text-blue-300',
};

const reminderColors = [
  { value: 'blue', label: 'Mavi', bg: 'bg-blue-500' },
  { value: 'green', label: 'Yesil', bg: 'bg-emerald-500' },
  { value: 'amber', label: 'Sari', bg: 'bg-amber-500' },
  { value: 'red', label: 'Kirmizi', bg: 'bg-red-500' },
  { value: 'purple', label: 'Mor', bg: 'bg-purple-500' },
  { value: 'pink', label: 'Pembe', bg: 'bg-pink-500' },
];

const reminderColorStyles: Record<string, { bg: string; border: string; dot: string }> = {
  blue: { bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-200 dark:border-blue-500/30', dot: 'bg-blue-500' },
  green: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/30', dot: 'bg-emerald-500' },
  amber: { bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/30', dot: 'bg-amber-500' },
  red: { bg: 'bg-red-50 dark:bg-red-500/10', border: 'border-red-200 dark:border-red-500/30', dot: 'bg-red-500' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-500/10', border: 'border-purple-200 dark:border-purple-500/30', dot: 'bg-purple-500' },
  pink: { bg: 'bg-pink-50 dark:bg-pink-500/10', border: 'border-pink-200 dark:border-pink-500/30', dot: 'bg-pink-500' },
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Monday = 0
}

const monthNames = ['Ocak', 'Subat', 'Mart', 'Nisan', 'Mayis', 'Haziran', 'Temmuz', 'Agustos', 'Eylul', 'Ekim', 'Kasim', 'Aralik'];
const dayNames = ['Pzt', 'Sal', 'Car', 'Per', 'Cum', 'Cmt', 'Paz'];

export default function MyPanelPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'reminders' | 'calendar'>('overview');

  // Reminder form
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderDesc, setReminderDesc] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [reminderColor, setReminderColor] = useState('blue');
  const [saving, setSaving] = useState(false);

  // Calendar state
  const now = new Date();
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [calYear, setCalYear] = useState(now.getFullYear());

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/my-dashboard');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error('Dashboard fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleCreateReminder = async () => {
    if (!reminderTitle.trim() || !reminderDate) return;
    setSaving(true);
    try {
      const res = await fetch('/api/my-dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createReminder',
          title: reminderTitle.trim(),
          description: reminderDesc.trim() || null,
          remind_at: new Date(reminderDate).toISOString(),
          color: reminderColor,
        }),
      });
      if (res.ok) {
        setReminderTitle('');
        setReminderDesc('');
        setReminderDate('');
        setReminderColor('blue');
        setShowReminderForm(false);
        fetchData();
      }
    } catch (e) {
      console.error('Create reminder error:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteReminder = async (id: number) => {
    try {
      await fetch('/api/my-dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'completeReminder', id }),
      });
      fetchData();
    } catch (e) {
      console.error('Complete reminder error:', e);
    }
  };

  const handleDeleteReminder = async (id: number) => {
    try {
      await fetch('/api/my-dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deleteReminder', id }),
      });
      fetchData();
    } catch (e) {
      console.error('Delete reminder error:', e);
    }
  };

  // Calendar: items with due dates in the selected month
  const dueDatesInMonth = (data?.myItems || []).filter(item => {
    if (!item.due_date) return false;
    const d = new Date(item.due_date);
    return d.getMonth() === calMonth && d.getFullYear() === calYear;
  });

  const reminderDatesInMonth = (data?.reminders || []).filter(r => {
    const d = new Date(r.remind_at);
    return d.getMonth() === calMonth && d.getFullYear() === calYear;
  });

  // Map day -> events
  const dayEvents: Record<number, { type: 'task' | 'reminder'; label: string; color: string }[]> = {};
  dueDatesInMonth.forEach(item => {
    const day = new Date(item.due_date!).getDate();
    if (!dayEvents[day]) dayEvents[day] = [];
    dayEvents[day].push({ type: 'task', label: item.task_name, color: 'blue' });
  });
  reminderDatesInMonth.forEach(r => {
    const day = new Date(r.remind_at).getDate();
    if (!dayEvents[day]) dayEvents[day] = [];
    dayEvents[day].push({ type: 'reminder', label: r.title, color: r.color });
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-navy-500 dark:text-navy-300">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-lg">Yukleniyor...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">Veri yuklenemedi</p>
      </div>
    );
  }

  const totalItems = data.statusSummary.devamEdiyor + data.statusSummary.baslanmadi + data.statusSummary.dataBekleniyor + data.statusSummary.tamamlandi;
  const completionRate = totalItems > 0 ? Math.round((data.statusSummary.tamamlandi / totalItems) * 100) : 0;
  const urgentAlerts = data.alerts.filter(a => a.severity === 'urgent').length;
  const warningAlerts = data.alerts.filter(a => a.severity === 'warning').length;

  const tabs = [
    { key: 'overview' as const, label: 'Genel Bakis', icon: <LayoutDashboard className="w-4 h-4" /> },
    { key: 'tasks' as const, label: 'Islerim', icon: <Briefcase className="w-4 h-4" /> },
    { key: 'reminders' as const, label: 'Hatirlaticilar', icon: <Bell className="w-4 h-4" /> },
    { key: 'calendar' as const, label: 'Takvim', icon: <Calendar className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
            <LayoutDashboard className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-navy-900 dark:text-white">
              Merhaba, {data.userName.split(' ')[0]}
            </h1>
            <p className="text-sm text-navy-500 dark:text-navy-400">
              {data.year} - Hafta {data.currentWeek}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 bg-white/60 dark:bg-navy-900/60 backdrop-blur-xl rounded-xl p-1 border border-white/20 dark:border-navy-700/30 w-fit">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 shadow-sm'
                : 'text-navy-500 dark:text-navy-400 hover:text-navy-700 dark:hover:text-navy-200 hover:bg-gray-50 dark:hover:bg-navy-800/50'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* === OVERVIEW TAB === */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* This Week Hours */}
            <div className="bg-white/70 dark:bg-navy-900/70 backdrop-blur-xl rounded-2xl p-5 border border-white/20 dark:border-navy-700/30 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                {data.lastWeekHours > 0 && (
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    data.thisWeekHours >= data.lastWeekHours
                      ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                      : 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400'
                  }`}>
                    {data.thisWeekHours >= data.lastWeekHours ? '+' : ''}{data.thisWeekHours - data.lastWeekHours}h
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-navy-900 dark:text-white">{data.thisWeekHours}h</p>
              <p className="text-xs text-navy-500 dark:text-navy-400 mt-1">Bu Hafta Saat</p>
            </div>

            {/* Active Tasks */}
            <div className="bg-white/70 dark:bg-navy-900/70 backdrop-blur-xl rounded-2xl p-5 border border-white/20 dark:border-navy-700/30 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold text-navy-900 dark:text-white">{data.statusSummary.devamEdiyor}</p>
              <p className="text-xs text-navy-500 dark:text-navy-400 mt-1">Aktif Is</p>
            </div>

            {/* Completion Rate */}
            <div className="bg-white/70 dark:bg-navy-900/70 backdrop-blur-xl rounded-2xl p-5 border border-white/20 dark:border-navy-700/30 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold text-navy-900 dark:text-white">%{completionRate}</p>
              <p className="text-xs text-navy-500 dark:text-navy-400 mt-1">Tamamlanma</p>
            </div>

            {/* Alerts */}
            <div className="bg-white/70 dark:bg-navy-900/70 backdrop-blur-xl rounded-2xl p-5 border border-white/20 dark:border-navy-700/30 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  urgentAlerts > 0
                    ? 'bg-gradient-to-br from-red-500 to-rose-500'
                    : warningAlerts > 0
                      ? 'bg-gradient-to-br from-amber-500 to-orange-500'
                      : 'bg-gradient-to-br from-gray-400 to-gray-500'
                }`}>
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold text-navy-900 dark:text-white">{data.alerts.length}</p>
              <p className="text-xs text-navy-500 dark:text-navy-400 mt-1">Uyari</p>
            </div>
          </div>

          {/* Alerts Section */}
          {data.alerts.length > 0 && (
            <div className="bg-white/70 dark:bg-navy-900/70 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-navy-700/30 shadow-lg">
              <h2 className="text-lg font-semibold text-navy-900 dark:text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Akilli Uyarilar
              </h2>
              <div className="space-y-3">
                {data.alerts.map((alert, i) => (
                  <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${severityStyles[alert.severity]}`}>
                    <div className="mt-0.5 flex-shrink-0">
                      {alertIconMap[alert.icon] || <Bell className="w-5 h-5" />}
                    </div>
                    <p className="text-sm font-medium">{alert.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status Distribution */}
          <div className="bg-white/70 dark:bg-navy-900/70 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-navy-700/30 shadow-lg">
            <h2 className="text-lg font-semibold text-navy-900 dark:text-white mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-violet-500" />
              Is Durumu Dagilimi
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20">
                <Play className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{data.statusSummary.devamEdiyor}</p>
                  <p className="text-xs text-blue-600/80 dark:text-blue-400/80">Devam Ediyor</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                <PauseCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <div>
                  <p className="text-xl font-bold text-amber-700 dark:text-amber-300">{data.statusSummary.dataBekleniyor}</p>
                  <p className="text-xs text-amber-600/80 dark:text-amber-400/80">Data Bekleniyor</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-500/10 border border-gray-200 dark:border-gray-500/20">
                <CircleDot className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <div>
                  <p className="text-xl font-bold text-gray-700 dark:text-gray-300">{data.statusSummary.baslanmadi}</p>
                  <p className="text-xs text-gray-600/80 dark:text-gray-400/80">Baslanmadi</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{data.statusSummary.tamamlandi}</p>
                  <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80">Tamamlandi</p>
                </div>
              </div>
            </div>
            {/* Progress Bar */}
            {totalItems > 0 && (
              <div className="mt-4">
                <div className="h-3 bg-gray-100 dark:bg-navy-800 rounded-full overflow-hidden flex">
                  <div className="bg-blue-500 h-full transition-all" style={{ width: `${(data.statusSummary.devamEdiyor / totalItems) * 100}%` }} />
                  <div className="bg-amber-500 h-full transition-all" style={{ width: `${(data.statusSummary.dataBekleniyor / totalItems) * 100}%` }} />
                  <div className="bg-gray-400 h-full transition-all" style={{ width: `${(data.statusSummary.baslanmadi / totalItems) * 100}%` }} />
                  <div className="bg-emerald-500 h-full transition-all" style={{ width: `${(data.statusSummary.tamamlandi / totalItems) * 100}%` }} />
                </div>
              </div>
            )}
          </div>

          {/* Upcoming Reminders (quick peek) */}
          {data.reminders.length > 0 && (
            <div className="bg-white/70 dark:bg-navy-900/70 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-navy-700/30 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-navy-900 dark:text-white flex items-center gap-2">
                  <Bell className="w-5 h-5 text-violet-500" />
                  Yaklasan Hatirlaticilar
                </h2>
                <button onClick={() => setActiveTab('reminders')} className="text-sm text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1">
                  Tumunu Gor <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-2">
                {data.reminders.slice(0, 3).map(r => {
                  const cs = reminderColorStyles[r.color] || reminderColorStyles.blue;
                  return (
                    <div key={r.id} className={`flex items-center gap-3 p-3 rounded-xl border ${cs.bg} ${cs.border}`}>
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${cs.dot}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-navy-900 dark:text-white truncate">{r.title}</p>
                        <p className="text-xs text-navy-500 dark:text-navy-400">
                          {new Date(r.remind_at).toLocaleDateString('tr-TR')} {new Date(r.remind_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* === TASKS TAB === */}
      {activeTab === 'tasks' && (
        <div className="bg-white/70 dark:bg-navy-900/70 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-navy-700/30 shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-navy-700/50">
            <h2 className="text-lg font-semibold text-navy-900 dark:text-white flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-violet-500" />
              Is Kalemlerim ({data.myItems.length})
            </h2>
          </div>
          {data.myItems.length === 0 ? (
            <div className="p-12 text-center text-navy-400 dark:text-navy-500">
              <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Henuz atanmis isin yok</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-navy-700/50">
              {data.myItems.map(item => {
                const sc = statusConfig[item.status] || statusConfig['Baslanmadi'];
                const isDue = item.due_date && new Date(item.due_date) < new Date() && item.status !== 'Tamamlandi';
                return (
                  <div key={item.id} className="p-4 hover:bg-gray-50/50 dark:hover:bg-navy-800/30 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${sc.bg} ${sc.color}`}>
                            {sc.icon}
                            {item.status}
                          </span>
                          {item.priority > 0 && (
                            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                              P{item.priority}
                            </span>
                          )}
                          {isDue && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400">
                              <AlertTriangle className="w-3 h-3" />
                              Gecikti
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-navy-900 dark:text-white">{item.task_name}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-navy-500 dark:text-navy-400">
                          <span>{item.project_code}</span>
                          {item.category && <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-navy-800 rounded">{item.category}</span>}
                          {item.due_date && (
                            <span className={`flex items-center gap-1 ${isDue ? 'text-red-600 dark:text-red-400 font-medium' : ''}`}>
                              <Calendar className="w-3 h-3" />
                              {new Date(item.due_date).toLocaleDateString('tr-TR')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* === REMINDERS TAB === */}
      {activeTab === 'reminders' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-navy-900 dark:text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-violet-500" />
              Hatirlaticilarim
            </h2>
            <button
              onClick={() => setShowReminderForm(!showReminderForm)}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-violet-500/20 transition-all"
            >
              {showReminderForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showReminderForm ? 'Kapat' : 'Yeni Hatirlatici'}
            </button>
          </div>

          {/* New Reminder Form */}
          {showReminderForm && (
            <div className="bg-white/70 dark:bg-navy-900/70 backdrop-blur-xl rounded-2xl p-6 border border-violet-200 dark:border-violet-500/30 shadow-lg">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">Baslik</label>
                  <input
                    type="text"
                    value={reminderTitle}
                    onChange={e => setReminderTitle(e.target.value)}
                    placeholder="Hatirlatici basligi..."
                    className="w-full px-4 py-2.5 bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-600 rounded-xl text-sm text-navy-900 dark:text-white placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                    maxLength={200}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">Aciklama (Opsiyonel)</label>
                  <textarea
                    value={reminderDesc}
                    onChange={e => setReminderDesc(e.target.value)}
                    placeholder="Detaylar..."
                    rows={2}
                    className="w-full px-4 py-2.5 bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-600 rounded-xl text-sm text-navy-900 dark:text-white placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40 resize-none"
                    maxLength={500}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">Tarih & Saat</label>
                    <input
                      type="datetime-local"
                      value={reminderDate}
                      onChange={e => setReminderDate(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-600 rounded-xl text-sm text-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">Renk</label>
                    <div className="flex items-center gap-2 mt-2">
                      {reminderColors.map(c => (
                        <button
                          key={c.value}
                          onClick={() => setReminderColor(c.value)}
                          className={`w-7 h-7 rounded-full ${c.bg} transition-all ${
                            reminderColor === c.value ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-navy-900 ring-violet-500 scale-110' : 'hover:scale-105'
                          }`}
                          title={c.label}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleCreateReminder}
                    disabled={saving || !reminderTitle.trim() || !reminderDate}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-violet-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Olustur
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Reminder List */}
          {data.reminders.length === 0 && !showReminderForm ? (
            <div className="bg-white/70 dark:bg-navy-900/70 backdrop-blur-xl rounded-2xl p-12 border border-white/20 dark:border-navy-700/30 shadow-lg text-center">
              <Bell className="w-12 h-12 mx-auto mb-3 text-navy-300 dark:text-navy-600 opacity-30" />
              <p className="text-navy-400 dark:text-navy-500">Henuz hatirlatici yok</p>
              <button
                onClick={() => setShowReminderForm(true)}
                className="mt-3 text-sm text-violet-600 dark:text-violet-400 hover:underline"
              >
                Ilk hatirlaticini olustur
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {data.reminders.map(r => {
                const cs = reminderColorStyles[r.color] || reminderColorStyles.blue;
                const isUpcoming = new Date(r.remind_at).getTime() - Date.now() < 86400000 && new Date(r.remind_at).getTime() > Date.now();
                const isPast = new Date(r.remind_at).getTime() < Date.now();
                return (
                  <div key={r.id} className={`${cs.bg} border ${cs.border} rounded-2xl p-4 transition-all ${isPast ? 'opacity-70' : ''}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${cs.dot} ${isUpcoming ? 'animate-pulse' : ''}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-navy-900 dark:text-white">{r.title}</p>
                        {r.description && (
                          <p className="text-xs text-navy-500 dark:text-navy-400 mt-0.5">{r.description}</p>
                        )}
                        <p className={`text-xs mt-1 ${isPast ? 'text-red-600 dark:text-red-400 font-medium' : 'text-navy-500 dark:text-navy-400'}`}>
                          {isPast ? 'Suresi gecti - ' : ''}
                          {new Date(r.remind_at).toLocaleDateString('tr-TR')} {new Date(r.remind_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleCompleteReminder(r.id)}
                          className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
                          title="Tamamla"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteReminder(r.id)}
                          className="p-1.5 rounded-lg text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* === CALENDAR TAB === */}
      {activeTab === 'calendar' && (
        <div className="bg-white/70 dark:bg-navy-900/70 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-navy-700/30 shadow-lg overflow-hidden">
          {/* Calendar Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-navy-700/50">
            <button
              onClick={() => {
                if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); }
                else setCalMonth(calMonth - 1);
              }}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-800 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-navy-600 dark:text-navy-300" />
            </button>
            <h2 className="text-lg font-semibold text-navy-900 dark:text-white">
              {monthNames[calMonth]} {calYear}
            </h2>
            <button
              onClick={() => {
                if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); }
                else setCalMonth(calMonth + 1);
              }}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-800 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-navy-600 dark:text-navy-300" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="p-4">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map(d => (
                <div key={d} className="text-center text-xs font-medium text-navy-400 dark:text-navy-500 py-2">{d}</div>
              ))}
            </div>
            {/* Day cells */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for first day offset */}
              {Array.from({ length: getFirstDayOfMonth(calYear, calMonth) }).map((_, i) => (
                <div key={`empty-${i}`} className="h-20" />
              ))}
              {/* Actual days */}
              {Array.from({ length: getDaysInMonth(calYear, calMonth) }).map((_, i) => {
                const day = i + 1;
                const isToday = day === now.getDate() && calMonth === now.getMonth() && calYear === now.getFullYear();
                const events = dayEvents[day] || [];
                return (
                  <div
                    key={day}
                    className={`h-20 p-1.5 rounded-xl border transition-colors ${
                      isToday
                        ? 'bg-violet-50 dark:bg-violet-500/10 border-violet-300 dark:border-violet-500/30'
                        : events.length > 0
                          ? 'bg-gray-50/50 dark:bg-navy-800/30 border-gray-200 dark:border-navy-700/30'
                          : 'border-transparent hover:bg-gray-50 dark:hover:bg-navy-800/20'
                    }`}
                  >
                    <span className={`text-xs font-medium ${
                      isToday ? 'text-violet-700 dark:text-violet-300' : 'text-navy-600 dark:text-navy-400'
                    }`}>
                      {day}
                    </span>
                    <div className="mt-0.5 space-y-0.5 overflow-hidden">
                      {events.slice(0, 2).map((ev, j) => (
                        <div key={j} className="flex items-center gap-1">
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                            ev.type === 'task' ? 'bg-blue-500' : (reminderColorStyles[ev.color]?.dot || 'bg-violet-500')
                          }`} />
                          <span className="text-[10px] text-navy-600 dark:text-navy-400 truncate">{ev.label}</span>
                        </div>
                      ))}
                      {events.length > 2 && (
                        <span className="text-[10px] text-navy-400 dark:text-navy-500">+{events.length - 2} daha</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="p-4 border-t border-gray-100 dark:border-navy-700/50 flex items-center gap-4 text-xs text-navy-500 dark:text-navy-400">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span>Teslim Tarihi</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-violet-500" />
              <span>Hatirlatici</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}