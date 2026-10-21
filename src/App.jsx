import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  INITIAL_TEAMS,
  ROUNDS_METADATA,
  DEFAULT_RULES,
  INITIAL_QUESTIONS
} from './constants/initialData';
import { Navbar } from './components/Navbar';
import { HomeLiveScores } from './components/HomeLiveScores';
import { LiveQuizWorkspace } from './components/LiveQuizWorkspace';
import { PresentationMode } from './components/PresentationMode';
import { StatsDashboard } from './components/StatsDashboard';
import { AdminControls } from './components/AdminControls';
import { PounceModal } from './components/PounceModal';
import { ScoreCorrectionModal } from './components/ScoreCorrectionModal';
import { AmbientParticles } from './components/AmbientParticles';
import { audioService } from './services/audioService';
import { supabaseService } from './services/supabaseClient';

import './App.css';
import './styles/Presentation.css';
import './styles/Paddles.css';
import './styles/Admin.css';

export function App() {
  // Theme state (with localStorage persistence)
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('egs_theme');
    // Upgrade to the requested new vibrant cyber-neon flagship theme
    if (!saved || saved === 'olive-moss' || saved === 'royal-gold') {
      localStorage.setItem('egs_theme', 'cyber-neon');
      return 'cyber-neon';
    }
    return saved;
  });

  // Automatic "Question For" Team Rotation State
  const [autoAdvanceTurn, setAutoAdvanceTurn] = useState(() => {
    const saved = localStorage.getItem('egs_auto_advance_turn');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('egs_auto_advance_turn', JSON.stringify(autoAdvanceTurn));
  }, [autoAdvanceTurn]);

  const hasLoadedInitialQRef = useRef(false);

  // Active View: 'home' | 'workspace' | 'presentation' | 'stats' | 'admin'
  const [activeView, setActiveView] = useState('home');

  // Teams & Scores state (auto-upgrades old low-contrast colors to vivid colors)
  const [teams, setTeams] = useState(() => {
    const saved = localStorage.getItem('egs_teams');
    if (!saved) return INITIAL_TEAMS;
    try {
      const parsed = JSON.parse(saved);
      const oldDullColors = ['#E35336', '#415078', '#636B2F', '#C05800', '#9B695E', '#9E5E38'];
      return parsed.map((t) => {
        const defaultMatch = INITIAL_TEAMS.find((it) => it.id === t.id);
        if (defaultMatch && (!t.color || oldDullColors.includes(t.color))) {
          return { ...t, color: defaultMatch.color };
        }
        return t;
      });
    } catch {
      return INITIAL_TEAMS;
    }
  });

  // Scoring Rules
  const [rules, setRules] = useState(() => {
    const saved = localStorage.getItem('egs_rules');
    return saved ? JSON.parse(saved) : DEFAULT_RULES;
  });

  // Questions Bank
  const [questions, setQuestions] = useState(() => {
    const saved = localStorage.getItem('egs_questions');
    return saved ? JSON.parse(saved) : INITIAL_QUESTIONS;
  });

  // Round & Turn tracking
  const [activeRound, setActiveRound] = useState(1);
  const [activeTeamId, setActiveTeamId] = useState('team-1');

  // Active Question & Answer state (pre-populates first round question so arena is immediately active)
  const [currentQuestion, setCurrentQuestion] = useState(() => {
    return INITIAL_QUESTIONS.find((q) => Number(q.round) === 1) || INITIAL_QUESTIONS[0];
  });
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [hasBeenScored, setHasBeenScored] = useState(false);

  // Timer State
  const [timerSeconds, setTimerSeconds] = useState(DEFAULT_RULES.defaultTimerDuration);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerIntervalRef = useRef(null);

  // Histories & Audit
  const [marksHistory, setMarksHistory] = useState(() => {
    const saved = localStorage.getItem('egs_marks_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [drawHistory, setDrawHistory] = useState(() => {
    const saved = localStorage.getItem('egs_draw_history');
    return saved ? JSON.parse(saved) : [];
  });

  // Modals state
  const [isPounceModalOpen, setIsPounceModalOpen] = useState(false);
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);

  // Admin Auth state
  const [adminUser, setAdminUser] = useState(null);

  // Apply Theme to document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('egs_theme', theme);
  }, [theme]);

  // Persist State to localStorage
  useEffect(() => {
    localStorage.setItem('egs_teams', JSON.stringify(teams));
  }, [teams]);

  useEffect(() => {
    localStorage.setItem('egs_questions', JSON.stringify(questions));
  }, [questions]);

  useEffect(() => {
    localStorage.setItem('egs_rules', JSON.stringify(rules));
  }, [rules]);

  useEffect(() => {
    localStorage.setItem('egs_marks_history', JSON.stringify(marksHistory));
  }, [marksHistory]);

  useEffect(() => {
    localStorage.setItem('egs_draw_history', JSON.stringify(drawHistory));
  }, [drawHistory]);

  // Check admin session on mount
  useEffect(() => {
    supabaseService.getCurrentSession().then((session) => {
      if (session) setAdminUser(session);
    });
  }, []);

  // Realtime state synchronization (Supabase)
  useEffect(() => {
    const unsubscribe = supabaseService.subscribeToLiveQuiz((remoteState) => {
      if (!remoteState) return;
      if (remoteState.active_round) setActiveRound(remoteState.active_round);
      if (remoteState.assigned_team_id) setActiveTeamId(remoteState.assigned_team_id);
      if (typeof remoteState.is_answer_revealed === 'boolean') {
        setIsAnswerRevealed(remoteState.is_answer_revealed);
      }
      if (remoteState.active_question_id) {
        const found = questions.find((q) => q.id === remoteState.active_question_id);
        if (found) setCurrentQuestion(found);
      }
    });
    return () => unsubscribe();
  }, [questions]);

  // Push live quiz state whenever key arena states change
  const syncArenaState = (partialState) => {
    supabaseService.pushLiveState({
      active_round: activeRound,
      assigned_team_id: activeTeamId,
      active_question_id: currentQuestion?.id || null,
      active_question_tag: currentQuestion?.tag || null,
      is_answer_revealed: isAnswerRevealed,
      is_timer_running: isTimerRunning,
      timer_seconds_remaining: timerSeconds,
      ...partialState
    });
  };

  // -------------------------------------------------------------
  // TIMER TICK ENGINE
  // -------------------------------------------------------------
  useEffect(() => {
    if (isTimerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current);
            setIsTimerRunning(false);
            if (rules.soundEnabled) audioService.playTimeUpBuzzer();
            syncArenaState({ is_timer_running: false, timer_seconds_remaining: 0 });
            return 0;
          }

          // Urgent ticks when timer <= 10s
          if (prev <= 10 && rules.soundEnabled) {
            audioService.playUrgentTick();
          } else if (rules.soundEnabled && prev % 5 === 0) {
            audioService.playTick();
          }

          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isTimerRunning, rules.soundEnabled]);

  const handleStartTimer = () => {
    if (timerSeconds > 0) {
      setIsTimerRunning(true);
      syncArenaState({ is_timer_running: true });
    }
  };

  const handlePauseTimer = () => {
    setIsTimerRunning(false);
    syncArenaState({ is_timer_running: false });
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setTimerSeconds(rules.defaultTimerDuration);
    syncArenaState({ is_timer_running: false, timer_seconds_remaining: rules.defaultTimerDuration });
  };

  const handleAdjustTimer = (secondsDelta) => {
    setTimerSeconds((prev) => Math.max(0, prev + secondsDelta));
  };

  // -------------------------------------------------------------
  // QUESTION SELECTION & REVEAL
  // -------------------------------------------------------------
  const handleSelectRound = (roundId) => {
    setActiveRound(roundId);
    syncArenaState({ active_round: roundId });
  };

  const handleDrawQuestion = (selectedQuestion) => {
    if (!selectedQuestion) return;

    // Automatically advance "Question for" to next team in rotation
    let assignedId = activeTeamId;
    if (autoAdvanceTurn && hasLoadedInitialQRef.current) {
      const cIdx = teams.findIndex((t) => t.id === activeTeamId);
      const nIdx = (cIdx + 1) % teams.length;
      assignedId = teams[nIdx].id;
      setActiveTeamId(assignedId);
    }
    hasLoadedInitialQRef.current = true;

    setCurrentQuestion(selectedQuestion);
    setIsAnswerRevealed(false);
    setHasBeenScored(false);
    setTimerSeconds(rules.defaultTimerDuration);
    setIsTimerRunning(false);

    // Clear team pounce flags
    setTeams((prev) => prev.map((t) => ({ ...t, hasPounced: false, pounceTimestamp: null })));

    // Mark question as drawn in bank, and auto-recycle if round pool is exhausted
    setQuestions((prev) => {
      const updated = prev.map((q) =>
        q.id === selectedQuestion.id
          ? { ...q, status: 'drawn', drawnAt: new Date().toISOString() }
          : q
      );
      // Auto-recycle: if all questions in this round are drawn, reset them to available so quiz can continue
      const remainingInRound = updated.filter(
        (q) => Number(q.round) === Number(activeRound) && q.status === 'available'
      );
      if (remainingInRound.length === 0) {
        return updated.map((q) =>
          Number(q.round) === Number(activeRound) ? { ...q, status: 'available' } : q
        );
      }
      return updated;
    });

    // Log to draw history
    const targetTeam = teams.find((t) => t.id === assignedId);
    const newDrawLog = {
      timestamp: new Date().toISOString(),
      questionId: selectedQuestion.id,
      questionTag: selectedQuestion.tag,
      round: activeRound,
      method: 'fair_random_reel',
      teamId: assignedId,
      teamName: targetTeam ? targetTeam.name : 'Unknown'
    };
    setDrawHistory((prev) => [newDrawLog, ...prev]);

    syncArenaState({
      assigned_team_id: assignedId,
      active_question_id: selectedQuestion.id,
      active_question_tag: selectedQuestion.tag,
      is_answer_revealed: false,
      is_timer_running: false,
      timer_seconds_remaining: rules.defaultTimerDuration
    });
  };

  const handleRevealByTag = (chitTag) => {
    if (!chitTag) return;
    const clean = chitTag.trim().toUpperCase();
    let found = questions.find((q) => q.tag.toUpperCase() === clean);
    if (!found) {
      found = questions.find(
        (q) => q.tag.replace(/[^A-Z0-9]/gi, '').toUpperCase() === clean.replace(/[^A-Z0-9]/gi, '')
      );
    }
    if (!found) return;

    // Automatically advance "Question for" to next team in rotation
    let assignedId = activeTeamId;
    if (autoAdvanceTurn && hasLoadedInitialQRef.current) {
      const cIdx = teams.findIndex((t) => t.id === activeTeamId);
      const nIdx = (cIdx + 1) % teams.length;
      assignedId = teams[nIdx].id;
      setActiveTeamId(assignedId);
    }
    hasLoadedInitialQRef.current = true;

    setCurrentQuestion(found);
    setIsAnswerRevealed(false);
    setHasBeenScored(false);
    setTimerSeconds(rules.defaultTimerDuration);
    setIsTimerRunning(false);

    // Clear pounce flags
    setTeams((prev) => prev.map((t) => ({ ...t, hasPounced: false, pounceTimestamp: null })));

    // Mark as drawn if available
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === found.id
          ? { ...q, status: 'drawn', drawnAt: new Date().toISOString() }
          : q
      )
    );

    const targetTeam = teams.find((t) => t.id === assignedId);
    const newDrawLog = {
      timestamp: new Date().toISOString(),
      questionId: found.id,
      questionTag: found.tag,
      round: found.round || activeRound,
      method: 'physical_chit',
      teamId: assignedId,
      teamName: targetTeam ? targetTeam.name : 'Unknown'
    };
    setDrawHistory((prev) => [newDrawLog, ...prev]);

    syncArenaState({
      assigned_team_id: assignedId,
      active_question_id: found.id,
      active_question_tag: found.tag,
      is_answer_revealed: false,
      is_timer_running: false,
      timer_seconds_remaining: rules.defaultTimerDuration
    });
  };

  const handleToggleAnswer = () => {
    const nextVal = !isAnswerRevealed;
    setIsAnswerRevealed(nextVal);
    syncArenaState({ is_answer_revealed: nextVal });
  };

  // -------------------------------------------------------------
  // TEAM ORDER & TURN SEQUENCING
  // -------------------------------------------------------------
  const handleSelectTeam = (teamId) => {
    setActiveTeamId(teamId);
    syncArenaState({ assigned_team_id: teamId });
  };

  const handleNextTeamSequence = () => {
    const currentIndex = teams.findIndex((t) => t.id === activeTeamId);
    const nextIndex = (currentIndex + 1) % teams.length;
    const nextTeam = teams[nextIndex];
    setActiveTeamId(nextTeam.id);
    syncArenaState({ assigned_team_id: nextTeam.id });
  };

  // Toggle Pounce for a team
  const handleTogglePounce = (teamId) => {
    setTeams((prev) =>
      prev.map((t) => {
        if (t.id === teamId) {
          const nextState = !t.hasPounced;
          return {
            ...t,
            hasPounced: nextState,
            pounceTimestamp: nextState ? new Date().toISOString() : null
          };
        }
        return t;
      })
    );
  };

  // -------------------------------------------------------------
  // SCORING & AUDIT ENGINE
  // -------------------------------------------------------------
  // 1. Regular Correct / Wrong (Only assigned team)
  const handleAwardRegularScore = (teamId, pointsDelta, type) => {
    // Stop timer
    setIsTimerRunning(false);

    // Update team scores
    setTeams((prev) =>
      prev.map((t) => {
        if (t.id === teamId) {
          const updatedRoundScores = [...t.scoresByRound];
          const rIdx = activeRound - 1;
          updatedRoundScores[rIdx] = (updatedRoundScores[rIdx] || 0) + pointsDelta;
          const updatedTotal = t.totalScore + pointsDelta;
          return {
            ...t,
            scoresByRound: updatedRoundScores,
            totalScore: updatedTotal
          };
        }
        return t;
      })
    );

    // Log marks event
    const targetTeam = teams.find((t) => t.id === teamId);
    const logItem = {
      timestamp: new Date().toISOString(),
      type,
      teamId,
      teamName: targetTeam ? targetTeam.name : 'Unknown',
      pointsDelta,
      questionTag: currentQuestion?.tag || null,
      round: activeRound,
      reason: `Direct ${type.toUpperCase()} answer by assigned team`,
      operator: adminUser?.email || 'Operator'
    };
    setMarksHistory((prev) => [logItem, ...prev]);

    setHasBeenScored(true);

    if (type === 'correct') {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#f59e0b', '#3b82f6', '#10b981', '#ec4899']
        });
      } catch {}
    }
  };

  // 2. Pounce Score Award (+10 / -5)
  const handleAwardPounceScore = (teamId, pointsDelta, type) => {
    // Update team score
    setTeams((prev) =>
      prev.map((t) => {
        if (t.id === teamId) {
          const updatedRoundScores = [...t.scoresByRound];
          const rIdx = activeRound - 1;
          updatedRoundScores[rIdx] = (updatedRoundScores[rIdx] || 0) + pointsDelta;
          const updatedTotal = t.totalScore + pointsDelta;
          return {
            ...t,
            scoresByRound: updatedRoundScores,
            totalScore: updatedTotal,
            hasPounced: false // Clear pounce flag for this team
          };
        }
        return t;
      })
    );

    const targetTeam = teams.find((t) => t.id === teamId);
    const logItem = {
      timestamp: new Date().toISOString(),
      type,
      teamId,
      teamName: targetTeam ? targetTeam.name : 'Unknown',
      pointsDelta,
      questionTag: currentQuestion?.tag || null,
      round: activeRound,
      reason: `Pounce ${type === 'pounce_correct' ? 'CORRECT' : 'INCORRECT'} result`,
      operator: adminUser?.email || 'Operator'
    };
    setMarksHistory((prev) => [logItem, ...prev]);

    if (type === 'pounce_correct') {
      setHasBeenScored(true);
      try {
        confetti({
          particleCount: 70,
          spread: 75,
          origin: { y: 0.8 },
          colors: ['#f59e0b', '#ec4899', '#ffffff']
        });
      } catch {}
    }
  };

  // 3. Score Correction & Audit Trail
  const handleSaveScoreCorrection = ({ teamId, round, pointsDelta, reason }) => {
    setTeams((prev) =>
      prev.map((t) => {
        if (t.id === teamId) {
          const updatedRoundScores = [...t.scoresByRound];
          const rIdx = round - 1;
          updatedRoundScores[rIdx] = (updatedRoundScores[rIdx] || 0) + pointsDelta;
          const updatedTotal = t.totalScore + pointsDelta;
          return {
            ...t,
            scoresByRound: updatedRoundScores,
            totalScore: updatedTotal
          };
        }
        return t;
      })
    );

    const targetTeam = teams.find((t) => t.id === teamId);
    const logItem = {
      timestamp: new Date().toISOString(),
      type: 'manual_adjustment',
      teamId,
      teamName: targetTeam ? targetTeam.name : 'Unknown',
      pointsDelta,
      questionTag: currentQuestion?.tag || null,
      round,
      reason: `Score Correction: ${reason}`,
      operator: adminUser?.email || 'Operator'
    };
    setMarksHistory((prev) => [logItem, ...prev]);
  };

  // Reset all scores with confirmation
  const handleResetAllScores = () => {
    setTeams((prev) =>
      prev.map((t) => ({
        ...t,
        scoresByRound: [0, 0, 0, 0, 0, 0],
        totalScore: 0,
        hasPounced: false,
        pounceTimestamp: null
      }))
    );
    const logItem = {
      timestamp: new Date().toISOString(),
      type: 'manual_adjustment',
      teamId: 'all',
      teamName: 'ALL TEAMS',
      pointsDelta: 0,
      questionTag: null,
      round: activeRound,
      reason: 'Administrator reset tournament scores to 0',
      operator: adminUser?.email || 'Operator'
    };
    setMarksHistory((prev) => [logItem, ...prev]);
  };

  // Reset draw eligibility while preserving audit history
  const handleResetDrawEligibility = () => {
    setQuestions((prev) => prev.map((q) => ({ ...q, status: 'available' })));
  };

  // -------------------------------------------------------------
  // RENDER CURRENT VIEW
  // -------------------------------------------------------------
  if (activeView === 'presentation') {
    return (
      <PresentationMode
        teams={teams}
        rounds={ROUNDS_METADATA}
        activeRound={activeRound}
        activeTeamId={activeTeamId}
        currentQuestion={currentQuestion}
        timerSeconds={timerSeconds}
        isTimerRunning={isTimerRunning}
        isAnswerRevealed={isAnswerRevealed}
        rules={rules}
        hasBeenScored={hasBeenScored}
        questions={questions}
        autoAdvanceTurn={autoAdvanceTurn}
        onToggleAutoAdvance={() => setAutoAdvanceTurn((prev) => !prev)}
        onAdvanceTurn={handleNextTeamSequence}
        onStartTimer={handleStartTimer}
        onPauseTimer={handlePauseTimer}
        onResetTimer={handleResetTimer}
        onAdjustTimer={handleAdjustTimer}
        onToggleAnswer={handleToggleAnswer}
        onSelectTeam={handleSelectTeam}
        onTogglePounce={handleTogglePounce}
        onAwardRegularScore={handleAwardRegularScore}
        onAwardPounceScore={handleAwardPounceScore}
        onOpenPounceModal={() => setIsPounceModalOpen(true)}
        onSelectRound={handleSelectRound}
        onDrawQuestion={handleDrawQuestion}
        onRevealByTag={handleRevealByTag}
        onOpenCorrectionModal={() => setIsCorrectionModalOpen(true)}
        onExitPresentation={() => setActiveView('home')}
      />
    );
  }

  // Remove workspace completely: if activeView is workspace, fallback to home
  const effectiveView = activeView === 'workspace' ? 'home' : activeView;

  return (
    <div className="egs-app-root">
      {/* Living Background Ambient Particle Constellation */}
      <AmbientParticles currentTheme={theme} />

      {/* Main Top Navigation */}
      <Navbar
        activeView={effectiveView}
        onNavigate={setActiveView}
        currentTheme={theme}
        onSelectTheme={setTheme}
        autoAdvanceTurn={autoAdvanceTurn}
        onToggleAutoAdvance={() => setAutoAdvanceTurn((prev) => !prev)}
        rules={rules}
        onToggleSound={() => setRules({ ...rules, soundEnabled: !rules.soundEnabled })}
        onLaunchPresentation={() => setActiveView('presentation')}
        isAuthenticated={Boolean(adminUser)}
        adminUser={adminUser}
      />

      {/* Main Body View Switching */}
      <main className="egs-main-viewport">
        {effectiveView === 'home' && (
          <HomeLiveScores
            teams={teams}
            rounds={ROUNDS_METADATA}
            activeRound={activeRound}
            activeTeamId={activeTeamId}
            currentQuestion={currentQuestion}
            isAnswerRevealed={isAnswerRevealed}
            timerSeconds={timerSeconds}
            isTimerRunning={isTimerRunning}
            autoAdvanceTurn={autoAdvanceTurn}
          />
        )}

        {activeView === 'stats' && (
          <StatsDashboard
            teams={teams}
            rounds={ROUNDS_METADATA}
            activeRound={activeRound}
            marksHistory={marksHistory}
            drawHistory={drawHistory}
            questions={questions}
          />
        )}

        {activeView === 'admin' && (
          <AdminControls
            isAuthenticated={Boolean(adminUser)}
            adminUser={adminUser}
            onLogin={setAdminUser}
            onLogout={() => {
              supabaseService.logoutAdmin();
              setAdminUser(null);
            }}
            teams={teams}
            onUpdateTeams={setTeams}
            rules={rules}
            onUpdateRules={setRules}
            onResetAllScores={handleResetAllScores}
            questions={questions}
            onUpdateQuestions={setQuestions}
            onResetDrawEligibility={handleResetDrawEligibility}
            marksHistory={marksHistory}
            drawHistory={drawHistory}
            currentTheme={theme}
            onSelectTheme={setTheme}
            onLaunchPresentation={() => setActiveView('presentation')}
          />
        )}
      </main>

      {/* Global Modals */}
      <PounceModal
        isOpen={isPounceModalOpen}
        onClose={() => setIsPounceModalOpen(false)}
        teams={teams}
        activeTeamId={activeTeamId}
        onTogglePounce={handleTogglePounce}
        soundEnabled={rules.soundEnabled}
      />

      <ScoreCorrectionModal
        isOpen={isCorrectionModalOpen}
        onClose={() => setIsCorrectionModalOpen(false)}
        teams={teams}
        rounds={ROUNDS_METADATA}
        activeRound={activeRound}
        onSaveCorrection={handleSaveScoreCorrection}
      />
    </div>
  );
}

export default App;
