/**
 * EGS Quizit! Headless Arena Engine
 * Pure JavaScript business logic & state machine.
 * Framework-agnostic: Works with React, Vue, Svelte, Angular, Solid, or Vanilla JS.
 */

export class QuizEngine {
  constructor(initialData = {}) {
    this.teams = initialData.teams ? JSON.parse(JSON.stringify(initialData.teams)) : [];
    this.questions = initialData.questions ? JSON.parse(JSON.stringify(initialData.questions)) : [];
    this.rounds = initialData.rounds ? JSON.parse(JSON.stringify(initialData.rounds)) : [];
    this.rules = initialData.rules ? { ...initialData.rules } : {
      correctPoints: 10,
      wrongPoints: 0,
      pounceCorrectPoints: 10,
      pounceIncorrectPoints: -5,
      defaultTimerDuration: 45,
      warningTimerThreshold: 10,
      soundEnabled: true,
      speechRate: 1.0,
      allowAudiencePass: true
    };

    // State
    this.activeRound = 1;
    this.activeTeamId = this.teams[0]?.id || 'team-1';
    this.currentQuestion = this.questions.find(q => Number(q.round) === 1) || this.questions[0] || null;
    this.isAnswerRevealed = false;
    this.hasBeenScored = false;
    this.timerSeconds = this.rules.defaultTimerDuration;
    this.isTimerRunning = false;
    this.timerInterval = null;

    // Audit logs
    this.marksHistory = [];
    this.drawHistory = [];

    // Subscribers (listeners for state updates)
    this.subscribers = new Set();
  }

  // --- Subscription Pattern ---
  subscribe(callback) {
    this.subscribers.add(callback);
    callback(this.getState());
    return () => this.subscribers.delete(callback);
  }

  notify() {
    const state = this.getState();
    this.subscribers.forEach(cb => cb(state));
  }

  getState() {
    return {
      activeRound: this.activeRound,
      activeTeamId: this.activeTeamId,
      activeTeam: this.teams.find(t => t.id === this.activeTeamId) || null,
      currentQuestion: this.currentQuestion,
      isAnswerRevealed: this.isAnswerRevealed,
      hasBeenScored: this.hasBeenScored,
      timerSeconds: this.timerSeconds,
      isTimerRunning: this.isTimerRunning,
      teams: this.teams,
      rules: this.rules,
      rounds: this.rounds,
      questionsCount: this.questions.length,
      availableQuestionsInRound: this.questions.filter(q => Number(q.round) === Number(this.activeRound) && q.status === 'available').length,
      marksHistory: this.marksHistory,
      drawHistory: this.drawHistory
    };
  }

  // --- Timer Controls ---
  startTimer(onUrgentTick, onTick, onTimeUp) {
    if (this.isTimerRunning || this.timerSeconds <= 0) return;
    this.isTimerRunning = true;
    this.notify();

    this.timerInterval = setInterval(() => {
      if (this.timerSeconds <= 1) {
        clearInterval(this.timerInterval);
        this.timerSeconds = 0;
        this.isTimerRunning = false;
        if (onTimeUp) onTimeUp();
        this.notify();
        return;
      }

      this.timerSeconds -= 1;
      if (this.timerSeconds <= this.rules.warningTimerThreshold) {
        if (onUrgentTick) onUrgentTick(this.timerSeconds);
      } else if (this.timerSeconds % 5 === 0) {
        if (onTick) onTick(this.timerSeconds);
      }
      this.notify();
    }, 1000);
  }

  pauseTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.isTimerRunning = false;
    this.notify();
  }

  resetTimer() {
    this.pauseTimer();
    this.timerSeconds = this.rules.defaultTimerDuration;
    this.notify();
  }

  adjustTimer(secondsDelta) {
    this.timerSeconds = Math.max(0, this.timerSeconds + secondsDelta);
    this.notify();
  }

  // --- Round & Turn Management ---
  selectRound(roundId) {
    this.activeRound = roundId;
    this.notify();
  }

  selectTeam(teamId) {
    this.activeTeamId = teamId;
    this.notify();
  }

  nextTeamSequence() {
    const currentIndex = this.teams.findIndex(t => t.id === this.activeTeamId);
    const nextIndex = (currentIndex + 1) % this.teams.length;
    this.activeTeamId = this.teams[nextIndex].id;
    this.notify();
    return this.teams[nextIndex];
  }

  // --- Question Drawing ---
  drawRandomQuestion() {
    const roundPool = this.questions.filter(
      q => Number(q.round) === Number(this.activeRound) && q.status === 'available'
    );

    let selectedQuestion = null;
    if (roundPool.length > 0) {
      const randomIndex = Math.floor(Math.random() * roundPool.length);
      selectedQuestion = roundPool[randomIndex];
    } else {
      // Auto-recycle round if all questions are drawn
      this.questions = this.questions.map(q =>
        Number(q.round) === Number(this.activeRound) ? { ...q, status: 'available' } : q
      );
      const recycledPool = this.questions.filter(
        q => Number(q.round) === Number(this.activeRound) && q.status === 'available'
      );
      selectedQuestion = recycledPool[Math.floor(Math.random() * recycledPool.length)];
    }

    if (!selectedQuestion) return null;

    this.applySelectedQuestion(selectedQuestion, 'fair_random_reel');
    return selectedQuestion;
  }

  revealByChitTag(chitTag) {
    if (!chitTag) return null;
    const clean = chitTag.trim().toUpperCase();
    let found = this.questions.find(q => q.tag.toUpperCase() === clean);
    if (!found) {
      found = this.questions.find(
        q => q.tag.replace(/[^A-Z0-9]/gi, '').toUpperCase() === clean.replace(/[^A-Z0-9]/gi, '')
      );
    }
    if (!found) return null;

    this.applySelectedQuestion(found, 'physical_chit');
    return found;
  }

  applySelectedQuestion(question, method) {
    // Automatically advance "Question for" to next team in rotation
    if (this.autoAdvanceTurn && this.hasDrawnBefore) {
      const currentIndex = this.teams.findIndex(t => t.id === this.activeTeamId);
      const nextIndex = (currentIndex + 1) % this.teams.length;
      this.activeTeamId = this.teams[nextIndex].id;
    }
    this.hasDrawnBefore = true;

    this.currentQuestion = question;
    this.isAnswerRevealed = false;
    this.hasBeenScored = false;
    this.resetTimer();

    // Clear pounces
    this.teams.forEach(t => {
      t.hasPounced = false;
      t.pounceTimestamp = null;
    });

    // Mark drawn
    this.questions = this.questions.map(q =>
      q.id === question.id ? { ...q, status: 'drawn', drawnAt: new Date().toISOString() } : q
    );

    // Audit log
    const targetTeam = this.teams.find(t => t.id === this.activeTeamId);
    this.drawHistory.unshift({
      timestamp: new Date().toISOString(),
      questionId: question.id,
      questionTag: question.tag,
      round: question.round || this.activeRound,
      method,
      teamId: this.activeTeamId,
      teamName: targetTeam ? targetTeam.name : 'Unknown'
    });

    this.notify();
  }

  toggleAnswerReveal() {
    this.isAnswerRevealed = !this.isAnswerRevealed;
    this.notify();
    return this.isAnswerRevealed;
  }

  // --- Pounce Registration ---
  toggleTeamPounce(teamId) {
    // Assigned team cannot pounce on their own question
    if (teamId === this.activeTeamId) {
      throw new Error('Assigned team cannot pounce on their own question.');
    }

    const team = this.teams.find(t => t.id === teamId);
    if (!team) return;

    team.hasPounced = !team.hasPounced;
    team.pounceTimestamp = team.hasPounced ? new Date().toISOString() : null;
    this.notify();
  }

  // --- Scoring Engine ---
  awardRegularScore(teamId, type) {
    if (this.hasBeenScored) {
      throw new Error('Question has already been scored. Use score correction for adjustments.');
    }

    const pointsDelta = type === 'correct' ? this.rules.correctPoints : this.rules.wrongPoints;
    this.pauseTimer();

    const team = this.teams.find(t => t.id === teamId);
    if (!team) return;

    const rIdx = this.activeRound - 1;
    team.scoresByRound[rIdx] = (team.scoresByRound[rIdx] || 0) + pointsDelta;
    team.totalScore += pointsDelta;

    this.hasBeenScored = true;

    // Audit log
    this.marksHistory.unshift({
      timestamp: new Date().toISOString(),
      type,
      teamId,
      teamName: team.name,
      pointsDelta,
      questionTag: this.currentQuestion?.tag || null,
      round: this.activeRound,
      reason: `Direct ${type.toUpperCase()} award to assigned team`,
      operator: 'Operator'
    });

    this.notify();
    return { pointsDelta, team };
  }

  awardPounceScore(teamId, type) {
    const isCorrect = type === 'pounce_correct';
    const pointsDelta = isCorrect ? this.rules.pounceCorrectPoints : this.rules.pounceIncorrectPoints;

    const team = this.teams.find(t => t.id === teamId);
    if (!team) return;

    const rIdx = this.activeRound - 1;
    team.scoresByRound[rIdx] = (team.scoresByRound[rIdx] || 0) + pointsDelta;
    team.totalScore += pointsDelta;
    team.hasPounced = false; // Reset pounce flag

    if (isCorrect) {
      this.hasBeenScored = true;
    }

    this.marksHistory.unshift({
      timestamp: new Date().toISOString(),
      type,
      teamId,
      teamName: team.name,
      pointsDelta,
      questionTag: this.currentQuestion?.tag || null,
      round: this.activeRound,
      reason: `Pounce ${isCorrect ? 'CORRECT' : 'INCORRECT'} result`,
      operator: 'Operator'
    });

    this.notify();
    return { pointsDelta, team };
  }

  correctScore({ teamId, round, pointsDelta, reason, operator = 'Operator' }) {
    const team = this.teams.find(t => t.id === teamId);
    if (!team) return;

    const rIdx = round - 1;
    team.scoresByRound[rIdx] = (team.scoresByRound[rIdx] || 0) + pointsDelta;
    team.totalScore += pointsDelta;

    this.marksHistory.unshift({
      timestamp: new Date().toISOString(),
      type: 'manual_adjustment',
      teamId,
      teamName: team.name,
      pointsDelta,
      questionTag: this.currentQuestion?.tag || null,
      round,
      reason: `Manual Correction: ${reason}`,
      operator
    });

    this.notify();
  }

  resetAllScores() {
    this.teams.forEach(t => {
      t.scoresByRound = [0, 0, 0, 0, 0, 0];
      t.totalScore = 0;
      t.hasPounced = false;
      t.pounceTimestamp = null;
    });
    this.marksHistory = [];
    this.hasBeenScored = false;
    this.notify();
  }
}
