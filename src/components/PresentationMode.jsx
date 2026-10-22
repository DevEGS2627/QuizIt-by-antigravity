import React, { useState, useEffect, useRef } from 'react';
import {
  Maximize,
  Minimize,
  MoreVertical,
  Lock,
  Unlock,
  ArrowLeft,
  Check
} from 'lucide-react';
import { QuestionStage } from './QuestionStage';
import { TeamCard } from './TeamCard';
import { ScorePaddles } from './ScorePaddles';
import { ChitAndDrawBar } from './ChitAndDrawBar';
import { AmbientParticles } from './AmbientParticles';
import egsLogo from '../assets/egs-logo.png';

export const STAGE_THEMES = [
  { id: 'cyber-neon', name: '⚡ Cyberpunk Neon', preview: '#00f5ff', accent: '#ff007f' },
  { id: 'solar-flare', name: '🔥 Solar Flare / Crimson', preview: '#ff2a5f', accent: '#ffb703' },
  { id: 'aurora-mint', name: '🌌 Aurora Borealis Mint', preview: '#00ff9d', accent: '#00e5ff' },
  { id: 'cosmic-violet', name: '🔮 Cosmic Amethyst', preview: '#c084fc', accent: '#f43f5e' },
  { id: 'electric-cobalt', name: '⚡ Laser Cobalt Blue', preview: '#38bdf8', accent: '#2563eb' },
  { id: 'champagne-luxe', name: '✨ 24K Champagne Luxe', preview: '#f6d365', accent: '#f59e0b' },
  { id: 'toxic-matrix', name: '🧪 Radioactive Matrix', preview: '#39ff14', accent: '#00f0ff' },
  { id: 'synthwave-sunset', name: '🌅 Tokyo Synthwave', preview: '#ff6b35', accent: '#ff1361' }
];

export const PresentationMode = ({
  teams,
  rounds,
  activeRound,
  activeTeamId,
  currentQuestion,
  timerSeconds,
  isTimerRunning,
  isAnswerRevealed,
  rules,
  hasBeenScored,
  questions,
  autoAdvanceTurn = true,
  onToggleAutoAdvance,
  onAdvanceTurn,
  onStartTimer,
  onPauseTimer,
  onResetTimer,
  onAdjustTimer,
  onToggleAnswer,
  onSelectTeam,
  onTogglePounce,
  onAwardRegularScore,
  onAwardPounceScore,
  onSelectRound,
  onDrawQuestion,
  onRevealByTag,
  onOpenCorrectionModal,
  onExitPresentation
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPaddles, setShowPaddles] = useState(true);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  const [stageTheme, setStageTheme] = useState(() => {
    return localStorage.getItem('egs_stage_palette') || 'royal-gold';
  });

  const moreMenuRef = useRef(null);

  const handleSelectStageTheme = (themeId) => {
    setStageTheme(themeId);
    localStorage.setItem('egs_stage_palette', themeId);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Fullscreen management
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const activeTeam = teams.find((t) => t.id === activeTeamId) || teams[0];
  const roundMetadata = rounds.find((r) => r.id === activeRound) || rounds[0];

  const currentIdx = teams.findIndex((t) => t.id === activeTeamId);
  const nextIdx = (currentIdx + 1) % teams.length;
  const nextTeam = teams[nextIdx];

  // Sorted teams for leaderboard standings preview
  const sortedByScore = [...teams].sort((a, b) => b.totalScore - a.totalScore);

  return (
    <div className="presentation-arena-container" data-stage-theme={stageTheme}>
      {/* Continuous Living Dust & Particle Movement in Presentation Mode */}
      <AmbientParticles currentTheme={stageTheme} />

      {/* Main 70/30 Projector Viewport Grid */}
      <div className="presentation-main-layout">
        {/* LEFT STAGE: 70% Attention */}
        <section className="presentation-stage-col">
          {/* Theatrical Auditorium Projector Header Bar */}
          <header className="projector-header">
            <div className="brand-stage-left">
              <div className="projector-crest-badge" title="The Espee Global School, Roorkee">
                <img
                  src={egsLogo}
                  alt="The Espee Global School Logo"
                  className="projector-crest-img"
                  onError={(e) => {
                    const fallbackUrl = `${import.meta.env.BASE_URL}egs-logo.png`;
                    if (e.currentTarget.src !== fallbackUrl) {
                      e.currentTarget.src = fallbackUrl;
                    }
                  }}
                />
              </div>
              <div className="projector-brand-text">
                <div className="projector-school-title">THE ESPEE GLOBAL SCHOOL</div>
                <div className="projector-arena-sub">INTER-SCHOOL QUIZIT ARENA</div>
              </div>

              <div className="stage-live-broadcast-pill">
                <span className="live-broadcast-dot" />
                <span>ON AIR</span>
              </div>

              <div className="round-badge-pill">
                <span className="round-num">{roundMetadata.badge}</span>
                <span className="round-sep">•</span>
                <span className="round-name-txt">{roundMetadata.name}</span>
              </div>

              {currentQuestion?.tag && (
                <div className="projector-chit-pill">
                  <span>TAG:</span>
                  <strong>{currentQuestion.tag}</strong>
                </div>
              )}
            </div>

            <div className="projector-header-actions">
              {/* Fullscreen Toggle */}
              <button
                type="button"
                className="btn-icon-ghost"
                onClick={toggleFullscreen}
                title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen Projector Mode'}
              >
                {isFullscreen ? <Minimize size={17} /> : <Maximize size={17} />}
              </button>

              {/* More Operator Controls Trigger (Hidden menu with theme colors & options) */}
              <div className="projector-dropdown-relative" ref={moreMenuRef}>
                <button
                  type="button"
                  className={`btn-icon-ghost ${showMoreMenu ? 'active' : ''}`}
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  title="Operator Controls & Color Schemes"
                >
                  <MoreVertical size={17} />
                </button>

                {/* Operator "More" Menu Dropdown (Guaranteed high z-index and zero clipping) */}
                {showMoreMenu && (
                  <div className="more-menu-dropdown">
                    <div className="menu-header">Operator Controls</div>
                    
                    <button
                      type="button"
                      className="menu-item"
                      onClick={() => {
                        setShowPaddles(!showPaddles);
                        setShowMoreMenu(false);
                      }}
                    >
                      <span>{showPaddles ? 'Hide Scoring Console' : 'Show Scoring Console'}</span>
                    </button>

                    <button
                      type="button"
                      className="menu-item"
                      onClick={() => {
                        setIsLocked(!isLocked);
                        setShowMoreMenu(false);
                      }}
                    >
                      {isLocked ? <Unlock size={14} /> : <Lock size={14} />}
                      <span>{isLocked ? 'Unlock Stage Controls' : 'Lock Stage Controls'}</span>
                    </button>

                    <button
                      type="button"
                      className="menu-item"
                      onClick={() => {
                        onOpenCorrectionModal();
                        setShowMoreMenu(false);
                      }}
                    >
                      <span>Score Correction Tool</span>
                    </button>

                    <div className="menu-divider" />

                    <div className="menu-label">Stage Color Scheme:</div>
                    <div className="menu-theme-chips-row">
                      {STAGE_THEMES.map((th) => (
                        <button
                          key={th.id}
                          type="button"
                          className={`theme-chip-btn ${stageTheme === th.id ? 'active' : ''}`}
                          style={{ borderColor: th.preview }}
                          onClick={() => handleSelectStageTheme(th.id)}
                          title={th.name}
                        >
                          <span className="chip-color-dot" style={{ backgroundColor: th.preview }} />
                        </button>
                      ))}
                    </div>

                    <div className="menu-divider" />

                    <div className="menu-label">Switch Round:</div>
                    <div className="menu-rounds-grid">
                      {rounds.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          className={`menu-round-btn ${activeRound === r.id ? 'active' : ''}`}
                          onClick={() => {
                            onSelectRound(r.id);
                            setShowMoreMenu(false);
                          }}
                        >
                          {r.badge}
                        </button>
                      ))}
                    </div>

                    <div className="menu-divider" />

                    <button
                      type="button"
                      className="menu-item exit-btn"
                      onClick={() => {
                        setShowMoreMenu(false);
                        onExitPresentation();
                      }}
                    >
                      <ArrowLeft size={15} />
                      <span>Exit Presentation Mode</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Question Stage Card */}
          <div className="stage-card-wrapper">
            <QuestionStage
              question={currentQuestion}
              activeTeam={activeTeam}
              nextTeam={nextTeam}
              onAdvanceTurn={onAdvanceTurn}
              autoAdvanceTurn={autoAdvanceTurn}
              onToggleAutoAdvance={onToggleAutoAdvance}
              timerSeconds={timerSeconds}
              isTimerRunning={isTimerRunning}
              onStartTimer={onStartTimer}
              onPauseTimer={onPauseTimer}
              onResetTimer={onResetTimer}
              onAdjustTimer={onAdjustTimer}
              isAnswerRevealed={isAnswerRevealed}
              onToggleAnswer={onToggleAnswer}
              isProjector={true}
              soundEnabled={rules.soundEnabled}
              hasBeenScored={hasBeenScored}
            />
          </div>

          {/* Bottom Floating Score Paddles Console */}
          {showPaddles && !isLocked && (
            <div className="presentation-paddles-wrap">
              <ScorePaddles
                rules={rules}
                activeTeam={activeTeam}
                teams={teams}
                hasBeenScored={hasBeenScored}
                onAwardRegularScore={onAwardRegularScore}
                onAwardPounceScore={onAwardPounceScore}
                soundEnabled={rules.soundEnabled}
                isVisible={showPaddles}
                onToggleVisibility={() => setShowPaddles(!showPaddles)}
              />
            </div>
          )}

          {/* Compact Bottom Operator Bar */}
          {!isLocked && (
            <div className="projector-bottom-operator-bar">
              <ChitAndDrawBar
                rounds={rounds}
                activeRound={activeRound}
                onSelectRound={onSelectRound}
                questions={questions}
                onDrawQuestion={onDrawQuestion}
                onRevealByTag={onRevealByTag}
                soundEnabled={rules.soundEnabled}
              />
            </div>
          )}
        </section>

        {/* RIGHT SIDEBAR: 30% Live Standings */}
        <aside className="presentation-sidebar-col">
          <div className="standings-header">
            <h2 className="standings-heading">Standings</h2>
            <span className="standings-round-chip">Round {activeRound}</span>
          </div>

          {/* All 6 Team Cards Guaranteed Visible Without Scrolling */}
          <div className="projector-teams-list">
            {teams.map((team) => {
              const rank = sortedByScore.findIndex((t) => t.id === team.id) + 1;
              const isActive = team.id === activeTeamId;
              return (
                <TeamCard
                  key={team.id}
                  team={team}
                  isActiveTeam={isActive}
                  roundIndex={activeRound - 1}
                  rank={rank}
                  compact={true}
                  onSelectTeam={onSelectTeam}
                  onTogglePounce={onTogglePounce}
                />
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
};
