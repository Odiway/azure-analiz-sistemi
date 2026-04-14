'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Trophy, Users, Clock, Zap, Crown, Medal, Award, Play, Loader2, CheckCircle2, XCircle, Timer } from 'lucide-react';

interface Participant {
  id: number;
  user_name: string;
  score: number;
  rank: number | null;
}

interface QuizSession {
  id: number;
  status: 'waiting' | 'active' | 'finished';
  current_question: number;
  question_ids: number[];
  question_started_at: string | null;
  started_at: string | null;
  finished_at: string | null;
  participants: Participant[];
  player_count?: number;
}

interface QuestionData {
  id: number;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  category: string;
}

interface Config {
  questionTime: number;
  revealTime: number;
  lobbyCountdown: number;
  minPlayers: number;
  questionsPerSession: number;
  cooldownMinutes: number;
}

interface AnswerResult {
  participant_id: number;
  is_correct: boolean;
  score: number;
  user_name: string;
}

interface LeaderboardEntry {
  user_name: string;
  total_score: number;
  games_played: number;
  wins: number;
}

export default function QuizPage() {
  const { data: authSession } = useSession();
  const userName = authSession?.user?.name || '';

  const [session, setSession] = useState<QuizSession | null>(null);
  const [canStart, setCanStart] = useState(true);
  const [cooldownEndsAt, setCooldownEndsAt] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionData | null>(null);
  const [answers, setAnswers] = useState<AnswerResult[]>([]);
  const [config, setConfig] = useState<Config | null>(null);
  const [results, setResults] = useState<QuizSession | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerResult, setAnswerResult] = useState<{ correct: boolean; score: number; correctOption: string } | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const [lobbyCountdown, setLobbyCountdown] = useState(0);
  const [showTab, setShowTab] = useState<'game' | 'leaderboard'>('game');
  const lastQuestionRef = useRef(0);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/quiz?action=status');
      const data = await res.json();
      setSession(data.session);
      setCanStart(data.canStart);
      setCooldownEndsAt(data.cooldownEndsAt);
      setCurrentQuestion(data.currentQuestion);
      setAnswers(data.answers || []);
      setConfig(data.config);
      setResults(data.results);

      // Reset answer selection if question changed
      if (data.session?.current_question !== lastQuestionRef.current) {
        setSelectedAnswer(null);
        setAnswerResult(null);
        lastQuestionRef.current = data.session?.current_question || 0;
      }
    } catch (e) {
      console.error('Status fetch error:', e);
    }
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch('/api/quiz?action=leaderboard');
      const data = await res.json();
      setLeaderboard(data.leaderboard || []);
    } catch (e) {
      console.error('Leaderboard fetch error:', e);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    fetchLeaderboard();
    pollingRef.current = setInterval(fetchStatus, 2000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [fetchStatus, fetchLeaderboard]);

  // Timer for question countdown
  useEffect(() => {
    if (!session || session.status !== 'active' || !session.question_started_at || !config) return;
    const interval = setInterval(() => {
      const started = new Date(session.question_started_at!).getTime();
      const elapsed = (Date.now() - started) / 1000;
      const remaining = Math.max(0, config.questionTime - elapsed);
      setTimeLeft(Math.ceil(remaining));
    }, 100);
    return () => clearInterval(interval);
  }, [session, config]);

  // Cooldown timer
  useEffect(() => {
    if (!cooldownEndsAt) { setCooldownLeft(0); return; }
    const interval = setInterval(() => {
      const remaining = Math.max(0, (new Date(cooldownEndsAt).getTime() - Date.now()) / 1000);
      setCooldownLeft(Math.ceil(remaining));
      if (remaining <= 0) {
        setCanStart(true);
        setCooldownEndsAt(null);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownEndsAt]);

  // Lobby countdown
  useEffect(() => {
    if (!session || session.status !== 'waiting' || !session.started_at || !config) { setLobbyCountdown(0); return; }
    const interval = setInterval(() => {
      const started = new Date(session.started_at!).getTime();
      const elapsed = (Date.now() - started) / 1000;
      const remaining = Math.max(0, config.lobbyCountdown - elapsed);
      setLobbyCountdown(Math.ceil(remaining));
    }, 100);
    return () => clearInterval(interval);
  }, [session, config]);

  const createSession = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', userName }),
      });
      if (res.ok) await fetchStatus();
    } finally {
      setLoading(false);
    }
  };

  const joinSession = async () => {
    if (!session) return;
    setLoading(true);
    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'join', userName, sessionId: session.id }),
      });
      if (res.ok) await fetchStatus();
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async (option: string) => {
    if (!session || selectedAnswer) return;
    setSelectedAnswer(option);
    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'answer',
          userName,
          sessionId: session.id,
          selectedOption: option,
          questionNumber: session.current_question,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setAnswerResult(data);
      }
    } catch (e) {
      console.error('Answer error:', e);
      setSelectedAnswer(null);
    }
  };

  const isInSession = session?.participants?.some(p => p.user_name === userName);
  const isRevealing = session?.status === 'active' && config && session.question_started_at &&
    ((Date.now() - new Date(session.question_started_at).getTime()) / 1000) > config.questionTime;

  const optionLabels = ['A', 'B', 'C', 'D'];
  const optionColors = [
    'from-blue-500 to-blue-600',
    'from-emerald-500 to-emerald-600',
    'from-amber-500 to-amber-600',
    'from-rose-500 to-rose-600',
  ];
  const optionBorders = [
    'border-blue-400 hover:border-blue-300',
    'border-emerald-400 hover:border-emerald-300',
    'border-amber-400 hover:border-amber-300',
    'border-rose-400 hover:border-rose-300',
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-navy-900 dark:text-white">Bilgi Yarışması</h1>
            <p className="text-sm text-navy-500 dark:text-navy-400">Takım arkadaşlarınla yarış!</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowTab('game')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              showTab === 'game'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                : 'bg-white/60 dark:bg-navy-800/60 text-navy-600 dark:text-navy-300 hover:bg-white dark:hover:bg-navy-700'
            }`}
          >
            <Trophy className="w-4 h-4 inline mr-1" />
            Yarışma
          </button>
          <button
            onClick={() => { setShowTab('leaderboard'); fetchLeaderboard(); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              showTab === 'leaderboard'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                : 'bg-white/60 dark:bg-navy-800/60 text-navy-600 dark:text-navy-300 hover:bg-white dark:hover:bg-navy-700'
            }`}
          >
            <Crown className="w-4 h-4 inline mr-1" />
            Sıralama
          </button>
        </div>
      </div>

      {showTab === 'leaderboard' ? (
        /* ==================== LEADERBOARD ==================== */
        <div className="bg-white/70 dark:bg-navy-900/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-navy-700/30 p-6">
          <h2 className="text-xl font-bold text-navy-900 dark:text-white mb-4 flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-500" />
            Tüm Zamanlar Sıralaması
          </h2>
          {leaderboard.length === 0 ? (
            <p className="text-center text-navy-500 dark:text-navy-400 py-8">Henüz yarışma yapılmamış</p>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((entry, i) => (
                <div key={entry.user_name} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  i === 0 ? 'bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-500/10 dark:to-yellow-500/10 border border-amber-200 dark:border-amber-500/20' :
                  i === 1 ? 'bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-500/10 dark:to-slate-500/10 border border-gray-200 dark:border-gray-500/20' :
                  i === 2 ? 'bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-500/10 dark:to-amber-500/10 border border-orange-200 dark:border-orange-500/20' :
                  'bg-gray-50 dark:bg-navy-800/50 border border-gray-100 dark:border-navy-700/30'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    i === 0 ? 'bg-amber-400 text-white' :
                    i === 1 ? 'bg-gray-400 text-white' :
                    i === 2 ? 'bg-orange-400 text-white' :
                    'bg-navy-200 dark:bg-navy-700 text-navy-600 dark:text-navy-300'
                  }`}>
                    {i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}
                  </div>
                  <div className="flex-1">
                    <span className="font-semibold text-navy-900 dark:text-white">{entry.user_name}</span>
                    <span className="text-xs text-navy-500 dark:text-navy-400 ml-2">{entry.games_played} oyun · {entry.wins} galibiyet</span>
                  </div>
                  <div className="text-lg font-bold text-amber-600 dark:text-amber-400">{entry.total_score.toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ==================== GAME AREA ==================== */
        <>
          {/* IDLE - No active session */}
          {(!session || session.status === 'finished') && (
            <div className="bg-white/70 dark:bg-navy-900/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-navy-700/30 p-8 text-center">
              {!canStart && cooldownLeft > 0 ? (
                <div>
                  <Clock className="w-16 h-16 mx-auto text-navy-400 dark:text-navy-500 mb-4" />
                  <h2 className="text-xl font-bold text-navy-900 dark:text-white mb-2">Bekleme Süresi</h2>
                  <p className="text-navy-500 dark:text-navy-400 mb-4">Bir sonraki yarışma için bekleyin</p>
                  <div className="text-4xl font-mono font-bold text-amber-500">
                    {Math.floor(cooldownLeft / 60)}:{(cooldownLeft % 60).toString().padStart(2, '0')}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-amber-500/30 mb-6">
                    <Zap className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-navy-900 dark:text-white mb-2">Bilgi Yarışması</h2>
                  <p className="text-navy-500 dark:text-navy-400 mb-6">
                    {config?.questionsPerSession || 6} soru · {config?.minPlayers || 3}+ oyuncu · 4 dakika
                  </p>
                  <button
                    onClick={createSession}
                    disabled={loading}
                    className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-lg rounded-2xl shadow-xl shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : (
                      <><Play className="w-6 h-6 inline mr-2" />Yarışma Başlat</>
                    )}
                  </button>
                </div>
              )}

              {/* Last results */}
              {results && results.participants && (
                <div className="mt-8 pt-6 border-t border-navy-100 dark:border-navy-700">
                  <h3 className="text-lg font-bold text-navy-900 dark:text-white mb-3">Son Yarışma Sonuçları</h3>
                  <div className="flex justify-center gap-4">
                    {results.participants.slice(0, 3).map((p: Participant, i: number) => (
                      <div key={p.id} className={`text-center p-4 rounded-xl ${
                        i === 0 ? 'bg-amber-50 dark:bg-amber-500/10' :
                        i === 1 ? 'bg-gray-50 dark:bg-gray-500/10' :
                        'bg-orange-50 dark:bg-orange-500/10'
                      }`}>
                        <div className="text-3xl mb-1">{['🥇', '🥈', '🥉'][i]}</div>
                        <div className="font-bold text-navy-900 dark:text-white">{p.user_name}</div>
                        <div className="text-sm text-amber-600 dark:text-amber-400 font-medium">{p.score.toLocaleString()} puan</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* LOBBY - Waiting for players */}
          {session && session.status === 'waiting' && (
            <div className="bg-white/70 dark:bg-navy-900/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-navy-700/30 p-8">
              <div className="text-center mb-6">
                <Users className="w-12 h-12 mx-auto text-amber-500 mb-3" />
                <h2 className="text-2xl font-bold text-navy-900 dark:text-white">Lobi</h2>
                <p className="text-navy-500 dark:text-navy-400">
                  {(session.participants?.length || 0) < (config?.minPlayers || 3)
                    ? `En az ${config?.minPlayers || 3} oyuncu gerekli (${session.participants?.length || 0}/${config?.minPlayers || 3})`
                    : lobbyCountdown > 0
                      ? `Yarışma ${lobbyCountdown} saniye içinde başlıyor!`
                      : 'Yarışma başlıyor...'}
                </p>
              </div>

              {/* Players list */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {session.participants?.map((p) => (
                  <div key={p.id} className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-3 text-center">
                    <div className="w-10 h-10 mx-auto bg-amber-400 rounded-full flex items-center justify-center text-white font-bold text-lg mb-1">
                      {p.user_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-sm font-medium text-navy-900 dark:text-white truncate">{p.user_name}</div>
                  </div>
                ))}
                {/* Empty slots */}
                {Array.from({ length: Math.max(0, (config?.minPlayers || 3) - (session.participants?.length || 0)) }).map((_, i) => (
                  <div key={`empty-${i}`} className="border-2 border-dashed border-navy-200 dark:border-navy-700 rounded-xl p-3 text-center">
                    <div className="w-10 h-10 mx-auto bg-navy-100 dark:bg-navy-800 rounded-full flex items-center justify-center mb-1">
                      <span className="text-navy-400 text-lg">?</span>
                    </div>
                    <div className="text-sm text-navy-400">Bekleniyor</div>
                  </div>
                ))}
              </div>

              {/* Join button */}
              {!isInSession && (
                <div className="text-center">
                  <button
                    onClick={joinSession}
                    disabled={loading}
                    className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105 transition-all disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Katıl'}
                  </button>
                </div>
              )}

              {/* Lobby countdown progress */}
              {lobbyCountdown > 0 && (
                <div className="mt-4">
                  <div className="h-2 bg-navy-100 dark:bg-navy-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-1000"
                      style={{ width: `${(lobbyCountdown / (config?.lobbyCountdown || 15)) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ACTIVE - Playing */}
          {session && session.status === 'active' && currentQuestion && (
            <div className="space-y-4">
              {/* Progress & Timer */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-sm text-navy-500 dark:text-navy-400">
                  <span className="font-medium">Soru {session.current_question}/{config?.questionsPerSession || 6}</span>
                  <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 rounded-full text-xs font-medium">
                    {currentQuestion.category}
                  </span>
                </div>
                <div className={`flex items-center gap-1 text-lg font-bold ${
                  timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-navy-900 dark:text-white'
                }`}>
                  <Timer className="w-5 h-5" />
                  {isRevealing ? (
                    <span className="text-emerald-500">Sonuçlar</span>
                  ) : (
                    <span>{timeLeft}s</span>
                  )}
                </div>
              </div>

              {/* Timer bar */}
              <div className="h-1.5 bg-navy-100 dark:bg-navy-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    timeLeft <= 5 ? 'bg-red-500' : timeLeft <= 10 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${(timeLeft / (config?.questionTime || 30)) * 100}%` }}
                />
              </div>

              {/* Question Card */}
              <div className="bg-white/70 dark:bg-navy-900/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-navy-700/30 p-6">
                <h2 className="text-xl font-bold text-navy-900 dark:text-white mb-6 text-center leading-relaxed">
                  {currentQuestion.question}
                </h2>

                {/* Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(['A', 'B', 'C', 'D'] as const).map((opt, i) => {
                    const optionKey = `option_${opt.toLowerCase()}` as keyof QuestionData;
                    const optionText = currentQuestion[optionKey] as string;
                    const isSelected = selectedAnswer === opt;
                    const isCorrectOption = answerResult?.correctOption === opt;
                    const showResult = answerResult !== null || isRevealing;

                    let bgClass = `bg-gradient-to-r ${optionColors[i]} bg-opacity-5 border-2 ${optionBorders[i]}`;
                    if (showResult) {
                      if (isCorrectOption) {
                        bgClass = 'bg-gradient-to-r from-emerald-500 to-emerald-600 border-2 border-emerald-400 text-white';
                      } else if (isSelected && !answerResult?.correct) {
                        bgClass = 'bg-gradient-to-r from-red-500 to-red-600 border-2 border-red-400 text-white';
                      } else {
                        bgClass = 'bg-gray-100 dark:bg-navy-800 border-2 border-gray-200 dark:border-navy-700 opacity-50';
                      }
                    } else if (isSelected) {
                      bgClass = `bg-gradient-to-r ${optionColors[i]} border-2 border-white/50 text-white shadow-lg`;
                    }

                    return (
                      <button
                        key={opt}
                        onClick={() => submitAnswer(opt)}
                        disabled={!!selectedAnswer || isRevealing as boolean || !isInSession}
                        className={`relative flex items-center gap-3 p-4 rounded-xl text-left transition-all duration-200 ${bgClass} ${
                          !selectedAnswer && !isRevealing && isInSession ? 'hover:scale-[1.02] cursor-pointer' : ''
                        } disabled:cursor-default`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                          showResult
                            ? isCorrectOption
                              ? 'bg-white/20 text-white'
                              : isSelected && !answerResult?.correct
                                ? 'bg-white/20 text-white'
                                : 'bg-navy-200 dark:bg-navy-700 text-navy-500'
                            : isSelected
                              ? 'bg-white/20 text-white'
                              : `bg-gradient-to-r ${optionColors[i]} text-white`
                        }`}>
                          {showResult && isCorrectOption ? <CheckCircle2 className="w-5 h-5" /> :
                           showResult && isSelected && !answerResult?.correct ? <XCircle className="w-5 h-5" /> :
                           optionLabels[i]}
                        </div>
                        <span className={`font-medium ${
                          showResult
                            ? isCorrectOption || (isSelected && !answerResult?.correct)
                              ? 'text-white'
                              : 'text-navy-600 dark:text-navy-400'
                            : isSelected
                              ? 'text-white'
                              : 'text-navy-800 dark:text-navy-200'
                        }`}>
                          {optionText}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Answer feedback */}
                {answerResult && (
                  <div className={`mt-4 p-3 rounded-xl text-center font-bold ${
                    answerResult.correct
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'
                  }`}>
                    {answerResult.correct
                      ? `🎉 Doğru! +${answerResult.score} puan`
                      : '❌ Yanlış!'}
                  </div>
                )}
              </div>

              {/* Live Scoreboard */}
              <div className="bg-white/70 dark:bg-navy-900/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-navy-700/30 p-4">
                <h3 className="text-sm font-bold text-navy-900 dark:text-white mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Canlı Skor
                </h3>
                <div className="space-y-1.5">
                  {session.participants?.sort((a, b) => b.score - a.score).map((p, i) => {
                    const hasAnswered = answers.some(a => a.user_name === p.user_name);
                    return (
                      <div key={p.id} className="flex items-center gap-2 text-sm">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                          i === 0 ? 'bg-amber-400 text-white' : 'bg-navy-200 dark:bg-navy-700 text-navy-600 dark:text-navy-300'
                        }`}>
                          {i + 1}
                        </span>
                        <span className={`flex-1 font-medium ${p.user_name === userName ? 'text-amber-600 dark:text-amber-400' : 'text-navy-700 dark:text-navy-300'}`}>
                          {p.user_name} {p.user_name === userName && '(Sen)'}
                        </span>
                        {hasAnswered && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                        <span className="font-bold text-navy-900 dark:text-white">{p.score.toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* FINISHED - Results shown during active session view */}
          {session && session.status === 'finished' && session.participants && (
            <div className="bg-white/70 dark:bg-navy-900/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-navy-700/30 p-8 text-center">
              <div className="mb-6">
                <div className="text-6xl mb-3">🏆</div>
                <h2 className="text-2xl font-bold text-navy-900 dark:text-white">Yarışma Bitti!</h2>
              </div>
              <div className="flex justify-center gap-6 mb-6">
                {session.participants.sort((a, b) => (a.rank || 99) - (b.rank || 99)).slice(0, 3).map((p, i) => (
                  <div key={p.id} className={`p-6 rounded-2xl min-w-[120px] ${
                    i === 0 ? 'bg-gradient-to-b from-amber-100 to-yellow-50 dark:from-amber-500/20 dark:to-yellow-500/10 border-2 border-amber-300 dark:border-amber-500/30 transform scale-110' :
                    i === 1 ? 'bg-gradient-to-b from-gray-100 to-slate-50 dark:from-gray-500/20 dark:to-slate-500/10 border border-gray-300 dark:border-gray-500/30' :
                    'bg-gradient-to-b from-orange-100 to-amber-50 dark:from-orange-500/20 dark:to-amber-500/10 border border-orange-300 dark:border-orange-500/30'
                  }`}>
                    <div className="text-4xl mb-2">{i === 0 ? <Crown className="w-10 h-10 mx-auto text-amber-500" /> : i === 1 ? <Medal className="w-8 h-8 mx-auto text-gray-500" /> : <Award className="w-8 h-8 mx-auto text-orange-500" />}</div>
                    <div className="text-xs text-navy-500 dark:text-navy-400 mb-1">{i + 1}. Sıra</div>
                    <div className="font-bold text-lg text-navy-900 dark:text-white">{p.user_name}</div>
                    <div className="text-amber-600 dark:text-amber-400 font-bold">{p.score.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
