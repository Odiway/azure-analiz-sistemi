import { NextResponse } from 'next/server';
import { getSQL } from '@/lib/db';

const COOLDOWN_MINUTES = 40;
const QUESTIONS_PER_SESSION = 6;
const QUESTION_TIME_SECONDS = 30;
const REVEAL_TIME_SECONDS = 5;
const LOBBY_COUNTDOWN_SECONDS = 15;
const MIN_PLAYERS = 2;
const THREE_MONTHS_AGO = 90; // days

export async function GET(req: Request) {
  const sql = getSQL();
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  try {
    if (action === 'status') {
      // Get current active/waiting session
      const sessions = await sql`
        SELECT s.*, 
          (SELECT json_agg(json_build_object('id', p.id, 'user_name', p.user_name, 'score', p.score, 'rank', p.rank) ORDER BY p.score DESC)
           FROM quiz_participants p WHERE p.session_id = s.id) as participants,
          (SELECT COUNT(*) FROM quiz_participants p WHERE p.session_id = s.id) as player_count
        FROM quiz_sessions s
        WHERE s.status IN ('waiting', 'active')
        ORDER BY s.created_at DESC
        LIMIT 1
      `;

      let session = sessions.length > 0 ? sessions[0] : null;

      // Check if we can create a new session (40 min cooldown)
      const lastFinished = await sql`
        SELECT finished_at FROM quiz_sessions 
        WHERE status = 'finished' 
        ORDER BY finished_at DESC 
        LIMIT 1
      `;
      
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

      // If session is active, get current question data
      let currentQuestion = null;
      let answers: Record<string, unknown>[] = [];
      if (session && session.status === 'active' && session.current_question > 0) {
        const qIds = session.question_ids;
        const qIndex = session.current_question - 1;
        if (qIndex < qIds.length) {
          const qId = qIds[qIndex];
          const qs = await sql`SELECT id, question, option_a, option_b, option_c, option_d, category FROM quiz_questions WHERE id = ${qId}`;
          if (qs.length > 0) currentQuestion = qs[0];
        }
        // Get answers for current question
        answers = await sql`
          SELECT a.participant_id, a.is_correct, a.score, p.user_name
          FROM quiz_answers a
          JOIN quiz_participants p ON p.id = a.participant_id
          WHERE a.session_id = ${session.id} AND a.question_number = ${session.current_question}
        `;
      }

      // If session is active, check if we need to advance question (time-based)
      if (session && session.status === 'active' && session.question_started_at) {
        const questionStarted = new Date(session.question_started_at);
        const elapsed = (Date.now() - questionStarted.getTime()) / 1000;
        const totalQuestionTime = QUESTION_TIME_SECONDS + REVEAL_TIME_SECONDS;
        
        if (elapsed >= totalQuestionTime) {
          // Time to advance to next question
          const nextQ = (session.current_question || 0) + 1;
          if (nextQ > QUESTIONS_PER_SESSION) {
            // Game over - calculate ranks
            await sql`UPDATE quiz_sessions SET status = 'finished', finished_at = NOW(), current_question = ${session.current_question} WHERE id = ${session.id}`;
            // Update ranks
            const ranked = await sql`
              SELECT id, score FROM quiz_participants WHERE session_id = ${session.id} ORDER BY score DESC
            `;
            for (let i = 0; i < ranked.length; i++) {
              await sql`UPDATE quiz_participants SET rank = ${i + 1} WHERE id = ${ranked[i].id}`;
            }
            session = { ...session, status: 'finished' };
          } else {
            await sql`UPDATE quiz_sessions SET current_question = ${nextQ}, question_started_at = NOW() WHERE id = ${session.id}`;
            session = { ...session, current_question: nextQ };
            // Get new question
            const qId = session.question_ids[nextQ - 1];
            const qs = await sql`SELECT id, question, option_a, option_b, option_c, option_d, category FROM quiz_questions WHERE id = ${qId}`;
            if (qs.length > 0) currentQuestion = qs[0];
            answers = [];
          }
        }
      }

      // If session is waiting and lobby countdown started, check if it's time to start
      if (session && session.status === 'waiting' && session.started_at) {
        const lobbyStart = new Date(session.started_at);
        const elapsed = (Date.now() - lobbyStart.getTime()) / 1000;
        if (elapsed >= LOBBY_COUNTDOWN_SECONDS) {
          const pCount = parseInt(session.player_count as string) || 0;
          if (pCount >= MIN_PLAYERS) {
            // Start the game - pick 6 questions not used in last 3 months
            const threeMonthsAgo = new Date();
            threeMonthsAgo.setDate(threeMonthsAgo.getDate() - THREE_MONTHS_AGO);
            
            const questions = await sql`
              SELECT id FROM quiz_questions 
              WHERE last_used_at IS NULL OR last_used_at < ${threeMonthsAgo.toISOString()}
              ORDER BY RANDOM()
              LIMIT ${QUESTIONS_PER_SESSION}
            `;
            
            if (questions.length < QUESTIONS_PER_SESSION) {
              // not enough fresh questions, reset old ones
              const allQs = await sql`SELECT id FROM quiz_questions ORDER BY RANDOM() LIMIT ${QUESTIONS_PER_SESSION}`;
              const qIds = allQs.map((q: Record<string, unknown>) => q.id as number);
              await sql`UPDATE quiz_sessions SET status = 'active', current_question = 1, question_ids = ${qIds}, question_started_at = NOW() WHERE id = ${session.id}`;
              for (const qId of qIds) {
                await sql`UPDATE quiz_questions SET last_used_at = NOW() WHERE id = ${qId}`;
              }
              session = { ...session, status: 'active', current_question: 1, question_ids: qIds };
            } else {
              const qIds = questions.map((q: Record<string, unknown>) => q.id as number);
              await sql`UPDATE quiz_sessions SET status = 'active', current_question = 1, question_ids = ${qIds}, question_started_at = NOW() WHERE id = ${session.id}`;
              for (const qId of qIds) {
                await sql`UPDATE quiz_questions SET last_used_at = NOW() WHERE id = ${qId}`;
              }
              session = { ...session, status: 'active', current_question: 1, question_ids: qIds };
            }
            // Fetch first question
            const qId = session.question_ids[0];
            const qs = await sql`SELECT id, question, option_a, option_b, option_c, option_d, category FROM quiz_questions WHERE id = ${qId}`;
            if (qs.length > 0) currentQuestion = qs[0];
          }
        }
      }

      // Get latest results if finished
      let results = null;
      if (!session || session.status === 'finished') {
        const latest = await sql`
          SELECT s.*,
            (SELECT json_agg(json_build_object('id', p.id, 'user_name', p.user_name, 'score', p.score, 'rank', p.rank) ORDER BY p.rank ASC NULLS LAST)
             FROM quiz_participants p WHERE p.session_id = s.id) as participants
          FROM quiz_sessions s
          WHERE s.status = 'finished'
          ORDER BY s.finished_at DESC
          LIMIT 1
        `;
        if (latest.length > 0) results = latest[0];
      }

      // Refresh participants
      if (session && (session.status === 'waiting' || session.status === 'active')) {
        const parts = await sql`
          SELECT id, user_name, score, rank FROM quiz_participants WHERE session_id = ${session.id} ORDER BY score DESC
        `;
        session = { ...session, participants: parts };
      }

      return NextResponse.json({
        session,
        canStart,
        cooldownEndsAt,
        currentQuestion,
        answers,
        results,
        config: {
          questionTime: QUESTION_TIME_SECONDS,
          revealTime: REVEAL_TIME_SECONDS,
          lobbyCountdown: LOBBY_COUNTDOWN_SECONDS,
          minPlayers: MIN_PLAYERS,
          questionsPerSession: QUESTIONS_PER_SESSION,
          cooldownMinutes: COOLDOWN_MINUTES,
        }
      });
    }

    if (action === 'leaderboard') {
      const allTime = await sql`
        SELECT user_name, 
          SUM(score) as total_score, 
          COUNT(DISTINCT session_id) as games_played,
          COUNT(CASE WHEN rank = 1 THEN 1 END) as wins
        FROM quiz_participants
        GROUP BY user_name
        ORDER BY total_score DESC
        LIMIT 20
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
    const { action, userName, sessionId, selectedOption, questionNumber } = body;

    if (action === 'create') {
      // Check cooldown
      const lastFinished = await sql`
        SELECT finished_at FROM quiz_sessions WHERE status = 'finished' ORDER BY finished_at DESC LIMIT 1
      `;
      if (lastFinished.length > 0 && lastFinished[0].finished_at) {
        const finishedAt = new Date(lastFinished[0].finished_at);
        const cooldownEnd = new Date(finishedAt.getTime() + COOLDOWN_MINUTES * 60 * 1000);
        if (new Date() < cooldownEnd) {
          return NextResponse.json({ error: 'Bekleme süresi dolmadı', cooldownEndsAt: cooldownEnd.toISOString() }, { status: 400 });
        }
      }

      // Check if there's an active/waiting session
      const existing = await sql`SELECT id FROM quiz_sessions WHERE status IN ('waiting', 'active') LIMIT 1`;
      if (existing.length > 0) {
        return NextResponse.json({ error: 'Zaten aktif bir yarışma var' }, { status: 400 });
      }

      // Create session
      const result = await sql`INSERT INTO quiz_sessions (status) VALUES ('waiting') RETURNING id`;
      const newSessionId = result[0].id;

      // Add creator as first participant
      if (userName) {
        await sql`INSERT INTO quiz_participants (session_id, user_name) VALUES (${newSessionId}, ${userName}) ON CONFLICT DO NOTHING`;
      }

      return NextResponse.json({ sessionId: newSessionId });
    }

    if (action === 'join') {
      if (!userName || !sessionId) {
        return NextResponse.json({ error: 'userName ve sessionId gerekli' }, { status: 400 });
      }

      // Check session exists and is waiting
      const sessions = await sql`SELECT id, status, started_at FROM quiz_sessions WHERE id = ${sessionId} AND status = 'waiting'`;
      if (sessions.length === 0) {
        return NextResponse.json({ error: 'Yarışma bulunamadı veya başlamış' }, { status: 400 });
      }

      await sql`INSERT INTO quiz_participants (session_id, user_name) VALUES (${sessionId}, ${userName}) ON CONFLICT (session_id, user_name) DO NOTHING`;

      // Check player count
      const countResult = await sql`SELECT COUNT(*) as cnt FROM quiz_participants WHERE session_id = ${sessionId}`;
      const playerCount = parseInt(countResult[0].cnt);

      // If we have enough players and lobby countdown hasn't started, start it
      if (playerCount >= MIN_PLAYERS && !sessions[0].started_at) {
        await sql`UPDATE quiz_sessions SET started_at = NOW() WHERE id = ${sessionId}`;
      }

      return NextResponse.json({ joined: true, playerCount });
    }

    if (action === 'answer') {
      if (!sessionId || !userName || !selectedOption || !questionNumber) {
        return NextResponse.json({ error: 'Eksik parametreler' }, { status: 400 });
      }

      // Get session
      const sessions = await sql`SELECT * FROM quiz_sessions WHERE id = ${sessionId} AND status = 'active'`;
      if (sessions.length === 0) {
        return NextResponse.json({ error: 'Aktif yarışma bulunamadı' }, { status: 400 });
      }
      const session = sessions[0];

      // Get participant
      const parts = await sql`SELECT id FROM quiz_participants WHERE session_id = ${sessionId} AND user_name = ${userName}`;
      if (parts.length === 0) {
        return NextResponse.json({ error: 'Katılımcı bulunamadı' }, { status: 400 });
      }
      const participantId = parts[0].id;

      // Check if already answered
      const existing = await sql`SELECT id FROM quiz_answers WHERE session_id = ${sessionId} AND participant_id = ${participantId} AND question_number = ${questionNumber}`;
      if (existing.length > 0) {
        return NextResponse.json({ error: 'Zaten cevaplandı' }, { status: 400 });
      }

      // Get correct answer
      const qIndex = questionNumber - 1;
      const qIds = session.question_ids;
      if (qIndex >= qIds.length) {
        return NextResponse.json({ error: 'Geçersiz soru numarası' }, { status: 400 });
      }
      const questionId = qIds[qIndex];
      const qs = await sql`SELECT correct_option FROM quiz_questions WHERE id = ${questionId}`;
      if (qs.length === 0) {
        return NextResponse.json({ error: 'Soru bulunamadı' }, { status: 400 });
      }

      const isCorrect = selectedOption.toUpperCase() === qs[0].correct_option;

      // Calculate score based on speed
      let score = 0;
      if (isCorrect && session.question_started_at) {
        const questionStarted = new Date(session.question_started_at);
        const timeTaken = (Date.now() - questionStarted.getTime()) / 1000;
        const baseScore = 1000;
        const speedBonus = Math.max(0, Math.floor(500 * (1 - timeTaken / QUESTION_TIME_SECONDS)));
        score = baseScore + speedBonus;
      }

      const timeTakenMs = session.question_started_at
        ? Date.now() - new Date(session.question_started_at).getTime()
        : 0;

      await sql`INSERT INTO quiz_answers (session_id, participant_id, question_id, question_number, selected_option, is_correct, time_taken_ms, score) 
        VALUES (${sessionId}, ${participantId}, ${questionId}, ${questionNumber}, ${selectedOption.toUpperCase()}, ${isCorrect}, ${timeTakenMs}, ${score})`;

      // Update participant total score
      await sql`UPDATE quiz_participants SET score = score + ${score} WHERE id = ${participantId}`;

      return NextResponse.json({ 
        correct: isCorrect, 
        score,
        correctOption: qs[0].correct_option 
      });
    }

    if (action === 'startCountdown') {
      if (!sessionId) {
        return NextResponse.json({ error: 'sessionId gerekli' }, { status: 400 });
      }
      const sessions = await sql`SELECT id, started_at FROM quiz_sessions WHERE id = ${sessionId} AND status = 'waiting'`;
      if (sessions.length === 0) {
        return NextResponse.json({ error: 'Yarışma bulunamadı' }, { status: 400 });
      }
      const countResult = await sql`SELECT COUNT(*) as cnt FROM quiz_participants WHERE session_id = ${sessionId}`;
      const playerCount = parseInt(countResult[0].cnt);
      if (playerCount < MIN_PLAYERS) {
        return NextResponse.json({ error: `En az ${MIN_PLAYERS} oyuncu gerekli` }, { status: 400 });
      }
      if (!sessions[0].started_at) {
        await sql`UPDATE quiz_sessions SET started_at = NOW() WHERE id = ${sessionId}`;
      }
      return NextResponse.json({ started: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Quiz POST error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
