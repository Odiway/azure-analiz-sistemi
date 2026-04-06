'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useRef, useCallback } from 'react';
import { Monitor, LogIn, LogOut, Clock, User, Bell, Wifi, Shield } from 'lucide-react';

interface ServerStatus {
  userName: string;
  userId: number;
  startedAt: string;
}

interface ServersState {
  'azure-1': ServerStatus | null;
  'azure-2': ServerStatus | null;
}

function formatDuration(startedAt: string): string {
  const start = new Date(startedAt).getTime();
  const now = Date.now();
  const diff = Math.max(0, Math.floor((now - start) / 1000));
  const hours = Math.floor(diff / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = diff % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  if (hours > 0) return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  return `${pad(minutes)}:${pad(seconds)}`;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [servers, setServers] = useState<ServersState>({ 'azure-1': null, 'azure-2': null });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [, setTick] = useState(0);
  const [toasts, setToasts] = useState<{ id: number; msg: string; type: 'success' | 'info' }[]>([]);
  const prevServersRef = useRef<ServersState>({ 'azure-1': null, 'azure-2': null });
  const toastIdRef = useRef(0);
  const initialLoadRef = useRef(true);

  const addToast = useCallback((msg: string, type: 'success' | 'info' = 'info') => {
    const id = ++toastIdRef.current;
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
        if (!initialLoadRef.current) {
          const prev = prevServersRef.current;
          for (const name of ['azure-1', 'azure-2'] as const) {
            const displayName = name === 'azure-1' ? 'Azure 1' : 'Azure 2';
            if (prev[name] && !data[name]) {
              addToast(`${displayName} artık müsait!`, 'success');
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('Sunucu Müsait', { body: `${displayName} artık boş!`, icon: '🟢' });
              }
            }
            if (!prev[name] && data[name]) {
              const currentId = session?.user?.id ? parseInt(session.user.id) : null;
              if (data[name]!.userId !== currentId) {
                addToast(`${displayName} → ${data[name]!.userName} giriş yaptı`, 'info');
              }
            }
          }
        }
        initialLoadRef.current = false;
        prevServersRef.current = data;
        setServers(data);
      }
    } catch {} finally {
      setLoading(false);
    }
  }, [addToast, session?.user?.id]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    fetchStatus();
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  async function handleEnter(serverName: string) {
    setActionLoading(serverName);
    try {
      const res = await fetch('/api/servers/enter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverName }),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast(data.error || 'Hata oluştu', 'info');
      } else {
        addToast(`Giriş başarılı!`, 'success');
      }
      await fetchStatus();
    } catch {
      addToast('Bağlantı hatası', 'info');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleExit(serverName: string) {
    setActionLoading(serverName);
    try {
      const res = await fetch('/api/servers/exit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverName }),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast(data.error || 'Hata oluştu', 'info');
      } else {
        addToast(`Çıkış başarılı!`, 'success');
      }
      await fetchStatus();
    } catch {
      addToast('Bağlantı hatası', 'info');
    } finally {
      setActionLoading(null);
    }
  }

  const currentUserId = session?.user?.id ? parseInt(session.user.id) : null;
  const userInServer = Object.entries(servers).find(([, s]) => s && s.userId === currentUserId);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 border-4 border-azure-200 rounded-full" />
            <div className="absolute inset-0 border-4 border-azure-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-navy-400 text-sm font-medium">Sunucu durumu yükleniyor...</p>
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
        {(['azure-1', 'azure-2'] as const).map((serverName) => {
          const status = servers[serverName];
          const isOccupied = !!status;
          const isMe = status && status.userId === currentUserId;
          const imInOther = userInServer && userInServer[0] !== serverName;
          const displayName = serverName === 'azure-1' ? 'Azure 1' : 'Azure 2';
          const serverNum = serverName === 'azure-1' ? '01' : '02';

          return (
            <div
              key={serverName}
              className={`relative overflow-hidden rounded-3xl transition-all duration-500 ${
                isOccupied
                  ? isMe
                    ? 'ring-2 ring-azure-400 shadow-2xl shadow-azure-100'
                    : 'ring-2 ring-red-400 shadow-2xl shadow-red-100'
                  : 'ring-1 ring-green-300 shadow-xl shadow-green-50 hover:shadow-2xl hover:shadow-green-100'
              }`}
            >
              {/* Top gradient bar */}
              <div
                className={`h-1.5 ${
                  isOccupied
                    ? isMe
                      ? 'bg-gradient-to-r from-azure-400 via-azure-500 to-blue-600'
                      : 'bg-gradient-to-r from-red-400 via-red-500 to-rose-600'
                    : 'bg-gradient-to-r from-emerald-400 via-green-500 to-teal-500'
                }`}
              />

              <div className="bg-white p-7">
                {/* Header row */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div
                      className={`relative w-14 h-14 rounded-2xl flex items-center justify-center ${
                        isOccupied
                          ? isMe
                            ? 'bg-azure-500'
                            : 'bg-red-500'
                          : 'bg-emerald-500'
                      }`}
                    >
                      <Monitor className="w-7 h-7 text-white" />
                      {isOccupied && (
                        <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${isMe ? 'bg-azure-400' : 'bg-red-400'} animate-pulse`} />
                      )}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{displayName}</h2>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full ${
                            isOccupied
                              ? isMe
                                ? 'bg-azure-100 text-azure-700'
                                : 'bg-red-100 text-red-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isOccupied ? (isMe ? 'bg-azure-500' : 'bg-red-500') : 'bg-green-500'}`} />
                          {isOccupied ? (isMe ? 'İçeridesiniz' : 'Meşgul') : 'Müsait'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="text-4xl font-black text-gray-100 select-none">{serverNum}</span>
                </div>

                {/* Body */}
                {isOccupied ? (
                  <div className="space-y-4">
                    {/* User info */}
                    <div className={`rounded-2xl p-4 ${isMe ? 'bg-azure-50 border border-azure-100' : 'bg-red-50 border border-red-100'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isMe ? 'bg-azure-200' : 'bg-red-200'}`}>
                          <User className={`w-5 h-5 ${isMe ? 'text-azure-700' : 'text-red-700'}`} />
                        </div>
                        <div>
                          <p className={`font-bold text-base ${isMe ? 'text-azure-900' : 'text-red-900'}`}>
                            {status.userName}
                          </p>
                          <p className={`text-xs ${isMe ? 'text-azure-500' : 'text-red-500'}`}>
                            {isMe ? 'Siz içeridesiniz' : 'Kullanıcı sunucu içerisinde'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Timer */}
                    <div className={`rounded-2xl p-4 text-center ${isMe ? 'bg-gradient-to-br from-azure-50 to-blue-50 border border-azure-100' : 'bg-gradient-to-br from-red-50 to-rose-50 border border-red-100'}`}>
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Clock className={`w-4 h-4 ${isMe ? 'text-azure-400' : 'text-red-400'}`} />
                        <span className={`text-xs font-medium ${isMe ? 'text-azure-500' : 'text-red-500'}`}>
                          Geçen Süre
                        </span>
                      </div>
                      <p className={`text-3xl font-mono font-black tracking-widest ${isMe ? 'text-azure-700' : 'text-red-700'}`}>
                        {formatDuration(status.startedAt)}
                      </p>
                    </div>

                    {/* Action */}
                    {isMe ? (
                      <button
                        onClick={() => handleExit(serverName)}
                        disabled={actionLoading === serverName}
                        className="w-full py-3.5 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-2xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2.5 shadow-lg shadow-red-200/60 active:scale-[0.98]"
                      >
                        <LogOut className="w-5 h-5" />
                        {actionLoading === serverName ? 'Çıkılıyor...' : 'Sunucudan Çıkış Yap'}
                      </button>
                    ) : (
                      <div className="rounded-2xl bg-red-50 border border-red-200 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Shield className="w-4 h-4 text-red-400" />
                          <span className="text-red-600 font-semibold text-sm">
                            {status.userName} içeride — Müsait değil
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Empty state */}
                    <div className="rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 p-6 text-center">
                      <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <Monitor className="w-6 h-6 text-green-600" />
                      </div>
                      <p className="text-green-800 font-semibold">Sunucu Müsait</p>
                      <p className="text-green-500 text-xs mt-1">Kimse bu sunucuyu kullanmıyor</p>
                    </div>

                    {/* Enter button */}
                    <button
                      onClick={() => handleEnter(serverName)}
                      disabled={actionLoading === serverName || !!imInOther}
                      className={`w-full py-3.5 rounded-2xl font-bold transition-all flex items-center justify-center gap-2.5 active:scale-[0.98] ${
                        imInOther
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                          : 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg shadow-green-200/60 disabled:opacity-50'
                      }`}
                    >
                      <LogIn className="w-5 h-5" />
                      {actionLoading === serverName
                        ? 'Giriş yapılıyor...'
                        : imInOther
                          ? 'Önce diğer sunucudan çıkın'
                          : "Azure'dayım — Giriş Yaptım"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Toasts */}
      <div className="fixed bottom-6 right-6 space-y-3 z-50 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-slide-up min-w-[260px] border ${
              t.type === 'success'
                ? 'bg-emerald-500 text-white border-emerald-400'
                : 'bg-white text-navy-800 border-navy-100'
            }`}
          >
            <Bell className={`w-4 h-4 flex-shrink-0 ${t.type === 'success' ? 'text-white' : 'text-azure-500'}`} />
            <span className="font-semibold text-sm">{t.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
