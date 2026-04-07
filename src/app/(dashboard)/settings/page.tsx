'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import {
  Settings, Bell, Smartphone, Save, CheckCircle, ExternalLink, Copy, Check,
} from 'lucide-react';

interface EventItem {
  key: string;
  label: string;
  group: string;
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const [ntfyTopic, setNtfyTopic] = useState('');
  const [prefs, setPrefs] = useState<Record<string, boolean>>({});
  const [allEvents, setAllEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const [copied, setCopied] = useState(false);

  const suggestedTopic = session?.user?.name
    ? `azure-temsa-${session.user.name.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '')}`
    : '';

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => {
        setNtfyTopic(d.ntfyTopic || '');
        setPrefs(d.ntfyPrefs || {});
        setAllEvents(d.allEvents || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function togglePref(key: string) {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
  }

  function toggleAll(checked: boolean) {
    const newPrefs: Record<string, boolean> = {};
    allEvents.forEach((e) => { newPrefs[e.key] = checked; });
    setPrefs(newPrefs);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ntfyTopic, ntfyPrefs: prefs }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {} finally { setSaving(false); }
  }

  async function handleTest() {
    if (!ntfyTopic) return;
    try {
      await fetch(`https://ntfy.sh/${ntfyTopic}`, {
        method: 'POST',
        body: 'Bu bir test bildirimidir! Bildirimler duzgun calisiyor.',
        headers: { 'Title': 'Azure Sunucu - Test', 'Tags': 'white_check_mark' },
      });
      setTestSent(true);
      setTimeout(() => setTestSent(false), 3000);
    } catch {}
  }

  function copyTopic() {
    navigator.clipboard.writeText(ntfyTopic);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const allChecked = allEvents.length > 0 && allEvents.every((e) => prefs[e.key]);
  const noneChecked = allEvents.every((e) => !prefs[e.key]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 border-4 border-azure-200 rounded-full" />
            <div className="absolute inset-0 border-4 border-azure-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-navy-400 text-sm font-medium">Yukleniyor...</p>
        </div>
      </div>
    );
  }

  const groups: Record<string, EventItem[]> = {};
  allEvents.forEach((e) => {
    if (!groups[e.group]) groups[e.group] = [];
    groups[e.group].push(e);
  });

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in py-4">
      <div>
        <h1 className="text-3xl font-extrabold text-navy-900 tracking-tight flex items-center gap-3">
          <Settings className="w-8 h-8 text-azure-500" />
          Ayarlar
        </h1>
        <p className="text-navy-400 text-sm mt-1">Bildirim tercihlerinizi yonetin</p>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-azure-500 to-blue-600 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Telefon Bildirimleri</h2>
              <p className="text-blue-100 text-xs">Ntfy ile anlik push bildirim alin</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Setup Steps */}
          <div className="bg-azure-50 rounded-2xl p-4 border border-azure-100">
            <h3 className="font-bold text-azure-800 text-sm mb-3">Nasil Kurulur?</h3>
            <div className="space-y-2.5">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 bg-azure-200 rounded-full flex items-center justify-center text-xs font-bold text-azure-700 flex-shrink-0 mt-0.5">1</span>
                <div>
                  <p className="text-sm text-azure-900 font-medium">Ntfy uygulamasini indirin</p>
                  <div className="flex gap-2 mt-1">
                    <a href="https://play.google.com/store/apps/details?id=io.heckel.ntfy" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-azure-600 hover:text-azure-800 font-medium">
                      Android <ExternalLink className="w-3 h-3" />
                    </a>
                    <span className="text-azure-300">|</span>
                    <a href="https://apps.apple.com/app/ntfy/id1625396347" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-azure-600 hover:text-azure-800 font-medium">
                      iOS <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 bg-azure-200 rounded-full flex items-center justify-center text-xs font-bold text-azure-700 flex-shrink-0 mt-0.5">2</span>
                <p className="text-sm text-azure-900 font-medium">Asagiya benzersiz bir topic adi girin</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 bg-azure-200 rounded-full flex items-center justify-center text-xs font-bold text-azure-700 flex-shrink-0 mt-0.5">3</span>
                <p className="text-sm text-azure-900 font-medium">Ntfy uygulamasinda ayni topic&apos;e abone olun</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 bg-azure-200 rounded-full flex items-center justify-center text-xs font-bold text-azure-700 flex-shrink-0 mt-0.5">4</span>
                <p className="text-sm text-azure-900 font-medium">Asagidan hangi olaylarda bildirim istediginizi secin</p>
              </div>
            </div>
          </div>

          {/* Topic Input */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              <Bell className="w-4 h-4 inline mr-1.5 text-azure-500" />
              Ntfy Topic Adi
            </label>
            <div className="relative">
              <input
                type="text"
                value={ntfyTopic}
                onChange={(e) => setNtfyTopic(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                maxLength={100}
                placeholder={suggestedTopic || 'azure-temsa-adiniz'}
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-gray-800 font-mono text-sm focus:outline-none focus:border-azure-400 focus:ring-1 focus:ring-azure-400 pr-10"
              />
              {ntfyTopic && (
                <button onClick={copyTopic} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-azure-500 transition-colors">
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
              )}
            </div>
            {suggestedTopic && !ntfyTopic && (
              <button onClick={() => setNtfyTopic(suggestedTopic)} className="mt-2 text-xs text-azure-500 hover:text-azure-700 font-medium">
                Onerilen: <span className="font-mono">{suggestedTopic}</span> — tiklayin
              </button>
            )}
          </div>

          {/* Notification Preferences Checkboxes */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-bold text-gray-700">
                Hangi olaylarda bildirim gelsin?
              </label>
              <button
                onClick={() => toggleAll(!allChecked)}
                className="text-xs text-azure-500 hover:text-azure-700 font-medium"
              >
                {allChecked ? 'Hepsini Kaldir' : 'Hepsini Sec'}
              </button>
            </div>

            <div className="space-y-3">
              {Object.entries(groups).map(([group, events]) => (
                <div key={group} className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">{group}</h4>
                  <div className="space-y-2">
                    {events.map((event) => (
                      <label
                        key={event.key}
                        className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all ${
                          prefs[event.key]
                            ? 'bg-azure-50 border border-azure-200'
                            : 'bg-white border border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                          prefs[event.key]
                            ? 'bg-azure-500 border-azure-500'
                            : 'border-gray-300'
                        }`}>
                          {prefs[event.key] && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <span className={`text-sm ${prefs[event.key] ? 'text-azure-800 font-medium' : 'text-gray-600'}`}>
                          {event.label}
                        </span>
                        <input
                          type="checkbox"
                          checked={prefs[event.key] || false}
                          onChange={() => togglePref(event.key)}
                          className="sr-only"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {noneChecked && ntfyTopic && (
              <p className="mt-2 text-xs text-amber-600 font-medium">
                Hicbir olay secilmedi — bildirim almayacaksiniz.
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-3 bg-gradient-to-r from-azure-500 to-blue-600 hover:from-azure-600 hover:to-blue-700 text-white rounded-2xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-azure-200/60 active:scale-[0.98]"
            >
              {saved ? (
                <><CheckCircle className="w-5 h-5" /> Kaydedildi!</>
              ) : (
                <><Save className="w-5 h-5" /> {saving ? 'Kaydediliyor...' : 'Kaydet'}</>
              )}
            </button>
            {ntfyTopic && (
              <button
                onClick={handleTest}
                disabled={testSent}
                className={`px-5 py-3 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 active:scale-[0.98] ${
                  testSent
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200'
                }`}
              >
                <Bell className="w-4 h-4" />
                {testSent ? 'Gonderildi!' : 'Test Gonder'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
