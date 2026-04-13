'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useMemo, useRef } from 'react';
import {
  Users, ChevronLeft, ChevronRight, Filter, BarChart3,
  Calendar, Briefcase, Activity, Zap, Target, Clock,
  Award, TrendingUp, X, Check, Loader2,
} from 'lucide-react';

// ===================== TYPES =====================
interface WorkforceTask {
  rowIndex: number;
  number: string;
  name: string;
  type: string;
  ekip: string;
  sorumlu: string;
  caeResp: string;
  project: string;
  status: string;
  phase3: string;
  cadReady: string;
  weeks: Record<number, number>;
}

interface PersonSummary {
  name: string;
  tasks: number;
  projects: string[];
  totalWeekAllocations: number;
  weeklyLoad: Record<number, number>;
}

interface WeekInfo {
  week: number;
  monday: Date;
  month: number;
  isCurrent: boolean;
}

// ===================== CONSTANTS =====================
const MONTHS_TR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const MONTHS_SHORT = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

const MONTH_HEADER_COLORS = [
  'bg-blue-600', 'bg-cyan-600', 'bg-teal-600', 'bg-emerald-600',
  'bg-green-600', 'bg-lime-600', 'bg-yellow-600', 'bg-amber-600',
  'bg-orange-600', 'bg-rose-600', 'bg-pink-600', 'bg-purple-600',
];

const MONTH_CELL_COLORS = [
  'bg-blue-50/60 dark:bg-blue-950/20', 'bg-cyan-50/60 dark:bg-cyan-950/20',
  'bg-teal-50/60 dark:bg-teal-950/20', 'bg-emerald-50/60 dark:bg-emerald-950/20',
  'bg-green-50/60 dark:bg-green-950/20', 'bg-lime-50/60 dark:bg-lime-950/20',
  'bg-yellow-50/60 dark:bg-yellow-950/20', 'bg-amber-50/60 dark:bg-amber-950/20',
  'bg-orange-50/60 dark:bg-orange-950/20', 'bg-rose-50/60 dark:bg-rose-950/20',
  'bg-pink-50/60 dark:bg-pink-950/20', 'bg-purple-50/60 dark:bg-purple-950/20',
];

const PROJECT_COLORS: Record<string, string> = {
  'NGC Maraton': 'bg-blue-500',
  'Aveneu Neo': 'bg-emerald-500',
  '12m Upgrade': 'bg-amber-500',
  'MD9 LHD WCL': 'bg-purple-500',
  'TS45 X10': 'bg-rose-500',
  'TS35 X10': 'bg-cyan-500',
  'TS30 X10': 'bg-teal-500',
  'CITY ONE': 'bg-orange-500',
  'NGC HD': 'bg-indigo-500',
  'NGC HD RHD': 'bg-violet-500',
  'NGC RD': 'bg-fuchsia-500',
  'NGC RD RHD': 'bg-pink-500',
  'EURO 7': 'bg-red-500',
  'A1327 LFP Batarya': 'bg-lime-500',
  'A1327 LFP': 'bg-green-500',
};

const PROJECT_DOT_COLORS: Record<string, string> = {
  'NGC Maraton': '#3B82F6',
  'Aveneu Neo': '#10B981',
  '12m Upgrade': '#F59E0B',
  'MD9 LHD WCL': '#8B5CF6',
  'TS45 X10': '#F43F5E',
  'TS35 X10': '#06B6D4',
  'TS30 X10': '#14B8A6',
  'CITY ONE': '#F97316',
  'NGC HD': '#6366F1',
  'NGC HD RHD': '#7C3AED',
  'NGC RD': '#D946EF',
  'NGC RD RHD': '#EC4899',
  'EURO 7': '#EF4444',
  'A1327 LFP Batarya': '#84CC16',
  'A1327 LFP': '#22C55E',
};

const PERSON_COLORS = [
  'from-blue-400 to-blue-600',
  'from-emerald-400 to-emerald-600',
  'from-purple-400 to-purple-600',
  'from-amber-400 to-amber-600',
  'from-rose-400 to-rose-600',
  'from-cyan-400 to-cyan-600',
  'from-indigo-400 to-indigo-600',
  'from-orange-400 to-orange-600',
];

// ===================== WEEK HELPERS =====================
function getWeeksForYear(year: number): WeekInfo[] {
  const result: WeekInfo[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const jan4 = new Date(year, 0, 4);
  const dow = jan4.getDay() || 7;
  const w1Mon = new Date(year, 0, 4 - dow + 1);

  for (let i = 0; i < 53; i++) {
    const monday = new Date(w1Mon);
    monday.setDate(w1Mon.getDate() + i * 7);
    const thursday = new Date(monday);
    thursday.setDate(monday.getDate() + 3);
    if (thursday.getFullYear() > year) break;

    const nextMon = new Date(monday);
    nextMon.setDate(monday.getDate() + 7);
    const isCurrent = today >= monday && today < nextMon;

    result.push({ week: i + 1, monday, month: thursday.getMonth(), isCurrent });
  }
  return result;
}

function groupWeeksByMonth(weeks: WeekInfo[]) {
  const groups: { month: number; name: string; weeks: WeekInfo[] }[] = [];
  let currentMonth = -1;
  for (const w of weeks) {
    if (w.month !== currentMonth) {
      currentMonth = w.month;
      groups.push({ month: w.month, name: MONTHS_TR[w.month], weeks: [] });
    }
    groups[groups.length - 1].weeks.push(w);
  }
  return groups;
}

// ===================== PAGE COMPONENT =====================
export default function WorkforcePage() {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState<WorkforceTask[]>([]);
  const [people, setPeople] = useState<PersonSummary[]>([]);
  const [projects, setProjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [year] = useState(2026);
  const [viewMode, setViewMode] = useState<'person' | 'project' | 'gantt'>('person');
  const [filterPerson, setFilterPerson] = useState('all');
  const [filterProject, setFilterProject] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // Cell popup for person/project view: { rowName, week, x, y }
  const [cellPopup, setCellPopup] = useState<{ rowName: string; week: number; x: number; y: number } | null>(null);

  const currentWeekRef = useRef<HTMLTableCellElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const weeks = useMemo(() => getWeeksForYear(year), [year]);
  const monthGroups = useMemo(() => groupWeeksByMonth(weeks), [weeks]);

  const analysisTypes = useMemo(() => {
    const types = Array.from(new Set(tasks.map(t => t.type).filter(Boolean)));
    return types.sort();
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (filterPerson !== 'all' && t.caeResp !== filterPerson) return false;
      if (filterProject !== 'all' && t.project !== filterProject) return false;
      if (filterType !== 'all' && t.type !== filterType) return false;
      return true;
    });
  }, [tasks, filterPerson, filterProject, filterType]);

  // Per-person week load from filtered tasks
  const personWeekLoad = useMemo(() => {
    const map: Record<string, Record<number, { count: number; tasks: WorkforceTask[] }>> = {};
    for (const task of filteredTasks) {
      const p = task.caeResp;
      if (!map[p]) map[p] = {};
      for (const [wk, val] of Object.entries(task.weeks)) {
        const w = parseInt(wk);
        if (!map[p][w]) map[p][w] = { count: 0, tasks: [] };
        map[p][w].count += val;
        map[p][w].tasks.push(task);
      }
    }
    return map;
  }, [filteredTasks]);

  // Per-project week load
  const projectWeekLoad = useMemo(() => {
    const map: Record<string, Record<number, { count: number; tasks: WorkforceTask[] }>> = {};
    for (const task of filteredTasks) {
      const prj = task.project;
      if (!map[prj]) map[prj] = {};
      for (const [wk, val] of Object.entries(task.weeks)) {
        const w = parseInt(wk);
        if (!map[prj][w]) map[prj][w] = { count: 0, tasks: [] };
        map[prj][w].count += val;
        map[prj][w].tasks.push(task);
      }
    }
    return map;
  }, [filteredTasks]);

  // Total week load
  const weekTotalLoad = useMemo(() => {
    const totals: Record<number, number> = {};
    for (const task of filteredTasks) {
      for (const [wk, val] of Object.entries(task.weeks)) {
        const w = parseInt(wk);
        totals[w] = (totals[w] || 0) + val;
      }
    }
    return totals;
  }, [filteredTasks]);

  useEffect(() => {
    fetch('/api/workforce')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setTasks(data.tasks);
          setPeople(data.people);
          setProjects(data.projects);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading && currentWeekRef.current) {
      currentWeekRef.current.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'center' });
    }
  }, [loading, viewMode]);

  function scrollToCurrentWeek() {
    if (currentWeekRef.current) {
      currentWeekRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }

  // Close popup on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setCellPopup(null);
      }
    }
    if (cellPopup) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [cellPopup]);

  // Toggle a single task/week allocation and save to Excel
  async function toggleTaskWeek(task: WorkforceTask, week: number) {
    const hasWork = task.weeks[week];
    const newValue = hasWork ? 0 : 1;

    // Optimistic update
    setTasks(prev => prev.map(t => {
      if (t.rowIndex !== task.rowIndex) return t;
      const newWeeks = { ...t.weeks };
      if (newValue > 0) {
        newWeeks[week] = newValue;
      } else {
        delete newWeeks[week];
      }
      return { ...t, weeks: newWeeks };
    }));

    setSaving(true);
    try {
      const res = await fetch('/api/workforce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: [{ rowIndex: task.rowIndex, week, value: newValue }] }),
      });
      if (!res.ok) throw new Error('Save failed');
      const data = await res.json();
      setTasks(data.tasks);
      setPeople(data.people);
      setProjects(data.projects);
    } catch {
      // Revert on error — refetch
      fetch('/api/workforce').then(r => r.json()).then(data => {
        setTasks(data.tasks);
        setPeople(data.people);
        setProjects(data.projects);
      }).catch(() => {});
    } finally {
      setSaving(false);
    }
  }

  // Open cell popup for person/project views
  function handleCellPopup(e: React.MouseEvent, rowName: string, week: number) {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setCellPopup({ rowName, week, x: rect.left, y: rect.bottom + 4 });
  }

  // Get tasks for a specific person/project and week
  function getPopupTasks(): WorkforceTask[] {
    if (!cellPopup) return [];
    if (viewMode === 'person') {
      return filteredTasks.filter(t => t.caeResp === cellPopup.rowName);
    }
    return filteredTasks.filter(t => t.project === cellPopup.rowName);
  }

  // Get heat color for load
  function getLoadColor(load: number): string {
    if (load === 0) return '';
    if (load === 1) return 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300';
    if (load === 2) return 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-300';
    if (load === 3) return 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300';
    return 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300';
  }

  function getLoadBg(load: number): string {
    if (load === 0) return '';
    if (load === 1) return 'bg-emerald-400';
    if (load === 2) return 'bg-yellow-400';
    if (load === 3) return 'bg-orange-400';
    return 'bg-red-500';
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 border-4 border-azure-200 rounded-full" />
            <div className="absolute inset-0 border-4 border-azure-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-navy-400 dark:text-navy-300 text-sm font-medium">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  const currentWeekNum = weeks.find(w => w.isCurrent)?.week || 0;
  const sortedPeople = [...people].sort((a, b) => b.tasks - a.tasks);
  const displayRows = viewMode === 'person'
    ? sortedPeople.map(p => p.name)
    : viewMode === 'project'
      ? projects
      : sortedPeople.map(p => p.name);

  const rowWeekData = viewMode === 'person' ? personWeekLoad : projectWeekLoad;

  return (
    <div className="max-w-full mx-auto animate-fade-in py-3 px-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-azure-500" />
            Analiz İş Gücü Planı
          </h1>
          <p className="text-navy-400 dark:text-navy-300 text-xs mt-0.5">
            CAE Departmanı — {year} Yıllık İş Gücü Dağılımı
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View mode */}
          <div className="flex bg-gray-100 dark:bg-navy-800 rounded-xl p-0.5">
            {(['person', 'project', 'gantt'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === mode
                    ? 'bg-white dark:bg-navy-700 text-azure-600 dark:text-azure-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                }`}
              >
                {mode === 'person' ? 'Kişi Bazlı' : mode === 'project' ? 'Proje Bazlı' : 'Gantt'}
              </button>
            ))}
          </div>

          <button
            onClick={scrollToCurrentWeek}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-azure-50 dark:bg-azure-500/10 text-azure-600 dark:text-azure-400 rounded-xl text-xs font-bold hover:bg-azure-100 dark:hover:bg-azure-500/20 transition-colors"
          >
            <Calendar className="w-3.5 h-3.5" />
            Bu Hafta
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 mb-3">
        <div className="bg-white dark:bg-navy-900 rounded-2xl p-3 border border-gray-100 dark:border-navy-800 shadow-sm">
          <div className="flex items-center gap-1.5 mb-1"><Users className="w-3.5 h-3.5 text-blue-500" /><span className="text-[10px] font-bold text-blue-500">Toplam Kişi</span></div>
          <div className="text-2xl font-extrabold text-blue-700 dark:text-blue-300">{people.length}</div>
        </div>
        <div className="bg-white dark:bg-navy-900 rounded-2xl p-3 border border-gray-100 dark:border-navy-800 shadow-sm">
          <div className="flex items-center gap-1.5 mb-1"><Briefcase className="w-3.5 h-3.5 text-purple-500" /><span className="text-[10px] font-bold text-purple-500">Toplam Analiz</span></div>
          <div className="text-2xl font-extrabold text-purple-700 dark:text-purple-300">{tasks.length}</div>
        </div>
        <div className="bg-white dark:bg-navy-900 rounded-2xl p-3 border border-gray-100 dark:border-navy-800 shadow-sm">
          <div className="flex items-center gap-1.5 mb-1"><Target className="w-3.5 h-3.5 text-emerald-500" /><span className="text-[10px] font-bold text-emerald-500">Proje Sayısı</span></div>
          <div className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300">{projects.length}</div>
        </div>
        <div className="bg-white dark:bg-navy-900 rounded-2xl p-3 border border-gray-100 dark:border-navy-800 shadow-sm">
          <div className="flex items-center gap-1.5 mb-1"><Activity className="w-3.5 h-3.5 text-amber-500" /><span className="text-[10px] font-bold text-amber-500">Bu Hafta Yük</span></div>
          <div className="text-2xl font-extrabold text-amber-700 dark:text-amber-300">{weekTotalLoad[currentWeekNum] || 0}</div>
        </div>
        <div className="bg-white dark:bg-navy-900 rounded-2xl p-3 border border-gray-100 dark:border-navy-800 shadow-sm">
          <div className="flex items-center gap-1.5 mb-1"><Zap className="w-3.5 h-3.5 text-rose-500" /><span className="text-[10px] font-bold text-rose-500">Maks Hafta</span></div>
          <div className="text-2xl font-extrabold text-rose-700 dark:text-rose-300">
            {Math.max(...Object.values(weekTotalLoad), 0)}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-sm border border-gray-100 dark:border-navy-800 px-4 py-2.5 mb-3 flex flex-wrap items-center gap-3">
        <Filter className="w-4 h-4 text-gray-400" />
        <select
          value={filterPerson}
          onChange={e => setFilterPerson(e.target.value)}
          className="text-xs bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-lg px-2.5 py-1.5 text-gray-700 dark:text-gray-300 font-medium"
        >
          <option value="all">Tüm Kişiler</option>
          {people.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
        </select>
        <select
          value={filterProject}
          onChange={e => setFilterProject(e.target.value)}
          className="text-xs bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-lg px-2.5 py-1.5 text-gray-700 dark:text-gray-300 font-medium"
        >
          <option value="all">Tüm Projeler</option>
          {projects.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="text-xs bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-lg px-2.5 py-1.5 text-gray-700 dark:text-gray-300 font-medium"
        >
          <option value="all">Tüm Tipler</option>
          {analysisTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        {(filterPerson !== 'all' || filterProject !== 'all' || filterType !== 'all') && (
          <button
            onClick={() => { setFilterPerson('all'); setFilterProject('all'); setFilterType('all'); }}
            className="text-[10px] bg-red-50 dark:bg-red-500/10 text-red-500 px-2 py-1 rounded-lg font-bold hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Temizle
          </button>
        )}
      </div>

      {/* Calendar Grid */}
      {viewMode !== 'gantt' ? (
        <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-lg border border-gray-100 dark:border-navy-800 overflow-hidden mb-4">
          <div ref={scrollContainerRef} className="overflow-x-auto">
            <table className="w-full border-collapse text-[11px]">
              <thead>
                {/* Month header row */}
                <tr>
                  <th className="sticky left-0 z-30 bg-navy-900 dark:bg-navy-950 text-white text-left px-3 py-2 font-bold min-w-[180px] border-b border-navy-700">
                    {viewMode === 'person' ? 'CAE Mühendisi' : 'Proje'}
                  </th>
                  <th className="sticky left-[180px] z-30 bg-navy-900 dark:bg-navy-950 text-white text-center px-1 py-2 font-bold w-[50px] border-b border-navy-700">
                    Toplam
                  </th>
                  {monthGroups.map(mg => (
                    <th
                      key={mg.month}
                      colSpan={mg.weeks.length}
                      className={`${MONTH_HEADER_COLORS[mg.month]} text-white text-center px-1 py-2 font-bold text-[10px] border-b border-white/20`}
                    >
                      {mg.name}
                    </th>
                  ))}
                </tr>

                {/* Week number row */}
                <tr>
                  <th className="sticky left-0 z-30 bg-gray-50 dark:bg-navy-800 border-b border-gray-200 dark:border-navy-700 px-3 py-1.5 text-left">
                    <span className="text-[9px] text-gray-400">Hafta →</span>
                  </th>
                  <th className="sticky left-[180px] z-30 bg-gray-50 dark:bg-navy-800 border-b border-gray-200 dark:border-navy-700 text-center text-[9px] text-gray-400">
                    İş
                  </th>
                  {weeks.map(w => (
                    <th
                      key={w.week}
                      ref={w.isCurrent ? currentWeekRef : undefined}
                      className={`text-center px-0 py-1.5 min-w-[28px] border-b text-[9px] font-medium
                        ${w.isCurrent
                          ? 'bg-azure-100 dark:bg-azure-500/20 text-azure-700 dark:text-azure-300 font-extrabold border-azure-300 dark:border-azure-600'
                          : `${MONTH_CELL_COLORS[w.month]} text-gray-500 dark:text-gray-400 border-gray-200 dark:border-navy-700`
                        }`}
                    >
                      <div>W{w.week}</div>
                      <div className="text-[7px] text-gray-400">{w.monday.getDate()}{MONTHS_SHORT[w.monday.getMonth()].substring(0, 1)}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayRows.map((rowName, idx) => {
                  const weekData = rowWeekData[rowName] || {};
                  const totalTasks = viewMode === 'person'
                    ? (people.find(p => p.name === rowName)?.tasks || 0)
                    : filteredTasks.filter(t => t.project === rowName).length;

                  return (
                    <tr
                      key={rowName}
                      className={`group hover:bg-azure-50/50 dark:hover:bg-azure-500/5 transition-colors
                        ${idx % 2 === 0 ? '' : 'bg-gray-50/50 dark:bg-navy-800/30'}`}
                    >
                      <td className="sticky left-0 z-20 bg-inherit px-3 py-1.5 border-b border-gray-100 dark:border-navy-800">
                        <button
                          onClick={() => setSelectedPerson(selectedPerson === rowName ? null : rowName)}
                          className="flex items-center gap-2 hover:text-azure-600 transition-colors w-full text-left"
                        >
                          <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${PERSON_COLORS[idx % PERSON_COLORS.length]} flex items-center justify-center text-white font-extrabold text-[10px] shadow-sm flex-shrink-0`}>
                            {rowName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 dark:text-white text-[11px]">{rowName}</div>
                            {viewMode === 'person' && (
                              <div className="text-[8px] text-gray-400">
                                {people.find(p => p.name === rowName)?.projects.length || 0} proje
                              </div>
                            )}
                          </div>
                        </button>
                      </td>
                      <td className="sticky left-[180px] z-20 bg-inherit text-center border-b border-gray-100 dark:border-navy-800 font-bold text-azure-600 dark:text-azure-400">
                        {totalTasks}
                      </td>
                      {weeks.map(w => {
                        const wd = weekData[w.week];
                        const load = wd?.count || 0;

                        return (
                          <td
                            key={w.week}
                            className={`text-center border-b border-gray-100 dark:border-navy-800 px-0 py-0 min-w-[28px] relative cursor-pointer
                              ${w.isCurrent ? 'bg-azure-50/70 dark:bg-azure-500/10 border-x border-azure-200 dark:border-azure-700' : ''}
                              ${load === 0 ? 'hover:bg-gray-100 dark:hover:bg-navy-700' : 'hover:opacity-75'}`}
                            title={wd ? `W${w.week}: ${load} analiz — düzenlemek için tıkla` : `W${w.week} — eklemek için tıkla`}
                            onClick={(e) => handleCellPopup(e, rowName, w.week)}
                          >
                            {load > 0 && (
                              <div className={`mx-auto w-full h-full min-h-[24px] flex items-center justify-center ${getLoadColor(load)}`}>
                                <span className="font-bold text-[10px]">{load}</span>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}

                {/* Total Row */}
                <tr className="bg-navy-900 dark:bg-navy-950">
                  <td className="sticky left-0 z-20 bg-navy-900 dark:bg-navy-950 px-3 py-2 border-t-2 border-navy-600 text-white font-bold text-xs">
                    TOPLAM İŞ YÜKÜ
                  </td>
                  <td className="sticky left-[180px] z-20 bg-navy-900 dark:bg-navy-950 text-center border-t-2 border-navy-600 text-white font-extrabold">
                    {filteredTasks.length}
                  </td>
                  {weeks.map(w => {
                    const total = weekTotalLoad[w.week] || 0;
                    return (
                      <td
                        key={w.week}
                        className={`text-center border-t-2 border-navy-600 px-0 py-1 ${w.isCurrent ? 'bg-azure-900' : 'bg-navy-900 dark:bg-navy-950'}`}
                      >
                        {total > 0 && (
                          <span className={`font-extrabold text-[10px] ${total >= 6 ? 'text-red-400' : total >= 4 ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {total}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Gantt View */
        <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-lg border border-gray-100 dark:border-navy-800 overflow-hidden mb-4">
          <div ref={scrollContainerRef} className="overflow-x-auto">
            <table className="w-full border-collapse text-[11px]">
              <thead>
                <tr>
                  <th className="sticky left-0 z-30 bg-navy-900 dark:bg-navy-950 text-white text-left px-3 py-2 font-bold min-w-[250px] border-b border-navy-700">
                    Analiz Adı
                  </th>
                  <th className="sticky left-[250px] z-30 bg-navy-900 dark:bg-navy-950 text-white text-center px-1 py-2 font-bold w-[80px] border-b border-navy-700 text-[9px]">
                    Kişi
                  </th>
                  {monthGroups.map(mg => (
                    <th
                      key={mg.month}
                      colSpan={mg.weeks.length}
                      className={`${MONTH_HEADER_COLORS[mg.month]} text-white text-center px-1 py-2 font-bold text-[10px] border-b border-white/20`}
                    >
                      {mg.name}
                    </th>
                  ))}
                </tr>
                <tr>
                  <th className="sticky left-0 z-30 bg-gray-50 dark:bg-navy-800 border-b border-gray-200 dark:border-navy-700 px-3 py-1 text-left text-[9px] text-gray-400">
                    Proje / Tip
                  </th>
                  <th className="sticky left-[250px] z-30 bg-gray-50 dark:bg-navy-800 border-b border-gray-200 dark:border-navy-700 text-center text-[9px] text-gray-400">
                    Proje
                  </th>
                  {weeks.map(w => (
                    <th
                      key={w.week}
                      ref={w.isCurrent ? currentWeekRef : undefined}
                      className={`text-center px-0 py-1 min-w-[28px] border-b text-[8px] font-medium
                        ${w.isCurrent
                          ? 'bg-azure-100 dark:bg-azure-500/20 text-azure-700 dark:text-azure-300 font-extrabold border-azure-300'
                          : `${MONTH_CELL_COLORS[w.month]} text-gray-500 dark:text-gray-400 border-gray-200 dark:border-navy-700`
                        }`}
                    >
                      W{w.week}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task, idx) => {
                  const projColor = PROJECT_DOT_COLORS[task.project] || '#6B7280';
                  return (
                    <tr
                      key={idx}
                      className={`hover:bg-azure-50/50 dark:hover:bg-azure-500/5 transition-colors ${idx % 2 === 0 ? '' : 'bg-gray-50/50 dark:bg-navy-800/30'}`}
                    >
                      <td className="sticky left-0 z-20 bg-inherit px-3 py-1 border-b border-gray-100 dark:border-navy-800">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: projColor }} />
                          <div>
                            <div className="font-bold text-gray-900 dark:text-white text-[10px] truncate max-w-[200px]">{task.name}</div>
                            <div className="text-[8px] text-gray-400">{task.project} · {task.type || '-'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="sticky left-[250px] z-20 bg-inherit text-center border-b border-gray-100 dark:border-navy-800">
                        <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300">{task.caeResp}</span>
                      </td>
                      {weeks.map(w => {
                        const hasWork = task.weeks[w.week];
                        return (
                          <td
                            key={w.week}
                            className={`text-center border-b border-gray-100 dark:border-navy-800 px-0 py-0 min-w-[28px] cursor-pointer
                              ${w.isCurrent ? 'border-x border-azure-200 dark:border-azure-700' : ''}
                              ${!hasWork ? 'hover:bg-gray-100 dark:hover:bg-navy-700' : 'hover:opacity-60'}`}
                            onClick={() => toggleTaskWeek(task, w.week)}
                            title={hasWork ? `${task.name} - W${w.week} (kaldırmak için tıkla)` : `W${w.week} (eklemek için tıkla)`}
                          >
                            {hasWork ? (
                              <div
                                className="w-full h-[20px] opacity-80 transition-all"
                                style={{ backgroundColor: projColor }}
                                title={`${task.name} - W${w.week}`}
                              />
                            ) : null}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Saving Indicator */}
      {saving && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-azure-600 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-bold animate-fade-in">
          <Loader2 className="w-4 h-4 animate-spin" />
          Kaydediliyor...
        </div>
      )}

      {/* Cell Popup for Person/Project views */}
      {cellPopup && viewMode !== 'gantt' && (() => {
        const popupTasks = getPopupTasks();
        const week = cellPopup.week;
        // Position popup, make sure it doesn't go off screen
        const left = Math.min(cellPopup.x, window.innerWidth - 320);
        const top = Math.min(cellPopup.y, window.innerHeight - 300);

        return (
          <div
            ref={popupRef}
            className="fixed z-50 bg-white dark:bg-navy-900 rounded-xl shadow-2xl border border-gray-200 dark:border-navy-700 w-[300px] max-h-[320px] overflow-hidden animate-fade-in"
            style={{ left: `${left}px`, top: `${top}px` }}
          >
            {/* Popup Header */}
            <div className="flex items-center justify-between px-3 py-2 bg-navy-900 dark:bg-navy-950 text-white rounded-t-xl">
              <div>
                <div className="font-bold text-xs">{cellPopup.rowName}</div>
                <div className="text-[9px] text-gray-300">Hafta {week} — {viewMode === 'person' ? 'Analizler' : 'Görevler'}</div>
              </div>
              <button onClick={() => setCellPopup(null)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Task list with toggles */}
            <div className="overflow-y-auto max-h-[260px] p-2 space-y-1">
              {popupTasks.length === 0 ? (
                <div className="text-center py-4 text-xs text-gray-400">Bu {viewMode === 'person' ? 'kişi' : 'proje'} için analiz bulunamadı</div>
              ) : (
                popupTasks.map((task, i) => {
                  const isActive = !!task.weeks[week];
                  const projColor = PROJECT_DOT_COLORS[task.project] || '#6B7280';
                  return (
                    <button
                      key={i}
                      onClick={() => toggleTaskWeek(task, week)}
                      className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-all ${
                        isActive
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-gray-50 dark:bg-navy-800/50 border border-gray-100 dark:border-navy-700 hover:bg-gray-100 dark:hover:bg-navy-700'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all ${
                        isActive
                          ? 'bg-emerald-500 text-white'
                          : 'bg-gray-200 dark:bg-navy-600'
                      }`}>
                        {isActive && <Check className="w-3 h-3" />}
                      </div>
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: projColor }} />
                      <div className="flex-1 min-w-0">
                        <div className={`font-bold text-[10px] truncate ${isActive ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-700 dark:text-gray-300'}`}>
                          {task.name}
                        </div>
                        <div className="text-[8px] text-gray-400 truncate">{task.project} · {task.caeResp}</div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        );
      })()}

      {/* Person Detail Panel */}
      {selectedPerson && viewMode === 'person' && (
        <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-lg border border-gray-100 dark:border-navy-800 p-5 mb-4 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-azure-400 to-blue-600 flex items-center justify-center text-white font-extrabold text-sm shadow-lg">
                {selectedPerson.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">{selectedPerson}</h3>
                <p className="text-xs text-gray-400">Detaylı iş gücü analizi</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedPerson(null)}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-navy-800 text-gray-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Person Stats */}
          {(() => {
            const personTasks = filteredTasks.filter(t => t.caeResp === selectedPerson);
            const personProjects = Array.from(new Set(personTasks.map(t => t.project)));
            const personTypes = Array.from(new Set(personTasks.map(t => t.type).filter(Boolean)));
            const personWeeks = personWeekLoad[selectedPerson] || {};
            const maxWeekLoad = Math.max(...Object.values(personWeeks).map(w => w.count), 0);
            const overloadedWeeks = Object.values(personWeeks).filter(w => w.count >= 3).length;

            return (
              <>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
                  <div className="bg-blue-50 dark:bg-blue-500/10 rounded-xl p-3 text-center">
                    <div className="text-xl font-extrabold text-blue-700 dark:text-blue-300">{personTasks.length}</div>
                    <div className="text-[9px] font-bold text-blue-500">TOPLAM ANALİZ</div>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-xl p-3 text-center">
                    <div className="text-xl font-extrabold text-emerald-700 dark:text-emerald-300">{personProjects.length}</div>
                    <div className="text-[9px] font-bold text-emerald-500">PROJE</div>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-500/10 rounded-xl p-3 text-center">
                    <div className="text-xl font-extrabold text-purple-700 dark:text-purple-300">{personTypes.length}</div>
                    <div className="text-[9px] font-bold text-purple-500">ANALİZ TİPİ</div>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-500/10 rounded-xl p-3 text-center">
                    <div className="text-xl font-extrabold text-amber-700 dark:text-amber-300">{maxWeekLoad}</div>
                    <div className="text-[9px] font-bold text-amber-500">MAKS HAFTALIK</div>
                  </div>
                  <div className="bg-red-50 dark:bg-red-500/10 rounded-xl p-3 text-center">
                    <div className="text-xl font-extrabold text-red-700 dark:text-red-300">{overloadedWeeks}</div>
                    <div className="text-[9px] font-bold text-red-500">AŞIRI YÜK HAFTA</div>
                  </div>
                </div>

                {/* Weekly Load Sparkline */}
                <div className="mb-5">
                  <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">Haftalık İş Yükü Dağılımı</h4>
                  <div className="flex items-end gap-[2px] h-16">
                    {weeks.map(w => {
                      const load = personWeeks[w.week]?.count || 0;
                      const maxH = Math.max(maxWeekLoad, 1);
                      const height = load > 0 ? Math.max(4, (load / maxH) * 56) : 0;
                      return (
                        <div
                          key={w.week}
                          className="flex-1 flex flex-col items-center justify-end"
                          title={`W${w.week}: ${load} analiz`}
                        >
                          <div
                            className={`w-full rounded-t-sm transition-all ${w.isCurrent ? 'bg-azure-500' : load >= 3 ? 'bg-red-400' : load >= 2 ? 'bg-amber-400' : 'bg-emerald-400'} ${load === 0 ? 'opacity-10' : ''}`}
                            style={{ height: `${Math.max(height, 2)}px` }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-[7px] text-gray-400 mt-1">
                    {monthGroups.map(mg => <span key={mg.month}>{MONTHS_SHORT[mg.month]}</span>)}
                  </div>
                </div>

                {/* Task List */}
                <div>
                  <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">Analiz Listesi</h4>
                  <div className="grid gap-2">
                    {personTasks.map((task, i) => {
                      const projColor = PROJECT_DOT_COLORS[task.project] || '#6B7280';
                      const weekCount = Object.keys(task.weeks).length;
                      const weekNums = Object.keys(task.weeks).map(Number).sort((a, b) => a - b);
                      const startW = weekNums[0] || 0;
                      const endW = weekNums[weekNums.length - 1] || 0;

                      return (
                        <div key={i} className="flex items-center gap-3 bg-gray-50 dark:bg-navy-800/50 rounded-xl p-3 border border-gray-100 dark:border-navy-700">
                          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: projColor }} />
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-xs text-gray-900 dark:text-white truncate">{task.name}</div>
                            <div className="text-[9px] text-gray-400">
                              {task.project} · {task.type || '-'} · {task.ekip || '-'}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-xs font-bold text-azure-600 dark:text-azure-400">{weekCount} hafta</div>
                            <div className="text-[9px] text-gray-400">W{startW}–W{endW}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* Project Legend */}
      <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-sm border border-gray-100 dark:border-navy-800 p-4">
        <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-azure-500" /> Proje Renkleri & Yük Seviyesi
        </h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {projects.map(p => (
            <div key={p} className="flex items-center gap-1.5 bg-gray-50 dark:bg-navy-800 rounded-lg px-2.5 py-1">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PROJECT_DOT_COLORS[p] || '#6B7280' }} />
              <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300">{p}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 text-[10px]">
          <span className="text-gray-400 font-bold">Yük:</span>
          <div className="flex items-center gap-1"><div className="w-4 h-3 rounded bg-emerald-100 dark:bg-emerald-500/20" /><span className="text-gray-500">1 (Normal)</span></div>
          <div className="flex items-center gap-1"><div className="w-4 h-3 rounded bg-yellow-100 dark:bg-yellow-500/20" /><span className="text-gray-500">2 (Orta)</span></div>
          <div className="flex items-center gap-1"><div className="w-4 h-3 rounded bg-orange-100 dark:bg-orange-500/20" /><span className="text-gray-500">3 (Yoğun)</span></div>
          <div className="flex items-center gap-1"><div className="w-4 h-3 rounded bg-red-100 dark:bg-red-500/20" /><span className="text-gray-500">4+ (Aşırı)</span></div>
        </div>
      </div>
    </div>
  );
}
