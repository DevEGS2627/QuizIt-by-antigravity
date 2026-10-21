import React, { useState, useEffect, useRef } from 'react';
import { Clock, CheckCircle, Radio, Sparkles } from 'lucide-react';
import { TeamCard } from './TeamCard';
import { QuestionRevealAnimator } from './QuestionRevealAnimator';

/**
 * HomeLiveScores: Clean Spectator Live Arena & Broadcast Viewer
 * - Host controls are completely removed and strictly limited to Admin / Projector mode.
 * - Displays live championship standings and active stage question with cyber laser / particle reveal.
 */
export const HomeLiveScores = ({
  teams,
  rounds,
  activeRound,
  activeTeamId,
  currentQuestion = null,
  isAnswerRevealed = false,
  timerSeconds = 45,
  isTimerRunning = false,
  autoAdvanceTurn = true
}) => {
  const currentRound = rounds.find((r) => Number(r.id) === Number(activeRound)) || rounds[0];
  const sortedTeams = [...teams].sort((a, b) => b.totalScore - a.totalScore);
  const leaderTeam = sortedTeams[0];
  const activeTeam = teams.find((t) => t.id === activeTeamId) || teams[0];
  const revealMode = localStorage.getItem('egs_reveal_mode') || 'word-cascade';

  return (
    <div className="home-minimal-view">
      {/* Standings Grid with Prestigious 1st, 2nd, 3rd Visual Hierarchy */}
      <section className="home-teams-block">
        <div className="block-header">
          <div className="block-title-row">
            <span className="block-title">STANDINGS ({teams.length} TEAMS)</span>
            <span className="spectator-mode-tag">
              <Radio size={12} className="live-radar-icon" /> LIVE ARENA
            </span>
          </div>
          <span className="block-leader">
            Current Leader: <strong style={{ color: leaderTeam.color }}>{leaderTeam.name}</strong> ({leaderTeam.totalScore} pts)
          </span>
        </div>

        {/* 6 Clean Team Tiles (No host buttons on spectator home page) */}
        <div className="teams-clean-grid">
          {teams.map((team) => {
            const rank = sortedTeams.findIndex((t) => t.id === team.id) + 1;
            const isActive = team.id === activeTeamId;
            return (
              <TeamCard
                key={team.id}
                team={team}
                isActiveTeam={isActive}
                roundIndex={activeRound - 1}
                rank={rank}
                compact={false}
                onSelectTeam={undefined}
                onTogglePounce={undefined}
              />
            );
          })}
        </div>
      </section>

      {/* ========================================================= */}
      {/* LIVE QUESTION BROADCAST STAGE (SPECTATOR QUESTION VIEW)  */}
      {/* Only the question, active turn, and live timer are shown  */}
      {/* ========================================================= */}
      <section className="home-live-stage-section">
        <div className="live-stage-header-row">
          <div className="live-status-group">
            <span className="live-indicator-dot" />
            <span className="live-stage-title">STAGE BROADCAST</span>
            <span className="stage-round-pill">
              {currentRound.badge}: {currentRound.name}
            </span>
          </div>

          <div className="live-stage-meta-pills">
            {currentQuestion?.tag && (
              <span className="chit-tag-pill">
                Chit #{currentQuestion.tag}
              </span>
            )}
            {activeTeam && (
              <span className="active-turn-pill" style={{ borderColor: activeTeam.color }}>
                <span className="turn-color-dot" style={{ backgroundColor: activeTeam.color }} />
                <span>Question for: <strong>{activeTeam.name}</strong></span>
              </span>
            )}

            {/* Live Timer Countdown (Display Only) */}
            {currentQuestion && (
              <div className={`visitor-timer-capsule ${timerSeconds <= 10 && timerSeconds > 0 ? 'urgent' : ''} ${timerSeconds === 0 ? 'expired' : ''}`}>
                <Clock size={13} />
                <span>
                  {String(Math.floor(timerSeconds / 60)).padStart(2, '0')}:
                  {String(timerSeconds % 60).padStart(2, '0')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Live Question Body with Multi-mode Reveal */}
        {currentQuestion ? (
          <div className="visitor-question-card">
            <div className="visitor-question-body">
              <QuestionRevealAnimator
                text={currentQuestion.question}
                triggerKey={currentQuestion.id}
                isAnswer={false}
                mode={revealMode}
                accentColor="var(--accent)"
              />
            </div>

            {/* Media if attached to question */}
            {currentQuestion.mediaUrl && (
              <div className="visitor-media-wrap">
                {currentQuestion.mediaType === 'video' ? (
                  <video src={currentQuestion.mediaUrl} controls className="visitor-media-content" />
                ) : (
                  <img src={currentQuestion.mediaUrl} alt="Stage Graphic" className="visitor-media-content" />
                )}
              </div>
            )}

            {/* Answer Display (Reveals automatically when judge reveals it) */}
            <div className="visitor-answer-wrapper">
              {isAnswerRevealed ? (
                <div className="visitor-answer-revealed answer-glow-enter">
                  <div className="answer-badge-row">
                    <CheckCircle size={15} className="answer-icon-verified" />
                    <span className="answer-tag-label">VERIFIED OFFICIAL ANSWER</span>
                  </div>
                  <div className="visitor-answer-text">
                    <QuestionRevealAnimator
                      text={currentQuestion.answer}
                      triggerKey={`ans-${currentQuestion.id}`}
                      isAnswer={true}
                      mode={revealMode}
                      accentColor="var(--pounce-color, #ffd700)"
                    />
                  </div>
                </div>
              ) : (
                <div className="visitor-answer-hidden">
                  <span className="hidden-answer-hint">
                    Official answer key hidden — reveals upon judge adjudication
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="visitor-stage-waiting">
            <div className="waiting-graphic-aura">
              <Sparkles size={28} className="waiting-sparkle-icon" />
            </div>
            <h3>Stage Ready for {currentRound.name}</h3>
            <p>
              Waiting for the operator to draw the next question chit from the judge console...
            </p>
            {activeTeam && (
              <div className="waiting-next-team-chip">
                <span>Question for next turn:</span>
                <strong style={{ color: activeTeam.color }}>{activeTeam.name} ({activeTeam.school})</strong>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
};
