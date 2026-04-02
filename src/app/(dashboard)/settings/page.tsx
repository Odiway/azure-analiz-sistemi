'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Settings,
  Users,
  Shield,
  ShieldCheck,
  User,
  Trash2,
  Pencil,
  X,
  Check,
  AlertCircle,
} from 'lucide-react';

interface UserItem {
  id: number;
  name: string;
  email: string;
  department: string | null;
  role: string;
  createdAt: string;
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<number | null>(null);
  const [editRole, setEditRole] = useState('');

  useEffect(() => {
    if (session && session.user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    fetchUsers();
  }, [session, router]);

  async function fetchUsers() {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch {}
    setLoading(false);
  }

  async function updateRole(userId: number, role: string) {
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role }),
      });
      if (res.ok) {
        setEditingUser(null);
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || 'Güncelleme hatası');
      }
    } catch {
      alert('Bağlantı hatası');
    }
  }

  async function deleteUser(userId: number, name: string) {
    if (!confirm(`"${name}" kullanıcısını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`)) return;
    try {
      const res = await fetch('/api/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || 'Silme hatası');
      }
    } catch {
      alert('Bağlantı hatası');
    }
  }

  if (session && session.user.role !== 'admin') {
    return null;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-[26px] font-bold text-navy-900 tracking-tight flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center shadow-md shadow-purple-500/20">
            <Settings className="w-5 h-5 text-white" />
          </div>
          Ayarlar
        </h1>
        <p className="text-navy-400 mt-2 text-sm">Kullanıcı yönetimi ve sistem ayarları</p>
      </div>

      {/* User Management */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-navy-100/40 overflow-hidden">
        <div className="px-6 py-4 border-b border-navy-50/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-purple-50/80 flex items-center justify-center">
              <Users className="w-3.5 h-3.5 text-purple-500" />
            </div>
            <h3 className="font-semibold text-navy-800 text-[15px]">Kullanıcılar</h3>
            <span className="text-xs text-navy-400 bg-navy-50/60 px-2 py-0.5 rounded-full">
              {users.length} kişi
            </span>
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center">
            <div className="w-6 h-6 border-2 border-navy-200 border-t-azure-500 rounded-full animate-spin mx-auto" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-navy-50/60 bg-navy-50/20">
                  <th className="text-left px-6 py-3 text-[11px] font-semibold text-navy-400 uppercase tracking-wider">Kullanıcı</th>
                  <th className="text-left px-6 py-3 text-[11px] font-semibold text-navy-400 uppercase tracking-wider">Email</th>
                  <th className="text-left px-6 py-3 text-[11px] font-semibold text-navy-400 uppercase tracking-wider">Departman</th>
                  <th className="text-left px-6 py-3 text-[11px] font-semibold text-navy-400 uppercase tracking-wider">Rol</th>
                  <th className="text-left px-6 py-3 text-[11px] font-semibold text-navy-400 uppercase tracking-wider">Kayıt Tarihi</th>
                  <th className="text-right px-6 py-3 text-[11px] font-semibold text-navy-400 uppercase tracking-wider">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-50/40">
                {users.map((u) => {
                  const isCurrentUser = u.id.toString() === session?.user?.id;
                  return (
                    <tr key={u.id} className="hover:bg-navy-50/30 transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold ${
                            u.role === 'admin' ? 'bg-gradient-to-br from-purple-500 to-purple-700' : 'bg-gradient-to-br from-azure-400 to-azure-600'
                          }`}>
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-navy-800">{u.name}</p>
                            {isCurrentUser && (
                              <span className="text-[10px] text-azure-500 font-medium">Siz</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-sm text-navy-500">{u.email}</td>
                      <td className="px-6 py-3.5 text-sm text-navy-500">{u.department || '—'}</td>
                      <td className="px-6 py-3.5">
                        {editingUser === u.id ? (
                          <div className="flex items-center gap-2">
                            <select
                              value={editRole}
                              onChange={(e) => setEditRole(e.target.value)}
                              className="px-2 py-1.5 text-xs bg-white border border-navy-200/50 rounded-lg outline-none focus:ring-2 focus:ring-azure-500/20"
                            >
                              <option value="user">Kullanıcı</option>
                              <option value="admin">Admin</option>
                            </select>
                            <button
                              onClick={() => updateRole(u.id, editRole)}
                              className="p-1 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingUser(null)}
                              className="p-1 text-navy-400 hover:bg-navy-50 rounded-lg transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                            u.role === 'admin'
                              ? 'bg-purple-50/80 text-purple-700 border border-purple-200/50'
                              : 'bg-azure-50/60 text-azure-700 border border-azure-200/50'
                          }`}>
                            {u.role === 'admin' ? (
                              <ShieldCheck className="w-3 h-3" />
                            ) : (
                              <User className="w-3 h-3" />
                            )}
                            {u.role === 'admin' ? 'Admin' : 'Kullanıcı'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-xs text-navy-400">
                        {new Date(u.createdAt).toLocaleDateString('tr-TR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {!isCurrentUser && (
                            <>
                              <button
                                onClick={() => { setEditingUser(u.id); setEditRole(u.role); }}
                                className="p-1.5 text-azure-500 hover:bg-azure-50/80 rounded-lg transition-colors"
                                title="Rolü Değiştir"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => deleteUser(u.id, u.name)}
                                className="p-1.5 text-red-500 hover:bg-red-50/80 rounded-lg transition-colors"
                                title="Kullanıcıyı Sil"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* System Info */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-navy-100/40 p-6">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-7 h-7 rounded-lg bg-azure-50/80 flex items-center justify-center">
            <AlertCircle className="w-3.5 h-3.5 text-azure-500" />
          </div>
          <h3 className="font-semibold text-navy-800 text-[15px]">Sistem Bilgileri</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-navy-50/30 rounded-xl">
            <p className="text-xs text-navy-400 mb-1">Toplam Kullanıcı</p>
            <p className="text-2xl font-bold text-navy-800">{users.length}</p>
          </div>
          <div className="p-4 bg-navy-50/30 rounded-xl">
            <p className="text-xs text-navy-400 mb-1">Admin Sayısı</p>
            <p className="text-2xl font-bold text-purple-600">{users.filter(u => u.role === 'admin').length}</p>
          </div>
          <div className="p-4 bg-navy-50/30 rounded-xl">
            <p className="text-xs text-navy-400 mb-1">Kullanıcı Sayısı</p>
            <p className="text-2xl font-bold text-azure-600">{users.filter(u => u.role === 'user').length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
