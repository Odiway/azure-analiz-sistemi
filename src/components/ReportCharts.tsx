'use client';

import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Calendar, Clock, Users, TrendingUp, Download } from 'lucide-react';

interface ReportData {
  period: string;
  startDate: string;
  endDate: string;
  summary: {
    totalReservations: number;
    totalHours: number;
  };
  userStats: Array<{
    userId: number;
    userName: string;
    reservationCount: number;
    totalHours: number;
  }>;
  activityStats: Array<{
    category: string | null;
    count: number;
    totalDuration: number | null;
  }>;
  dailyUsage: Array<{
    date: string;
    count: number;
    totalHours: number;
  }>;
}

const CHART_COLORS = ['#0078D4', '#00A36C', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899'];
const PERIODS = [
  { value: 'daily', label: 'Günlük' },
  { value: 'weekly', label: 'Haftalık' },
  { value: 'monthly', label: 'Aylık' },
  { value: 'yearly', label: 'Yıllık' },
];

export default function ReportCharts() {
  const [period, setPeriod] = useState('weekly');
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, [period]);

  async function fetchReport() {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?period=${period}`);
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }

  function exportCSV() {
    if (!data) return;

    const rows = [
      ['Kullanıcı', 'Rezervasyon Sayısı', 'Toplam Saat'],
      ...data.userStats.map((u) => [u.userName, u.reservationCount.toString(), u.totalHours.toString()]),
    ];

    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rapor-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const dailyChartData =
    data?.dailyUsage.map((d) => ({
      date: new Date(d.date).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' }),
      saat: d.totalHours,
      adet: d.count,
    })) || [];

  const pieData =
    data?.userStats.map((u) => ({
      name: u.userName,
      value: u.totalHours,
    })) || [];

  const activityPieData =
    data?.activityStats
      .filter((a) => a.category)
      .map((a) => ({
        name: a.category || 'Diğer',
        value: a.count,
      })) || [];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-[26px] font-bold text-navy-900 tracking-tight">Raporlar</h2>
          <p className="text-navy-400 text-sm mt-1">Azure sunucu kullanım istatistikleri</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-white/70 backdrop-blur-sm border border-navy-100/40 rounded-xl overflow-hidden p-1">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  period === p.value
                    ? 'bg-white text-navy-900 shadow-sm'
                    : 'text-navy-400 hover:text-navy-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2.5 border border-navy-200/50 text-navy-600 rounded-xl text-sm font-medium hover:bg-navy-50/60 transition-all duration-200"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-navy-100/40 animate-pulse">
              <div className="h-16 bg-navy-50/50 rounded-xl" />
            </div>
          ))}
        </div>
      ) : data ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { icon: Calendar, label: 'Toplam Rezervasyon', value: data.summary.totalReservations, color: 'azure' },
              { icon: Clock, label: 'Toplam Saat', value: data.summary.totalHours, color: 'emerald' },
              { icon: Users, label: 'Aktif Kullanıcı', value: data.userStats.length, color: 'purple' },
              { icon: TrendingUp, label: 'Ort. Saat/Rez.', value: data.summary.totalReservations > 0 ? (data.summary.totalHours / data.summary.totalReservations).toFixed(1) : '0', color: 'amber' },
            ].map((card, i) => (
              <div key={i} className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 border border-navy-100/40 hover:bg-white/90 hover:shadow-card transition-all duration-300">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 bg-${card.color}-50/80 rounded-xl flex items-center justify-center`}>
                    <card.icon className={`w-[18px] h-[18px] text-${card.color}-500`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-navy-900">{card.value}</p>
                    <p className="text-xs text-navy-400">{card.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-navy-100/40">
              <h3 className="text-[15px] font-semibold text-navy-800 mb-4">Günlük Kullanım</h3>
              {dailyChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailyChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e8ecf0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#8896a8' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#8896a8' }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid rgba(0,0,0,0.06)',
                        boxShadow: '0 8px 30px -4px rgb(0 0 0 / 0.08)',
                        backdropFilter: 'blur(12px)',
                        background: 'rgba(255,255,255,0.92)',
                      }}
                    />
                    <Bar dataKey="saat" fill="#0078D4" radius={[8, 8, 0, 0]} name="Saat" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-navy-300 text-sm">
                  Bu dönemde veri yok
                </div>
              )}
            </div>

            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-navy-100/40">
              <h3 className="text-[15px] font-semibold text-navy-800 mb-4">Kullanıcı Dağılımı</h3>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} (${(percent * 100).toFixed(0)}%)`
                      }
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid rgba(0,0,0,0.06)',
                        boxShadow: '0 8px 30px -4px rgb(0 0 0 / 0.08)',
                        background: 'rgba(255,255,255,0.92)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-navy-300 text-sm">
                  Bu dönemde veri yok
                </div>
              )}
            </div>
          </div>

          {/* Activity Categories + User Table */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-navy-100/40">
              <h3 className="text-[15px] font-semibold text-navy-800 mb-4">İşlem Kategorileri</h3>
              {activityPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={activityPieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label
                    >
                      {activityPieData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid rgba(0,0,0,0.06)',
                        boxShadow: '0 8px 30px -4px rgb(0 0 0 / 0.08)',
                        background: 'rgba(255,255,255,0.92)',
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-navy-300 text-sm">
                  Bu dönemde veri yok
                </div>
              )}
            </div>

            {/* User Stats Table */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-navy-100/40">
              <h3 className="text-[15px] font-semibold text-navy-800 mb-4">Kullanıcı Detayları</h3>
              {data.userStats.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-navy-100/40">
                        <th className="text-left py-3 text-navy-400 font-medium text-xs uppercase tracking-wider">Kullanıcı</th>
                        <th className="text-center py-3 text-navy-400 font-medium text-xs uppercase tracking-wider">Rez.</th>
                        <th className="text-center py-3 text-navy-400 font-medium text-xs uppercase tracking-wider">Saat</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.userStats.map((user, i) => (
                        <tr key={user.userId} className="border-b border-navy-50/30 hover:bg-navy-50/20 transition-colors">
                          <td className="py-3">
                            <div className="flex items-center gap-2.5">
                              <div
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                                style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                              >
                                {user.userName.charAt(0)}
                              </div>
                              <span className="font-medium text-navy-800">{user.userName}</span>
                            </div>
                          </td>
                          <td className="py-3 text-center text-navy-600">{user.reservationCount}</td>
                          <td className="py-3 text-center text-navy-600">{user.totalHours}s</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-navy-300 text-sm">
                  Bu dönemde veri yok
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
