'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Briefcase, Search, Filter, ChevronDown, ChevronUp, Plus, X, Save, Trash2,
  BarChart3, Users, FolderKanban, Clock, CheckCircle, AlertCircle, Pause,
  TrendingUp, ArrowUpDown, Pencil, Eye, ChevronLeft, ChevronRight, Download, FileSpreadsheet,
} from 'lucide-react';
import { generateGeneralReport, generatePersonReport } from '@/lib/pdf-report';
import { generateGeneralExcel, generatePersonExcel } from '@/lib/excel-report';

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
  completed_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface Filters {
  people: string[];
  projects: { project_code: string; project_name: string }[];
  categories: string[];
  statuses: string[];
}

interface SummaryData {
  statusDistribution: { status: string; count: number }[];
  personWorkload: { assigned_to: string; total: number; active: number; completed: number; not_started: number }[];
  categoryDistribution: { category: string; count: number }[];
  projectDistribution: { project_code: string; project_name: string; total: number; completed: number; active: number }[];
  totalHours: { total: number; items_with_logs: number };
}

type Tab = 'overview' | 'table' | 'person' | 'reports';

const statusConfig: Record<string, { color: string; darkColor: string; icon: React.ReactNode; bg: string; darkBg: string }> = {
  'Devam Ediyor': { color: 'text-blue-700', darkColor: 'dark:text-blue-400', icon: <Clock className="w-3.5 h-3.5" />, bg: 'bg-blue-100', darkBg: 'dark:bg-blue-500/20' },
  'Tamamlandı': { color: 'text-green-700', darkColor: 'dark:text-green-400', icon: <CheckCircle className="w-3.5 h-3.5" />, bg: 'bg-green-100', darkBg: 'dark:bg-green-500/20' },
  'Başlanmadı': { color: 'text-gray-600', darkColor: 'dark:text-gray-400', icon: <Pause className="w-3.5 h-3.5" />, bg: 'bg-gray-100', darkBg: 'dark:bg-gray-500/20' },
  'Data Bekleniyor': { color: 'text-amber-700', darkColor: 'dark:text-amber-400', icon: <AlertCircle className="w-3.5 h-3.5" />, bg: 'bg-amber-100', darkBg: 'dark:bg-amber-500/20' },
};

const priorityColors: Record<string, string> = {
  'Yüksek': 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400',
  'Orta': 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400',
  'Düşük': 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400',
};

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] || statusConfig['Başlanmadı'];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${cfg.bg} ${cfg.darkBg} ${cfg.color} ${cfg.darkColor}`}>
      {cfg.icon} {status}
    </span>
  );
}

function formatDate(d: string | null) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function WorkTrackingPage() {
  const { data: session } = useSession();
  const [tab, setTab] = useState<Tab>('overview');
  const [items, setItems] = useState<WorkItem[]>([]);
  const [filters, setFilters] = useState<Filters>({ people: [], projects: [], categories: [], statuses: [] });
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [fStatus, setFStatus] = useState('all');
  const [fPerson, setFPerson] = useState('all');
  const [fProject, setFProject] = useState('all');
  const [fCategory, setFCategory] = useState('all');
  const [fSearch, setFSearch] = useState('');
  const [sortBy, setSortBy] = useState('updated_at');
  const [sortDir, setSortDir] = useState<'ASC' | 'DESC'>('DESC');

  // Pagination
  const [page, setPage] = useState(1);
  const perPage = 20;

  // Modal
  const [editItem, setEditItem] = useState<WorkItem | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    project_code: '', project_name: '', task_name: '', assigned_to: '',
    status: 'Başlanmadı', priority: 'Orta', category: 'Genel',
    start_date: '', target_date: '', notes: '',
  });

  // Person report
  const [reportPerson, setReportPerson] = useState('all');

  const fetchFilters = useCallback(async () => {
    try {
      const res = await fetch('/api/work-items/reports?type=filters');
      if (res.ok) setFilters(await res.json());
    } catch {}
  }, []);

  const fetchItems = useCallback(async () => {
    const params = new URLSearchParams();
    if (fStatus !== 'all') params.set('status', fStatus);
    if (fPerson !== 'all') params.set('assignedTo', fPerson);
    if (fProject !== 'all') params.set('projectCode', fProject);
    if (fCategory !== 'all') params.set('category', fCategory);
    if (fSearch) params.set('search', fSearch);
    params.set('sortBy', sortBy);
    params.set('sortDir', sortDir);
    try {
      const res = await fetch(`/api/work-items?${params}`);
      if (res.ok) setItems(await res.json());
    } catch {}
  }, [fStatus, fPerson, fProject, fCategory, fSearch, sortBy, sortDir]);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch('/api/work-items/reports?type=summary');
      if (res.ok) setSummary(await res.json());
    } catch {}
  }, []);

  useEffect(() => {
    Promise.all([fetchFilters(), fetchItems(), fetchSummary()]).finally(() => setLoading(false));
  }, [fetchFilters, fetchItems, fetchSummary]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * perPage;
    return items.slice(start, start + perPage);
  }, [items, page]);

  const totalPages = Math.ceil(items.length / perPage);

  function toggleSort(col: string) {
    if (sortBy === col) setSortDir(d => d === 'ASC' ? 'DESC' : 'ASC');
    else { setSortBy(col); setSortDir('ASC'); }
    setPage(1);
  }

  function openEdit(item: WorkItem) {
    setEditItem(item);
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

  function openAdd() {
    setEditItem(null);
    setShowAdd(true);
    setForm({
      project_code: '', project_name: '', task_name: '', assigned_to: '',
      status: 'Başlanmadı', priority: 'Orta', category: 'Genel',
      start_date: '', target_date: '', notes: '',
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
      setEditItem(null);
      setShowAdd(false);
      await Promise.all([fetchItems(), fetchSummary()]);
    } catch {} finally { setSaving(false); }
  }

  async function handleDelete(id: number) {
    if (!confirm('Bu iş kalemini silmek istediğinize emin misiniz?')) return;
    await fetch(`/api/work-items/${id}`, { method: 'DELETE' });
    setEditItem(null);
    await Promise.all([fetchItems(), fetchSummary()]);
  }

  // Person report data
  const personReportData = useMemo(() => {
    if (!summary) return [];
    return summary.personWorkload.filter(p =>
      reportPerson === 'all' || p.assigned_to === reportPerson
    );
  }, [summary, reportPerson]);

  // Overview stats
  const overviewStats = useMemo(() => {
    if (!summary) return null;
    const total = summary.statusDistribution.reduce((s, d) => s + d.count, 0);
    const active = summary.statusDistribution.find(d => d.status === 'Devam Ediyor')?.count || 0;
    const completed = summary.statusDistribution.find(d => d.status === 'Tamamlandı')?.count || 0;
    const notStarted = summary.statusDistribution.find(d => d.status === 'Başlanmadı')?.count || 0;
    return { total, active, completed, notStarted, completionRate: total ? Math.round((completed / total) * 100) : 0 };
  }, [summary]);

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

  return (
    <div className="max-w-[1600px] mx-auto animate-fade-in py-4 px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-navy-900 dark:text-white tracking-tight flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-azure-500" />
            İş Takip Sistemi
          </h1>
          <p className="text-navy-400 dark:text-navy-300 text-sm mt-1">
            CAE ekibi iş planı ve raporlama
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => summary && generateGeneralExcel(items, summary)}
            disabled={!summary}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-700 hover:bg-gray-50 dark:hover:bg-navy-700 text-emerald-600 dark:text-emerald-400 rounded-xl font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-40"
          >
            <FileSpreadsheet className="w-4 h-4" /> Excel
          </button>
          <button
            onClick={() => summary && generateGeneralReport(items, summary)}
            disabled={!summary}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-700 hover:bg-gray-50 dark:hover:bg-navy-700 text-red-600 dark:text-red-400 rounded-xl font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-40"
          >
            <Download className="w-4 h-4" /> PDF
          </button>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-azure-500 to-blue-600 hover:from-azure-600 hover:to-blue-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-azure-200/60 dark:shadow-azure-900/30 active:scale-[0.98]">
            <Plus className="w-4 h-4" /> Yeni İş Ekle
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white/60 dark:bg-navy-900/60 backdrop-blur-sm rounded-2xl p-1.5 border border-gray-200 dark:border-navy-700 w-fit">
        {([
          { key: 'overview', label: 'Genel Bakış', icon: <BarChart3 className="w-4 h-4" /> },
          { key: 'table', label: 'İş Listesi', icon: <FolderKanban className="w-4 h-4" /> },
          { key: 'person', label: 'Kişi Raporu', icon: <Users className="w-4 h-4" /> },
          { key: 'reports', label: 'Proje Raporu', icon: <TrendingUp className="w-4 h-4" /> },
        ] as { key: Tab; label: string; icon: React.ReactNode }[]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              tab === t.key
                ? 'bg-azure-500 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-navy-800'
            }`}
          >
            {t.icon} <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {tab === 'overview' && overviewStats && summary && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: 'Toplam İş', value: overviewStats.total, color: 'from-azure-500 to-blue-600', icon: <Briefcase className="w-5 h-5" /> },
              { label: 'Devam Eden', value: overviewStats.active, color: 'from-blue-500 to-indigo-600', icon: <Clock className="w-5 h-5" /> },
              { label: 'Tamamlanan', value: overviewStats.completed, color: 'from-emerald-500 to-green-600', icon: <CheckCircle className="w-5 h-5" /> },
              { label: 'Başlanmamış', value: overviewStats.notStarted, color: 'from-gray-400 to-gray-500', icon: <Pause className="w-5 h-5" /> },
              { label: 'Tamamlanma', value: `%${overviewStats.completionRate}`, color: 'from-purple-500 to-violet-600', icon: <TrendingUp className="w-5 h-5" /> },
            ].map((s, i) => (
              <div key={i} className="bg-white dark:bg-navy-900 rounded-2xl p-5 shadow-lg border border-gray-100 dark:border-navy-800 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white`}>
                    {s.icon}
                  </div>
                  <span className="text-3xl font-black text-gray-900 dark:text-white">{s.value}</span>
                </div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Status Distribution Bar */}
          <div className="bg-white dark:bg-navy-900 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-navy-800">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Durum Dağılımı</h3>
            <div className="h-6 rounded-full overflow-hidden flex bg-gray-100 dark:bg-navy-800">
              {summary.statusDistribution.map((d, i) => {
                const pct = overviewStats.total ? (d.count / overviewStats.total) * 100 : 0;
                const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-gray-400', 'bg-amber-500'];
                return (
                  <div
                    key={d.status}
                    className={`${colors[i] || colors[0]} transition-all relative group`}
                    style={{ width: `${pct}%` }}
                    title={`${d.status}: ${d.count} (%${Math.round(pct)})`}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      {pct > 12 && <span className="text-white text-[10px] font-bold">{d.count}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-4 mt-3">
              {summary.statusDistribution.map((d, i) => {
                const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-gray-400', 'bg-amber-500'];
                return (
                  <div key={d.status} className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400">
                    <div className={`w-3 h-3 rounded-full ${colors[i] || colors[0]}`} />
                    {d.status} ({d.count})
                  </div>
                );
              })}
            </div>
          </div>

          {/* Person Workload */}
          <div className="bg-white dark:bg-navy-900 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-navy-800">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Kişi Bazlı İş Yükü</h3>
            <div className="space-y-3">
              {summary.personWorkload.map((p) => {
                const total = overviewStats.total || 1;
                return (
                  <div key={p.assigned_to} className="flex items-center gap-4">
                    <div className="w-24 text-sm font-bold text-gray-800 dark:text-gray-200 truncate">{p.assigned_to}</div>
                    <div className="flex-1 h-7 rounded-lg overflow-hidden flex bg-gray-100 dark:bg-navy-800">
                      <div className="bg-emerald-500 transition-all" style={{ width: `${(p.completed / total) * 100}%` }} title={`Tamamlanan: ${p.completed}`} />
                      <div className="bg-blue-500 transition-all" style={{ width: `${(p.active / total) * 100}%` }} title={`Devam eden: ${p.active}`} />
                      <div className="bg-gray-300 dark:bg-gray-600 transition-all" style={{ width: `${(p.not_started / total) * 100}%` }} title={`Başlanmamış: ${p.not_started}`} />
                    </div>
                    <div className="w-16 text-right">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{p.total}</span>
                      <span className="text-xs text-gray-400 ml-1">iş</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-4 mt-4 pt-3 border-t border-gray-100 dark:border-navy-700">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                <div className="w-3 h-3 rounded-full bg-emerald-500" /> Tamamlanan
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                <div className="w-3 h-3 rounded-full bg-blue-500" /> Devam Eden
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600" /> Başlanmamış
              </div>
            </div>
          </div>

          {/* Category Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-navy-900 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-navy-800">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">Kategori Dağılımı</h3>
              <div className="space-y-2">
                {summary.categoryDistribution.map((c) => {
                  const maxCount = summary.categoryDistribution[0]?.count || 1;
                  return (
                    <div key={c.category} className="flex items-center gap-3">
                      <span className="w-28 text-xs font-semibold text-gray-600 dark:text-gray-400 truncate">{c.category}</span>
                      <div className="flex-1 h-5 rounded-md overflow-hidden bg-gray-100 dark:bg-navy-800">
                        <div className="h-full bg-gradient-to-r from-azure-400 to-blue-500 rounded-md transition-all" style={{ width: `${(c.count / maxCount) * 100}%` }} />
                      </div>
                      <span className="w-8 text-right text-xs font-bold text-gray-700 dark:text-gray-300">{c.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white dark:bg-navy-900 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-navy-800">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">Proje Dağılımı</h3>
              <div className="space-y-2 max-h-[320px] overflow-y-auto">
                {summary.projectDistribution.map((p) => (
                  <div key={p.project_code + p.project_name} className="flex items-center justify-between py-2 px-3 rounded-xl bg-gray-50 dark:bg-navy-800/50 hover:bg-gray-100 dark:hover:bg-navy-800 transition-colors">
                    <div>
                      <span className="text-xs font-mono font-bold text-azure-600 dark:text-azure-400">{p.project_code}</span>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 ml-2">{p.project_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded">{p.completed}✓</span>
                      <span className="text-[10px] font-bold bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded">{p.active}⟳</span>
                      <span className="text-xs font-bold text-gray-600 dark:text-gray-400">{p.total}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TABLE TAB */}
      {tab === 'table' && (
        <div className="space-y-4">
          {/* Quick Status Chips */}
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'Tümü', color: 'bg-gray-100 dark:bg-navy-800 text-gray-700 dark:text-gray-300' },
              { key: 'Devam Ediyor', label: 'Devam Eden', color: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400' },
              { key: 'Tamamlandı', label: 'Tamamlanan', color: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' },
              { key: 'Başlanmadı', label: 'Başlanmamış', color: 'bg-gray-200 dark:bg-gray-600/30 text-gray-600 dark:text-gray-400' },
              { key: 'Data Bekleniyor', label: 'Data Bekleniyor', color: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400' },
            ].map(chip => (
              <button
                key={chip.key}
                onClick={() => { setFStatus(chip.key); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  fStatus === chip.key
                    ? `${chip.color} ring-2 ring-azure-400 dark:ring-azure-500 shadow-md scale-105`
                    : `${chip.color} opacity-60 hover:opacity-100`
                }`}
              >
                {chip.label}
                {chip.key !== 'all' && summary && (
                  <span className="ml-1.5 opacity-70">
                    {summary.statusDistribution.find(d => d.status === chip.key)?.count || 0}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Filters Bar */}
          <div className="bg-white dark:bg-navy-900 rounded-2xl p-4 shadow-lg border border-gray-100 dark:border-navy-800">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={fSearch}
                  onChange={(e) => { setFSearch(e.target.value); setPage(1); }}
                  placeholder="İş adı, proje, kişi veya kategori ara..."
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-200 dark:border-navy-700 rounded-xl text-sm text-gray-800 dark:text-gray-200 dark:bg-navy-800 focus:outline-none focus:border-azure-400 focus:ring-1 focus:ring-azure-400"
                />
                {fSearch && (
                  <button onClick={() => { setFSearch(''); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-gray-200 dark:hover:bg-navy-700 transition-colors">
                    <X className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                )}
              </div>
              <select value={fPerson} onChange={e => { setFPerson(e.target.value); setPage(1); }} className="px-3 py-2.5 border border-gray-200 dark:border-navy-700 rounded-xl text-sm text-gray-700 dark:text-gray-300 dark:bg-navy-800 focus:outline-none focus:border-azure-400">
                <option value="all">Tüm Kişiler</option>
                {filters.people.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <select value={fProject} onChange={e => { setFProject(e.target.value); setPage(1); }} className="px-3 py-2.5 border border-gray-200 dark:border-navy-700 rounded-xl text-sm text-gray-700 dark:text-gray-300 dark:bg-navy-800 focus:outline-none focus:border-azure-400">
                <option value="all">Tüm Projeler</option>
                {filters.projects.map(p => <option key={p.project_code} value={p.project_code}>{p.project_code} - {p.project_name}</option>)}
              </select>
              <select value={fCategory} onChange={e => { setFCategory(e.target.value); setPage(1); }} className="px-3 py-2.5 border border-gray-200 dark:border-navy-700 rounded-xl text-sm text-gray-700 dark:text-gray-300 dark:bg-navy-800 focus:outline-none focus:border-azure-400">
                <option value="all">Tüm Kategoriler</option>
                {filters.categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {(fStatus !== 'all' || fPerson !== 'all' || fProject !== 'all' || fCategory !== 'all' || fSearch) && (
                <button
                  onClick={() => { setFStatus('all'); setFPerson('all'); setFProject('all'); setFCategory('all'); setFSearch(''); setPage(1); }}
                  className="flex items-center gap-1.5 px-3 py-2.5 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold transition-colors"
                >
                  <X className="w-3.5 h-3.5" /> Temizle
                </button>
              )}
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5" />
                {items.length} sonuç
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-lg border border-gray-100 dark:border-navy-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-navy-800/50 border-b border-gray-100 dark:border-navy-700">
                    {[
                      { key: 'project_code', label: 'Proje' },
                      { key: 'task_name', label: 'İş Adı' },
                      { key: 'assigned_to', label: 'Kişi' },
                      { key: 'status', label: 'Durum' },
                      { key: 'priority', label: 'Öncelik' },
                      { key: 'category', label: 'Kategori' },
                      { key: 'updated_at', label: 'Güncelleme' },
                    ].map(col => (
                      <th
                        key={col.key}
                        onClick={() => toggleSort(col.key)}
                        className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-azure-500 transition-colors select-none"
                      >
                        <span className="flex items-center gap-1">
                          {col.label}
                          {sortBy === col.key && (sortDir === 'ASC' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                          {sortBy !== col.key && <ArrowUpDown className="w-3 h-3 opacity-30" />}
                        </span>
                      </th>
                    ))}
                    <th className="px-4 py-3 w-20"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-navy-800">
                  {paginatedItems.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-navy-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-mono font-bold text-azure-600 dark:text-azure-400 text-xs">{item.project_code}</div>
                        <div className="text-[10px] text-gray-400 dark:text-gray-500 truncate max-w-[120px]">{item.project_name}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 dark:text-white max-w-[300px] truncate" title={item.task_name}>{item.task_name}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-gray-700 dark:text-gray-300">{item.assigned_to}</span>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${priorityColors[item.priority] || priorityColors['Orta']}`}>{item.priority}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{item.category}</td>
                      <td className="px-4 py-3 text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">{formatDate(item.updated_at)}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-azure-50 dark:hover:bg-azure-500/10 text-gray-400 hover:text-azure-500 transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-navy-700">
                <span className="text-xs text-gray-500 dark:text-gray-400">Sayfa {page} / {totalPages}</span>
                <div className="flex gap-1">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg border border-gray-200 dark:border-navy-700 hover:bg-gray-50 dark:hover:bg-navy-800 disabled:opacity-30 transition-colors">
                    <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg border border-gray-200 dark:border-navy-700 hover:bg-gray-50 dark:hover:bg-navy-800 disabled:opacity-30 transition-colors">
                    <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PERSON REPORT TAB */}
      {tab === 'person' && summary && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <select value={reportPerson} onChange={e => setReportPerson(e.target.value)} className="px-4 py-2.5 border border-gray-200 dark:border-navy-700 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 dark:bg-navy-800 focus:outline-none focus:border-azure-400">
              <option value="all">Tüm Kişiler</option>
              {filters.people.filter(p => p !== 'Atanmamış').map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            {reportPerson !== 'all' && (
              <>
              <button
                onClick={() => {
                  const pw = summary.personWorkload.find(p => p.assigned_to === reportPerson);
                  if (pw) generatePersonExcel(reportPerson, items.filter(i => i.assigned_to === reportPerson), pw);
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-700 hover:bg-gray-50 dark:hover:bg-navy-700 text-emerald-600 dark:text-emerald-400 rounded-xl font-bold text-sm transition-all active:scale-[0.98]"
              >
                <FileSpreadsheet className="w-4 h-4" /> Excel
              </button>
              <button
                onClick={() => {
                  const pw = summary.personWorkload.find(p => p.assigned_to === reportPerson);
                  if (pw) generatePersonReport(reportPerson, items.filter(i => i.assigned_to === reportPerson), pw);
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-700 hover:bg-gray-50 dark:hover:bg-navy-700 text-red-600 dark:text-red-400 rounded-xl font-bold text-sm transition-all active:scale-[0.98]"
              >
                <Download className="w-4 h-4" /> PDF
              </button>
              </>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {personReportData.map(p => {
              const completionRate = p.total ? Math.round((p.completed / p.total) * 100) : 0;
              return (
                <div key={p.assigned_to} onClick={() => setReportPerson(prev => prev === p.assigned_to ? 'all' : p.assigned_to)} className={`bg-white dark:bg-navy-900 rounded-2xl p-5 shadow-lg border-2 transition-all hover:-translate-y-0.5 hover:shadow-xl cursor-pointer ${reportPerson === p.assigned_to ? 'border-azure-500 dark:border-azure-400 ring-2 ring-azure-200 dark:ring-azure-500/30' : 'border-gray-100 dark:border-navy-800'}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-azure-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                      {p.assigned_to.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white">{p.assigned_to}</h4>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{p.total} iş kalemi</p>
                    </div>
                  </div>

                  <div className="h-3 rounded-full overflow-hidden flex bg-gray-100 dark:bg-navy-800 mb-3">
                    <div className="bg-emerald-500" style={{ width: `${(p.completed / Math.max(p.total, 1)) * 100}%` }} />
                    <div className="bg-blue-500" style={{ width: `${(p.active / Math.max(p.total, 1)) * 100}%` }} />
                    <div className="bg-gray-300 dark:bg-gray-600" style={{ width: `${(p.not_started / Math.max(p.total, 1)) * 100}%` }} />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-xl py-2">
                      <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">{p.completed}</p>
                      <p className="text-[10px] font-semibold text-emerald-500">Tamamlanan</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-500/10 rounded-xl py-2">
                      <p className="text-lg font-black text-blue-600 dark:text-blue-400">{p.active}</p>
                      <p className="text-[10px] font-semibold text-blue-500">Devam Eden</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-500/10 rounded-xl py-2">
                      <p className="text-lg font-black text-gray-500 dark:text-gray-400">{p.not_started}</p>
                      <p className="text-[10px] font-semibold text-gray-400">Bekleyen</p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Tamamlanma</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); generatePersonExcel(p.assigned_to, items.filter(i => i.assigned_to === p.assigned_to), p); }}
                        className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-gray-400 hover:text-emerald-500 transition-colors"
                        title="Excel İndir"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); generatePersonReport(p.assigned_to, items.filter(i => i.assigned_to === p.assigned_to), p); }}
                        className="p-1.5 rounded-lg hover:bg-azure-50 dark:hover:bg-azure-500/10 text-gray-400 hover:text-azure-500 transition-colors"
                        title="PDF İndir"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <span className={`text-sm font-black ${completionRate >= 70 ? 'text-emerald-600 dark:text-emerald-400' : completionRate >= 40 ? 'text-amber-600 dark:text-amber-400' : 'text-red-500 dark:text-red-400'}`}>
                        %{completionRate}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Person task list */}
          {reportPerson !== 'all' && (
            <div className="bg-white dark:bg-navy-900 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-navy-800">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">{reportPerson} — İş Detayları</h3>
              <div className="space-y-2">
                {items.filter(i => i.assigned_to === reportPerson).map(item => (
                  <div key={item.id} className="flex items-center justify-between py-2.5 px-4 rounded-xl bg-gray-50 dark:bg-navy-800/50 hover:bg-gray-100 dark:hover:bg-navy-800 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-mono font-bold text-azure-600 dark:text-azure-400 flex-shrink-0">{item.project_code}</span>
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{item.task_name}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                      <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500">{item.category}</span>
                      <StatusBadge status={item.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* PROJECT REPORT TAB */}
      {tab === 'reports' && summary && (
        <div className="space-y-6">
          {summary.projectDistribution.map(proj => {
            const projectItems = items.filter(i => i.project_code === proj.project_code && i.project_name === proj.project_name);
            const completionRate = proj.total ? Math.round((proj.completed / proj.total) * 100) : 0;

            return (
              <div key={proj.project_code + proj.project_name} className="bg-white dark:bg-navy-900 rounded-2xl shadow-lg border border-gray-100 dark:border-navy-800 overflow-hidden">
                {/* Project Header */}
                <div className="bg-gradient-to-r from-azure-500 to-blue-600 px-6 py-4 flex items-center justify-between">
                  <div>
                    <span className="text-white/70 text-xs font-mono font-bold">{proj.project_code}</span>
                    <h3 className="text-lg font-bold text-white">{proj.project_name}</h3>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-white/70 text-xs">Tamamlanma</p>
                      <p className="text-2xl font-black text-white">%{completionRate}</p>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                      <span className="text-2xl font-black text-white">{proj.total}</span>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2 flex">
                  <div className="bg-emerald-500 transition-all" style={{ width: `${completionRate}%` }} />
                  <div className="bg-blue-400 transition-all" style={{ width: `${proj.total ? (proj.active / proj.total) * 100 : 0}%` }} />
                  <div className="bg-gray-200 dark:bg-navy-700 flex-1" />
                </div>

                {/* Task list */}
                <div className="p-4">
                  <div className="space-y-1.5">
                    {projectItems.map(item => (
                      <div key={item.id} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-gray-50 dark:hover:bg-navy-800/50 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{item.task_name}</span>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{item.assigned_to}</span>
                          <StatusBadge status={item.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit/Add Modal */}
      {(editItem || showAdd) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-navy-900 rounded-3xl p-6 w-full max-w-lg mx-4 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {editItem ? 'İş Düzenle' : 'Yeni İş Ekle'}
              </h3>
              <button onClick={() => { setEditItem(null); setShowAdd(false); }} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-800 transition-colors">
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
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">İş Adı</label>
                <input value={form.task_name} onChange={e => setForm(f => ({ ...f, task_name: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 dark:border-navy-700 rounded-xl text-sm text-gray-800 dark:text-gray-200 dark:bg-navy-800 focus:outline-none focus:border-azure-400" placeholder="CFD Analiz" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Atanan Kişi</label>
                  <select value={form.assigned_to} onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 dark:border-navy-700 rounded-xl text-sm text-gray-700 dark:text-gray-300 dark:bg-navy-800 focus:outline-none focus:border-azure-400">
                    <option value="">Seçin</option>
                    {filters.people.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Durum</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 dark:border-navy-700 rounded-xl text-sm text-gray-700 dark:text-gray-300 dark:bg-navy-800 focus:outline-none focus:border-azure-400">
                    {filters.statuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Öncelik</label>
                  <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 dark:border-navy-700 rounded-xl text-sm text-gray-700 dark:text-gray-300 dark:bg-navy-800 focus:outline-none focus:border-azure-400">
                    <option value="Yüksek">Yüksek</option>
                    <option value="Orta">Orta</option>
                    <option value="Düşük">Düşük</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Kategori</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 dark:border-navy-700 rounded-xl text-sm text-gray-700 dark:text-gray-300 dark:bg-navy-800 focus:outline-none focus:border-azure-400">
                    {filters.categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Başlangıç</label>
                  <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 dark:border-navy-700 rounded-xl text-sm text-gray-700 dark:text-gray-300 dark:bg-navy-800 focus:outline-none focus:border-azure-400" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Hedef Tarih</label>
                  <input type="date" value={form.target_date} onChange={e => setForm(f => ({ ...f, target_date: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 dark:border-navy-700 rounded-xl text-sm text-gray-700 dark:text-gray-300 dark:bg-navy-800 focus:outline-none focus:border-azure-400" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Notlar</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} className="w-full px-3 py-2.5 border border-gray-200 dark:border-navy-700 rounded-xl text-sm text-gray-800 dark:text-gray-200 dark:bg-navy-800 focus:outline-none focus:border-azure-400 resize-none" placeholder="Ek notlar..." />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              {editItem && (
                <button onClick={() => handleDelete(editItem.id)} className="px-4 py-2.5 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-xl font-semibold text-sm transition-colors flex items-center gap-1.5">
                  <Trash2 className="w-4 h-4" /> Sil
                </button>
              )}
              <div className="flex-1" />
              <button onClick={() => { setEditItem(null); setShowAdd(false); }} className="px-4 py-2.5 bg-gray-100 dark:bg-navy-800 hover:bg-gray-200 dark:hover:bg-navy-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm transition-colors">
                İptal
              </button>
              <button onClick={handleSave} disabled={saving || !form.task_name || !form.project_code} className="px-5 py-2.5 bg-gradient-to-r from-azure-500 to-blue-600 hover:from-azure-600 hover:to-blue-700 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center gap-1.5">
                <Save className="w-4 h-4" /> {saving ? '...' : editItem ? 'Güncelle' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
