import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// TEMSA corporate colors
const TEMSA_BLUE = [0, 82, 155] as const;      // #00529B
const TEMSA_DARK = [26, 32, 44] as const;       // #1A202C
const HEADER_BG = [0, 82, 155] as const;
const LIGHT_BLUE = [235, 245, 255] as const;
const LIGHT_GRAY = [248, 250, 252] as const;
const WHITE = [255, 255, 255] as const;
const TEXT_DARK = [30, 30, 30] as const;
const TEXT_MEDIUM = [100, 100, 100] as const;
const GREEN = [16, 185, 129] as const;
const BLUE = [59, 130, 246] as const;
const AMBER = [245, 158, 11] as const;
const RED = [239, 68, 68] as const;
const GRAY = [156, 163, 175] as const;

// Font name constant
const FONT = 'Roboto';

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

// ===================== FONT LOADING =====================
let fontCache: { regular: string; bold: string } | null = null;

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    for (let j = 0; j < chunk.length; j++) {
      binary += String.fromCharCode(chunk[j]);
    }
  }
  return btoa(binary);
}

async function loadTurkishFonts(doc: jsPDF) {
  if (!fontCache) {
    const [regularRes, boldRes] = await Promise.all([
      fetch('/fonts/Roboto-Regular.ttf'),
      fetch('/fonts/Roboto-Bold.ttf'),
    ]);
    const [regularBuf, boldBuf] = await Promise.all([
      regularRes.arrayBuffer(),
      boldRes.arrayBuffer(),
    ]);
    fontCache = {
      regular: arrayBufferToBase64(regularBuf),
      bold: arrayBufferToBase64(boldBuf),
    };
  }

  doc.addFileToVFS('Roboto-Regular.ttf', fontCache.regular);
  doc.addFont('Roboto-Regular.ttf', FONT, 'normal');
  doc.addFileToVFS('Roboto-Bold.ttf', fontCache.bold);
  doc.addFont('Roboto-Bold.ttf', FONT, 'bold');
  doc.setFont(FONT);
}

function formatDateTR(d: string | null) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function nowTR() {
  return new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function addCorporateHeader(doc: jsPDF, title: string, subtitle?: string) {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Top blue band
  doc.setFillColor(...TEMSA_BLUE);
  doc.rect(0, 0, pageWidth, 38, 'F');

  // Accent line under blue band
  doc.setFillColor(0, 120, 210);
  doc.rect(0, 38, pageWidth, 1.5, 'F');

  // TEMSA text
  doc.setFont(FONT, 'bold');
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text('TEMSA', 15, 18);

  // Department text
  doc.setFontSize(9);
  doc.setFont(FONT, 'normal');
  doc.setTextColor(200, 220, 255);
  doc.text('CAE Departmanı', 15, 26);

  // Date on right
  doc.setFontSize(8);
  doc.setTextColor(200, 220, 255);
  doc.text(nowTR(), pageWidth - 15, 18, { align: 'right' });

  // Confidential badge
  doc.setFontSize(7);
  doc.setTextColor(255, 200, 100);
  doc.setFont(FONT, 'bold');
  doc.text('GİZLİ / CONFIDENTIAL', pageWidth - 15, 26, { align: 'right' });

  // Report title
  doc.setFontSize(16);
  doc.setFont(FONT, 'bold');
  doc.setTextColor(...TEMSA_DARK);
  doc.text(title, 15, 52);

  if (subtitle) {
    doc.setFontSize(10);
    doc.setFont(FONT, 'normal');
    doc.setTextColor(...TEXT_MEDIUM);
    doc.text(subtitle, 15, 60);
  }

  // Thin line under title
  doc.setDrawColor(200, 210, 230);
  doc.setLineWidth(0.3);
  doc.line(15, subtitle ? 64 : 56, pageWidth - 15, subtitle ? 64 : 56);

  return subtitle ? 70 : 62;
}

function addCorporateFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Bottom band
    doc.setFillColor(245, 247, 250);
    doc.rect(0, pageHeight - 16, pageWidth, 16, 'F');
    doc.setDrawColor(200, 210, 230);
    doc.setLineWidth(0.3);
    doc.line(0, pageHeight - 16, pageWidth, pageHeight - 16);

    // Left - Company info
    doc.setFont(FONT, 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(130, 130, 130);
    doc.text('TEMSA Ulaşım Araçları A.Ş. | CAE Departmanı | İş Takip Sistemi', 15, pageHeight - 9);

    // Center - Page numbers
    doc.setFont(FONT, 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text(`Sayfa ${i} / ${pageCount}`, pageWidth / 2, pageHeight - 9, { align: 'center' });

    // Right - Date
    doc.setFont(FONT, 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(130, 130, 130);
    doc.text(nowTR(), pageWidth - 15, pageHeight - 9, { align: 'right' });
  }
}

function drawStatBox(doc: jsPDF, x: number, y: number, w: number, h: number, label: string, value: string, color: readonly [number, number, number]) {
  // Card shadow effect
  doc.setFillColor(230, 235, 240);
  doc.roundedRect(x + 0.5, y + 0.5, w, h, 3, 3, 'F');

  // Card background
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(x, y, w, h, 3, 3, 'F');

  // Top color accent
  doc.setFillColor(...color);
  doc.roundedRect(x, y, w, 4, 3, 3, 'F');
  doc.setFillColor(255, 255, 255);
  doc.rect(x, y + 3, w, 2, 'F');

  // Value
  doc.setFont(FONT, 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...color);
  doc.text(value, x + w / 2, y + h / 2 + 1, { align: 'center' });

  // Label
  doc.setFont(FONT, 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...TEXT_MEDIUM);
  doc.text(label, x + w / 2, y + h - 5, { align: 'center' });
}

function drawProgressBar(doc: jsPDF, x: number, y: number, w: number, h: number, segments: { pct: number; color: readonly [number, number, number] }[]) {
  // Background
  doc.setFillColor(230, 235, 240);
  doc.roundedRect(x, y, w, h, h / 2, h / 2, 'F');

  let offsetX = x;
  for (const seg of segments) {
    const segW = w * (seg.pct / 100);
    if (segW > 0) {
      doc.setFillColor(seg.color[0], seg.color[1], seg.color[2]);
      doc.rect(offsetX, y, segW, h, 'F');
      offsetX += segW;
    }
  }
  // Round caps
  if (segments.length > 0 && segments[0].pct > 0) {
    doc.setFillColor(segments[0].color[0], segments[0].color[1], segments[0].color[2]);
    doc.circle(x + h / 2, y + h / 2, h / 2, 'F');
  }
}

// ===================== GENERAL REPORT =====================
export async function generateGeneralReport(items: WorkItem[], summary: SummaryData) {
  const doc = new jsPDF('p', 'mm', 'a4');
  await loadTurkishFonts(doc);
  const pageWidth = doc.internal.pageSize.getWidth();

  // PAGE 1: Overview
  let startY = addCorporateHeader(doc, 'Genel İş Takip Raporu', 'CAE Departmanı - Tüm Proje ve İş Kalemleri Özeti');

  const total = summary.statusDistribution.reduce((s, d) => s + d.count, 0);
  const active = summary.statusDistribution.find(d => d.status === 'Devam Ediyor')?.count || 0;
  const completed = summary.statusDistribution.find(d => d.status === 'Tamamlandı')?.count || 0;
  const notStarted = summary.statusDistribution.find(d => d.status === 'Başlanmadı')?.count || 0;
  const completionRate = total ? Math.round((completed / total) * 100) : 0;

  // Stat boxes
  const boxW = (pageWidth - 40) / 5;
  const boxH = 28;
  const boxes = [
    { label: 'Toplam İş', value: total.toString(), color: TEMSA_BLUE },
    { label: 'Devam Eden', value: active.toString(), color: BLUE },
    { label: 'Tamamlanan', value: completed.toString(), color: GREEN },
    { label: 'Başlanmamış', value: notStarted.toString(), color: GRAY },
    { label: 'Tamamlanma', value: `%${completionRate}`, color: completionRate >= 70 ? GREEN : completionRate >= 40 ? AMBER : RED },
  ];
  boxes.forEach((b, i) => drawStatBox(doc, 15 + i * (boxW + 2.5), startY, boxW, boxH, b.label, b.value, b.color));

  startY += boxH + 12;

  // Section: Status Distribution
  doc.setFont(FONT, 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...TEMSA_DARK);
  doc.text('Durum Dağılımı', 15, startY);
  startY += 6;

  const barW = pageWidth - 30;
  summary.statusDistribution.forEach((d, i) => {
    const pct = total ? (d.count / total) * 100 : 0;
    const statusColors: (readonly [number, number, number])[] = [BLUE, GREEN, GRAY, AMBER];
    const col = statusColors[i] || BLUE;

    doc.setFillColor(240, 242, 246);
    doc.roundedRect(15, startY, barW, 7, 2, 2, 'F');
    if (pct > 0) {
      doc.setFillColor(...col);
      doc.roundedRect(15, startY, barW * (pct / 100), 7, 2, 2, 'F');
    }
    doc.setFont(FONT, 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...TEXT_DARK);
    doc.text(`${d.status}: ${d.count} (%${Math.round(pct)})`, 17, startY + 5);
    startY += 10;
  });

  startY += 6;

  // Section: Person Workload Table
  doc.setFont(FONT, 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...TEMSA_DARK);
  doc.text('Kişi Bazlı İş Yükü', 15, startY);
  startY += 4;

  autoTable(doc, {
    startY,
    head: [['Kişi', 'Toplam', 'Devam Eden', 'Tamamlanan', 'Başlanmamış', 'Tamamlanma %']],
    body: summary.personWorkload.map(p => [
      p.assigned_to,
      p.total.toString(),
      p.active.toString(),
      p.completed.toString(),
      p.not_started.toString(),
      `%${p.total ? Math.round((p.completed / p.total) * 100) : 0}`,
    ]),
    theme: 'grid',
    headStyles: { fillColor: [...TEMSA_BLUE], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8, cellPadding: 3 },
    bodyStyles: { fontSize: 8, cellPadding: 2.5, textColor: [...TEXT_DARK] },
    alternateRowStyles: { fillColor: [...LIGHT_BLUE] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 35 },
      1: { halign: 'center', cellWidth: 22 },
      2: { halign: 'center', cellWidth: 25 },
      3: { halign: 'center', cellWidth: 27 },
      4: { halign: 'center', cellWidth: 27 },
      5: { halign: 'center', cellWidth: 27, fontStyle: 'bold' },
    },
    margin: { left: 15, right: 15 },
    styles: { lineColor: [220, 225, 235], lineWidth: 0.2, font: 'Roboto' },
  });

  // PAGE 2: Category + Project Distribution
  doc.addPage();
  startY = addCorporateHeader(doc, 'Kategori ve Proje Dağılımı', 'Detaylı iş kalemi dağılım analizi');

  // Category Table
  doc.setFont(FONT, 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...TEMSA_DARK);
  doc.text('Kategori Bazlı Dağılım', 15, startY);
  startY += 4;

  autoTable(doc, {
    startY,
    head: [['Kategori', 'İş Sayısı', 'Oran']],
    body: summary.categoryDistribution.map(c => [c.category, c.count.toString(), `%${total ? Math.round((c.count / total) * 100) : 0}`]),
    theme: 'grid',
    headStyles: { fillColor: [...TEMSA_BLUE], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8, cellPadding: 3 },
    bodyStyles: { fontSize: 8, cellPadding: 2.5, textColor: [...TEXT_DARK] },
    alternateRowStyles: { fillColor: [...LIGHT_BLUE] },
    columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'center' }, 2: { halign: 'center' } },
    margin: { left: 15, right: 15 },
    styles: { lineColor: [220, 225, 235], lineWidth: 0.2, font: 'Roboto' },
  });

  startY = (doc as any).lastAutoTable.finalY + 14;

  // Project Table
  doc.setFont(FONT, 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...TEMSA_DARK);
  doc.text('Proje Bazlı Dağılım', 15, startY);
  startY += 4;

  autoTable(doc, {
    startY,
    head: [['Proje Kodu', 'Proje Adı', 'Toplam', 'Tamamlanan', 'Devam Eden', 'Tamamlanma %']],
    body: summary.projectDistribution.map(p => [
      p.project_code, p.project_name, p.total.toString(), p.completed.toString(), p.active.toString(),
      `%${p.total ? Math.round((p.completed / p.total) * 100) : 0}`,
    ]),
    theme: 'grid',
    headStyles: { fillColor: [...TEMSA_BLUE], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8, cellPadding: 3 },
    bodyStyles: { fontSize: 8, cellPadding: 2.5, textColor: [...TEXT_DARK] },
    alternateRowStyles: { fillColor: [...LIGHT_BLUE] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 22 },
      2: { halign: 'center', cellWidth: 18 },
      3: { halign: 'center', cellWidth: 24 },
      4: { halign: 'center', cellWidth: 24 },
      5: { halign: 'center', cellWidth: 24, fontStyle: 'bold' },
    },
    margin: { left: 15, right: 15 },
    styles: { lineColor: [220, 225, 235], lineWidth: 0.2, font: 'Roboto' },
  });

  // PAGE 3+: Full work item list
  doc.addPage();
  startY = addCorporateHeader(doc, 'Tüm İş Kalemleri Listesi', `Toplam ${items.length} iş kalemi`);

  autoTable(doc, {
    startY,
    head: [['#', 'Proje', 'İş Adı', 'Kişi', 'Durum', 'Öncelik', 'Kategori']],
    body: items.map((item, i) => [
      (i + 1).toString(),
      item.project_code,
      item.task_name,
      item.assigned_to,
      item.status,
      item.priority,
      item.category,
    ]),
    theme: 'grid',
    headStyles: { fillColor: [...TEMSA_BLUE], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5, cellPadding: 3 },
    bodyStyles: { fontSize: 7, cellPadding: 2, textColor: [...TEXT_DARK] },
    alternateRowStyles: { fillColor: [...LIGHT_GRAY] },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 18, fontStyle: 'bold' },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 24 },
      4: { cellWidth: 25 },
      5: { cellWidth: 18, halign: 'center' },
      6: { cellWidth: 28 },
    },
    margin: { left: 15, right: 15 },
    styles: { lineColor: [220, 225, 235], lineWidth: 0.2, overflow: 'linebreak', font: 'Roboto' },
    didParseCell: (data: any) => {
      if (data.section === 'body' && data.column.index === 4) {
        const val = data.cell.raw;
        if (val === 'Tamamlandı') { data.cell.styles.textColor = [...GREEN]; data.cell.styles.fontStyle = 'bold'; }
        else if (val === 'Devam Ediyor') { data.cell.styles.textColor = [...BLUE]; data.cell.styles.fontStyle = 'bold'; }
        else if (val === 'Başlanmadı') { data.cell.styles.textColor = [...GRAY]; }
        else if (val === 'Data Bekleniyor') { data.cell.styles.textColor = [...AMBER]; data.cell.styles.fontStyle = 'bold'; }
      }
      if (data.section === 'body' && data.column.index === 5) {
        const val = data.cell.raw;
        if (val === 'Yüksek') { data.cell.styles.textColor = [...RED]; data.cell.styles.fontStyle = 'bold'; }
        else if (val === 'Düşük') { data.cell.styles.textColor = [...GREEN]; }
      }
    },
  });

  addCorporateFooter(doc);
  doc.save(`TEMSA_CAE_Genel_Rapor_${new Date().toISOString().split('T')[0]}.pdf`);
}

// ===================== PERSON REPORT =====================
export async function generatePersonReport(
  personName: string,
  items: WorkItem[],
  workload: PersonWorkload,
) {
  const doc = new jsPDF('p', 'mm', 'a4');
  await loadTurkishFonts(doc);
  const pageWidth = doc.internal.pageSize.getWidth();

  let startY = addCorporateHeader(doc, `Kişi Raporu: ${personName}`, 'Bireysel iş takip ve performans raporu');

  const completionRate = workload.total ? Math.round((workload.completed / workload.total) * 100) : 0;

  // Stat boxes
  const boxW = (pageWidth - 40) / 4;
  const boxH = 30;
  const stats = [
    { label: 'Toplam İş', value: workload.total.toString(), color: TEMSA_BLUE },
    { label: 'Devam Eden', value: workload.active.toString(), color: BLUE },
    { label: 'Tamamlanan', value: workload.completed.toString(), color: GREEN },
    { label: 'Tamamlanma', value: `%${completionRate}`, color: completionRate >= 70 ? GREEN : completionRate >= 40 ? AMBER : RED },
  ];
  stats.forEach((s, i) => drawStatBox(doc, 15 + i * (boxW + 3.3), startY, boxW, boxH, s.label, s.value, s.color));

  startY += boxH + 12;

  // Progress bar 
  doc.setFont(FONT, 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...TEMSA_DARK);
  doc.text('İlerleme Durumu', 15, startY);
  startY += 5;

  const barTotal = workload.total || 1;
  drawProgressBar(doc, 15, startY, pageWidth - 30, 6, [
    { pct: (workload.completed / barTotal) * 100, color: GREEN },
    { pct: (workload.active / barTotal) * 100, color: BLUE },
    { pct: (workload.not_started / barTotal) * 100, color: GRAY },
  ]);
  startY += 10;

  // Legend
  const legendItems: { label: string; color: readonly [number, number, number] }[] = [
    { label: `Tamamlanan: ${workload.completed}`, color: GREEN },
    { label: `Devam Eden: ${workload.active}`, color: BLUE },
    { label: `Başlanmamış: ${workload.not_started}`, color: GRAY },
  ];
  let legendX = 15;
  legendItems.forEach(item => {
    doc.setFillColor(item.color[0], item.color[1], item.color[2]);
    doc.circle(legendX + 2, startY + 1.5, 1.5, 'F');
    doc.setFont(FONT, 'normal');
    doc.setFontSize(7);
    doc.setTextColor(TEXT_MEDIUM[0], TEXT_MEDIUM[1], TEXT_MEDIUM[2]);
    doc.text(item.label, legendX + 6, startY + 2.5);
    legendX += 45;
  });
  startY += 12;

  // Active work items table
  const activeItems = items.filter(i => i.status === 'Devam Ediyor');
  if (activeItems.length > 0) {
    doc.setFont(FONT, 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...TEMSA_BLUE);
    doc.text(`Devam Eden İşler (${activeItems.length})`, 15, startY);
    startY += 4;

    autoTable(doc, {
      startY,
      head: [['Proje Kodu', 'Proje Adı', 'İş Adı', 'Öncelik', 'Kategori']],
      body: activeItems.map(item => [item.project_code, item.project_name, item.task_name, item.priority, item.category]),
      theme: 'grid',
      headStyles: { fillColor: [...BLUE], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8, cellPadding: 3 },
      bodyStyles: { fontSize: 7.5, cellPadding: 2.5, textColor: [...TEXT_DARK] },
      alternateRowStyles: { fillColor: [235, 245, 255] },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 22 }, 3: { halign: 'center', cellWidth: 20 }, 4: { cellWidth: 30 } },
      margin: { left: 15, right: 15 },
      styles: { lineColor: [220, 225, 235], lineWidth: 0.2, overflow: 'linebreak', font: 'Roboto' },
    });
    startY = (doc as any).lastAutoTable.finalY + 10;
  }

  // Completed work items table
  const completedItems = items.filter(i => i.status === 'Tamamlandı');
  if (completedItems.length > 0) {
    if (startY > 230) { doc.addPage(); startY = 25; }

    doc.setFont(FONT, 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...GREEN);
    doc.text(`Tamamlanan İşler (${completedItems.length})`, 15, startY);
    startY += 4;

    autoTable(doc, {
      startY,
      head: [['Proje Kodu', 'Proje Adı', 'İş Adı', 'Kategori']],
      body: completedItems.map(item => [item.project_code, item.project_name, item.task_name, item.category]),
      theme: 'grid',
      headStyles: { fillColor: [...GREEN], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8, cellPadding: 3 },
      bodyStyles: { fontSize: 7.5, cellPadding: 2.5, textColor: [...TEXT_DARK] },
      alternateRowStyles: { fillColor: [236, 253, 245] },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 22 }, 3: { cellWidth: 30 } },
      margin: { left: 15, right: 15 },
      styles: { lineColor: [220, 225, 235], lineWidth: 0.2, overflow: 'linebreak', font: 'Roboto' },
    });
    startY = (doc as any).lastAutoTable.finalY + 10;
  }

  // Not started items
  const nsItems = items.filter(i => i.status === 'Başlanmadı');
  if (nsItems.length > 0) {
    if (startY > 230) { doc.addPage(); startY = 25; }

    doc.setFont(FONT, 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...GRAY);
    doc.text(`Başlanmamış İşler (${nsItems.length})`, 15, startY);
    startY += 4;

    autoTable(doc, {
      startY,
      head: [['Proje Kodu', 'Proje Adı', 'İş Adı', 'Kategori']],
      body: nsItems.map(item => [item.project_code, item.project_name, item.task_name, item.category]),
      theme: 'grid',
      headStyles: { fillColor: [140, 150, 165], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8, cellPadding: 3 },
      bodyStyles: { fontSize: 7.5, cellPadding: 2.5, textColor: [...TEXT_DARK] },
      alternateRowStyles: { fillColor: [...LIGHT_GRAY] },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 22 }, 3: { cellWidth: 30 } },
      margin: { left: 15, right: 15 },
      styles: { lineColor: [220, 225, 235], lineWidth: 0.2, overflow: 'linebreak', font: 'Roboto' },
    });
  }

  // Full list on new page
  doc.addPage();
  startY = addCorporateHeader(doc, `${personName} - Tüm İşler`, `Toplam ${items.length} iş kalemi`);

  autoTable(doc, {
    startY,
    head: [['#', 'Proje', 'İş Adı', 'Durum', 'Öncelik', 'Kategori']],
    body: items.map((item, i) => [(i + 1).toString(), item.project_code, item.task_name, item.status, item.priority, item.category]),
    theme: 'grid',
    headStyles: { fillColor: [...TEMSA_BLUE], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8, cellPadding: 3 },
    bodyStyles: { fontSize: 7.5, cellPadding: 2.5, textColor: [...TEXT_DARK] },
    alternateRowStyles: { fillColor: [...LIGHT_GRAY] },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 20, fontStyle: 'bold' },
      3: { cellWidth: 25 },
      4: { cellWidth: 18, halign: 'center' },
      5: { cellWidth: 28 },
    },
    margin: { left: 15, right: 15 },
    styles: { lineColor: [220, 225, 235], lineWidth: 0.2, overflow: 'linebreak', font: 'Roboto' },
    didParseCell: (data: any) => {
      if (data.section === 'body' && data.column.index === 3) {
        const val = data.cell.raw;
        if (val === 'Tamamlandı') { data.cell.styles.textColor = [...GREEN]; data.cell.styles.fontStyle = 'bold'; }
        else if (val === 'Devam Ediyor') { data.cell.styles.textColor = [...BLUE]; data.cell.styles.fontStyle = 'bold'; }
        else if (val === 'Data Bekleniyor') { data.cell.styles.textColor = [...AMBER]; data.cell.styles.fontStyle = 'bold'; }
      }
    },
  });

  addCorporateFooter(doc);
  const safeName = personName.replace(/[^a-zA-Z0-9\u00C0-\u024F]/g, '_');
  doc.save(`TEMSA_CAE_Kisi_Raporu_${safeName}_${new Date().toISOString().split('T')[0]}.pdf`);
}
