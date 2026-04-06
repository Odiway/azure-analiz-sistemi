'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useCallback } from 'react';
import { StickyNote, Pencil, Trash2, Save, X, Plus } from 'lucide-react';

interface Note {
  id: number;
  user_id: number;
  user_name: string;
  content: string;
  color: string;
  updated_at: string;
}

const colorMap: Record<string, { bg: string; border: string; header: string; text: string; shadow: string }> = {
  yellow: { bg: 'bg-yellow-100', border: 'border-yellow-300', header: 'bg-yellow-200', text: 'text-yellow-900', shadow: 'shadow-yellow-200/60' },
  blue: { bg: 'bg-blue-100', border: 'border-blue-300', header: 'bg-blue-200', text: 'text-blue-900', shadow: 'shadow-blue-200/60' },
  green: { bg: 'bg-green-100', border: 'border-green-300', header: 'bg-green-200', text: 'text-green-900', shadow: 'shadow-green-200/60' },
  pink: { bg: 'bg-pink-100', border: 'border-pink-300', header: 'bg-pink-200', text: 'text-pink-900', shadow: 'shadow-pink-200/60' },
  purple: { bg: 'bg-purple-100', border: 'border-purple-300', header: 'bg-purple-200', text: 'text-purple-900', shadow: 'shadow-purple-200/60' },
  orange: { bg: 'bg-orange-100', border: 'border-orange-300', header: 'bg-orange-200', text: 'text-orange-900', shadow: 'shadow-orange-200/60' },
};

const colors = ['yellow', 'blue', 'green', 'pink', 'purple', 'orange'];
const colorDots: Record<string, string> = {
  yellow: 'bg-yellow-400',
  blue: 'bg-blue-400',
  green: 'bg-green-400',
  pink: 'bg-pink-400',
  purple: 'bg-purple-400',
  orange: 'bg-orange-400',
};

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'Az önce';
  if (diff < 3600) return `${Math.floor(diff / 60)} dk önce`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} sa önce`;
  return `${Math.floor(diff / 86400)} gün önce`;
}

export default function NotesPage() {
  const { data: session } = useSession();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editColor, setEditColor] = useState('yellow');
  const [saving, setSaving] = useState(false);

  const myId = session?.user?.id ? parseInt(session.user.id) : null;
  const myNote = notes.find((n) => n.user_id === myId);

  const fetchNotes = useCallback(async () => {
    try {
      const res = await fetch(`/api/notes?_=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
      }
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchNotes();
    const i = setInterval(fetchNotes, 5000);
    return () => clearInterval(i);
  }, [fetchNotes]);

  async function handleSave() {
    if (!editContent.trim()) return;
    setSaving(true);
    try {
      await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent.trim(), color: editColor }),
      });
      setEditing(false);
      await fetchNotes();
    } catch {} finally { setSaving(false); }
  }

  async function handleDelete() {
    setSaving(true);
    try {
      await fetch('/api/notes', { method: 'DELETE' });
      setEditing(false);
      await fetchNotes();
    } catch {} finally { setSaving(false); }
  }

  function startEdit() {
    setEditContent(myNote?.content || '');
    setEditColor(myNote?.color || 'yellow');
    setEditing(true);
  }

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-navy-900 tracking-tight flex items-center gap-3">
            <StickyNote className="w-8 h-8 text-amber-500" />
            Yapışkan Notlar
          </h1>
          <p className="text-navy-400 text-sm mt-1">Ekibe mesaj bırakın — herkes görebilir</p>
        </div>
        {!editing && (
          <button
            onClick={startEdit}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-amber-200/60 active:scale-[0.98]"
          >
            {myNote ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {myNote ? 'Notumu Düzenle' : 'Not Ekle'}
          </button>
        )}
      </div>

      {/* Edit Panel */}
      {editing && (
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-amber-100 animate-scale-in">
          <h3 className="font-bold text-gray-900 mb-3">
            {myNote ? 'Notunu Düzenle' : 'Yeni Not'}
          </h3>

          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            maxLength={500}
            rows={4}
            placeholder="Ekibe mesajınızı yazın..."
            className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-gray-800 resize-none focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-sm"
          />

          <div className="flex items-center gap-2 mt-3 mb-4">
            <span className="text-xs font-semibold text-gray-500">Renk:</span>
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => setEditColor(c)}
                className={`w-7 h-7 rounded-full ${colorDots[c]} transition-all ${
                  editColor === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-110'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditing(false)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm transition-colors"
            >
              <X className="w-4 h-4 inline mr-1" />
              İptal
            </button>
            {myNote && (
              <button
                onClick={handleDelete}
                disabled={saving}
                className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4 inline mr-1" />
                Sök
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving || !editContent.trim()}
              className="ml-auto px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
          <p className="text-right text-[10px] text-gray-400 mt-1">{editContent.length}/500</p>
        </div>
      )}

      {/* Notes Grid */}
      {notes.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-amber-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <StickyNote className="w-8 h-8 text-amber-300" />
          </div>
          <p className="text-gray-400 font-medium">Henüz not yok</p>
          <p className="text-gray-300 text-sm mt-1">İlk notu siz bırakın!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {notes.map((note) => {
            const c = colorMap[note.color] || colorMap.yellow;
            const isMine = note.user_id === myId;
            return (
              <div
                key={note.id}
                className={`relative rounded-2xl ${c.bg} border ${c.border} shadow-lg ${c.shadow} transition-all hover:-translate-y-1 hover:shadow-xl ${
                  isMine ? 'ring-2 ring-amber-400/50' : ''
                }`}
                style={{ transform: `rotate(${(note.id % 5 - 2) * 0.8}deg)` }}
              >
                {/* Header strip */}
                <div className={`${c.header} rounded-t-2xl px-4 py-2.5 flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-white/50 rounded-lg flex items-center justify-center">
                      <span className="text-xs font-black">{note.user_name.split(' ').map(w => w[0]).join('').slice(0, 2)}</span>
                    </div>
                    <span className={`font-bold text-sm ${c.text}`}>{note.user_name}</span>
                  </div>
                  {isMine && (
                    <button
                      onClick={startEdit}
                      className="w-6 h-6 rounded-lg bg-white/40 hover:bg-white/70 flex items-center justify-center transition-colors"
                    >
                      <Pencil className="w-3 h-3 text-gray-600" />
                    </button>
                  )}
                </div>

                {/* Content */}
                <div className="px-4 py-3">
                  <p className={`text-sm leading-relaxed whitespace-pre-wrap ${c.text}`}>
                    {note.content}
                  </p>
                </div>

                {/* Footer */}
                <div className="px-4 pb-3">
                  <p className="text-[10px] text-gray-400 font-medium">
                    {timeAgo(note.updated_at)}
                  </p>
                </div>

                {/* Pin decoration */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-gray-400 rounded-full shadow-md border-2 border-gray-300" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
