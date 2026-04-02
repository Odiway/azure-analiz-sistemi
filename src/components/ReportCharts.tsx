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
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Raporlar</h2>
          <p className="text-gray-500 text-sm mt-1">Azure sunucu kullanım istatistikleri</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-white border border-gray-200 rounded-lg overflow-hidden">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-4 py-2 text-sm font-medium transition-all ${
                  period === p.value
                    ? 'bg-azure-500 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 animate-pulse">
              <div className="h-16 bg-gray-100 rounded-lg" />
            </div>
          ))}
        </div>
      ) : data ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-azure-50 rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-azure-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{data.summary.totalReservations}</p>
                  <p className="text-xs text-gray-500">Toplam Rezervasyon</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <Clock className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{data.summary.totalHours}</p>
                  <p className="text-xs text-gray-500">Toplam Saat</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{data.userStats.length}</p>
                  <p className="text-xs text-gray-500">Aktif Kullanıcı</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {data.summary.totalReservations > 0
                      ? (data.summary.totalHours / data.summary.totalReservations).toFixed(1)
                      : '0'}
                  </p>
                  <p className="text-xs text-gray-500">Ort. Saat/Rez.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Daily Usage Bar Chart */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Günlük Kullanım</h3>
              {dailyChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailyChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                    />
                    <Bar dataKey="saat" fill="#0078D4" radius={[6, 6, 0, 0]} name="Saat" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-400 text-sm">
                  Bu dönemde veri yok
                </div>
              )}
            </div>

            {/* User Distribution Pie */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Kullanıcı Dağılımı</h3>
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
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-400 text-sm">
                  Bu dönemde veri yok
                </div>
              )}
            </div>
          </div>

          {/* Activity Categories */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">İşlem Kategorileri</h3>
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
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-400 text-sm">
                  Bu dönemde veri yok
                </div>
              )}
            </div>

            {/* User Stats Table */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Kullanıcı Detayları</h3>
              {data.userStats.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-3 text-gray-500 font-medium">Kullanıcı</th>
                        <th className="text-center py-3 text-gray-500 font-medium">Rez.</th>
                        <th className="text-center py-3 text-gray-500 font-medium">Saat</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.userStats.map((user, i) => (
                        <tr key={user.userId} className="border-b border-gray-50">
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                              >
                                {user.userName.charAt(0)}
                              </div>
                              <span className="font-medium text-gray-900">{user.userName}</span>
                            </div>
                          </td>
                          <td className="py-3 text-center text-gray-700">{user.reservationCount}</td>
                          <td className="py-3 text-center text-gray-700">{user.totalHours}s</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-400 text-sm">
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
