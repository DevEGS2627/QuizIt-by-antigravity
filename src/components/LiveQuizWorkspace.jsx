import React, { useState } from 'react';
import { Users, History, Tv2 } from 'lucide-react';
import { QuestionStage } from './QuestionStage';
import { ChitAndDrawBar } from './ChitAndDrawBar';
import { ScorePaddles } from './ScorePaddles';

export const LiveQuizWorkspace = ({
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
  drawHistory,
  marksHistory,
  onStartTimer,
  onPauseTimer,
  onResetTimer,
  onAdjustTimer,
  onToggleAnswer,
  onSelectTeam,
  onNextTeamSequence,
  onTogglePounce,
  onAwardRegularScore,
  onAwardPounceScore,
  onOpenPounceModal,
  onSelectRound,
  onDrawQuestion,
  onRevealByTag,
  onLaunchPresentation
}) => {
  const [showDrawDrawer, setShowDrawDrawer] = useState(false);
  const [paddlesVisible, setPaddlesVisible] = useState(true);

  const activeTeam = teams.find((t) => t.id === activeTeamId) || teams[0];

  return (
    <div className="workspace-clean-container">
      {/* Top Header & Turn Navigation */}
      <section className="workspace-sub-bar">
        <div className="sub-bar-left">
          <span className="sub-bar-title">Live Stage</span>
          <button
            type="button"
            className="btn-next-turn-pill"
            onClick={onNextTeamSequence}
            title="Advance Turn to Next Team"
          >
            <span>Next Turn ({activeTeam.shortName} →)</span>
          </button>
        </div>

        <div className="sub-bar-right">
          <button
            type="button"
            className="btn-subtle-tool"
            onClick={() => setShowDrawDrawer(!showDrawDrawer)}
            title="Draw Log"
          >
            <History size={14} />
            <span>Draws ({drawHistory.length})</span>
          </button>

          <button
            type="button"
            className="btn-subtle-tool"
            onClick={onLaunchPresentation}
            title="Launch Projector Screen"
          >
            <Tv2 size={14} />
            <span>Projector</span>
          </button>
        </div>
      </section>

      {/* Chit & Random Draw Bar */}
      <section className="workspace-draw-strip">
        <ChitAndDrawBar
          rounds={rounds}
          activeRound={activeRound}
          onSelectRound={onSelectRound}
          questions={questions}
          onDrawQuestion={onDrawQuestion}
          onRevealByTag={onRevealByTag}
          soundEnabled={rules.soundEnabled}
        />
      </section>

      {/* Main Grid: Question Stage (Left) + Quick Turn Monitor (Right) */}
      <div className="workspace-split-grid">
        <div className="workspace-stage-pane">
          <QuestionStage
            question={currentQuestion}
            activeTeam={activeTeam}
            timerSeconds={timerSeconds}
            isTimerRunning={isTimerRunning}
            onStartTimer={onStartTimer}
            onPauseTimer={onPauseTimer}
            onResetTimer={onResetTimer}
            onAdjustTimer={onAdjustTimer}
            isAnswerRevealed={isAnswerRevealed}
            onToggleAnswer={onToggleAnswer}
            isProjector={false}
            soundEnabled={rules.soundEnabled}
            hasBeenScored={hasBeenScored}
          />
        </div>

        {/* Quiet Quick Turn Monitor */}
        <aside className="workspace-sidebar-pane">
          <div className="sidebar-pane-header">
            <span>Teams & Turn</span>
          </div>

          <div className="quick-teams-stack">
            {teams.map((t) => {
              const isActive = t.id === activeTeamId;
              return (
                <div
                  key={t.id}
                  className={`team-quick-tile ${isActive ? 'active-turn' : ''} ${t.hasPounced ? 'pounced-turn' : ''}`}
                  onClick={() => onSelectTeam(t.id)}
                >
                  <div className="tile-left">
                    <span className="dot" style={{ backgroundColor: t.color }} />
                    <div className="tile-names">
                      <span className="name">{t.name}</span>
                      <span className="school">{t.school}</span>
                    </div>
                  </div>

                  <div className="tile-right">
                    <span className="score">{t.totalScore}</span>
                    {t.hasPounced && <span className="pounce-pip">P</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
      </div>

      {/* Bottom Floating Score Paddles */}
      <section className="workspace-paddles-wrap">
        <ScorePaddles
          rules={rules}
          activeTeam={activeTeam}
          teams={teams}
          hasBeenScored={hasBeenScored}
          onAwardRegularScore={onAwardRegularScore}
          onAwardPounceScore={onAwardPounceScore}
          onOpenPounceRegistration={onOpenPounceModal}
          soundEnabled={rules.soundEnabled}
          isVisible={paddlesVisible}
          onToggleVisibility={() => setPaddlesVisible(!paddlesVisible)}
        />
      </section>

      {/* Draw History Drawer */}
      {showDrawDrawer && (
        <div className="modal-backdrop" onClick={() => setShowDrawDrawer(false)}>
          <div className="modal-dialog draw-drawer-clean" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-heading">Draw History</h3>
              <button type="button" className="modal-close-btn" onClick={() => setShowDrawDrawer(false)}>
                ✕
              </button>
            </div>

            <div className="drawer-body-clean">
              {drawHistory.length === 0 ? (
                <p className="empty-muted-text">No questions drawn yet in this session.</p>
              ) : (
                drawHistory.map((d, idx) => (
                  <div key={idx} className="draw-history-row">
                    <div className="row-left">
                      <span className="tag-badge">{d.questionTag}</span>
                      <span className="time">{new Date(d.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <span className="meta">Round {d.round} • For: {d.teamName}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
