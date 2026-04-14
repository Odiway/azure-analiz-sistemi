import { NextResponse } from 'next/server';
import { getSQL } from '@/lib/db';

const COOLDOWN_MINUTES = 40;
const QUESTIONS_PER_SESSION = 12;
const QUESTION_TIME_SECONDS = 30;
const REVEAL_TIME_SECONDS = 5;
const MIN_PLAYERS = 2;
const THREE_MONTHS_AGO = 90;

async function startGame(sql: ReturnType<typeof getSQL>, sessionId: number) {
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setDate(threeMonthsAgo.getDate() - THREE_MONTHS_AGO);

  let questions = await sql`
    SELECT id FROM quiz_questions 
    WHERE last_used_at IS NULL OR last_used_at < ${threeMonthsAgo.toISOString()}
    ORDER BY RANDOM() LIMIT ${QUESTIONS_PER_SESSION}
  `;
  if (questions.length < QUESTIONS_PER_SESSION) {
    questions = await sql`SELECT id FROM quiz_questions ORDER BY RANDOM() LIMIT ${QUESTIONS_PER_SESSION}`;
  }

  const qIds = questions.map((q: Record<string, unknown>) => q.id as number);
  await sql`UPDATE quiz_sessions SET status = 'active', current_question = 1, question_ids = ${qIds}, question_started_at = NOW(), started_at = NOW() WHERE id = ${sessionId}`;
  for (const qId of qIds) {
    await sql`UPDATE quiz_questions SET last_used_at = NOW() WHERE id = ${qId}`;
  }
  return qIds;
}

export async function GET(req: Request) {
  const sql = getSQL();
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  try {
    if (action === 'status') {
      const sessions = await sql`
        SELECT s.*, 
          (SELECT COUNT(*) FROM quiz_participants p WHERE p.session_id = s.id) as player_count
        FROM quiz_sessions s
        WHERE s.status IN ('waiting', 'active')
        ORDER BY s.created_at DESC LIMIT 1
      `;

      let session = sessions.length > 0 ? sessions[0] : null;

      const lastFinished = await sql`SELECT finished_at FROM quiz_sessions WHERE status = 'finished' ORDER BY finished_at DESC LIMIT 1`;
      let canStart = true;
      let cooldownEndsAt = null;
      if (lastFinished.length > 0 && lastFinished[0].finished_at) {
        const finishedAt = new Date(lastFinished[0].finished_at);
        const cooldownEnd = new Date(finishedAt.getTime() + COOLDOWN_MINUTES * 60 * 1000);
        if (new Date() < cooldownEnd) {
          canStart = false;
          cooldownEndsAt = cooldownEnd.toISOString();
        }
      }

      let currentQuestion = null;
      let answers: Record<string, unknown>[] = [];
      let allAnswered = false;

      if (session && session.status === 'active' && session.current_question > 0) {
        const qIds = session.question_ids;
        const qIndex = session.current_question - 1;
        if (qIndex < qIds.length) {
          const qId = qIds[qIndex];
          const qs = await sql`SELECT id, question, option_a, option_b, option_c, option_d, category FROM quiz_questions WHERE id = ${qId}`;
          if (qs.length > 0) currentQuestion = qs[0];
        }

        answers = await sql`
          SELECT a.participant_id, a.is_correct, a.score, a.selected_option, p.user_name
          FROM quiz_answers a
          JOIN quiz_participants p ON p.id = a.participant_id
          WHERE a.session_id = ${session.id} AND a.question_number = ${session.current_question}
        `;

        const pCount = parseInt(session.player_count as string) || 0;
        allAnswered = pCount > 0 && answers.length >= pCount;
      }

      if (session && session.status === 'active' && session.question_started_at) {
        const questionStarted = new Date(session.question_started_at).getTime();
        const elapsed = (Date.now() - questionStarted) / 1000;

        let shouldAdvance = false;
        if (allAnswered) {
          const lastAns = await sql`
            SELECT MAX(answered_at) as last_at FROM quiz_answers 
            WHERE session_id = ${session.id} AND question_number = ${session.current_question}
          `;
          if (lastAns.length > 0 && lastAns[0].last_at) {
            const lastAnswerTime = new Date(lastAns[0].last_at).getTime();
            const revealElapsed = (Date.now() - lastAnswerTime) / 1000;
            shouldAdvance = revealElapsed >= REVEAL_TIME_SECONDS;
          }
        } else {
          shouldAdvance = elapsed >= (QUESTION_TIME_SECONDS + REVEAL_TIME_SECONDS);
        }

        if (shouldAdvance) {
          const nextQ = (session.current_question || 0) + 1;
          if (nextQ > QUESTIONS_PER_SESSION) {
            await sql`UPDATE quiz_sessions SET status = 'finished', finished_at = NOW() WHERE id = ${session.id}`;
            const ranked = await sql`SELECT id, score FROM quiz_participants WHERE session_id = ${session.id} ORDER BY score DESC`;
            for (let i = 0; i < ranked.length; i++) {
              await sql`UPDATE quiz_participants SET rank = ${i + 1} WHERE id = ${ranked[i].id}`;
            }
            session = { ...session, status: 'finished' };
          } else {
            await sql`UPDATE quiz_sessions SET current_question = ${nextQ}, question_started_at = NOW() WHERE id = ${session.id}`;
            session = { ...session, current_question: nextQ };
            const qId = session.question_ids[nextQ - 1];
            const qs = await sql`SELECT id, question, option_a, option_b, option_c, option_d, category FROM quiz_questions WHERE id = ${qId}`;
            if (qs.length > 0) currentQuestion = qs[0];
            answers = [];
            allAnswered = false;
          }
        }
      }

      if (session && session.status === 'waiting') {
        const participants = await sql`SELECT id, user_name, is_ready FROM quiz_participants WHERE session_id = ${session.id}`;
        const pCount = participants.length;
        const readyCount = participants.filter((p: Record<string, unknown>) => p.is_ready).length;
        
        if (pCount >= MIN_PLAYERS && readyCount === pCount) {
          const qIds = await startGame(sql, session.id);
          session = { ...session, status: 'active', current_question: 1, question_ids: qIds };
          const qId = qIds[0];
          const qs = await sql`SELECT id, question, option_a, option_b, option_c, option_d, category FROM quiz_questions WHERE id = ${qId}`;
          if (qs.length > 0) currentQuestion = qs[0];
        }
      }

      let results = null;
      if (!session || session.status === 'finished') {
        const latest = await sql`
          SELECT s.*,
            (SELECT json_agg(json_build_object('id', p.id, 'user_name', p.user_name, 'score', p.score, 'rank', p.rank) ORDER BY p.rank ASC NULLS LAST)
             FROM quiz_participants p WHERE p.session_id = s.id) as participants
          FROM quiz_sessions s WHERE s.status = 'finished' ORDER BY s.finished_at DESC LIMIT 1
        `;
        if (latest.length > 0) results = latest[0];
      }

      if (session && (session.status === 'waiting' || session.status === 'active')) {
        const parts = await sql`SELECT id, user_name, score, rank, is_ready FROM quiz_participants WHERE session_id = ${session.id} ORDER BY score DESC`;
        session = { ...session, participants: parts };
      }

      let chatMessages: Record<string, unknown>[] = [];
      if (session && session.id) {
        chatMessages = await sql`SELECT user_name, message, created_at FROM quiz_chat WHERE session_id = ${session.id} ORDER BY created_at DESC LIMIT 50`;
        chatMessages.reverse();
      }

      return NextResponse.json({
        session, canStart, cooldownEndsAt, currentQuestion, answers, allAnswered, results, chatMessages,
        config: { questionTime: QUESTION_TIME_SECONDS, revealTime: REVEAL_TIME_SECONDS, minPlayers: MIN_PLAYERS, questionsPerSession: QUESTIONS_PER_SESSION, cooldownMinutes: COOLDOWN_MINUTES }
      });
    }

    if (action === 'leaderboard') {
      const allTime = await sql`
        SELECT user_name, SUM(score) as total_score, COUNT(DISTINCT session_id) as games_played, COUNT(CASE WHEN rank = 1 THEN 1 END) as wins
        FROM quiz_participants GROUP BY user_name ORDER BY total_score DESC LIMIT 20
      `;
      return NextResponse.json({ leaderboard: allTime });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Quiz GET error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const sql = getSQL();
  try {
    const body = await req.json();
    const { action, userName, sessionId, selectedOption, questionNumber, message } = body;

    if (action === 'create') {
      const lastFinished = await sql`SELECT finished_at FROM quiz_sessions WHERE status = 'finished' ORDER BY finished_at DESC LIMIT 1`;
      if (lastFinished.length > 0 && lastFinished[0].finished_at) {
        const finishedAt = new Date(lastFinished[0].finished_at);
        const cooldownEnd = new Date(finishedAt.getTime() + COOLDOWN_MINUTES * 60 * 1000);
        if (new Date() < cooldownEnd) {
          return NextResponse.json({ error: 'Bekleme sÃ¼resi dolmadÄ±', cooldownEndsAt: cooldownEnd.toISOString() }, { status: 400 });
        }
      }
      const existing = await sql`SELECT id FROM quiz_sessions WHERE status IN ('waiting', 'active') LIMIT 1`;
      if (existing.length > 0) return NextResponse.json({ error: 'Zaten aktif bir yarÄ±ÅŸma var' }, { status: 400 });

      const result = await sql`INSERT INTO quiz_sessions (status) VALUES ('waiting') RETURNING id`;
      const newId = result[0].id;
      if (userName) {
        await sql`INSERT INTO quiz_participants (session_id, user_name) VALUES (${newId}, ${userName}) ON CONFLICT DO NOTHING`;
      }
      return NextResponse.json({ sessionId: newId });
    }

    if (action === 'join') {
      if (!userName || !sessionId) return NextResponse.json({ error: 'Eksik parametre' }, { status: 400 });
      const sessions = await sql`SELECT id, status FROM quiz_sessions WHERE id = ${sessionId} AND status IN ('waiting', 'active')`;
      if (sessions.length === 0) return NextResponse.json({ error: 'YarÄ±ÅŸma bulunamadÄ± veya bitmiÅŸ' }, { status: 400 });
      await sql`INSERT INTO quiz_participants (session_id, user_name) VALUES (${sessionId}, ${userName}) ON CONFLICT (session_id, user_name) DO NOTHING`;
      const cnt = await sql`SELECT COUNT(*) as cnt FROM quiz_participants WHERE session_id = ${sessionId}`;
      return NextResponse.json({ joined: true, playerCount: parseInt(cnt[0].cnt) });
    }

    if (action === 'ready') {
      if (!userName || !sessionId) return NextResponse.json({ error: 'Eksik parametre' }, { status: 400 });
      await sql`UPDATE quiz_participants SET is_ready = TRUE WHERE session_id = ${sessionId} AND user_name = ${userName}`;
      return NextResponse.json({ ready: true });
    }

    if (action === 'unready') {
      if (!userName || !sessionId) return NextResponse.json({ error: 'Eksik parametre' }, { status: 400 });
      await sql`UPDATE quiz_participants SET is_ready = FALSE WHERE session_id = ${sessionId} AND user_name = ${userName}`;
      return NextResponse.json({ ready: false });
    }

    if (action === 'answer') {
      if (!sessionId || !userName || !selectedOption || !questionNumber) return NextResponse.json({ error: 'Eksik parametre' }, { status: 400 });
      const sessions = await sql`SELECT * FROM quiz_sessions WHERE id = ${sessionId} AND status = 'active'`;
      if (sessions.length === 0) return NextResponse.json({ error: 'Aktif yarÄ±ÅŸma yok' }, { status: 400 });
      const s = sessions[0];

      const parts = await sql`SELECT id FROM quiz_participants WHERE session_id = ${sessionId} AND user_name = ${userName}`;
      if (parts.length === 0) return NextResponse.json({ error: 'KatÄ±lÄ±mcÄ± deÄŸilsiniz' }, { status: 400 });
      const pid = parts[0].id;

      const dup = await sql`SELECT id FROM quiz_answers WHERE session_id = ${sessionId} AND participant_id = ${pid} AND question_number = ${questionNumber}`;
      if (dup.length > 0) return NextResponse.json({ error: 'Zaten cevaplandÄ±' }, { status: 400 });

      const qIds = s.question_ids;
      if (questionNumber - 1 >= qIds.length) return NextResponse.json({ error: 'GeÃ§ersiz soru' }, { status: 400 });
      const qId = qIds[questionNumber - 1];
      const qs = await sql`SELECT correct_option FROM quiz_questions WHERE id = ${qId}`;
      if (qs.length === 0) return NextResponse.json({ error: 'Soru bulunamadÄ±' }, { status: 400 });

      const isCorrect = selectedOption.toUpperCase() === qs[0].correct_option;
      let score = 0;
      if (isCorrect && s.question_started_at) {
        const timeTaken = (Date.now() - new Date(s.question_started_at).getTime()) / 1000;
        score = 1000 + Math.max(0, Math.floor(500 * (1 - timeTaken / QUESTION_TIME_SECONDS)));
      }
      const timeTakenMs = s.question_started_at ? Date.now() - new Date(s.question_started_at).getTime() : 0;

      await sql`INSERT INTO quiz_answers (session_id, participant_id, question_id, question_number, selected_option, is_correct, time_taken_ms, score) VALUES (${sessionId}, ${pid}, ${qId}, ${questionNumber}, ${selectedOption.toUpperCase()}, ${isCorrect}, ${timeTakenMs}, ${score})`;
      await sql`UPDATE quiz_participants SET score = score + ${score} WHERE id = ${pid}`;
      return NextResponse.json({ correct: isCorrect, score, correctOption: qs[0].correct_option });
    }

    if (action === 'chat') {
      if (!userName || !sessionId || !message) return NextResponse.json({ error: 'Eksik parametre' }, { status: 400 });
      const cleanMsg = String(message).slice(0, 200).trim();
      if (!cleanMsg) return NextResponse.json({ error: 'BoÅŸ mesaj' }, { status: 400 });
      await sql`INSERT INTO quiz_chat (session_id, user_name, message) VALUES (${sessionId}, ${userName}, ${cleanMsg})`;
      return NextResponse.json({ sent: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Quiz POST error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
