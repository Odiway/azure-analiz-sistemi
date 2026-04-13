'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  Briefcase, Plus, X, Save, Trash2, ChevronLeft, ChevronRight,
  Download, FileSpreadsheet, Calendar, FileText, Users, FolderKanban,
  BarChart3, TrendingUp, Upload, CheckCircle, AlertCircle,
  Clock, Target, Flame, Award, Zap, Activity,
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

  // Upload
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ success: boolean; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Analysis tab
  const [analysisTab, setAnalysisTab] = useState<'none' | 'person' | 'project'>('none');
  const [summary, setSummary] = useState<any>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

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

  // Fetch analysis summary when tab activated
  useEffect(() => {
    if (analysisTab !== 'none' && !summary) {
      setSummaryLoading(true);
      fetch('/api/work-items/reports?type=summary')
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data) setSummary(data); })
        .catch(() => {})
        .finally(() => setSummaryLoading(false));
    }
  }, [analysisTab, summary]);

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
    const ExcelJS = (await import('exceljs')).default;
    const wb = new ExcelJS.Workbook();
    wb.creator = 'TEMSA CAE Departmanı';
    wb.created = new Date();

    // Month hex colors matching UI
    const MONTH_HEX = [
      '2563EB', '0891B2', '0D9488', '059669', '16A34A', '65A30D',
      'CA8A04', 'D97706', 'EA580C', 'E11D48', 'DB2777', '9333EA',
    ];
    const MONTH_LIGHT_HEX = [
      'DBEAFE', 'CFFAFE', 'CCFBF1', 'D1FAE5', 'DCFCE7', 'ECFCCB',
      'FEF9C3', 'FEF3C7', 'FFEDD5', 'FFE4E6', 'FCE7F3', 'F3E8FF',
    ];

    const TEMSA_BLUE_HEX = '00529B';
    const HEADER_WHITE = 'FFFFFF';
    const BORDER_STYLE = { style: 'thin' as const, color: { argb: 'FFD0D5DD' } };
    const ALL_BORDERS = { top: BORDER_STYLE, bottom: BORDER_STYLE, left: BORDER_STYLE, right: BORDER_STYLE };

    // ---- Sheet 1: Haftalık Plan ----
    const ws = wb.addWorksheet('Haftalık Plan', {
      views: [{ state: 'frozen', xSplit: 6, ySplit: 3 }],
    });

    // Row 1: Month headers (merged across weeks)
    const monthRow = ws.getRow(1);
    monthRow.height = 22;
    // Fixed columns first
    for (let c = 1; c <= 6; c++) {
      const cell = monthRow.getCell(c);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A202C' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = ALL_BORDERS;
    }
    monthRow.getCell(1).value = 'TEMSA CAE';
    monthRow.getCell(2).value = `İş Planı ${year}`;

    let colOffset = 7;
    for (const mg of monthGroups) {
      const startCol = colOffset;
      const endCol = colOffset + mg.weeks.length - 1;
      const hexColor = MONTH_HEX[mg.month];

      for (let c = startCol; c <= endCol; c++) {
        const cell = monthRow.getCell(c);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${hexColor}` } };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = ALL_BORDERS;
      }
      if (mg.weeks.length > 1) {
        ws.mergeCells(1, startCol, 1, endCol);
      }
      monthRow.getCell(startCol).value = mg.name;
      colOffset = endCol + 1;
    }

    // Row 2: Column headers (Week numbers)
    const headerRow = ws.getRow(2);
    headerRow.height = 24;
    const fixedHeaders = ['Proje Kodu', 'Projenin Adı', 'Çalışmanın Adı', 'Çalışan Kişi', 'Durum', 'Toplam'];
    fixedHeaders.forEach((h, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = h;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${TEMSA_BLUE_HEX}` } };
      cell.font = { bold: true, color: { argb: `FF${HEADER_WHITE}` }, size: 9 };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = ALL_BORDERS;
    });
    weeks.forEach((w, i) => {
      const cell = headerRow.getCell(7 + i);
      cell.value = `W${w.week}`;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${TEMSA_BLUE_HEX}` } };
      cell.font = { bold: true, color: { argb: `FF${HEADER_WHITE}` }, size: 8 };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = ALL_BORDERS;
    });

    // Row 3: Date sub-headers
    const dateRow = ws.getRow(3);
    dateRow.height = 18;
    for (let c = 1; c <= 6; c++) {
      const cell = dateRow.getCell(c);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      cell.font = { italic: true, color: { argb: 'FF64748B' }, size: 8 };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = ALL_BORDERS;
    }
    weeks.forEach((w, i) => {
      const cell = dateRow.getCell(7 + i);
      cell.value = `${w.monday.getDate()} ${MONTHS_SHORT[w.monday.getMonth()]}`;
      const lightHex = MONTH_LIGHT_HEX[w.month];
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${lightHex}` } };
      cell.font = { size: 7, color: { argb: 'FF475569' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = ALL_BORDERS;
    });

    // Data rows
    const STATUS_COLORS: Record<string, string> = {
      'Devam Ediyor': '3B82F6',
      'Tamamlandı': '10B981',
      'Başlanmadı': '9CA3AF',
      'Data Bekleniyor': 'F59E0B',
    };
    const STATUS_BG: Record<string, string> = {
      'Devam Ediyor': 'EFF6FF',
      'Tamamlandı': 'ECFDF5',
      'Başlanmadı': 'F9FAFB',
      'Data Bekleniyor': 'FFFBEB',
    };

    filteredItems.forEach((item, idx) => {
      const row = ws.getRow(4 + idx);
      row.height = 20;
      const isEven = idx % 2 === 0;
      const rowBg = isEven ? 'FFFFFFFF' : 'FFF8FAFC';

      row.getCell(1).value = item.project_code;
      row.getCell(2).value = item.project_name;
      row.getCell(3).value = item.task_name;
      row.getCell(4).value = item.assigned_to;
      row.getCell(5).value = item.status;
      row.getCell(6).value = itemTotals[item.id] || 0;

      // Style fixed columns
      for (let c = 1; c <= 6; c++) {
        const cell = row.getCell(c);
        cell.font = { size: 9, color: { argb: 'FF1E293B' } };
        cell.alignment = { vertical: 'middle', wrapText: c === 3 };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
        cell.border = ALL_BORDERS;
      }
      // Bold project code
      row.getCell(1).font = { size: 9, bold: true, color: { argb: 'FF1E293B' } };
      // Status color
      const stColor = STATUS_COLORS[item.status];
      const stBg = STATUS_BG[item.status];
      if (stColor) {
        row.getCell(5).font = { size: 8, bold: true, color: { argb: `FF${stColor}` } };
        row.getCell(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${stBg}` } };
      }
      row.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' };
      // Toplam bold
      row.getCell(6).font = { size: 9, bold: true, color: { argb: `FF${TEMSA_BLUE_HEX}` } };
      row.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' };

      // Week cells
      weeks.forEach((w, wi) => {
        const cell = row.getCell(7 + wi);
        const h = logs[`${item.id}_${w.week}`];
        cell.value = h || null;
        const lightHex = MONTH_LIGHT_HEX[w.month];
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: h ? `FF${lightHex}` : rowBg } };
        cell.font = { size: 9, color: { argb: h ? 'FF1E293B' : 'FFD1D5DB' }, bold: !!h };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = ALL_BORDERS;
        if (h) cell.numFmt = '0.0';
      });
    });

    // Total row
    const totalRowIdx = 4 + filteredItems.length;
    const tRow = ws.getRow(totalRowIdx);
    tRow.height = 24;
    tRow.getCell(1).value = 'TOPLAM';
    tRow.getCell(6).value = grandTotal;
    weeks.forEach((w, i) => {
      tRow.getCell(7 + i).value = weekTotals[w.week] || null;
    });
    for (let c = 1; c <= 6 + weeks.length; c++) {
      const cell = tRow.getCell(c);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A202C' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = ALL_BORDERS;
    }
    tRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };

    // Column widths
    ws.getColumn(1).width = 14;
    ws.getColumn(2).width = 22;
    ws.getColumn(3).width = 35;
    ws.getColumn(4).width = 16;
    ws.getColumn(5).width = 16;
    ws.getColumn(6).width = 10;
    for (let i = 0; i < weeks.length; i++) {
      ws.getColumn(7 + i).width = 7;
    }

    // ---- Sheet 2: Kişi Özeti ----
    const ws2 = wb.addWorksheet('Kişi Özeti');
    const personTotals: Record<string, number> = {};
    for (const item of items) {
      for (const w of weeks) {
        const h = logs[`${item.id}_${w.week}`];
        if (h) personTotals[item.assigned_to] = (personTotals[item.assigned_to] || 0) + h;
      }
    }
    const sortedPeople = Object.entries(personTotals).sort((a, b) => b[1] - a[1]);

    // Header
    const pHeaderRow = ws2.getRow(1);
    pHeaderRow.height = 26;
    ['Kişi', 'Toplam Saat', 'Oran'].forEach((h, i) => {
      const cell = pHeaderRow.getCell(i + 1);
      cell.value = h;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${TEMSA_BLUE_HEX}` } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = ALL_BORDERS;
    });

    const totalAllHours = sortedPeople.reduce((s, p) => s + p[1], 0);
    sortedPeople.forEach(([name, hours], idx) => {
      const row = ws2.getRow(2 + idx);
      row.height = 22;
      const isEven = idx % 2 === 0;
      row.getCell(1).value = name;
      row.getCell(2).value = hours;
      row.getCell(3).value = totalAllHours ? Math.round((hours / totalAllHours) * 100) / 100 : 0;
      row.getCell(3).numFmt = '0%';

      for (let c = 1; c <= 3; c++) {
        const cell = row.getCell(c);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isEven ? 'FFFFFFFF' : 'FFF1F5F9' } };
        cell.font = { size: 10, color: { argb: 'FF1E293B' } };
        cell.alignment = { horizontal: c === 1 ? 'left' : 'center', vertical: 'middle' };
        cell.border = ALL_BORDERS;
      }
      row.getCell(1).font = { size: 10, bold: true, color: { argb: 'FF1E293B' } };
      row.getCell(2).font = { size: 10, bold: true, color: { argb: `FF${TEMSA_BLUE_HEX}` } };
    });

    // Total row
    const pTotalRow = ws2.getRow(2 + sortedPeople.length);
    pTotalRow.height = 24;
    pTotalRow.getCell(1).value = 'TOPLAM';
    pTotalRow.getCell(2).value = totalAllHours;
    pTotalRow.getCell(3).value = 1;
    pTotalRow.getCell(3).numFmt = '0%';
    for (let c = 1; c <= 3; c++) {
      const cell = pTotalRow.getCell(c);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A202C' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
      cell.alignment = { horizontal: c === 1 ? 'left' : 'center', vertical: 'middle' };
      cell.border = ALL_BORDERS;
    }

    ws2.getColumn(1).width = 20;
    ws2.getColumn(2).width = 14;
    ws2.getColumn(3).width = 10;

    // Export
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TEMSA_CAE_Is_Plani_${year}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ===================== PDF EXPORT =====================
  async function downloadGeneralPDF() {
    try {
      const [itemsRes, summaryRes] = await Promise.all([
        fetch('/api/work-items'),
        fetch('/api/work-items/reports?type=summary'),
      ]);
      if (!itemsRes.ok || !summaryRes.ok) return;
      const [allItems, summaryData] = await Promise.all([itemsRes.json(), summaryRes.json()]);
      const { generateGeneralReport } = await import('@/lib/pdf-report');
      generateGeneralReport(allItems, summaryData);
    } catch (e) {
      console.error('PDF Error:', e);
    }
  }

  async function downloadPersonPDF(personName: string) {
    try {
      const [itemsRes, summaryRes] = await Promise.all([
        fetch(`/api/work-items?assignedTo=${encodeURIComponent(personName)}`),
        fetch('/api/work-items/reports?type=summary'),
      ]);
      if (!itemsRes.ok || !summaryRes.ok) return;
      const [personItems, summaryData] = await Promise.all([itemsRes.json(), summaryRes.json()]);
      const workload = summaryData.personWorkload?.find((p: any) => p.assigned_to === personName);
      if (!workload) return;
      const { generatePersonReport } = await import('@/lib/pdf-report');
      generatePersonReport(personName, personItems, workload);
    } catch (e) {
      console.error('PDF Error:', e);
    }
  }

  // ===================== EXCEL UPLOAD =====================
  async function handleExcelUpload(file: File) {
    setUploading(true);
    setUploadResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('year', year.toString());
      const res = await fetch('/api/work-items/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) {
        setUploadResult({ success: true, message: data.message });
        await fetchData();
      } else {
        setUploadResult({ success: false, message: data.error || 'Yükleme hatası' });
      }
    } catch {
      setUploadResult({ success: false, message: 'Bağlantı hatası' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
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
          <button onClick={downloadGeneralPDF} className="flex items-center gap-1 px-2.5 py-2 bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-700 hover:bg-gray-50 dark:hover:bg-navy-700 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold transition-all">
            <FileText className="w-3.5 h-3.5" /> PDF
          </button>
          <button onClick={() => { setShowUpload(true); setUploadResult(null); }} className="flex items-center gap-1 px-2.5 py-2 bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-700 hover:bg-gray-50 dark:hover:bg-navy-700 text-violet-600 dark:text-violet-400 rounded-xl text-xs font-bold transition-all">
            <Upload className="w-3.5 h-3.5" /> Yükle
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

      {/* =================== ANALYSIS TABS =================== */}
      <div className="flex gap-2 mt-4 mb-2">
        <button
          onClick={() => setAnalysisTab(analysisTab === 'person' ? 'none' : 'person')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
            analysisTab === 'person'
              ? 'bg-azure-500 text-white shadow-lg shadow-azure-200/50 dark:shadow-azure-900/30'
              : 'bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-navy-700'
          }`}
        >
          <Users className="w-3.5 h-3.5" /> Kişi Bazlı Analiz
        </button>
        <button
          onClick={() => setAnalysisTab(analysisTab === 'project' ? 'none' : 'project')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
            analysisTab === 'project'
              ? 'bg-azure-500 text-white shadow-lg shadow-azure-200/50 dark:shadow-azure-900/30'
              : 'bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-navy-700'
          }`}
        >
          <FolderKanban className="w-3.5 h-3.5" /> Proje Bazlı Analiz
        </button>
      </div>

      {/* =================== PERSON ANALYSIS =================== */}
      {analysisTab === 'person' && (() => {
        // Pre-compute per-person data from weekly grid
        const personDataMap: Record<string, {
          hours: number; activeWeeks: number; weeklyHours: number[];
          projectSet: Set<string>; taskList: { task: string; project: string; hours: number; status: string }[];
          maxWeekHours: number; currentWeekHours: number; last4WeeksHours: number;
        }> = {};

        const currentWeekNum = weeks.find(w => w.isCurrent)?.week || 0;

        for (const item of items) {
          const name = item.assigned_to;
          if (!personDataMap[name]) {
            personDataMap[name] = {
              hours: 0, activeWeeks: 0, weeklyHours: new Array(weeks.length).fill(0),
              projectSet: new Set(), taskList: [], maxWeekHours: 0, currentWeekHours: 0, last4WeeksHours: 0,
            };
          }
          const pd = personDataMap[name];
          pd.projectSet.add(item.project_code);
          let taskHours = 0;
          for (let wi = 0; wi < weeks.length; wi++) {
            const h = logs[`${item.id}_${weeks[wi].week}`] || 0;
            pd.weeklyHours[wi] += h;
            pd.hours += h;
            taskHours += h;
          }
          pd.taskList.push({ task: item.task_name, project: item.project_code, hours: taskHours, status: item.status });
        }

        for (const pd of Object.values(personDataMap)) {
          pd.activeWeeks = pd.weeklyHours.filter(h => h > 0).length;
          pd.maxWeekHours = Math.max(...pd.weeklyHours, 1);
          // Current week hours
          if (currentWeekNum > 0) {
            const cwIdx = weeks.findIndex(w => w.week === currentWeekNum);
            if (cwIdx >= 0) pd.currentWeekHours = pd.weeklyHours[cwIdx];
            // Last 4 weeks
            for (let i = Math.max(0, cwIdx - 3); i <= cwIdx; i++) {
              pd.last4WeeksHours += pd.weeklyHours[i];
            }
          }
          pd.taskList.sort((a, b) => b.hours - a.hours);
        }

        return (
          <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-lg border border-gray-100 dark:border-navy-800 p-5 mb-4 animate-fade-in">
            <div className="flex items-center gap-2 mb-5">
              <Users className="w-5 h-5 text-azure-500" />
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Kişi Bazlı İş Yükü Analizi</h2>
              <span className="text-[10px] bg-azure-100 dark:bg-azure-500/20 text-azure-600 dark:text-azure-400 px-2 py-0.5 rounded-full font-bold ml-auto">{people.length} kişi</span>
            </div>

            {/* Team overview row */}
            {(() => {
              const totalPeople = Object.keys(personDataMap).length;
              const totalHours = Object.values(personDataMap).reduce((s, d) => s + d.hours, 0);
              const avgHours = totalPeople > 0 ? Math.round(totalHours / totalPeople) : 0;
              const topPerson = Object.entries(personDataMap).sort((a, b) => b[1].hours - a[1].hours)[0];
              return (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-500/10 dark:to-blue-500/5 rounded-xl p-3 border border-blue-100 dark:border-blue-900/30">
                    <div className="flex items-center gap-1.5 mb-1"><Users className="w-3.5 h-3.5 text-blue-500" /><span className="text-[10px] font-bold text-blue-500">Toplam Ekip</span></div>
                    <div className="text-2xl font-extrabold text-blue-700 dark:text-blue-300">{totalPeople}</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-500/10 dark:to-purple-500/5 rounded-xl p-3 border border-purple-100 dark:border-purple-900/30">
                    <div className="flex items-center gap-1.5 mb-1"><Clock className="w-3.5 h-3.5 text-purple-500" /><span className="text-[10px] font-bold text-purple-500">Toplam Saat</span></div>
                    <div className="text-2xl font-extrabold text-purple-700 dark:text-purple-300">{totalHours}</div>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-500/10 dark:to-amber-500/5 rounded-xl p-3 border border-amber-100 dark:border-amber-900/30">
                    <div className="flex items-center gap-1.5 mb-1"><BarChart3 className="w-3.5 h-3.5 text-amber-500" /><span className="text-[10px] font-bold text-amber-500">Ort. Saat/Kişi</span></div>
                    <div className="text-2xl font-extrabold text-amber-700 dark:text-amber-300">{avgHours}</div>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-500/10 dark:to-emerald-500/5 rounded-xl p-3 border border-emerald-100 dark:border-emerald-900/30">
                    <div className="flex items-center gap-1.5 mb-1"><Award className="w-3.5 h-3.5 text-emerald-500" /><span className="text-[10px] font-bold text-emerald-500">En Aktif</span></div>
                    <div className="text-lg font-extrabold text-emerald-700 dark:text-emerald-300 truncate">{topPerson ? topPerson[0] : '-'}</div>
                  </div>
                </div>
              );
            })()}

            {summaryLoading ? (
              <div className="text-center py-8 text-gray-400 text-sm">Yükleniyor...</div>
            ) : summary?.personWorkload ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {summary.personWorkload.map((person: any) => {
                  const completionRate = person.total ? Math.round((person.completed / person.total) * 100) : 0;
                  const pd = personDataMap[person.assigned_to];
                  if (!pd) return null;
                  const avgPerWeek = pd.activeWeeks > 0 ? (pd.hours / pd.activeWeeks).toFixed(1) : '0';
                  const projectCount = pd.projectSet.size;

                  // Mini weekly sparkline (last 12 weeks from current)
                  const currentIdx = weeks.findIndex(w => w.isCurrent);
                  const sparkStart = Math.max(0, currentIdx - 11);
                  const sparkEnd = currentIdx >= 0 ? currentIdx + 1 : weeks.length;
                  const sparkData = pd.weeklyHours.slice(sparkStart, sparkEnd);
                  const sparkMax = Math.max(...sparkData, 1);

                  return (
                    <div key={person.assigned_to} className="bg-gray-50 dark:bg-navy-800/50 rounded-2xl p-5 border border-gray-100 dark:border-navy-700 hover:border-azure-300 dark:hover:border-azure-700 hover:shadow-md transition-all">
                      {/* Card header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-azure-400 to-blue-600 flex items-center justify-center text-white font-extrabold text-sm shadow-lg">
                            {person.assigned_to.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-gray-900 dark:text-white">{person.assigned_to}</h3>
                            <p className="text-[10px] text-gray-400">{projectCount} proje · {pd.activeWeeks} aktif hafta</p>
                          </div>
                        </div>
                        <button
                          onClick={() => downloadPersonPDF(person.assigned_to)}
                          className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 dark:text-red-400 transition-colors"
                          title="PDF İndir"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Stats row */}
                      <div className="grid grid-cols-5 gap-1.5 mb-4">
                        <div className="bg-white dark:bg-navy-900 rounded-xl p-2 text-center">
                          <div className="text-base font-extrabold text-gray-800 dark:text-gray-200">{person.total}</div>
                          <div className="text-[8px] text-gray-400 font-bold">TOPLAM İŞ</div>
                        </div>
                        <div className="bg-white dark:bg-navy-900 rounded-xl p-2 text-center">
                          <div className="text-base font-extrabold text-blue-500">{person.active}</div>
                          <div className="text-[8px] text-gray-400 font-bold">DEVAM</div>
                        </div>
                        <div className="bg-white dark:bg-navy-900 rounded-xl p-2 text-center">
                          <div className="text-base font-extrabold text-emerald-500">{person.completed}</div>
                          <div className="text-[8px] text-gray-400 font-bold">BİTTİ</div>
                        </div>
                        <div className="bg-white dark:bg-navy-900 rounded-xl p-2 text-center">
                          <div className="text-base font-extrabold text-purple-500">{pd.hours}</div>
                          <div className="text-[8px] text-gray-400 font-bold">SAAT</div>
                        </div>
                        <div className="bg-white dark:bg-navy-900 rounded-xl p-2 text-center">
                          <div className="text-base font-extrabold text-amber-500">{avgPerWeek}</div>
                          <div className="text-[8px] text-gray-400 font-bold">ORT/HFT</div>
                        </div>
                      </div>

                      {/* Completion progress */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">Tamamlanma</span>
                          <span className={`text-[10px] font-extrabold ${completionRate >= 70 ? 'text-emerald-500' : completionRate >= 40 ? 'text-amber-500' : 'text-red-500'}`}>%{completionRate}</span>
                        </div>
                        <div className="w-full h-2.5 bg-gray-200 dark:bg-navy-700 rounded-full overflow-hidden">
                          {person.total > 0 && (
                            <div className="h-full flex">
                              <div className="bg-emerald-500 h-full transition-all" style={{ width: `${(person.completed / person.total) * 100}%` }} />
                              <div className="bg-blue-500 h-full transition-all" style={{ width: `${(person.active / person.total) * 100}%` }} />
                              <div className="bg-amber-400 h-full transition-all" style={{ width: `${(person.not_started / person.total) * 100}%` }} />
                            </div>
                          )}
                        </div>
                        <div className="flex gap-3 mt-1">
                          <span className="text-[8px] text-emerald-500 font-bold flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> Bitti {person.completed}</span>
                          <span className="text-[8px] text-blue-500 font-bold flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" /> Devam {person.active}</span>
                          <span className="text-[8px] text-amber-500 font-bold flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" /> Bekliyor {person.not_started}</span>
                        </div>
                      </div>

                      {/* Weekly activity sparkline */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1"><Activity className="w-3 h-3" /> Son 12 Hafta</span>
                          <span className="text-[10px] font-bold text-azure-500">Bu hafta: {pd.currentWeekHours}h</span>
                        </div>
                        <div className="flex items-end gap-[2px] h-8">
                          {sparkData.map((h, i) => (
                            <div
                              key={i}
                              className={`flex-1 rounded-t-sm transition-all ${i === sparkData.length - 1 ? 'bg-red-500' : h > 0 ? 'bg-azure-400 dark:bg-azure-500' : 'bg-gray-200 dark:bg-navy-700'}`}
                              style={{ height: `${Math.max(h > 0 ? 15 : 4, (h / sparkMax) * 100)}%` }}
                              title={`W${weeks[sparkStart + i]?.week || ''}: ${h}h`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Top tasks */}
                      <div>
                        <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1.5 block">En Çok Çalışılan</span>
                        <div className="space-y-1">
                          {pd.taskList.slice(0, 3).map((t, i) => (
                            <div key={i} className="flex items-center gap-2 bg-white dark:bg-navy-900 rounded-lg px-2.5 py-1.5">
                              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOTS[t.status] || 'bg-gray-400'}`} />
                              <span className="text-[10px] font-mono font-bold text-azure-500 flex-shrink-0">{t.project}</span>
                              <span className="text-[10px] text-gray-600 dark:text-gray-400 truncate flex-1">{t.task}</span>
                              <span className="text-[10px] font-bold text-gray-800 dark:text-gray-200 flex-shrink-0">{t.hours}h</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400 text-sm">Veri bulunamadı</div>
            )}
          </div>
        );
      })()}

      {/* =================== PROJECT ANALYSIS =================== */}
      {analysisTab === 'project' && (() => {
        // Pre-compute per-project data
        const projectDataMap: Record<string, {
          hours: number; weeklyHours: number[]; activeWeeks: number;
          people: Set<string>; taskList: { task: string; person: string; hours: number; status: string }[];
          currentWeekHours: number; last4WeeksHours: number;
        }> = {};

        const currentWeekNum = weeks.find(w => w.isCurrent)?.week || 0;

        for (const item of items) {
          const code = item.project_code;
          if (!projectDataMap[code]) {
            projectDataMap[code] = {
              hours: 0, weeklyHours: new Array(weeks.length).fill(0), activeWeeks: 0,
              people: new Set(), taskList: [], currentWeekHours: 0, last4WeeksHours: 0,
            };
          }
          const pd = projectDataMap[code];
          pd.people.add(item.assigned_to);
          let taskHours = 0;
          for (let wi = 0; wi < weeks.length; wi++) {
            const h = logs[`${item.id}_${weeks[wi].week}`] || 0;
            pd.weeklyHours[wi] += h;
            pd.hours += h;
            taskHours += h;
          }
          pd.taskList.push({ task: item.task_name, person: item.assigned_to, hours: taskHours, status: item.status });
        }

        for (const pd of Object.values(projectDataMap)) {
          pd.activeWeeks = pd.weeklyHours.filter(h => h > 0).length;
          if (currentWeekNum > 0) {
            const cwIdx = weeks.findIndex(w => w.week === currentWeekNum);
            if (cwIdx >= 0) pd.currentWeekHours = pd.weeklyHours[cwIdx];
            for (let i = Math.max(0, cwIdx - 3); i <= cwIdx; i++) {
              pd.last4WeeksHours += pd.weeklyHours[i];
            }
          }
          pd.taskList.sort((a, b) => b.hours - a.hours);
        }

        const totalProjectHours = Object.values(projectDataMap).reduce((s, d) => s + d.hours, 0);

        return (
          <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-lg border border-gray-100 dark:border-navy-800 p-5 mb-4 animate-fade-in">
            <div className="flex items-center gap-2 mb-5">
              <FolderKanban className="w-5 h-5 text-azure-500" />
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Proje Bazlı Dağılım Analizi</h2>
              <span className="text-[10px] bg-azure-100 dark:bg-azure-500/20 text-azure-600 dark:text-azure-400 px-2 py-0.5 rounded-full font-bold ml-auto">{projects.length} proje</span>
            </div>

            {summaryLoading ? (
              <div className="text-center py-8 text-gray-400 text-sm">Yükleniyor...</div>
            ) : summary?.projectDistribution ? (
              <div className="space-y-5">
                {/* Overview stats */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-500/10 dark:to-blue-500/5 rounded-xl p-3 border border-blue-100 dark:border-blue-900/30">
                    <div className="flex items-center gap-1.5 mb-1"><FolderKanban className="w-3.5 h-3.5 text-blue-500" /><span className="text-[10px] font-bold text-blue-500">Projeler</span></div>
                    <div className="text-2xl font-extrabold text-blue-700 dark:text-blue-300">{summary.projectDistribution.length}</div>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-500/10 dark:to-emerald-500/5 rounded-xl p-3 border border-emerald-100 dark:border-emerald-900/30">
                    <div className="flex items-center gap-1.5 mb-1"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" /><span className="text-[10px] font-bold text-emerald-500">Tamamlanan</span></div>
                    <div className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300">{summary.projectDistribution.reduce((s: number, p: any) => s + p.completed, 0)}</div>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-500/10 dark:to-amber-500/5 rounded-xl p-3 border border-amber-100 dark:border-amber-900/30">
                    <div className="flex items-center gap-1.5 mb-1"><Zap className="w-3.5 h-3.5 text-amber-500" /><span className="text-[10px] font-bold text-amber-500">Devam Eden</span></div>
                    <div className="text-2xl font-extrabold text-amber-700 dark:text-amber-300">{summary.projectDistribution.reduce((s: number, p: any) => s + p.active, 0)}</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-500/10 dark:to-purple-500/5 rounded-xl p-3 border border-purple-100 dark:border-purple-900/30">
                    <div className="flex items-center gap-1.5 mb-1"><Clock className="w-3.5 h-3.5 text-purple-500" /><span className="text-[10px] font-bold text-purple-500">Toplam Saat</span></div>
                    <div className="text-2xl font-extrabold text-purple-700 dark:text-purple-300">{totalProjectHours}</div>
                  </div>
                  <div className="bg-gradient-to-br from-rose-50 to-rose-100/50 dark:from-rose-500/10 dark:to-rose-500/5 rounded-xl p-3 border border-rose-100 dark:border-rose-900/30">
                    <div className="flex items-center gap-1.5 mb-1"><Flame className="w-3.5 h-3.5 text-rose-500" /><span className="text-[10px] font-bold text-rose-500">Bu Hafta</span></div>
                    <div className="text-2xl font-extrabold text-rose-700 dark:text-rose-300">{Object.values(projectDataMap).reduce((s, d) => s + d.currentWeekHours, 0)}h</div>
                  </div>
                </div>

                {/* Saat dağılım bar */}
                {totalProjectHours > 0 && (
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-2 block">Saat Dağılımı (Proje Bazlı)</span>
                    <div className="w-full h-5 bg-gray-100 dark:bg-navy-800 rounded-full overflow-hidden flex">
                      {summary.projectDistribution.map((project: any, i: number) => {
                        const ph = projectDataMap[project.project_code]?.hours || 0;
                        const pct = (ph / totalProjectHours) * 100;
                        if (pct < 1) return null;
                        const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-rose-500', 'bg-cyan-500', 'bg-teal-500', 'bg-orange-500', 'bg-pink-500', 'bg-indigo-500'];
                        return (
                          <div
                            key={project.project_code}
                            className={`${colors[i % colors.length]} h-full transition-all relative group`}
                            style={{ width: `${pct}%` }}
                            title={`${project.project_code}: ${ph}h (%${Math.round(pct)})`}
                          />
                        );
                      })}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
                      {summary.projectDistribution.map((project: any, i: number) => {
                        const ph = projectDataMap[project.project_code]?.hours || 0;
                        if (ph === 0) return null;
                        const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-rose-500', 'bg-cyan-500', 'bg-teal-500', 'bg-orange-500', 'bg-pink-500', 'bg-indigo-500'];
                        return (
                          <span key={project.project_code} className="text-[9px] text-gray-500 dark:text-gray-400 font-bold flex items-center gap-1">
                            <span className={`w-2 h-2 rounded-sm inline-block ${colors[i % colors.length]}`} />
                            {project.project_code} {Math.round((ph / totalProjectHours) * 100)}%
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Project cards */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {summary.projectDistribution.map((project: any) => {
                    const completionRate = project.total ? Math.round((project.completed / project.total) * 100) : 0;
                    const pd = projectDataMap[project.project_code];
                    if (!pd) return null;
                    const peopleCount = pd.people.size;
                    const avgPerWeek = pd.activeWeeks > 0 ? (pd.hours / pd.activeWeeks).toFixed(1) : '0';

                    // Sparkline
                    const currentIdx = weeks.findIndex(w => w.isCurrent);
                    const sparkStart = Math.max(0, currentIdx - 11);
                    const sparkEnd = currentIdx >= 0 ? currentIdx + 1 : weeks.length;
                    const sparkData = pd.weeklyHours.slice(sparkStart, sparkEnd);
                    const sparkMax = Math.max(...sparkData, 1);

                    return (
                      <div key={project.project_code} className="bg-gray-50 dark:bg-navy-800/50 rounded-2xl p-5 border border-gray-100 dark:border-navy-700 hover:border-azure-300 dark:hover:border-azure-700 hover:shadow-md transition-all">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-extrabold text-azure-600 dark:text-azure-400 text-base">{project.project_code}</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                completionRate >= 70 ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                : completionRate >= 40 ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400'
                                : 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400'
                              }`}>%{completionRate}</span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{project.project_name}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] text-gray-400">Bu hafta</div>
                            <div className="text-sm font-extrabold text-rose-500">{pd.currentWeekHours}h</div>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-6 gap-1.5 mb-4">
                          <div className="bg-white dark:bg-navy-900 rounded-lg p-1.5 text-center">
                            <div className="text-sm font-bold text-gray-800 dark:text-gray-200">{project.total}</div>
                            <div className="text-[7px] text-gray-400 font-bold">TOPLAM</div>
                          </div>
                          <div className="bg-white dark:bg-navy-900 rounded-lg p-1.5 text-center">
                            <div className="text-sm font-bold text-blue-500">{project.active}</div>
                            <div className="text-[7px] text-gray-400 font-bold">DEVAM</div>
                          </div>
                          <div className="bg-white dark:bg-navy-900 rounded-lg p-1.5 text-center">
                            <div className="text-sm font-bold text-emerald-500">{project.completed}</div>
                            <div className="text-[7px] text-gray-400 font-bold">BİTTİ</div>
                          </div>
                          <div className="bg-white dark:bg-navy-900 rounded-lg p-1.5 text-center">
                            <div className="text-sm font-bold text-purple-500">{pd.hours}h</div>
                            <div className="text-[7px] text-gray-400 font-bold">SAAT</div>
                          </div>
                          <div className="bg-white dark:bg-navy-900 rounded-lg p-1.5 text-center">
                            <div className="text-sm font-bold text-amber-500">{avgPerWeek}</div>
                            <div className="text-[7px] text-gray-400 font-bold">ORT/HFT</div>
                          </div>
                          <div className="bg-white dark:bg-navy-900 rounded-lg p-1.5 text-center">
                            <div className="text-sm font-bold text-cyan-500">{peopleCount}</div>
                            <div className="text-[7px] text-gray-400 font-bold">KİŞİ</div>
                          </div>
                        </div>

                        {/* Multi-segment progress */}
                        <div className="mb-4">
                          <div className="w-full h-2 bg-gray-200 dark:bg-navy-700 rounded-full overflow-hidden">
                            {project.total > 0 && (
                              <div className="h-full flex">
                                <div className="bg-emerald-500 h-full" style={{ width: `${(project.completed / project.total) * 100}%` }} />
                                <div className="bg-blue-500 h-full" style={{ width: `${(project.active / project.total) * 100}%` }} />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Sparkline */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1"><Activity className="w-3 h-3" /> Son 12 Hafta</span>
                            <span className="text-[10px] font-bold text-gray-400">Son 4 hafta: {pd.last4WeeksHours}h</span>
                          </div>
                          <div className="flex items-end gap-[2px] h-7">
                            {sparkData.map((h, i) => (
                              <div
                                key={i}
                                className={`flex-1 rounded-t-sm transition-all ${i === sparkData.length - 1 ? 'bg-red-500' : h > 0 ? 'bg-azure-400 dark:bg-azure-500' : 'bg-gray-200 dark:bg-navy-700'}`}
                                style={{ height: `${Math.max(h > 0 ? 15 : 4, (h / sparkMax) * 100)}%` }}
                                title={`W${weeks[sparkStart + i]?.week || ''}: ${h}h`}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Team members + tasks */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1 block">Ekip</span>
                            <div className="flex flex-wrap gap-1">
                              {Array.from(pd.people).map(p => (
                                <span key={p} className="text-[9px] bg-white dark:bg-navy-900 border border-gray-100 dark:border-navy-700 rounded-md px-1.5 py-0.5 font-bold text-gray-600 dark:text-gray-400">{p}</span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1 block">En Yoğun</span>
                            <div className="space-y-0.5">
                              {pd.taskList.slice(0, 2).map((t, i) => (
                                <div key={i} className="flex items-center gap-1">
                                  <div className={`w-1 h-1 rounded-full ${STATUS_DOTS[t.status] || 'bg-gray-400'}`} />
                                  <span className="text-[9px] text-gray-600 dark:text-gray-400 truncate">{t.task}</span>
                                  <span className="text-[9px] font-bold text-gray-800 dark:text-gray-200 ml-auto flex-shrink-0">{t.hours}h</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400 text-sm">Veri bulunamadı</div>
            )}
          </div>
        );
      })()}

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

      {/* =================== UPLOAD MODAL =================== */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-navy-900 rounded-3xl p-6 w-full max-w-md mx-4 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-violet-500" /> Excel Yükle
              </h3>
              <button onClick={() => setShowUpload(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-800 transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-800 rounded-xl p-3">
                <p className="text-xs text-violet-700 dark:text-violet-300 font-medium leading-relaxed">
                  Excel dosyanızda şu sütunlar olmalı:<br />
                  <span className="font-bold">Proje Kodu | Projenin Adı | Çalışmanın Adı | Çalışan Kişi | Durum | Toplam | W1, W2...W52</span>
                </p>
                <p className="text-xs text-violet-500 dark:text-violet-400 mt-2">
                  Mevcut verilerle eşleşen satırlar güncellenir, yeni satırlar eklenir. Yıl: <span className="font-bold">{year}</span>
                </p>
              </div>

              <div
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition-colors cursor-pointer ${
                  uploading
                    ? 'border-violet-300 bg-violet-50/50 dark:border-violet-700 dark:bg-violet-500/5'
                    : 'border-gray-200 dark:border-navy-700 hover:border-violet-400 dark:hover:border-violet-600 hover:bg-violet-50/30 dark:hover:bg-violet-500/5'
                }`}
                onClick={() => !uploading && fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const droppedFile = e.dataTransfer.files[0];
                  if (droppedFile && (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls'))) {
                    handleExcelUpload(droppedFile);
                  }
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleExcelUpload(f);
                  }}
                />
                {uploading ? (
                  <div className="space-y-2">
                    <div className="w-10 h-10 mx-auto border-4 border-violet-200 border-t-violet-500 rounded-full animate-spin" />
                    <p className="text-sm font-bold text-violet-600 dark:text-violet-400">İşleniyor...</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <FileSpreadsheet className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600" />
                    <p className="text-sm font-bold text-gray-600 dark:text-gray-400">Dosyayı sürükleyin veya tıklayın</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">.xlsx veya .xls formatı</p>
                  </div>
                )}
              </div>

              {/* Result message */}
              {uploadResult && (
                <div className={`flex items-start gap-2 rounded-xl p-3 ${
                  uploadResult.success
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-800'
                }`}>
                  {uploadResult.success ? (
                    <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  )}
                  <p className={`text-xs font-medium leading-relaxed ${
                    uploadResult.success ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'
                  }`}>
                    {uploadResult.message}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-5">
              <div className="flex-1" />
              <button
                onClick={() => setShowUpload(false)}
                className="px-4 py-2.5 bg-gray-100 dark:bg-navy-800 hover:bg-gray-200 dark:hover:bg-navy-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
