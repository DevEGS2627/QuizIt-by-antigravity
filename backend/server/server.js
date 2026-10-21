/**
 * EGS Quizit! Zero-Dependency Local Backend API & Realtime Server
 * Built with standard Node.js libraries (http, fs, path). No external npm install required!
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 4000;
const DATA_DIR = path.join(__dirname, '..', 'data');

// Load seed data
const teams = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'initial_teams.json'), 'utf8'));
const questions = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'questions_bank.json'), 'utf8'));
const rounds = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'rounds_metadata.json'), 'utf8'));
const rules = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'default_rules.json'), 'utf8'));

// In-Memory Arena State
let arenaState = {
  activeRound: 1,
  activeTeamId: teams[0]?.id || 'team-1',
  currentQuestion: questions.find(q => Number(q.round) === 1) || questions[0],
  isAnswerRevealed: false,
  hasBeenScored: false,
  timerSeconds: rules.defaultTimerDuration,
  isTimerRunning: false,
  teams: teams,
  rules: rules,
  rounds: rounds,
  marksHistory: [],
  drawHistory: []
};

// SSE Connected Clients (for real-time projector / live scoreboards)
const sseClients = new Set();

function broadcastState() {
  const payload = `data: ${JSON.stringify(arenaState)}\n\n`;
  for (const client of sseClients) {
    client.write(payload);
  }
}

// Timer Loop
let timerInterval = null;
function startTimerLoop() {
  if (arenaState.isTimerRunning) return;
  arenaState.isTimerRunning = true;
  broadcastState();

  timerInterval = setInterval(() => {
    if (arenaState.timerSeconds <= 1) {
      clearInterval(timerInterval);
      arenaState.timerSeconds = 0;
      arenaState.isTimerRunning = false;
      broadcastState();
      return;
    }
    arenaState.timerSeconds -= 1;
    broadcastState();
  }, 1000);
}

function pauseTimerLoop() {
  if (timerInterval) clearInterval(timerInterval);
  arenaState.isTimerRunning = false;
  broadcastState();
}

function sendJSON(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  // Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // Realtime Server-Sent Events (SSE) Stream
  if (pathname === '/api/events' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });
    res.write(`data: ${JSON.stringify(arenaState)}\n\n`);
    sseClients.add(res);

    req.on('close', () => {
      sseClients.delete(res);
    });
    return;
  }

  // --- API ROUTING ---
  try {
    if (pathname === '/api/state' && req.method === 'GET') {
      return sendJSON(res, 200, arenaState);
    }

    if (pathname === '/api/questions' && req.method === 'GET') {
      return sendJSON(res, 200, questions);
    }

    if (pathname === '/api/teams' && req.method === 'GET') {
      return sendJSON(res, 200, arenaState.teams);
    }

    // Timer endpoints
    if (pathname === '/api/timer/start' && req.method === 'POST') {
      startTimerLoop();
      return sendJSON(res, 200, { ok: true, isTimerRunning: true });
    }

    if (pathname === '/api/timer/pause' && req.method === 'POST') {
      pauseTimerLoop();
      return sendJSON(res, 200, { ok: true, isTimerRunning: false });
    }

    if (pathname === '/api/timer/reset' && req.method === 'POST') {
      pauseTimerLoop();
      arenaState.timerSeconds = arenaState.rules.defaultTimerDuration;
      broadcastState();
      return sendJSON(res, 200, { ok: true, timerSeconds: arenaState.timerSeconds });
    }

    // Question selection
    if (pathname === '/api/questions/draw' && req.method === 'POST') {
      pauseTimerLoop();
      const roundQuestions = questions.filter(
        q => Number(q.round) === Number(arenaState.activeRound) && q.status === 'available'
      );
      let selected = null;
      if (roundQuestions.length > 0) {
        selected = roundQuestions[Math.floor(Math.random() * roundQuestions.length)];
      } else {
        // recycle
        questions.forEach(q => {
          if (Number(q.round) === Number(arenaState.activeRound)) q.status = 'available';
        });
        const rec = questions.filter(q => Number(q.round) === Number(arenaState.activeRound));
        selected = rec[Math.floor(Math.random() * rec.length)];
      }

      if (selected) {
        selected.status = 'drawn';
        arenaState.currentQuestion = selected;
        arenaState.isAnswerRevealed = false;
        arenaState.hasBeenScored = false;
        arenaState.timerSeconds = arenaState.rules.defaultTimerDuration;
        arenaState.teams.forEach(t => { t.hasPounced = false; });
        arenaState.drawHistory.unshift({
          timestamp: new Date().toISOString(),
          questionId: selected.id,
          questionTag: selected.tag,
          round: arenaState.activeRound,
          method: 'fair_random_reel',
          teamId: arenaState.activeTeamId
        });
        broadcastState();
      }
      return sendJSON(res, 200, { ok: true, currentQuestion: arenaState.currentQuestion });
    }

    if (pathname === '/api/questions/chit' && req.method === 'POST') {
      const body = await parseBody(req);
      const tag = (body.tag || '').trim().toUpperCase();
      const found = questions.find(q => q.tag.toUpperCase() === tag);
      if (!found) {
        return sendJSON(res, 404, { error: `Question with tag "${tag}" not found` });
      }

      pauseTimerLoop();
      found.status = 'drawn';
      arenaState.currentQuestion = found;
      arenaState.isAnswerRevealed = false;
      arenaState.hasBeenScored = false;
      arenaState.timerSeconds = arenaState.rules.defaultTimerDuration;
      arenaState.teams.forEach(t => { t.hasPounced = false; });
      arenaState.drawHistory.unshift({
        timestamp: new Date().toISOString(),
        questionId: found.id,
        questionTag: found.tag,
        round: found.round,
        method: 'physical_chit',
        teamId: arenaState.activeTeamId
      });
      broadcastState();
      return sendJSON(res, 200, { ok: true, currentQuestion: found });
    }

    if (pathname === '/api/questions/reveal' && req.method === 'POST') {
      arenaState.isAnswerRevealed = !arenaState.isAnswerRevealed;
      broadcastState();
      return sendJSON(res, 200, { ok: true, isAnswerRevealed: arenaState.isAnswerRevealed });
    }

    // Turn sequencing
    if (pathname === '/api/teams/next' && req.method === 'POST') {
      const idx = arenaState.teams.findIndex(t => t.id === arenaState.activeTeamId);
      const nextIdx = (idx + 1) % arenaState.teams.length;
      arenaState.activeTeamId = arenaState.teams[nextIdx].id;
      broadcastState();
      return sendJSON(res, 200, { ok: true, activeTeamId: arenaState.activeTeamId });
    }

    // Pounce toggle
    if (pathname === '/api/pounce' && req.method === 'POST') {
      const body = await parseBody(req);
      const team = arenaState.teams.find(t => t.id === body.teamId);
      if (!team) return sendJSON(res, 404, { error: 'Team not found' });
      if (team.id === arenaState.activeTeamId) {
        return sendJSON(res, 400, { error: 'Assigned team cannot pounce on their own question' });
      }

      team.hasPounced = !team.hasPounced;
      team.pounceTimestamp = team.hasPounced ? new Date().toISOString() : null;
      broadcastState();
      return sendJSON(res, 200, { ok: true, team });
    }

    // Scoring
    if (pathname === '/api/score/regular' && req.method === 'POST') {
      const body = await parseBody(req);
      if (arenaState.hasBeenScored) {
        return sendJSON(res, 400, { error: 'Question already scored. Use score correction for adjustments.' });
      }

      pauseTimerLoop();
      const team = arenaState.teams.find(t => t.id === body.teamId);
      if (!team) return sendJSON(res, 404, { error: 'Team not found' });

      const delta = body.type === 'correct' ? arenaState.rules.correctPoints : arenaState.rules.wrongPoints;
      const rIdx = arenaState.activeRound - 1;
      team.scoresByRound[rIdx] = (team.scoresByRound[rIdx] || 0) + delta;
      team.totalScore += delta;
      arenaState.hasBeenScored = true;

      arenaState.marksHistory.unshift({
        timestamp: new Date().toISOString(),
        type: body.type,
        teamId: team.id,
        teamName: team.name,
        pointsDelta: delta,
        questionTag: arenaState.currentQuestion?.tag || null,
        round: arenaState.activeRound,
        reason: `Direct ${body.type.toUpperCase()} award`,
        operator: 'Operator'
      });

      broadcastState();
      return sendJSON(res, 200, { ok: true, team, delta });
    }

    if (pathname === '/api/score/pounce' && req.method === 'POST') {
      const body = await parseBody(req);
      const team = arenaState.teams.find(t => t.id === body.teamId);
      if (!team) return sendJSON(res, 404, { error: 'Team not found' });

      const isCorrect = body.type === 'pounce_correct';
      const delta = isCorrect ? arenaState.rules.pounceCorrectPoints : arenaState.rules.pounceIncorrectPoints;
      const rIdx = arenaState.activeRound - 1;
      team.scoresByRound[rIdx] = (team.scoresByRound[rIdx] || 0) + delta;
      team.totalScore += delta;
      team.hasPounced = false;
      if (isCorrect) arenaState.hasBeenScored = true;

      arenaState.marksHistory.unshift({
        timestamp: new Date().toISOString(),
        type: body.type,
        teamId: team.id,
        teamName: team.name,
        pointsDelta: delta,
        questionTag: arenaState.currentQuestion?.tag || null,
        round: arenaState.activeRound,
        reason: `Pounce ${isCorrect ? 'CORRECT' : 'INCORRECT'} result`,
        operator: 'Operator'
      });

      broadcastState();
      return sendJSON(res, 200, { ok: true, team, delta });
    }

    // Health
    if (pathname === '/health' || pathname === '/') {
      return sendJSON(res, 200, {
        name: 'EGS Quizit Backend API',
        status: 'online',
        sseStream: 'http://localhost:' + PORT + '/api/events',
        activeRound: arenaState.activeRound,
        teamsCount: arenaState.teams.length,
        questionsCount: questions.length
      });
    }

    sendJSON(res, 404, { error: 'Endpoint not found' });
  } catch (err) {
    sendJSON(res, 500, { error: err.message });
  }
});

server.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`⚡ EGS Quizit! Mock Backend API Server is Active!`);
  console.log(`> REST API:   http://localhost:${PORT}/api/state`);
  console.log(`> SSE Stream: http://localhost:${PORT}/api/events`);
  console.log(`==================================================`);
});
