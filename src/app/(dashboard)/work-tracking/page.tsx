'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  Briefcase, Plus, X, Save, Trash2, ChevronLeft, ChevronRight,
  Download, FileSpreadsheet, Calendar,
} from 'lucide-react';

// ===================== TYPES =====================
interface WorkItem {
  id: number;
  project_code: string;
  project_name: string;
  task_name: string;
  assigned_to: string;
  status: string;
  priority: string;
  category: string;
  start_date: string | null;
  target_date: string | null;
  notes: string | null;
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

const STATUS_DOTS: Record<string, string> = {
  'Devam Ediyor': 'bg-blue-500',
  'Tamamlandı': 'bg-emerald-500',
  'Başlanmadı': 'bg-gray-400',
  'Data Bekleniyor': 'bg-amber-500',
};

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
export default function WorkTrackingPage() {
  const { data: session } = useSession();
  const [year, setYear] = useState(new Date().getFullYear());
  const [items, setItems] = useState<WorkItem[]>([]);
  const [logs, setLogs] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [filterPerson, setFilterPerson] = useState('all');
  const [filterProject, setFilterProject] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [people, setPeople] = useState<string[]>([]);
  const [projects, setProjects] = useState<{ project_code: string; project_name: string }[]>([]);

  // Cell editing
  const [editCell, setEditCell] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Add/Edit modal
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<WorkItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    project_code: '', project_name: '', task_name: '', assigned_to: '',
    status: 'Başlanmadı', priority: 'Orta', category: 'Genel',
    start_date: '', target_date: '', notes: '',
  });

  // Scroll refs
  const currentWeekRef = useRef<HTMLTableCellElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Computed
  const weeks = useMemo(() => getWeeksForYear(year), [year]);
  const monthGroups = useMemo(() => groupWeeksByMonth(weeks), [weeks]);

  const statuses = useMemo(() => Array.from(new Set(items.map(i => i.status))).sort(), [items]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (filterPerson !== 'all' && item.assigned_to !== filterPerson) return false;
      if (filterProject !== 'all' && item.project_code !== filterProject) return false;
      if (filterStatus !== 'all' && item.status !== filterStatus) return false;
      return true;
    });
  }, [items, filterPerson, filterProject, filterStatus]);

  const weekTotals = useMemo(() => {
    const totals: Record<number, number> = {};
    for (const item of filteredItems) {
      for (const w of weeks) {
        const h = logs[`${item.id}_${w.week}`];
        if (h) totals[w.week] = (totals[w.week] || 0) + h;
      }
    }
    return totals;
  }, [filteredItems, weeks, logs]);

  const itemTotals = useMemo(() => {
    const totals: Record<number, number> = {};
    for (const item of filteredItems) {
      let total = 0;
      for (const w of weeks) {
        total += logs[`${item.id}_${w.week}`] || 0;
      }
      if (total > 0) totals[item.id] = total;
    }
    return totals;
  }, [filteredItems, weeks, logs]);

  const grandTotal = useMemo(() => Object.values(itemTotals).reduce((a, b) => a + b, 0), [itemTotals]);

  // ===================== DATA FETCHING =====================
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/work-items/weekly?year=${year}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items);
        setLogs(data.logs);
        setPeople(data.people);
        setProjects(data.projects);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => { setLoading(true); fetchData(); }, [fetchData]);

  // Scroll to current week on load
  useEffect(() => {
    if (!loading && currentWeekRef.current && scrollContainerRef.current) {
      const cell = currentWeekRef.current;
      cell.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'center' });
    }
  }, [loading]);

  // Focus input on edit
  useEffect(() => {
    if (editCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editCell]);

  // ===================== CELL OPERATIONS =====================
  async function saveHours(itemId: number, weekNum: number, value: string) {
    const hours = parseFloat(value) || 0;
    const key = `${itemId}_${weekNum}`;

    // Optimistic update
    setLogs(prev => {
      const next = { ...prev };
      if (hours <= 0) delete next[key];
      else next[key] = hours;
      return next;
    });
    setEditCell(null);

    try {
      await fetch('/api/work-items/weekly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ work_item_id: itemId, week_number: weekNum, year, hours }),
      });
    } catch {
      fetchData(); // rollback
    }
  }

  function handleCellClick(itemId: number, weekNum: number) {
    const key = `${itemId}_${weekNum}`;
    if (editCell === key) return;
    setEditCell(key);
    setEditValue(logs[key]?.toString() || '');
  }

  function handleCellKeyDown(e: React.KeyboardEvent, itemId: number, weekNum: number) {
    if (e.key === 'Enter') {
      saveHours(itemId, weekNum, editValue);
    } else if (e.key === 'Escape') {
      setEditCell(null);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      saveHours(itemId, weekNum, editValue);
      const nextWeek = weeks.find(w => w.week === weekNum + 1);
      if (nextWeek) {
        const nextKey = `${itemId}_${nextWeek.week}`;
        setTimeout(() => {
          setEditCell(nextKey);
          setEditValue(logs[nextKey]?.toString() || '');
        }, 50);
      }
    }
  }

  function handleCellBlur(itemId: number, weekNum: number) {
    saveHours(itemId, weekNum, editValue);
  }

  // ===================== MODAL OPERATIONS =====================
  function openAdd() {
    setEditItem(null);
    setShowModal(true);
    setForm({
      project_code: '', project_name: '', task_name: '', assigned_to: '',
      status: 'Başlanmadı', priority: 'Orta', category: 'Genel',
      start_date: '', target_date: '', notes: '',
    });
  }

  function openEdit(item: WorkItem) {
    setEditItem(item);
    setShowModal(true);
    setForm({
      project_code: item.project_code,
      project_name: item.project_name,
      task_name: item.task_name,
      assigned_to: item.assigned_to,
      status: item.status,
      priority: item.priority,
      category: item.category || 'Genel',
      start_date: item.start_date?.split('T')[0] || '',
      target_date: item.target_date?.split('T')[0] || '',
      notes: item.notes || '',
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (editItem) {
        await fetch(`/api/work-items/${editItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
      } else {
        await fetch('/api/work-items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
      }
      setShowModal(false);
      setEditItem(null);
      await fetchData();
    } catch { /* ignore */ } finally { setSaving(false); }
  }

  async function handleDelete(id: number) {
    if (!confirm('Bu iş kalemini silmek istediğinize emin misiniz?')) return;
    await fetch(`/api/work-items/${id}`, { method: 'DELETE' });
    setShowModal(false);
    setEditItem(null);
    await fetchData();
  }

  function scrollToCurrentWeek() {
    if (currentWeekRef.current) {
      currentWeekRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }

  // ===================== EXCEL EXPORT =====================
  async function exportWeeklyExcel() {
    const XLSX = (await import('xlsx')).default;
    const wb = XLSX.utils.book_new();

    // Sheet: Haftalık Plan
    const headerRow1 = ['Proje Kodu', 'Projenin Adı', 'Çalışmanın Adı', 'Çalışan Kişi', 'Durum', 'Toplam'];
    weeks.forEach(w => headerRow1.push(`W${w.week}`));

    const headerRow2 = ['', '', '', '', '', ''];
    weeks.forEach(w => headerRow2.push(`${w.monday.getDate()} ${MONTHS_SHORT[w.monday.getMonth()]}`));

    const rows: (string | number)[][] = [headerRow1, headerRow2];

    for (const item of filteredItems) {
      const row: (string | number)[] = [
        item.project_code, item.project_name, item.task_name,
        item.assigned_to, item.status, itemTotals[item.id] || 0,
      ];
      weeks.forEach(w => {
        const h = logs[`${item.id}_${w.week}`];
        row.push(h || '');
      });
      rows.push(row);
    }

    // Total row
    const totalRow: (string | number)[] = ['TOPLAM', '', '', '', '', grandTotal];
    weeks.forEach(w => totalRow.push(weekTotals[w.week] || ''));
    rows.push(totalRow);

    const ws = XLSX.utils.aoa_to_sheet(rows);

    // Column widths
    ws['!cols'] = [
      { wch: 12 }, { wch: 18 }, { wch: 30 }, { wch: 12 }, { wch: 14 }, { wch: 8 },
      ...weeks.map(() => ({ wch: 5 })),
    ];

    // Merge month headers - add month row
    XLSX.utils.book_append_sheet(wb, ws, 'Haftalık Plan');

    // Sheet: Kişi Özeti
    const personRows: (string | number)[][] = [['Kişi', 'Toplam Saat']];
    const personTotals: Record<string, number> = {};
    for (const item of items) {
      for (const w of weeks) {
        const h = logs[`${item.id}_${w.week}`];
        if (h) personTotals[item.assigned_to] = (personTotals[item.assigned_to] || 0) + h;
      }
    }
    Object.entries(personTotals).sort((a, b) => b[1] - a[1]).forEach(([name, hours]) => {
      personRows.push([name, hours]);
    });

    const ws2 = XLSX.utils.aoa_to_sheet(personRows);
    ws2['!cols'] = [{ wch: 15 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, ws2, 'Kişi Özeti');

    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TEMSA_CAE_Is_Plani_${year}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ===================== LOADING STATE =====================
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

  // ===================== RENDER =====================
  return (
    <div className="max-w-full mx-auto animate-fade-in py-3 px-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Briefcase className="w-7 h-7 text-azure-500" />
            İş Takip Sistemi
          </h1>
          <p className="text-navy-400 dark:text-navy-300 text-xs mt-0.5">
            CAE Departmanı — Haftalık İş Planı
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-xl px-1.5 py-1">
            <button onClick={() => setYear(y => y - 1)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-700 transition-colors">
              <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
            <span className="text-sm font-bold text-gray-800 dark:text-gray-200 min-w-[44px] text-center">{year}</span>
            <button onClick={() => setYear(y => y + 1)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-700 transition-colors">
              <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
          <button onClick={scrollToCurrentWeek} className="flex items-center gap-1 px-2.5 py-2 bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-700 hover:bg-gray-50 dark:hover:bg-navy-700 rounded-xl text-xs font-bold text-azure-600 dark:text-azure-400 transition-all">
            <Calendar className="w-3.5 h-3.5" /> Bugün
          </button>
          <button onClick={exportWeeklyExcel} className="flex items-center gap-1 px-2.5 py-2 bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-700 hover:bg-gray-50 dark:hover:bg-navy-700 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold transition-all">
            <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
          </button>
          <button onClick={openAdd} className="flex items-center gap-1 px-2.5 py-2 bg-gradient-to-r from-azure-500 to-blue-600 hover:from-azure-600 hover:to-blue-700 text-white rounded-xl font-bold text-xs transition-all shadow-lg shadow-azure-200/60 dark:shadow-azure-900/30">
            <Plus className="w-3.5 h-3.5" /> Yeni İş
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <select value={filterPerson} onChange={e => setFilterPerson(e.target.value)} className="px-2.5 py-1.5 border border-gray-200 dark:border-navy-700 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-300 dark:bg-navy-800 focus:outline-none focus:border-azure-400">
          <option value="all">Tüm Kişiler</option>
          {people.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={filterProject} onChange={e => setFilterProject(e.target.value)} className="px-2.5 py-1.5 border border-gray-200 dark:border-navy-700 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-300 dark:bg-navy-800 focus:outline-none focus:border-azure-400">
          <option value="all">Tüm Projeler</option>
          {projects.map(p => <option key={p.project_code} value={p.project_code}>{p.project_code} - {p.project_name}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-2.5 py-1.5 border border-gray-200 dark:border-navy-700 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-300 dark:bg-navy-800 focus:outline-none focus:border-azure-400">
          <option value="all">Tüm Durumlar</option>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {(filterPerson !== 'all' || filterProject !== 'all' || filterStatus !== 'all') && (
          <button onClick={() => { setFilterPerson('all'); setFilterProject('all'); setFilterStatus('all'); }} className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg text-xs font-bold transition-colors">
            <X className="w-3 h-3" /> Temizle
          </button>
        )}
        <div className="flex items-center gap-2 ml-auto text-[10px] font-semibold text-gray-500 dark:text-gray-400">
          <span>{filteredItems.length} iş</span>
          <span className="text-gray-300 dark:text-gray-600">•</span>
          <span>{grandTotal} saat</span>
        </div>
      </div>

      {/* =================== WEEKLY GRID =================== */}
      <div
        ref={scrollContainerRef}
        className="bg-white dark:bg-navy-900 rounded-2xl shadow-lg border border-gray-100 dark:border-navy-800 overflow-auto select-none"
        style={{ maxHeight: 'calc(100vh - 200px)' }}
      >
        <table className="border-collapse" style={{ minWidth: `${465 + weeks.length * 46}px` }}>
          <thead className="sticky top-0 z-30">
            {/* Row 1: Month headers */}
            <tr>
              <th
                colSpan={5}
                className="sticky left-0 z-40 bg-[#00529B] text-white px-3 py-2 text-left text-[11px] font-bold border-b border-r border-[#003d75] whitespace-nowrap"
                style={{ minWidth: '465px' }}
              >
                Planlanan Çalışma — {year}
              </th>
              {monthGroups.map(mg => (
                <th
                  key={mg.month}
                  colSpan={mg.weeks.length}
                  className={`${MONTH_HEADER_COLORS[mg.month]} text-white px-1 py-2 text-center text-[11px] font-bold border-b border-r border-white/20 whitespace-nowrap`}
                >
                  {mg.name}
                </th>
              ))}
            </tr>

            {/* Row 2: Column headers + week numbers */}
            <tr className="bg-gray-50 dark:bg-navy-800/80">
              <th className="sticky left-0 z-40 bg-gray-50 dark:bg-navy-800 px-2 py-1.5 text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 border-b border-r border-gray-200 dark:border-navy-700 uppercase tracking-wider" style={{ minWidth: '80px' }}>Proje</th>
              <th className="sticky z-40 bg-gray-50 dark:bg-navy-800 px-2 py-1.5 text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 border-b border-r border-gray-200 dark:border-navy-700 uppercase tracking-wider" style={{ left: '80px', minWidth: '190px' }}>Çalışmanın Adı</th>
              <th className="sticky z-40 bg-gray-50 dark:bg-navy-800 px-2 py-1.5 text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 border-b border-r border-gray-200 dark:border-navy-700 uppercase tracking-wider" style={{ left: '270px', minWidth: '80px' }}>Kişi</th>
              <th className="sticky z-40 bg-gray-50 dark:bg-navy-800 px-1 py-1.5 text-center text-[10px] font-bold text-gray-500 dark:text-gray-400 border-b border-r border-gray-200 dark:border-navy-700 uppercase tracking-wider" style={{ left: '350px', minWidth: '45px' }}>Durum</th>
              <th className="sticky z-40 bg-gray-50 dark:bg-navy-800 px-1 py-1.5 text-center text-[10px] font-bold text-gray-500 dark:text-gray-400 border-b border-r border-gray-200 dark:border-navy-700 uppercase tracking-wider" style={{ left: '395px', minWidth: '70px' }}>Toplam</th>
              {weeks.map(w => (
                <th
                  key={w.week}
                  ref={w.isCurrent ? currentWeekRef : undefined}
                  className={`px-0.5 py-1 text-center border-b border-r whitespace-nowrap ${
                    w.isCurrent
                      ? 'bg-red-500 text-white border-red-400 font-black'
                      : `${MONTH_CELL_COLORS[w.month]} text-gray-500 dark:text-gray-400 border-gray-200 dark:border-navy-700 font-bold`
                  }`}
                  style={{ minWidth: '46px' }}
                >
                  <div className="text-[10px]">W{w.week}</div>
                  <div className="text-[8px] opacity-70 font-normal">{w.monday.getDate()}.{MONTHS_SHORT[w.monday.getMonth()]}</div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {filteredItems.map((item, idx) => {
              const rowBg = idx % 2 === 0
                ? 'bg-white dark:bg-navy-900'
                : 'bg-gray-50/70 dark:bg-navy-800/20';
              const stickyBg = idx % 2 === 0
                ? 'bg-white dark:bg-navy-900'
                : 'bg-gray-50 dark:bg-navy-850';

              return (
                <tr key={item.id} className={`${rowBg} hover:bg-azure-50/40 dark:hover:bg-azure-500/5 transition-colors`}>
                  {/* Proje */}
                  <td
                    className={`sticky left-0 z-10 ${stickyBg} px-2 py-1 border-b border-r border-gray-100 dark:border-navy-800 cursor-pointer group/cell`}
                    onClick={() => openEdit(item)}
                    style={{ minWidth: '80px' }}
                  >
                    <div className="font-mono font-bold text-azure-600 dark:text-azure-400 text-[10px] group-hover/cell:underline">{item.project_code}</div>
                    <div className="text-[8px] text-gray-400 dark:text-gray-600 truncate max-w-[72px]">{item.project_name}</div>
                  </td>

                  {/* Çalışmanın Adı */}
                  <td
                    className={`sticky z-10 ${stickyBg} px-2 py-1 border-b border-r border-gray-100 dark:border-navy-800 cursor-pointer`}
                    style={{ left: '80px', minWidth: '190px' }}
                    onClick={() => openEdit(item)}
                  >
                    <div className="font-medium text-gray-800 dark:text-gray-200 text-[11px] truncate max-w-[180px]" title={item.task_name}>
                      {item.task_name}
                    </div>
                  </td>

                  {/* Kişi */}
                  <td
                    className={`sticky z-10 ${stickyBg} px-2 py-1 border-b border-r border-gray-100 dark:border-navy-800`}
                    style={{ left: '270px', minWidth: '80px' }}
                  >
                    <span className="font-semibold text-gray-700 dark:text-gray-300 text-[11px]">{item.assigned_to}</span>
                  </td>

                  {/* Durum */}
                  <td
                    className={`sticky z-10 ${stickyBg} px-1 py-1 border-b border-r border-gray-100 dark:border-navy-800 text-center`}
                    style={{ left: '350px', minWidth: '45px' }}
                  >
                    <div className={`w-3 h-3 rounded-full mx-auto ${STATUS_DOTS[item.status] || 'bg-gray-400'}`} title={item.status} />
                  </td>

                  {/* Toplam */}
                  <td
                    className={`sticky z-10 ${stickyBg} px-1 py-1 border-b border-r border-gray-100 dark:border-navy-800 text-center`}
                    style={{ left: '395px', minWidth: '70px' }}
                  >
                    {itemTotals[item.id] ? (
                      <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">{itemTotals[item.id]}</span>
                    ) : null}
                  </td>

                  {/* Week cells */}
                  {weeks.map(w => {
                    const key = `${item.id}_${w.week}`;
                    const hours = logs[key];
                    const isEditing = editCell === key;

                    return (
                      <td
                        key={w.week}
                        className={`px-0 py-0 border-b border-r text-center cursor-pointer transition-colors ${
                          w.isCurrent
                            ? 'bg-red-50/70 dark:bg-red-500/10 border-red-100 dark:border-red-900/30'
                            : `${MONTH_CELL_COLORS[w.month]} border-gray-100 dark:border-navy-800`
                        } ${!isEditing && !hours ? 'hover:bg-azure-100/60 dark:hover:bg-azure-500/10' : ''}`}
                        style={{ minWidth: '46px' }}
                        onClick={() => !isEditing && handleCellClick(item.id, w.week)}
                      >
                        {isEditing ? (
                          <input
                            ref={inputRef}
                            type="number"
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onKeyDown={e => handleCellKeyDown(e, item.id, w.week)}
                            onBlur={() => handleCellBlur(item.id, w.week)}
                            className="w-full h-8 px-1 text-center text-xs font-bold bg-white dark:bg-navy-800 border-2 border-azure-500 outline-none text-gray-900 dark:text-white"
                            min="0"
                            step="1"
                          />
                        ) : hours ? (
                          <div className="h-8 flex items-center justify-center">
                            <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200">{hours}</span>
                          </div>
                        ) : (
                          <div className="h-8" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}

            {/* Total row */}
            <tr className="sticky bottom-0 z-20 bg-[#1a202c] dark:bg-navy-950">
              <td colSpan={4} className="sticky left-0 z-30 bg-[#1a202c] dark:bg-navy-950 px-3 py-2 text-white font-bold text-xs border-t border-r border-[#2d3748]" style={{ minWidth: '350px' }}>
                TOPLAM
              </td>
              <td className="sticky z-30 bg-[#1a202c] dark:bg-navy-950 px-1 py-2 text-center text-white font-bold text-xs border-t border-r border-[#2d3748]" style={{ left: '395px', minWidth: '70px' }}>
                {grandTotal || ''}
              </td>
              {weeks.map(w => (
                <td
                  key={w.week}
                  className={`px-0.5 py-2 text-center font-bold text-xs border-t border-r ${
                    w.isCurrent
                      ? 'bg-red-700 text-white border-red-600'
                      : 'bg-[#2d3748] dark:bg-navy-900 text-gray-200 border-[#374151]'
                  }`}
                  style={{ minWidth: '46px' }}
                >
                  {weekTotals[w.week] || ''}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-2 text-[10px]">
        {Object.entries(STATUS_DOTS).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
            <div className={`w-2 h-2 rounded-full ${color}`} /> {status}
          </div>
        ))}
        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 ml-2">
          <div className="w-2 h-2 rounded-full bg-red-500" /> Bu hafta
        </div>
        <span className="text-gray-400 dark:text-gray-600 ml-auto">Hücreye tıklayarak saat girebilirsiniz</span>
      </div>

      {/* =================== ADD/EDIT MODAL =================== */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-navy-900 rounded-3xl p-6 w-full max-w-lg mx-4 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {editItem ? 'İş Düzenle' : 'Yeni İş Ekle'}
              </h3>
              <button onClick={() => { setShowModal(false); setEditItem(null); }} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-800 transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Proje Kodu</label>
                  <input value={form.project_code} onChange={e => setForm(f => ({ ...f, project_code: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 dark:border-navy-700 rounded-xl text-sm text-gray-800 dark:text-gray-200 dark:bg-navy-800 focus:outline-none focus:border-azure-400" placeholder="A1319" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Proje Adı</label>
                  <input value={form.project_name} onChange={e => setForm(f => ({ ...f, project_name: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 dark:border-navy-700 rounded-xl text-sm text-gray-800 dark:text-gray-200 dark:bg-navy-800 focus:outline-none focus:border-azure-400" placeholder="NGC Maraton" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Çalışmanın Adı</label>
                <input value={form.task_name} onChange={e => setForm(f => ({ ...f, task_name: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 dark:border-navy-700 rounded-xl text-sm text-gray-800 dark:text-gray-200 dark:bg-navy-800 focus:outline-none focus:border-azure-400" placeholder="CFD Analiz" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Çalışan Kişi</label>
                  <select value={form.assigned_to} onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 dark:border-navy-700 rounded-xl text-sm text-gray-700 dark:text-gray-300 dark:bg-navy-800 focus:outline-none focus:border-azure-400">
                    <option value="">Seçin</option>
                    {people.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Durum</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 dark:border-navy-700 rounded-xl text-sm text-gray-700 dark:text-gray-300 dark:bg-navy-800 focus:outline-none focus:border-azure-400">
                    <option value="Başlanmadı">Başlanmadı</option>
                    <option value="Devam Ediyor">Devam Ediyor</option>
                    <option value="Tamamlandı">Tamamlandı</option>
                    <option value="Data Bekleniyor">Data Bekleniyor</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Notlar</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full px-3 py-2.5 border border-gray-200 dark:border-navy-700 rounded-xl text-sm text-gray-800 dark:text-gray-200 dark:bg-navy-800 focus:outline-none focus:border-azure-400 resize-none" />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              {editItem && (
                <button onClick={() => handleDelete(editItem.id)} className="px-4 py-2.5 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-xl font-semibold text-sm transition-colors flex items-center gap-1.5">
                  <Trash2 className="w-4 h-4" /> Sil
                </button>
              )}
              <div className="flex-1" />
              <button onClick={() => { setShowModal(false); setEditItem(null); }} className="px-4 py-2.5 bg-gray-100 dark:bg-navy-800 hover:bg-gray-200 dark:hover:bg-navy-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm transition-colors">
                İptal
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.task_name || !form.project_code}
                className="px-5 py-2.5 bg-gradient-to-r from-azure-500 to-blue-600 hover:from-azure-600 hover:to-blue-700 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" /> {saving ? '...' : editItem ? 'Güncelle' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
