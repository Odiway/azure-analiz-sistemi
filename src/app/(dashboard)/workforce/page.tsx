'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useMemo, useRef } from 'react';
import {
  Users, ChevronLeft, ChevronRight, Filter, BarChart3,
  Calendar, Briefcase, Activity, Zap, Target, Clock,
  Award, TrendingUp, X, Check, Loader2, Download,
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
  // Pending changes: key = `${rowIndex}_${week}` -> value (1 or 0)
  const [pendingChanges, setPendingChanges] = useState<Record<string, { rowIndex: number; week: number; value: number }>>({});
  // Data arrived marks from DB: key = `${rowIndex}_${week}` -> ISO date string
  const [dataArrived, setDataArrived] = useState<Record<string, string>>({});
  // Pending data arrived changes: key = `${rowIndex}_${week}` -> add/remove
  const [pendingDataArrived, setPendingDataArrived] = useState<Record<string, { rowIndex: number; week: number; add: boolean }>>({});
  // Cell popup for person/project view: { rowName, week, x, y }
  const [cellPopup, setCellPopup] = useState<{ rowName: string; week: number; x: number; y: number } | null>(null);

  const hasPendingChanges = Object.keys(pendingChanges).length > 0 || Object.keys(pendingDataArrived).length > 0;
  const pendingCount = Object.keys(pendingChanges).length + Object.keys(pendingDataArrived).length;

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

  // Data arrived per person per week: which tasks have data vs not
  const personDataArrivedInfo = useMemo(() => {
    const map: Record<string, Record<number, { arrived: WorkforceTask[]; notArrived: WorkforceTask[] }>> = {};
    for (const task of filteredTasks) {
      const p = task.caeResp;
      if (!map[p]) map[p] = {};
      for (const wk of Object.keys(task.weeks)) {
        const w = parseInt(wk);
        if (!map[p][w]) map[p][w] = { arrived: [], notArrived: [] };
        if (dataArrived[`${task.rowIndex}_${w}`]) {
          map[p][w].arrived.push(task);
        } else {
          map[p][w].notArrived.push(task);
        }
      }
    }
    return map;
  }, [filteredTasks, dataArrived]);

  // Data arrived per project per week
  const projectDataArrivedInfo = useMemo(() => {
    const map: Record<string, Record<number, { arrived: WorkforceTask[]; notArrived: WorkforceTask[] }>> = {};
    for (const task of filteredTasks) {
      const prj = task.project;
      if (!map[prj]) map[prj] = {};
      for (const wk of Object.keys(task.weeks)) {
        const w = parseInt(wk);
        if (!map[prj][w]) map[prj][w] = { arrived: [], notArrived: [] };
        if (dataArrived[`${task.rowIndex}_${w}`]) {
          map[prj][w].arrived.push(task);
        } else {
          map[prj][w].notArrived.push(task);
        }
      }
    }
    return map;
  }, [filteredTasks, dataArrived]);

  useEffect(() => {
    fetch('/api/workforce')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setTasks(data.tasks);
          setPeople(data.people);
          setProjects(data.projects);
          if (data.dataArrived) setDataArrived(data.dataArrived);
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

  // ===================== EXCEL EXPORT =====================
  async function exportWorkforceExcel() {
    const ExcelJS = (await import('exceljs')).default;
    const wb = new ExcelJS.Workbook();
    wb.creator = 'TEMSA CAE Departmanı';
    wb.created = new Date();

    const TEMSA_BLUE = '00529B';
    const HEADER_WHITE = 'FFFFFF';
    const BORDER_STYLE = { style: 'thin' as const, color: { argb: 'FFD0D5DD' } };
    const ALL_BORDERS = { top: BORDER_STYLE, bottom: BORDER_STYLE, left: BORDER_STYLE, right: BORDER_STYLE };
    const MONTH_HEX = [
      '2563EB', '0891B2', '0D9488', '059669', '16A34A', '65A30D',
      'CA8A04', 'D97706', 'EA580C', 'E11D48', 'DB2777', '9333EA',
    ];
    const MONTH_LIGHT_HEX = [
      'DBEAFE', 'CFFAFE', 'CCFBF1', 'D1FAE5', 'DCFCE7', 'ECFCCB',
      'FEF9C3', 'FEF3C7', 'FFEDD5', 'FFE4E6', 'FCE7F3', 'F3E8FF',
    ];

    // ---- Sheet 1: İş Gücü Planı ----
    const ws = wb.addWorksheet('İş Gücü Planı', {
      views: [{ state: 'frozen', xSplit: 6, ySplit: 3 }],
    });

    // Row 1: Month headers
    const monthRow = ws.getRow(1);
    monthRow.height = 22;
    for (let c = 1; c <= 6; c++) {
      const cell = monthRow.getCell(c);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A202C' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = ALL_BORDERS;
    }
    monthRow.getCell(1).value = 'TEMSA CAE';
    monthRow.getCell(2).value = `İş Gücü ${year}`;

    let colOffset = 7;
    for (const mg of monthGroups) {
      const startCol = colOffset;
      const endCol = colOffset + mg.weeks.length - 1;
      for (let c = startCol; c <= endCol; c++) {
        const cell = monthRow.getCell(c);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${MONTH_HEX[mg.month]}` } };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = ALL_BORDERS;
      }
      if (mg.weeks.length > 1) ws.mergeCells(1, startCol, 1, endCol);
      monthRow.getCell(startCol).value = mg.name;
      colOffset = endCol + 1;
    }

    // Row 2: Column headers
    const headerRow = ws.getRow(2);
    headerRow.height = 24;
    const fixedHeaders = ['No', 'Analiz Adı', 'Proje', 'Kişi', 'Tip', 'Durum'];
    fixedHeaders.forEach((h, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = h;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${TEMSA_BLUE}` } };
      cell.font = { bold: true, color: { argb: `FF${HEADER_WHITE}` }, size: 9 };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = ALL_BORDERS;
    });
    weeks.forEach((w, i) => {
      const cell = headerRow.getCell(7 + i);
      cell.value = `W${w.week}`;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${TEMSA_BLUE}` } };
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
      cell.border = ALL_BORDERS;
    }
    weeks.forEach((w, i) => {
      const cell = dateRow.getCell(7 + i);
      cell.value = `${w.monday.getDate()} ${MONTHS_SHORT[w.monday.getMonth()]}`;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${MONTH_LIGHT_HEX[w.month]}` } };
      cell.font = { size: 7, color: { argb: 'FF475569' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = ALL_BORDERS;
    });

    // Data rows
    filteredTasks.forEach((task, idx) => {
      const row = ws.getRow(4 + idx);
      row.height = 20;
      const isEven = idx % 2 === 0;
      const rowBg = isEven ? 'FFFFFFFF' : 'FFF8FAFC';

      row.getCell(1).value = task.number;
      row.getCell(2).value = task.name;
      row.getCell(3).value = task.project;
      row.getCell(4).value = task.caeResp;
      row.getCell(5).value = task.type;
      row.getCell(6).value = task.status;

      for (let c = 1; c <= 6; c++) {
        const cell = row.getCell(c);
        cell.font = { size: 9, color: { argb: 'FF1E293B' } };
        cell.alignment = { vertical: 'middle', wrapText: c === 2 };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
        cell.border = ALL_BORDERS;
      }
      row.getCell(1).font = { size: 9, bold: true, color: { argb: 'FF1E293B' } };

      weeks.forEach((w, wi) => {
        const cell = row.getCell(7 + wi);
        const val = task.weeks[w.week];
        const isDA = !!dataArrived[`${task.rowIndex}_${w.week}`];
        cell.value = val || null;
        if (val) {
          if (isDA) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFED7AA' } }; // orange-200
            cell.font = { size: 9, bold: true, color: { argb: 'FF9A3412' } };
          } else {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${MONTH_LIGHT_HEX[w.month]}` } };
            cell.font = { size: 9, bold: true, color: { argb: 'FF1E293B' } };
          }
        } else {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
        }
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = ALL_BORDERS;
      });
    });

    // Column widths
    ws.getColumn(1).width = 8;
    ws.getColumn(2).width = 32;
    ws.getColumn(3).width = 18;
    ws.getColumn(4).width = 16;
    ws.getColumn(5).width = 14;
    ws.getColumn(6).width = 14;
    for (let i = 0; i < weeks.length; i++) ws.getColumn(7 + i).width = 7;

    // ---- Helper: build person/project calendar sheet ----
    function buildCalendarSheet(sheetName: string, label: string, rows: string[], weekData: Record<string, Record<number, { count: number; tasks: WorkforceTask[] }>>) {
      const s = wb.addWorksheet(sheetName, {
        views: [{ state: 'frozen', xSplit: 2, ySplit: 3 }],
      });

      // Row 1: Month headers
      const mRow = s.getRow(1);
      mRow.height = 22;
      for (let c = 1; c <= 2; c++) {
        const cell = mRow.getCell(c);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A202C' } };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = ALL_BORDERS;
      }
      mRow.getCell(1).value = `TEMSA CAE — ${label}`;

      let co = 3;
      for (const mg of monthGroups) {
        const sc = co;
        const ec = co + mg.weeks.length - 1;
        for (let c = sc; c <= ec; c++) {
          const cell = mRow.getCell(c);
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${MONTH_HEX[mg.month]}` } };
          cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.border = ALL_BORDERS;
        }
        if (mg.weeks.length > 1) s.mergeCells(1, sc, 1, ec);
        mRow.getCell(sc).value = mg.name;
        co = ec + 1;
      }

      // Row 2: Headers
      const hRow = s.getRow(2);
      hRow.height = 24;
      [label, 'Toplam'].forEach((h, i) => {
        const cell = hRow.getCell(i + 1);
        cell.value = h;
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${TEMSA_BLUE}` } };
        cell.font = { bold: true, color: { argb: `FF${HEADER_WHITE}` }, size: 9 };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = ALL_BORDERS;
      });
      weeks.forEach((w, i) => {
        const cell = hRow.getCell(3 + i);
        cell.value = `W${w.week}`;
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${TEMSA_BLUE}` } };
        cell.font = { bold: true, color: { argb: `FF${HEADER_WHITE}` }, size: 8 };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = ALL_BORDERS;
      });

      // Row 3: Date sub-headers
      const dRow = s.getRow(3);
      dRow.height = 18;
      for (let c = 1; c <= 2; c++) {
        const cell = dRow.getCell(c);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
        cell.border = ALL_BORDERS;
      }
      weeks.forEach((w, i) => {
        const cell = dRow.getCell(3 + i);
        cell.value = `${w.monday.getDate()} ${MONTHS_SHORT[w.monday.getMonth()]}`;
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${MONTH_LIGHT_HEX[w.month]}` } };
        cell.font = { size: 7, color: { argb: 'FF475569' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = ALL_BORDERS;
      });

      // Load color mapping
      const LOAD_COLORS: Record<number, { bg: string; fg: string }> = {
        1: { bg: 'FFD1FAE5', fg: 'FF065F46' }, // emerald
        2: { bg: 'FFFEF9C3', fg: 'FF854D0E' }, // yellow
        3: { bg: 'FFFFEDD5', fg: 'FF9A3412' }, // orange
      };
      const LOAD_HIGH = { bg: 'FFFEE2E2', fg: 'FF991B1B' }; // red for 4+

      // Data rows
      rows.forEach((rowName, idx) => {
        const row = s.getRow(4 + idx);
        row.height = 20;
        const isEven = idx % 2 === 0;
        const rowBg = isEven ? 'FFFFFFFF' : 'FFF8FAFC';
        const wd = weekData[rowName] || {};

        // Total tasks
        const totalTasks = Object.values(wd).reduce((s, d) => Math.max(s, d.tasks.length), 0);
        const uniqueTasks = new Set<number>();
        Object.values(wd).forEach(d => d.tasks.forEach(t => uniqueTasks.add(t.rowIndex)));

        row.getCell(1).value = rowName;
        row.getCell(1).font = { size: 10, bold: true, color: { argb: 'FF1E293B' } };
        row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
        row.getCell(1).alignment = { vertical: 'middle' };
        row.getCell(1).border = ALL_BORDERS;

        row.getCell(2).value = uniqueTasks.size;
        row.getCell(2).font = { size: 10, bold: true, color: { argb: `FF${TEMSA_BLUE}` } };
        row.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
        row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell(2).border = ALL_BORDERS;

        weeks.forEach((w, wi) => {
          const cell = row.getCell(3 + wi);
          const d = wd[w.week];
          const load = d?.count || 0;
          cell.value = load || null;
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.border = ALL_BORDERS;

          // Check if any task in this cell has data_arrived
          const hasDA = d?.tasks.some(t => !!dataArrived[`${t.rowIndex}_${w.week}`]);

          if (load > 0 && hasDA) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFED7AA' } };
            cell.font = { size: 9, bold: true, color: { argb: 'FF9A3412' } };
          } else if (load > 0) {
            const lc = load >= 4 ? LOAD_HIGH : (LOAD_COLORS[load] || LOAD_HIGH);
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: lc.bg } };
            cell.font = { size: 9, bold: true, color: { argb: lc.fg } };
          } else {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
          }
        });
      });

      // Total row
      const tRow = s.getRow(4 + rows.length);
      tRow.height = 24;
      tRow.getCell(1).value = 'TOPLAM';
      tRow.getCell(2).value = filteredTasks.length;
      weeks.forEach((w, i) => {
        tRow.getCell(3 + i).value = weekTotalLoad[w.week] || null;
      });
      for (let c = 1; c <= 2 + weeks.length; c++) {
        const cell = tRow.getCell(c);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A202C' } };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 };
        cell.alignment = { horizontal: c === 1 ? 'left' : 'center', vertical: 'middle' };
        cell.border = ALL_BORDERS;
      }

      s.getColumn(1).width = 22;
      s.getColumn(2).width = 10;
      for (let i = 0; i < weeks.length; i++) s.getColumn(3 + i).width = 7;
    }

    // ---- Sheet 2: Kişi Bazlı ----
    buildCalendarSheet('Kişi Bazlı', 'CAE Mühendisi', sortedPeople.map(p => p.name), personWeekLoad);

    // ---- Sheet 3: Proje Bazlı ----
    buildCalendarSheet('Proje Bazlı', 'Proje', projects, projectWeekLoad);

    // ---- Sheet 4: Data Geldi Tarihleri ----
    const wsDa = wb.addWorksheet('Data Geldi Tarihleri', {
      views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }],
    });

    // Header
    const daHeader = wsDa.getRow(1);
    daHeader.height = 26;
    const daHeaders = ['Analiz Adı', 'Proje', 'Kişi', 'Tip', 'Hafta', 'Hafta Başlangıcı', 'Data Geldi Tarihi'];
    daHeaders.forEach((h, i) => {
      const cell = daHeader.getCell(i + 1);
      cell.value = h;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF97316' } }; // orange
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = ALL_BORDERS;
    });

    // Collect all data_arrived entries
    const daEntries: { task: WorkforceTask; week: number; date: string }[] = [];
    for (const task of filteredTasks) {
      for (const w of weeks) {
        const key = `${task.rowIndex}_${w.week}`;
        if (dataArrived[key]) {
          daEntries.push({ task, week: w.week, date: dataArrived[key] });
        }
      }
    }

    // Sort by date descending (newest first)
    daEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    daEntries.forEach((entry, idx) => {
      const row = wsDa.getRow(2 + idx);
      row.height = 22;
      const isEven = idx % 2 === 0;
      const rowBg = isEven ? 'FFFFFFFF' : 'FFFFF7ED'; // white / orange-50

      const weekInfo = weeks.find(w => w.week === entry.week);
      const mondayStr = weekInfo ? `${weekInfo.monday.getDate()} ${MONTHS_TR[weekInfo.monday.getMonth()]} ${weekInfo.monday.getFullYear()}` : '';
      const dateObj = new Date(entry.date);
      const dateStr = `${dateObj.getDate()} ${MONTHS_TR[dateObj.getMonth()]} ${dateObj.getFullYear()} ${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`;

      row.getCell(1).value = entry.task.name;
      row.getCell(2).value = entry.task.project;
      row.getCell(3).value = entry.task.caeResp;
      row.getCell(4).value = entry.task.type;
      row.getCell(5).value = `W${entry.week}`;
      row.getCell(6).value = mondayStr;
      row.getCell(7).value = dateStr;

      for (let c = 1; c <= 7; c++) {
        const cell = row.getCell(c);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
        cell.font = { size: 10, color: { argb: 'FF1E293B' } };
        cell.alignment = { horizontal: c <= 4 ? 'left' : 'center', vertical: 'middle', wrapText: c === 1 };
        cell.border = ALL_BORDERS;
      }
      row.getCell(1).font = { size: 10, bold: true, color: { argb: 'FF1E293B' } };
      row.getCell(7).font = { size: 10, bold: true, color: { argb: 'FFC2410C' } }; // orange-700
    });

    if (daEntries.length === 0) {
      const row = wsDa.getRow(2);
      row.getCell(1).value = 'Henüz data geldi işareti yok';
      row.getCell(1).font = { size: 10, italic: true, color: { argb: 'FF9CA3AF' } };
    }

    wsDa.getColumn(1).width = 35;
    wsDa.getColumn(2).width = 18;
    wsDa.getColumn(3).width = 16;
    wsDa.getColumn(4).width = 14;
    wsDa.getColumn(5).width = 10;
    wsDa.getColumn(6).width = 22;
    wsDa.getColumn(7).width = 24;

    // ---- Sheet 5: Kişi Özeti ----
    const ws3 = wb.addWorksheet('Kişi Özeti');
    const pHeader = ws3.getRow(1);
    pHeader.height = 26;
    ['Kişi', 'Analiz Sayısı', 'Proje Sayısı', 'Data Gelen Analiz'].forEach((h, i) => {
      const cell = pHeader.getCell(i + 1);
      cell.value = h;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${TEMSA_BLUE}` } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = ALL_BORDERS;
    });

    sortedPeople.forEach((p, idx) => {
      const row = ws3.getRow(2 + idx);
      row.height = 22;
      const isEven = idx % 2 === 0;
      const personTasks = filteredTasks.filter(t => t.caeResp === p.name);
      const personProjects = new Set(personTasks.map(t => t.project));

      // Count unique tasks that have at least one data_arrived mark
      const tasksWithData = new Set<number>();
      for (const t of personTasks) {
        for (const w of weeks) {
          if (dataArrived[`${t.rowIndex}_${w.week}`]) {
            tasksWithData.add(t.rowIndex);
            break;
          }
        }
      }

      row.getCell(1).value = p.name;
      row.getCell(2).value = personTasks.length;
      row.getCell(3).value = personProjects.size;
      row.getCell(4).value = tasksWithData.size;

      for (let c = 1; c <= 4; c++) {
        const cell = row.getCell(c);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isEven ? 'FFFFFFFF' : 'FFF1F5F9' } };
        cell.font = { size: 10, color: { argb: 'FF1E293B' } };
        cell.alignment = { horizontal: c === 1 ? 'left' : 'center', vertical: 'middle' };
        cell.border = ALL_BORDERS;
      }
      row.getCell(1).font = { size: 10, bold: true, color: { argb: 'FF1E293B' } };
      row.getCell(4).font = { size: 10, bold: true, color: { argb: 'FFC2410C' } };
    });

    ws3.getColumn(1).width = 20;
    ws3.getColumn(2).width = 16;
    ws3.getColumn(3).width = 14;
    ws3.getColumn(4).width = 18;

    // Export
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TEMSA_CAE_Is_Gucu_Plani_${year}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
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

  // Toggle a single task/week allocation locally (pending)
  function toggleTaskWeek(task: WorkforceTask, week: number) {
    const hasWork = task.weeks[week];
    const newValue = hasWork ? 0 : 1;
    const key = `${task.rowIndex}_${week}`;

    // Update local task state immediately
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

    // Track in pending changes
    setPendingChanges(prev => {
      const next = { ...prev };
      next[key] = { rowIndex: task.rowIndex, week, value: newValue };
      return next;
    });
  }

  // Toggle data arrived for a task/week locally (pending)
  function toggleDataArrived(task: WorkforceTask, week: number) {
    const key = `${task.rowIndex}_${week}`;
    const isCurrentlyArrived = !!dataArrived[key];

    // Update local dataArrived state immediately
    setDataArrived(prev => {
      const next = { ...prev };
      if (isCurrentlyArrived) {
        delete next[key];
      } else {
        next[key] = new Date().toISOString();
      }
      return next;
    });

    // Track in pending data arrived changes
    setPendingDataArrived(prev => {
      const next = { ...prev };
      next[key] = { rowIndex: task.rowIndex, week, add: !isCurrentlyArrived };
      return next;
    });
  }

  // Save all pending changes to DB
  async function saveChanges() {
    if (!hasPendingChanges) return;

    setSaving(true);
    try {
      const updates = Object.values(pendingChanges);
      const dataArrivedUpdates = Object.values(pendingDataArrived);
      const res = await fetch('/api/workforce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates, dataArrivedUpdates }),
      });
      if (!res.ok) throw new Error('Save failed');
      const data = await res.json();
      setTasks(data.tasks);
      setPeople(data.people);
      setProjects(data.projects);
      if (data.dataArrived) setDataArrived(data.dataArrived);
      setPendingChanges({});
      setPendingDataArrived({});
    } catch {
      // Revert — refetch original
      fetch('/api/workforce').then(r => r.json()).then(data => {
        setTasks(data.tasks);
        setPeople(data.people);
        setProjects(data.projects);
        if (data.dataArrived) setDataArrived(data.dataArrived);
      }).catch(() => {});
      setPendingChanges({});
      setPendingDataArrived({});
    } finally {
      setSaving(false);
    }
  }

  // Discard all pending changes
  function discardChanges() {
    setPendingChanges({});
    setPendingDataArrived({});
    setLoading(true);
    fetch('/api/workforce')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setTasks(data.tasks);
          setPeople(data.people);
          setProjects(data.projects);
          if (data.dataArrived) setDataArrived(data.dataArrived);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
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

          <button
            onClick={exportWorkforceExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Excel
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
                        const daInfo = viewMode === 'person'
                          ? personDataArrivedInfo[rowName]?.[w.week]
                          : projectDataArrivedInfo[rowName]?.[w.week];
                        const hasDataArrived = daInfo && daInfo.arrived.length > 0;
                        const allDataArrived = daInfo && daInfo.arrived.length > 0 && daInfo.notArrived.length === 0;

                        return (
                          <td
                            key={w.week}
                            className={`text-center border-b border-gray-100 dark:border-navy-800 px-0 py-0 min-w-[28px] relative cursor-pointer
                              ${w.isCurrent ? 'bg-azure-50/70 dark:bg-azure-500/10 border-x border-azure-200 dark:border-azure-700' : ''}
                              ${load === 0 ? 'hover:bg-gray-100 dark:hover:bg-navy-700' : 'hover:opacity-75'}`}
                            title={wd ? `W${w.week}: ${load} analiz${hasDataArrived ? ` (${daInfo!.arrived.length}/${daInfo!.arrived.length + daInfo!.notArrived.length} data geldi)` : ''} — düzenlemek için tıkla` : `W${w.week} — eklemek için tıkla`}
                            onClick={(e) => handleCellPopup(e, rowName, w.week)}
                          >
                            {load > 0 ? (
                              <div className={`mx-auto w-full h-full min-h-[24px] flex items-center justify-center ${hasDataArrived ? (allDataArrived ? 'bg-orange-200 dark:bg-orange-500/30 text-orange-800 dark:text-orange-200 ring-1 ring-inset ring-orange-400/50' : 'bg-orange-100 dark:bg-orange-500/15 text-orange-700 dark:text-orange-300') : getLoadColor(load)}`}>
                                <span className="font-bold text-[10px]">{load}</span>
                                {hasDataArrived && <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-orange-500 rounded-full" />}
                              </div>
                            ) : null}
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
                        const isDataArrived = !!dataArrived[`${task.rowIndex}_${w.week}`];
                        return (
                          <td
                            key={w.week}
                            className={`text-center border-b border-gray-100 dark:border-navy-800 px-0 py-0 min-w-[28px] cursor-pointer relative
                              ${w.isCurrent ? 'border-x border-azure-200 dark:border-azure-700' : ''}
                              ${!hasWork ? 'hover:bg-gray-100 dark:hover:bg-navy-700' : 'hover:opacity-60'}`}
                            onClick={() => toggleTaskWeek(task, w.week)}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              if (hasWork) toggleDataArrived(task, w.week);
                            }}
                            title={hasWork ? `${task.name} - W${w.week}${isDataArrived ? ' (data geldi)' : ''}\nSol tık: iş kaldır | Sağ tık: data geldi` : `W${w.week} (eklemek için tıkla)`}
                          >
                            {hasWork ? (
                              <div
                                className={`w-full h-[20px] transition-all ${isDataArrived ? 'ring-2 ring-orange-500 ring-inset' : ''}`}
                                style={{ backgroundColor: isDataArrived ? '#F97316' : projColor, opacity: isDataArrived ? 1 : 0.8 }}
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

      {/* Save Changes Bar */}
      {hasPendingChanges && (
        <div className="fixed bottom-0 left-0 right-0 z-50 animate-fade-in">
          <div className="max-w-3xl mx-auto px-4 pb-5">
            <div className="flex items-center justify-between gap-4 bg-navy-900 dark:bg-navy-950 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-navy-700">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                  <span className="text-sm font-extrabold">{pendingCount}</span>
                </div>
                <div>
                  <div className="text-sm font-bold">Kaydedilmemiş Değişiklik</div>
                  <div className="text-[10px] text-gray-400">
                    {Object.keys(pendingChanges).length > 0 && `${Object.keys(pendingChanges).length} iş değişikliği`}
                    {Object.keys(pendingChanges).length > 0 && Object.keys(pendingDataArrived).length > 0 && ' · '}
                    {Object.keys(pendingDataArrived).length > 0 && `${Object.keys(pendingDataArrived).length} data geldi`}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={discardChanges}
                  disabled={saving}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
                >
                  Vazgeç
                </button>
                <button
                  onClick={saveChanges}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-400 transition-colors disabled:opacity-50 shadow-lg"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Kaydediliyor...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Değişiklikleri Kaydet
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cell Popup for Person/Project views */}
      {cellPopup && viewMode !== 'gantt' && (() => {
        const popupTasks = getPopupTasks();
        const week = cellPopup.week;
        // Position popup, make sure it doesn't go off screen
        const left = Math.min(cellPopup.x, window.innerWidth - 360);
        const top = Math.min(cellPopup.y, window.innerHeight - 400);

        // Count data arrived stats
        const activeTasks = popupTasks.filter(t => !!t.weeks[week]);
        const arrivedCount = activeTasks.filter(t => !!dataArrived[`${t.rowIndex}_${week}`]).length;

        return (
          <div
            ref={popupRef}
            className="fixed z-50 bg-white dark:bg-navy-900 rounded-xl shadow-2xl border border-gray-200 dark:border-navy-700 w-[340px] max-h-[400px] overflow-hidden animate-fade-in"
            style={{ left: `${left}px`, top: `${top}px` }}
          >
            {/* Popup Header */}
            <div className="flex items-center justify-between px-3 py-2 bg-navy-900 dark:bg-navy-950 text-white rounded-t-xl">
              <div>
                <div className="font-bold text-xs">{cellPopup.rowName}</div>
                <div className="text-[9px] text-gray-300">
                  Hafta {week} — {viewMode === 'person' ? 'Analizler' : 'Görevler'}
                  {activeTasks.length > 0 && (
                    <span className="ml-1.5 text-orange-300">
                      ({arrivedCount}/{activeTasks.length} data geldi)
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => setCellPopup(null)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Task list with toggles */}
            <div className="overflow-y-auto max-h-[340px] p-2 space-y-1">
              {popupTasks.length === 0 ? (
                <div className="text-center py-4 text-xs text-gray-400">Bu {viewMode === 'person' ? 'kişi' : 'proje'} için analiz bulunamadı</div>
              ) : (
                popupTasks.map((task, i) => {
                  const isActive = !!task.weeks[week];
                  const isArrived = !!dataArrived[`${task.rowIndex}_${week}`];
                  const projColor = PROJECT_DOT_COLORS[task.project] || '#6B7280';
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-2 px-2.5 py-2 rounded-lg transition-all ${
                        isActive
                          ? isArrived
                            ? 'bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-800'
                            : 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-gray-50 dark:bg-navy-800/50 border border-gray-100 dark:border-navy-700'
                      }`}
                    >
                      {/* Work allocation toggle */}
                      <button
                        onClick={() => toggleTaskWeek(task, week)}
                        className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all ${
                          isActive
                            ? 'bg-emerald-500 text-white'
                            : 'bg-gray-200 dark:bg-navy-600 hover:bg-gray-300 dark:hover:bg-navy-500'
                        }`}
                        title={isActive ? 'İş çıkar' : 'İş ekle'}
                      >
                        {isActive && <Check className="w-3 h-3" />}
                      </button>

                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: projColor }} />

                      <div className="flex-1 min-w-0">
                        <div className={`font-bold text-[10px] truncate ${isActive ? (isArrived ? 'text-orange-700 dark:text-orange-300' : 'text-emerald-700 dark:text-emerald-300') : 'text-gray-700 dark:text-gray-300'}`}>
                          {task.name}
                        </div>
                        <div className="text-[8px] text-gray-400 truncate">{task.project} · {task.caeResp}</div>
                      </div>

                      {/* Data arrived toggle */}
                      {isActive && (
                        <button
                          onClick={() => toggleDataArrived(task, week)}
                          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-bold transition-all flex-shrink-0 ${
                            isArrived
                              ? 'bg-orange-500 text-white shadow-sm'
                              : 'bg-gray-200 dark:bg-navy-600 text-gray-500 dark:text-gray-400 hover:bg-orange-100 dark:hover:bg-orange-500/20 hover:text-orange-600'
                          }`}
                          title={isArrived ? 'Data geldi işaretini kaldır' : 'Data geldi işaretle'}
                        >
                          <Zap className="w-3 h-3" />
                          {isArrived ? 'Data ✓' : 'Data'}
                        </button>
                      )}
                    </div>
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
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <div className="flex items-center gap-1"><div className="w-4 h-3 rounded bg-orange-400 ring-1 ring-orange-500" /><span className="text-gray-500 font-semibold">Data Geldi (Manuel)</span></div>
        </div>
      </div>
    </div>
  );
}
