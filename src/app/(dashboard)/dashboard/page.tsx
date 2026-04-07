'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useRef, useCallback } from 'react';
import {
  Monitor, LogIn, LogOut, Clock, User, Bell, Wifi, Shield,
  Users, ListOrdered, Timer, X, Activity, CheckCircle,
} from 'lucide-react';

interface SessionInfo {
  userName: string;
  userId: number;
  startedAt: string;
  estimatedMinutes: number;
}

interface AnalysisInfo {
  userName: string;
  userId: number;
  startedAt: string;
  estimatedMinutes: number;
}

interface QueueItem {
  userId: number;
  userName: string;
  position: number;
}

interface ServerData {
  session: SessionInfo | null;
  queue: QueueItem[];
  analysis: AnalysisInfo | null;
}

interface ServersState {
  'azure-1': ServerData;
  'azure-2': ServerData;
}

const emptyState: ServersState = {
  'azure-1': { session: null, queue: [], analysis: null },
  'azure-2': { session: null, queue: [], analysis: null },
};

function formatDuration(startedAt: string): string {
  const diff = Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

function formatETA(startedAt: string, estimatedMinutes: number): string {
  const endTime = new Date(new Date(startedAt).getTime() + estimatedMinutes * 60000);
  const remaining = Math.max(0, Math.floor((endTime.getTime() - Date.now()) / 60000));
  if (remaining === 0) return 'Süre doldu';
  if (remaining >= 1440) return `~${Math.floor(remaining / 1440)} gün ${Math.floor((remaining % 1440) / 60)} sa kaldı`;
  if (remaining >= 60) return `~${Math.floor(remaining / 60)} sa ${remaining % 60} dk kaldı`;
  return `~${remaining} dk kaldı`;
}

function isOvertime(startedAt: string, estimatedMinutes: number): boolean {
  return Date.now() > new Date(startedAt).getTime() + estimatedMinutes * 60000;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [servers, setServers] = useState<ServersState>(emptyState);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [, setTick] = useState(0);
  const [toasts, setToasts] = useState<{ id: number; msg: string; type: 'success' | 'info' | 'warn' }[]>([]);
  const prevRef = useRef<ServersState>(emptyState);
  const toastId = useRef(0);
  const firstLoad = useRef(true);

  // Enter modal
  const [showEnterModal, setShowEnterModal] = useState<string | null>(null);
  const [enterMinutes, setEnterMinutes] = useState(60);

  // Exit modal
  const [showExitModal, setShowExitModal] = useState<string | null>(null);
  const [exitHasAnalysis, setExitHasAnalysis] = useState(false);
  const [exitAnalysisMinutes, setExitAnalysisMinutes] = useState(120);

  const toast = useCallback((msg: string, type: 'success' | 'info' | 'warn' = 'info') => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000);
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/servers/status?_=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (res.ok) {
        const data: ServersState = await res.json();
        if (!firstLoad.current) {
          const prev = prevRef.current;
          const me = session?.user?.id ? parseInt(session.user.id) : null;
          for (const name of ['azure-1', 'azure-2'] as const) {
            const dn = name === 'azure-1' ? 'Azure 1' : 'Azure 2';
            if (prev[name].session && !data[name].session) {
              toast(`${dn} artık müsait!`, 'success');
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('Sunucu Müsait', { body: `${dn} artık boş!` });
              }
            }
            if (!prev[name].session && data[name].session && data[name].session!.userId !== me) {
              toast(`${dn} → ${data[name].session!.userName} giriş yaptı`, 'info');
            }
          }
        }
        firstLoad.current = false;
        prevRef.current = data;
        setServers(data);
      }
    } catch {} finally { setLoading(false); }
  }, [toast, session?.user?.id]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
    fetchStatus();
    const i = setInterval(fetchStatus, 2000);
    return () => clearInterval(i);
  }, [fetchStatus]);

  useEffect(() => {
    const t = setInterval(() => setTick((v) => v + 1), 1000);
    return () => clearInterval(t);
  }, []);

  async function handleEnter(serverName: string) {
    setActionLoading(serverName);
    try {
      const res = await fetch('/api/servers/enter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverName, estimatedMinutes: enterMinutes }),
      });
      const data = await res.json();
      if (!res.ok) toast(data.error, 'warn');
      else toast(`Giriş başarılı! (ntfy: ${data.ntfy || 'yok'})`, 'success');
      await fetchStatus();
    } catch { toast('Bağlantı hatası', 'warn'); }
    finally { setActionLoading(null); setShowEnterModal(null); }
  }

  async function handleExit(serverName: string) {
    setActionLoading(serverName);
    try {
      const res = await fetch('/api/servers/exit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverName,
          hasAnalysis: exitHasAnalysis,
          analysisMinutes: exitHasAnalysis ? exitAnalysisMinutes : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) toast(data.error, 'warn');
      else toast(`${exitHasAnalysis ? 'Çıkış yapıldı, analiz devam ediyor' : 'Çıkış başarılı!'} (ntfy: ${data.ntfy || 'yok'})`, 'success');
      await fetchStatus();
    } catch { toast('Bağlantı hatası', 'warn'); }
    finally { setActionLoading(null); setShowExitModal(null); setExitHasAnalysis(false); }
  }

  async function handleCompleteAnalysis(serverName: string) {
    setActionLoading(`a-${serverName}`);
    try {
      const res = await fetch('/api/servers/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverName }),
      });
      const data = await res.json();
      if (!res.ok) toast(data.error, 'warn');
      else toast('Analiz tamamlandı!', 'success');
      await fetchStatus();
    } catch { toast('Bağlantı hatası', 'warn'); }
    finally { setActionLoading(null); }
  }

  async function handleJoinQueue(serverName: string) {
    setActionLoading(`q-${serverName}`);
    try {
      const res = await fetch('/api/servers/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverName }),
      });
      const data = await res.json();
      if (!res.ok) toast(data.error, 'warn');
      else toast(`Sıraya alındınız! (${data.position}. sıra)`, 'success');
      await fetchStatus();
    } catch { toast('Bağlantı hatası', 'warn'); }
    finally { setActionLoading(null); }
  }

  async function handleLeaveQueue(serverName: string) {
    setActionLoading(`q-${serverName}`);
    try {
      const res = await fetch('/api/servers/queue', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverName }),
      });
      if (res.ok) toast('Sıradan çıkıldı', 'info');
      await fetchStatus();
    } catch { toast('Bağlantı hatası', 'warn'); }
    finally { setActionLoading(null); }
  }

  const myId = session?.user?.id ? parseInt(session.user.id) : null;
  const myActiveServer = Object.entries(servers).find(([, d]) => d.session && d.session.userId === myId)?.[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 border-4 border-azure-200 rounded-full" />
            <div className="absolute inset-0 border-4 border-azure-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-navy-400 text-sm font-medium">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in py-4">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-navy-900 tracking-tight">
          Hoş geldin, <span className="text-azure-500">{session?.user?.name}</span>
        </h1>
        <div className="flex items-center justify-center gap-2 mt-3">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
            <Wifi className="w-3 h-3" />
            Canlı
          </div>
          <span className="text-navy-300 text-xs">Her 2 saniyede güncellenir</span>
        </div>
      </div>

      {/* Server Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(['azure-1', 'azure-2'] as const).map((sn) => {
          const d = servers[sn];
          const s = d.session;
          const q = d.queue;
          const a = d.analysis;
          const occupied = !!s;
          const isMe = s && s.userId === myId;
          const imInOther = myActiveServer && myActiveServer !== sn;
          const myQueuePos = q.find((x) => x.userId === myId);
          const isMyAnalysis = a && a.userId === myId;
          const dn = sn === 'azure-1' ? 'Azure 1' : 'Azure 2';
          const num = sn === 'azure-1' ? '01' : '02';
          const overtime = s ? isOvertime(s.startedAt, s.estimatedMinutes) : false;
          const analysisOvertime = a ? isOvertime(a.startedAt, a.estimatedMinutes) : false;

          // Card style
          let ringClass = '';
          let barClass = '';
          let statusLabel = '';
          let statusColor = '';
          let dotColor = '';

          if (occupied) {
            if (isMe) {
              ringClass = 'ring-2 ring-azure-400 shadow-2xl shadow-azure-100';
              barClass = 'bg-gradient-to-r from-azure-400 to-blue-600';
              statusLabel = 'İçeridesiniz';
              statusColor = 'bg-azure-100 text-azure-700';
              dotColor = 'bg-azure-500';
            } else if (overtime) {
              ringClass = 'ring-2 ring-orange-400 shadow-2xl shadow-orange-100';
              barClass = 'bg-gradient-to-r from-orange-400 to-amber-500';
              statusLabel = 'Süre Aşımı';
              statusColor = 'bg-orange-100 text-orange-700';
              dotColor = 'bg-orange-500';
            } else {
              ringClass = 'ring-2 ring-red-400 shadow-2xl shadow-red-100';
              barClass = 'bg-gradient-to-r from-red-400 to-rose-600';
              statusLabel = 'Meşgul';
              statusColor = 'bg-red-100 text-red-700';
              dotColor = 'bg-red-500';
            }
          } else if (a) {
            ringClass = 'ring-2 ring-purple-300 shadow-xl shadow-purple-50';
            barClass = 'bg-gradient-to-r from-purple-400 to-violet-500';
            statusLabel = 'Analiz Devam Ediyor';
            statusColor = 'bg-purple-100 text-purple-700';
            dotColor = 'bg-purple-500';
          } else {
            ringClass = 'ring-1 ring-green-300 shadow-xl shadow-green-50 hover:shadow-2xl';
            barClass = 'bg-gradient-to-r from-emerald-400 to-teal-500';
            statusLabel = 'Müsait';
            statusColor = 'bg-green-100 text-green-700';
            dotColor = 'bg-green-500';
          }

          return (
            <div key={sn} className={`relative overflow-hidden rounded-3xl transition-all duration-500 ${ringClass}`}>
              <div className={`h-1.5 ${barClass}`} />

              <div className="bg-white p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className={`relative w-12 h-12 rounded-2xl flex items-center justify-center ${
                      occupied ? (isMe ? 'bg-azure-500' : overtime ? 'bg-orange-500' : 'bg-red-500')
                        : a ? 'bg-purple-500' : 'bg-emerald-500'
                    }`}>
                      <Monitor className="w-6 h-6 text-white" />
                      {(occupied || a) && <div className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                        occupied ? (isMe ? 'bg-azure-400' : 'bg-red-400') : 'bg-purple-400'
                      } animate-pulse`} />}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{dn}</h2>
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2 py-0.5 rounded-full ${statusColor}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                        {statusLabel}
                      </span>
                    </div>
                  </div>
                  <span className="text-4xl font-black text-gray-100 select-none">{num}</span>
                </div>

                {/* Body */}
                {occupied ? (
                  <div className="space-y-3">
                    <div className={`rounded-2xl p-3.5 ${isMe ? 'bg-azure-50 border border-azure-100' : 'bg-red-50 border border-red-100'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isMe ? 'bg-azure-200' : 'bg-red-200'}`}>
                          <User className={`w-4 h-4 ${isMe ? 'text-azure-700' : 'text-red-700'}`} />
                        </div>
                        <div>
                          <p className={`font-bold ${isMe ? 'text-azure-900' : 'text-red-900'}`}>{s!.userName}</p>
                          <p className={`text-xs ${isMe ? 'text-azure-500' : 'text-red-500'}`}>
                            {isMe ? 'Siz içeridesiniz' : 'Sunucu içerisinde'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className={`rounded-2xl p-3 text-center ${isMe ? 'bg-azure-50 border border-azure-100' : overtime ? 'bg-orange-50 border border-orange-100' : 'bg-red-50 border border-red-100'}`}>
                        <div className="flex items-center justify-center gap-1 mb-0.5">
                          <Clock className={`w-3 h-3 ${isMe ? 'text-azure-400' : 'text-red-400'}`} />
                          <span className={`text-[10px] font-medium ${isMe ? 'text-azure-500' : 'text-red-500'}`}>Geçen Süre</span>
                        </div>
                        <p className={`text-2xl font-mono font-black tracking-widest ${isMe ? 'text-azure-700' : 'text-red-700'}`}>
                          {formatDuration(s!.startedAt)}
                        </p>
                      </div>
                      <div className={`rounded-2xl p-3 text-center ${overtime ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50 border border-gray-100'}`}>
                        <div className="flex items-center justify-center gap-1 mb-0.5">
                          <Timer className={`w-3 h-3 ${overtime ? 'text-orange-500' : 'text-gray-400'}`} />
                          <span className={`text-[10px] font-medium ${overtime ? 'text-orange-600' : 'text-gray-500'}`}>Tahmini</span>
                        </div>
                        <p className={`text-sm font-bold mt-1 ${overtime ? 'text-orange-600' : 'text-gray-600'}`}>
                          {s!.estimatedMinutes >= 60 ? `${Math.floor(s!.estimatedMinutes / 60)} sa ${s!.estimatedMinutes % 60} dk` : `${s!.estimatedMinutes} dk`}
                        </p>
                        <p className={`text-[10px] mt-0.5 font-medium ${overtime ? 'text-orange-500 animate-pulse' : 'text-gray-400'}`}>
                          {formatETA(s!.startedAt, s!.estimatedMinutes)}
                        </p>
                      </div>
                    </div>

                    {isMe ? (
                      <button
                        onClick={() => { setShowExitModal(sn); setExitHasAnalysis(false); setExitAnalysisMinutes(120); }}
                        disabled={actionLoading === sn}
                        className="w-full py-3 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-2xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-red-200/60 active:scale-[0.98]"
                      >
                        <LogOut className="w-5 h-5" />
                        {actionLoading === sn ? 'Çıkılıyor...' : 'Sunucudan Çıkış Yap'}
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <div className="rounded-2xl bg-red-50 border border-red-200 py-2.5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Shield className="w-4 h-4 text-red-400" />
                            <span className="text-red-600 font-semibold text-sm">
                              {s!.userName} içeride — Müsait değil
                            </span>
                          </div>
                        </div>
                        {!myActiveServer && !myQueuePos && (
                          <button
                            onClick={() => handleJoinQueue(sn)}
                            disabled={actionLoading === `q-${sn}`}
                            className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-2xl font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98]"
                          >
                            <ListOrdered className="w-4 h-4" />
                            {actionLoading === `q-${sn}` ? 'Ekleniyor...' : 'Sıraya Gir'}
                          </button>
                        )}
                        {myQueuePos && (
                          <button
                            onClick={() => handleLeaveQueue(sn)}
                            disabled={actionLoading === `q-${sn}`}
                            className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            <X className="w-4 h-4" />
                            Sıradan Çık ({myQueuePos.position}. sıradasınız)
                          </button>
                        )}
                      </div>
                    )}

                    {q.length > 0 && (
                      <div className="rounded-2xl bg-amber-50 border border-amber-100 p-3">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Users className="w-3.5 h-3.5 text-amber-600" />
                          <span className="text-xs font-bold text-amber-700">Sırada Bekleyenler ({q.length})</span>
                        </div>
                        <div className="space-y-1">
                          {q.map((item) => (
                            <div key={item.userId} className={`flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg ${item.userId === myId ? 'bg-amber-200/70 font-bold text-amber-900' : 'bg-amber-100/50 text-amber-800'}`}>
                              <span className="w-5 h-5 rounded-full bg-amber-200 flex items-center justify-center text-[10px] font-bold text-amber-700">{item.position}</span>
                              <span>{item.userName}</span>
                              {item.userId === myId && <span className="text-amber-600 ml-auto">(Siz)</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {a ? (
                      <div className={`rounded-2xl p-4 text-center ${analysisOvertime ? 'bg-purple-50 border-2 border-purple-300' : 'bg-purple-50 border border-purple-100'}`}>
                        <div className="w-11 h-11 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-2">
                          <Activity className={`w-5 h-5 text-purple-600 ${analysisOvertime ? '' : 'animate-pulse'}`} />
                        </div>
                        <p className="text-purple-800 font-semibold">Müsait — Analiz Devam Ediyor</p>
                        <p className="text-purple-500 text-xs mt-0.5">
                          {a.userName} tarafından başlatıldı
                        </p>
                        <div className="mt-2 inline-flex items-center gap-2 bg-purple-100 px-3 py-1.5 rounded-xl">
                          <Timer className="w-3.5 h-3.5 text-purple-600" />
                          <span className={`text-sm font-bold ${analysisOvertime ? 'text-orange-600' : 'text-purple-700'}`}>
                            {formatETA(a.startedAt, a.estimatedMinutes)}
                          </span>
                        </div>
                        {isMyAnalysis && (
                          <button
                            onClick={() => handleCompleteAnalysis(sn)}
                            disabled={actionLoading === `a-${sn}`}
                            className="mt-3 w-full py-2 bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            {actionLoading === `a-${sn}` ? '...' : 'Analizim Bitti'}
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 p-5 text-center">
                        <div className="w-11 h-11 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-2">
                          <Monitor className="w-5 h-5 text-green-600" />
                        </div>
                        <p className="text-green-800 font-semibold">Sunucu Müsait</p>
                        <p className="text-green-500 text-xs mt-0.5">Kimse bu sunucuyu kullanmıyor</p>
                      </div>
                    )}

                    <button
                      onClick={() => { setEnterMinutes(60); setShowEnterModal(sn); }}
                      disabled={!!imInOther}
                      className={`w-full py-3 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 active:scale-[0.98] ${
                        imInOther
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                          : 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg shadow-green-200/60 disabled:opacity-50'
                      }`}
                    >
                      <LogIn className="w-5 h-5" />
                      {imInOther ? 'Önce diğer sunucudan çıkın' : "Azure'dayım — Giriş Yaptım"}
                    </button>

                    {q.length > 0 && (
                      <div className="rounded-2xl bg-amber-50 border border-amber-100 p-3">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Users className="w-3.5 h-3.5 text-amber-600" />
                          <span className="text-xs font-bold text-amber-700">Sırada Bekleyenler ({q.length})</span>
                        </div>
                        <div className="space-y-1">
                          {q.map((item) => (
                            <div key={item.userId} className={`flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg ${item.userId === myId ? 'bg-amber-200/70 font-bold text-amber-900' : 'bg-amber-100/50 text-amber-800'}`}>
                              <span className="w-5 h-5 rounded-full bg-amber-200 flex items-center justify-center text-[10px] font-bold text-amber-700">{item.position}</span>
                              <span>{item.userName}</span>
                              {item.userId === myId && <span className="text-amber-600 ml-auto">(Siz)</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Enter Modal */}
      {showEnterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm mx-4 shadow-2xl animate-scale-in">
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              {showEnterModal === 'azure-1' ? 'Azure 1' : 'Azure 2'} — Giriş
            </h3>
            <p className="text-sm text-gray-500 mb-5">Tahmini ne kadar süre kullanacaksınız?</p>

            <div className="space-y-3 mb-5">
              <div className="grid grid-cols-4 gap-2">
                {[15, 30, 60, 120].map((m) => (
                  <button
                    key={m}
                    onClick={() => setEnterMinutes(m)}
                    className={`py-2 rounded-xl text-sm font-bold transition-all ${
                      enterMinutes === m
                        ? 'bg-azure-500 text-white shadow-md shadow-azure-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {m >= 60 ? `${m / 60} sa` : `${m} dk`}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[180, 240, 480, 720].map((m) => (
                  <button
                    key={m}
                    onClick={() => setEnterMinutes(m)}
                    className={`py-2 rounded-xl text-sm font-bold transition-all ${
                      enterMinutes === m
                        ? 'bg-azure-500 text-white shadow-md shadow-azure-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {`${m / 60} sa`}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={enterMinutes}
                  onChange={(e) => setEnterMinutes(parseInt(e.target.value) || 60)}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-center font-bold text-gray-800 focus:outline-none focus:border-azure-400 focus:ring-1 focus:ring-azure-400"
                />
                <span className="text-sm text-gray-500 font-medium">dakika</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowEnterModal(null)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
              >
                İptal
              </button>
              <button
                onClick={() => handleEnter(showEnterModal)}
                disabled={actionLoading === showEnterModal}
                className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                {actionLoading === showEnterModal ? '...' : 'Giriş Yap'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit Modal */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm mx-4 shadow-2xl animate-scale-in">
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              {showExitModal === 'azure-1' ? 'Azure 1' : 'Azure 2'} — Çıkış
            </h3>
            <p className="text-sm text-gray-500 mb-5">Sunucudan çıkıyorsunuz</p>

            <div className="mb-5">
              <button
                onClick={() => setExitHasAnalysis(!exitHasAnalysis)}
                className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all ${
                  exitHasAnalysis
                    ? 'border-purple-400 bg-purple-50'
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                }`}
              >
                <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${
                  exitHasAnalysis ? 'border-purple-500 bg-purple-500' : 'border-gray-300'
                }`}>
                  {exitHasAnalysis && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                </div>
                <div className="text-left">
                  <p className={`font-bold text-sm ${exitHasAnalysis ? 'text-purple-900' : 'text-gray-700'}`}>
                    İçeride analizim var
                  </p>
                  <p className={`text-xs ${exitHasAnalysis ? 'text-purple-500' : 'text-gray-400'}`}>
                    Çıkıyorum ama analiz devam ediyor
                  </p>
                </div>
                <Activity className={`w-5 h-5 ml-auto ${exitHasAnalysis ? 'text-purple-500' : 'text-gray-300'}`} />
              </button>
            </div>

            {exitHasAnalysis && (
              <div className="mb-5 animate-fade-in">
                <p className="text-sm font-semibold text-purple-800 mb-3">Analiz tahmini ne kadar sürecek?</p>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[60, 120, 240, 480].map((m) => (
                    <button
                      key={m}
                      onClick={() => setExitAnalysisMinutes(m)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all ${
                        exitAnalysisMinutes === m
                          ? 'bg-purple-500 text-white shadow-md'
                          : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                      }`}
                    >
                      {m >= 60 ? `${m / 60} sa` : `${m} dk`}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[720, 1440, 2880, 4320].map((m) => (
                    <button
                      key={m}
                      onClick={() => setExitAnalysisMinutes(m)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all ${
                        exitAnalysisMinutes === m
                          ? 'bg-purple-500 text-white shadow-md'
                          : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                      }`}
                    >
                      {m >= 1440 ? `${m / 1440} gün` : `${m / 60} sa`}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={exitAnalysisMinutes}
                    onChange={(e) => setExitAnalysisMinutes(parseInt(e.target.value) || 120)}
                    className="flex-1 px-3 py-2 border border-purple-200 rounded-xl text-center font-bold text-purple-800 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
                  />
                  <span className="text-sm text-purple-500 font-medium">dakika</span>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setShowExitModal(null)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
              >
                İptal
              </button>
              <button
                onClick={() => handleExit(showExitModal)}
                disabled={actionLoading === showExitModal}
                className="flex-1 py-2.5 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                {actionLoading === showExitModal ? '...' : 'Çıkış Yap'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div className="fixed bottom-6 right-6 space-y-3 z-50 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-slide-up min-w-[260px] border ${
              t.type === 'success' ? 'bg-emerald-500 text-white border-emerald-400'
                : t.type === 'warn' ? 'bg-red-500 text-white border-red-400'
                : 'bg-white text-navy-800 border-navy-100'
            }`}
          >
            <Bell className={`w-4 h-4 flex-shrink-0 ${t.type === 'success' || t.type === 'warn' ? 'text-white' : 'text-azure-500'}`} />
            <span className="font-semibold text-sm">{t.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
