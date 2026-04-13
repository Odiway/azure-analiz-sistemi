import * as XLSX from 'xlsx';

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
}

interface PersonWorkload {
  assigned_to: string;
  total: number;
  active: number;
  completed: number;
  not_started: number;
}

interface SummaryData {
  statusDistribution: { status: string; count: number }[];
  personWorkload: PersonWorkload[];
  categoryDistribution: { category: string; count: number }[];
  projectDistribution: { project_code: string; project_name: string; total: number; completed: number; active: number }[];
  totalHours: { total: number; items_with_logs: number };
}

function formatDate(d: string | null) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function generateGeneralExcel(items: WorkItem[], summary: SummaryData) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Tüm İş Kalemleri
  const itemRows = items.map((item, i) => ({
    '#': i + 1,
    'Proje Kodu': item.project_code,
    'Proje Adı': item.project_name,
    'İş Adı': item.task_name,
    'Atanan Kişi': item.assigned_to,
    'Durum': item.status,
    'Öncelik': item.priority,
    'Kategori': item.category,
    'Başlangıç': formatDate(item.start_date),
    'Hedef Tarih': formatDate(item.target_date),
    'Tamamlanma': formatDate(item.completed_date),
    'Notlar': item.notes || '',
  }));
  const ws1 = XLSX.utils.json_to_sheet(itemRows);
  // Set column widths
  ws1['!cols'] = [
    { wch: 4 }, { wch: 12 }, { wch: 25 }, { wch: 40 }, { wch: 18 },
    { wch: 16 }, { wch: 10 }, { wch: 18 }, { wch: 12 }, { wch: 12 },
    { wch: 12 }, { wch: 30 },
  ];
  XLSX.utils.book_append_sheet(wb, ws1, 'Tüm İşler');

  // Sheet 2: Kişi Bazlı Özet
  const personRows = summary.personWorkload.map(p => ({
    'Kişi': p.assigned_to,
    'Toplam': p.total,
    'Devam Eden': p.active,
    'Tamamlanan': p.completed,
    'Başlanmamış': p.not_started,
    'Tamamlanma %': p.total ? Math.round((p.completed / p.total) * 100) : 0,
  }));
  const ws2 = XLSX.utils.json_to_sheet(personRows);
  ws2['!cols'] = [{ wch: 20 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, ws2, 'Kişi Özeti');

  // Sheet 3: Proje Bazlı Özet
  const projectRows = summary.projectDistribution.map(p => ({
    'Proje Kodu': p.project_code,
    'Proje Adı': p.project_name,
    'Toplam': p.total,
    'Tamamlanan': p.completed,
    'Devam Eden': p.active,
    'Tamamlanma %': p.total ? Math.round((p.completed / p.total) * 100) : 0,
  }));
  const ws3 = XLSX.utils.json_to_sheet(projectRows);
  ws3['!cols'] = [{ wch: 12 }, { wch: 25 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, ws3, 'Proje Özeti');

  // Sheet 4: Kategori Dağılımı
  const catRows = summary.categoryDistribution.map(c => ({
    'Kategori': c.category,
    'İş Sayısı': c.count,
  }));
  const ws4 = XLSX.utils.json_to_sheet(catRows);
  ws4['!cols'] = [{ wch: 20 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, ws4, 'Kategoriler');

  XLSX.writeFile(wb, `TEMSA_CAE_Genel_Rapor_${new Date().toISOString().split('T')[0]}.xlsx`);
}

export function generatePersonExcel(personName: string, items: WorkItem[], workload: PersonWorkload) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Özet
  const summaryRows = [
    { 'Metrik': 'Toplam İş', 'Değer': workload.total },
    { 'Metrik': 'Devam Eden', 'Değer': workload.active },
    { 'Metrik': 'Tamamlanan', 'Değer': workload.completed },
    { 'Metrik': 'Başlanmamış', 'Değer': workload.not_started },
    { 'Metrik': 'Tamamlanma %', 'Değer': workload.total ? Math.round((workload.completed / workload.total) * 100) : 0 },
  ];
  const ws1 = XLSX.utils.json_to_sheet(summaryRows);
  ws1['!cols'] = [{ wch: 16 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, ws1, 'Özet');

  // Sheet 2: Tüm İşler
  const itemRows = items.map((item, i) => ({
    '#': i + 1,
    'Proje Kodu': item.project_code,
    'Proje Adı': item.project_name,
    'İş Adı': item.task_name,
    'Durum': item.status,
    'Öncelik': item.priority,
    'Kategori': item.category,
    'Başlangıç': formatDate(item.start_date),
    'Hedef Tarih': formatDate(item.target_date),
    'Tamamlanma': formatDate(item.completed_date),
    'Notlar': item.notes || '',
  }));
  const ws2 = XLSX.utils.json_to_sheet(itemRows);
  ws2['!cols'] = [
    { wch: 4 }, { wch: 12 }, { wch: 25 }, { wch: 40 },
    { wch: 16 }, { wch: 10 }, { wch: 18 }, { wch: 12 },
    { wch: 12 }, { wch: 12 }, { wch: 30 },
  ];
  XLSX.utils.book_append_sheet(wb, ws2, 'İşler');

  const safeName = personName.replace(/[^a-zA-Z0-9\u00C0-\u024F]/g, '_');
  XLSX.writeFile(wb, `TEMSA_CAE_${safeName}_${new Date().toISOString().split('T')[0]}.xlsx`);
}
