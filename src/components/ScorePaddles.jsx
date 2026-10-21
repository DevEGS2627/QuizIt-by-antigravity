import React, { useState, useEffect } from 'react';
import { Check, X, Award, AlertTriangle, ChevronUp, ChevronDown } from 'lucide-react';
import { audioService } from '../services/audioService';

/**
 * ScorePaddles: Precision Broadcast Scoring Console HUD
 * Sophisticated broadcast console controls (matte obsidian, hairline titanium borders,
 * studio emerald, muted slate-crimson, and refined amber bronze).
 * Zero cheap neon gradients or cartoonish blooms.
 */
export const ScorePaddles = ({
  rules,
  activeTeam,
  teams,
  hasBeenScored = false,
  onAwardRegularScore,
  onAwardPounceScore,
  soundEnabled = true,
  isVisible = true,
  onToggleVisibility
}) => {
  const [animatingBtn, setAnimatingBtn] = useState(null);
  const [pounceTargetModal, setPounceTargetModal] = useState(null); // 'correct' | 'incorrect'

  const pouncedTeams = teams.filter((t) => t.hasPounced);

  const triggerButtonAnimation = (btnId, callback) => {
    setAnimatingBtn(btnId);
    if (soundEnabled) audioService.playPaddle();
    setTimeout(() => {
      setAnimatingBtn(null);
      if (callback) callback();
    }, 180);
  };

  const handleRegularCorrect = () => {
    if (hasBeenScored) {
      alert('This question has already been scored. Use the Score Correction tool to amend.');
      return;
    }
    if (!activeTeam) {
      alert('Please select or assign a team to this question first.');
      return;
    }
    triggerButtonAnimation('correct', () => {
      if (soundEnabled) audioService.playCorrect();
      onAwardRegularScore(activeTeam.id, rules.correctPoints, 'correct');
    });
  };

  const handleRegularWrong = () => {
    if (hasBeenScored) {
      alert('This question has already been scored. Use the Score Correction tool to amend.');
      return;
    }
    if (!activeTeam) {
      alert('Please select or assign a team to this question first.');
      return;
    }
    triggerButtonAnimation('wrong', () => {
      if (soundEnabled) audioService.playWrong();
      onAwardRegularScore(activeTeam.id, rules.wrongPoints, 'wrong');
    });
  };

  const handlePounceCorrectClick = () => {
    // If exactly one team flagged pounced, award to them; otherwise open clean team picker
    if (pouncedTeams.length === 1) {
      const target = pouncedTeams[0];
      triggerButtonAnimation('pounce-correct', () => {
        if (soundEnabled) audioService.playCorrect();
        onAwardPounceScore(target.id, rules.pounceCorrectPoints, 'pounce_correct');
      });
    } else {
      setPounceTargetModal('correct');
    }
  };

  const handlePounceIncorrectClick = () => {
    // If exactly one team flagged pounced, deduct from them; otherwise open clean team picker
    if (pouncedTeams.length === 1) {
      const target = pouncedTeams[0];
      triggerButtonAnimation('pounce-incorrect', () => {
        if (soundEnabled) audioService.playWrong();
        onAwardPounceScore(target.id, rules.pounceIncorrectPoints, 'pounce_incorrect');
      });
    } else {
      setPounceTargetModal('incorrect');
    }
  };

  // Keyboard shortcut listener: '1' for Correct, '0' for Wrong
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
        return;
      }
      if (e.key === '1') {
        e.preventDefault();
        handleRegularCorrect();
      } else if (e.key === '0') {
        e.preventDefault();
        handleRegularWrong();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  if (!isVisible) {
    return (
      <button
        type="button"
        className="show-score-deck-floating-btn"
        onClick={onToggleVisibility}
        title="Show Score Console"
      >
        <ChevronUp size={15} />
        <span>Scoring Console</span>
      </button>
    );
  }

  return (
    <div className="score-deck-dock-container">
      {/* Precision Broadcast Console Chassis */}
      <div className="score-deck-glass-capsule">
        {/* Active Team Context Indicator */}
        {activeTeam && (
          <div className="deck-active-team-pill">
            <span className="deck-turn-dot" style={{ backgroundColor: activeTeam.color }} />
            <div className="deck-team-text">
              <span className="deck-team-label">CURRENT TURN</span>
              <strong className="deck-team-name">{activeTeam.name}</strong>
            </div>
            <span className="deck-team-score-badge">{activeTeam.totalScore} pts</span>
          </div>
        )}

        <div className="deck-buttons-cluster">
          {/* Action 1: Correct (+pts) */}
          <button
            type="button"
            className={`deck-action-btn btn-correct ${animatingBtn === 'correct' ? 'is-animating' : ''} ${hasBeenScored ? 'is-disabled' : ''}`}
            onClick={handleRegularCorrect}
            disabled={hasBeenScored}
            title={`Award Correct (+${rules.correctPoints}) to ${activeTeam?.name || 'Active Team'} (Shortcut: 1)`}
          >
            <span className="deck-key-hint">1</span>
            <div className="btn-icon-circle">
              <Check size={16} strokeWidth={2.6} />
            </div>
            <div className="btn-content-wrap">
              <span className="btn-title">CORRECT</span>
              <span className="btn-points-badge">+{rules.correctPoints}</span>
            </div>
          </button>

          {/* Action 2: Wrong (0 / -pts) */}
          <button
            type="button"
            className={`deck-action-btn btn-wrong ${animatingBtn === 'wrong' ? 'is-animating' : ''} ${hasBeenScored ? 'is-disabled' : ''}`}
            onClick={handleRegularWrong}
            disabled={hasBeenScored}
            title={`Award Wrong (${rules.wrongPoints}) to ${activeTeam?.name || 'Active Team'} (Shortcut: 0)`}
          >
            <span className="deck-key-hint">0</span>
            <div className="btn-icon-circle">
              <X size={16} strokeWidth={2.6} />
            </div>
            <div className="btn-content-wrap">
              <span className="btn-title">WRONG</span>
              <span className="btn-points-badge">{rules.wrongPoints}</span>
            </div>
          </button>

          <div className="deck-glass-divider" />

          {/* Action 3: Pounce Correct (+) */}
          <button
            type="button"
            className={`deck-action-btn btn-pounce-award ${animatingBtn === 'pounce-correct' ? 'is-animating' : ''}`}
            onClick={handlePounceCorrectClick}
            title={`Award Pounce Correct (+${rules.pounceCorrectPoints})`}
          >
            <div className="btn-icon-circle">
              <Award size={15} strokeWidth={2.4} />
            </div>
            <div className="btn-content-wrap">
              <span className="btn-title">POUNCE +</span>
              <span className="btn-points-badge">+{rules.pounceCorrectPoints}</span>
            </div>
          </button>

          {/* Action 4: Pounce Incorrect (-) */}
          <button
            type="button"
            className={`deck-action-btn btn-pounce-penalty ${animatingBtn === 'pounce-incorrect' ? 'is-animating' : ''}`}
            onClick={handlePounceIncorrectClick}
            title={`Deduct Pounce Penalty (${rules.pounceIncorrectPoints})`}
          >
            <div className="btn-icon-circle">
              <AlertTriangle size={15} strokeWidth={2.4} />
            </div>
            <div className="btn-content-wrap">
              <span className="btn-title">POUNCE -</span>
              <span className="btn-points-badge">{rules.pounceIncorrectPoints}</span>
            </div>
          </button>
        </div>

        {/* Minimize toggle button */}
        {onToggleVisibility && (
          <button
            type="button"
            className="deck-collapse-toggle-btn"
            onClick={onToggleVisibility}
            title="Collapse Scoring Console"
          >
            <ChevronDown size={14} />
          </button>
        )}
      </div>

      {/* Target Modal for Pounce Scoring */}
      {pounceTargetModal && (
        <div className="pounce-picker-overlay" onClick={() => setPounceTargetModal(null)}>
          <div className="pounce-picker-card" onClick={(e) => e.stopPropagation()}>
            <h4 className="picker-title">
              Award {pounceTargetModal === 'correct' ? `+${rules.pounceCorrectPoints}` : rules.pounceIncorrectPoints} Pounce to:
            </h4>
            <div className="picker-teams-list">
              {(pouncedTeams.length > 0 ? pouncedTeams : teams).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className="picker-team-btn"
                  onClick={() => {
                    const isCorr = pounceTargetModal === 'correct';
                    triggerButtonAnimation(isCorr ? 'pounce-correct' : 'pounce-incorrect', () => {
                      if (isCorr) {
                        if (soundEnabled) audioService.playCorrect();
                        onAwardPounceScore(t.id, rules.pounceCorrectPoints, 'pounce_correct');
                      } else {
                        if (soundEnabled) audioService.playWrong();
                        onAwardPounceScore(t.id, rules.pounceIncorrectPoints, 'pounce_incorrect');
                      }
                      setPounceTargetModal(null);
                    });
                  }}
                >
                  <span className="picker-dot" style={{ backgroundColor: t.color }} />
                  <div>
                    <div className="picker-name">{t.name}</div>
                    <div className="picker-school">{t.school} ({t.totalScore} pts)</div>
                  </div>
                </button>
              ))}
            </div>
            <button
              type="button"
              className="picker-cancel-btn"
              onClick={() => setPounceTargetModal(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

