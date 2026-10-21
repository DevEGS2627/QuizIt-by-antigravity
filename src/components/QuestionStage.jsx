import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Play,
  Pause,
  RotateCcw,
  Check,
  ChevronRight,
  MoreVertical
} from 'lucide-react';
import { QuestionRevealAnimator, REVEAL_ANIMATION_MODES } from './QuestionRevealAnimator';
import { speechService } from '../services/speechService';

export const QuestionStage = ({
  question,
  activeTeam,
  nextTeam = null,
  onAdvanceTurn,
  autoAdvanceTurn = true,
  onToggleAutoAdvance,
  timerSeconds,
  isTimerRunning,
  onStartTimer,
  onPauseTimer,
  onResetTimer,
  onAdjustTimer,
  isAnswerRevealed,
  onToggleAnswer,
  isProjector = false,
  soundEnabled = true,
  hasBeenScored = false
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [revealMode, setRevealMode] = useState(() => {
    return localStorage.getItem('egs_reveal_mode') || 'word-cascade';
  });
  const [showModePicker, setShowModePicker] = useState(false);
  const modeMenuRef = useRef(null);

  const handleSelectRevealMode = (modeId) => {
    setRevealMode(modeId);
    localStorage.setItem('egs_reveal_mode', modeId);
    setShowModePicker(false);
  };

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (modeMenuRef.current && !modeMenuRef.current.contains(e.target)) {
        setShowModePicker(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    speechService.stop();
    setIsSpeaking(false);
  }, [question?.id]);

  // Keyboard shortcut listener for Space (timer) and 'A' (answer) and 'N' (next team)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        if (isTimerRunning) onPauseTimer();
        else onStartTimer();
      } else if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        onToggleAnswer();
      } else if (e.key === 'n' || e.key === 'N') {
        if (onAdvanceTurn) {
          e.preventDefault();
          onAdvanceTurn();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTimerRunning, onPauseTimer, onStartTimer, onToggleAnswer, onAdvanceTurn]);

  const handleToggleSpeech = () => {
    if (isSpeaking) {
      speechService.stop();
      setIsSpeaking(false);
    } else {
      if (question?.question) {
        setIsSpeaking(true);
        speechService.speak(
          question.question,
          () => setIsSpeaking(false),
          () => setIsSpeaking(false)
        );
      }
    }
  };

  const qLength = question?.question?.length || 0;
  const getDynamicFontSizeClass = () => {
    if (isProjector) {
      if (qLength > 240) return 'projector-font-compact';
      if (qLength > 140) return 'projector-font-medium';
      return 'projector-font-large';
    }
    if (qLength > 240) return 'stage-font-compact';
    if (qLength > 140) return 'stage-font-medium';
    return 'stage-font-large';
  };

  if (!question) {
    return (
      <div className={`question-stage-empty ${isProjector ? 'is-projector' : ''}`}>
        <div className="empty-stage-content">
          <span className="empty-sub-tag">Stage Ready</span>
          <h2 className="empty-title">Select or Draw Question</h2>
          <p className="empty-subtitle">
            Enter a physical chit tag or trigger a fair random draw to begin.
          </p>
          {activeTeam && (
            <div className="next-turn-badge">
              <span>Current Turn:</span>
              <strong style={{ color: activeTeam.color }}>{activeTeam.name}</strong>
            </div>
          )}
        </div>
      </div>
    );
  }

  const isUrgent = timerSeconds <= 10 && timerSeconds > 0;
  const isTimeUp = timerSeconds === 0;

  return (
    <div className={`question-stage-card ${isProjector ? 'is-projector' : ''}`}>
      {/* Top Stage Metadata & Automatic Turn Rotation Banner */}
      <div className="stage-top-bar">
        <div className="stage-meta-left">
          {activeTeam && (
            <div className="team-turn-chip active-pulsing" style={{ borderColor: activeTeam.color }}>
              <span className="team-color-pip" style={{ backgroundColor: activeTeam.color }} />
              <span>Question for: <strong style={{ color: activeTeam.color }}>{activeTeam.name}</strong></span>
              {autoAdvanceTurn && (
                <span className="auto-turn-badge" title="Automatically advances to next team after question draw">
                  AUTO
                </span>
              )}
            </div>
          )}

          {/* Quick Next Team Cycle Pill */}
          {nextTeam && onAdvanceTurn && (
            <button
              type="button"
              className="btn-next-team-cycle"
              onClick={onAdvanceTurn}
              title={`Advance turn to ${nextTeam.name} (Shortcut: N)`}
            >
              <span>Next: <strong>{nextTeam.shortName || nextTeam.name}</strong></span>
              <ChevronRight size={13} />
            </button>
          )}

          <span className="tag-badge">Chit #{question.tag}</span>

          {hasBeenScored && (
            <span className="scored-badge">
              <Check size={12} /> Scored
            </span>
          )}
        </div>

        {/* Minimal Apple-style Timer Capsule */}
        <div className={`minimal-timer ${isUrgent ? 'urgent' : ''} ${isTimeUp ? 'expired' : ''}`}>
          <span className="timer-value">
            {String(Math.floor(timerSeconds / 60)).padStart(2, '0')}:
            {String(timerSeconds % 60).padStart(2, '0')}
          </span>

          <div className="timer-action-buttons">
            <button
              type="button"
              className="btn-timer-action"
              onClick={isTimerRunning ? onPauseTimer : onStartTimer}
              title={isTimerRunning ? 'Pause (Space)' : 'Start (Space)'}
            >
              {isTimerRunning ? <Pause size={13} /> : <Play size={13} />}
            </button>

            <button
              type="button"
              className="btn-timer-action"
              onClick={onResetTimer}
              title="Reset Timer"
            >
              <RotateCcw size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Question Text (Instant Render, Zero Flicker, Silky Animated Reveal) */}
      <div className={`stage-question-content ${getDynamicFontSizeClass()}`}>
        <QuestionRevealAnimator
          text={question.question}
          triggerKey={question.id}
          isAnswer={false}
          mode={revealMode}
          accentColor="var(--accent)"
        />
      </div>

      {/* Optional Media */}
      {question.mediaUrl && (
        <div className="stage-media-panel">
          {question.mediaType === 'video' ? (
            <video src={question.mediaUrl} controls className="stage-video" />
          ) : (
            <img src={question.mediaUrl} alt="Question Graphic" className="stage-image" />
          )}
        </div>
      )}

      {/* Action Toolbar */}
      <div className="stage-action-toolbar">
        <div className="toolbar-left">
          <button
            type="button"
            className={`btn-minimal-action ${isSpeaking ? 'active' : ''}`}
            onClick={handleToggleSpeech}
            title="Read Question Aloud"
          >
            {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
            <span>{isSpeaking ? 'Stop Reading' : 'Read Aloud'}</span>
          </button>

          <button
            type="button"
            className={`btn-minimal-action ${isAnswerRevealed ? 'revealed' : ''}`}
            onClick={onToggleAnswer}
            title="Toggle Answer Key (Shortcut: A)"
          >
            {isAnswerRevealed ? <EyeOff size={14} /> : <Eye size={14} />}
            <span>{isAnswerRevealed ? 'Hide Answer' : 'Reveal Answer'}</span>
            <span className="kbd-hint">A</span>
          </button>
        </div>

        <div className="toolbar-right">
          {question.source && (
            <span className="stage-source-text">Source: {question.source}</span>
          )}

          {/* Sleek 3-Dot Options Menu (Contains Animation Mode Picker) */}
          <div className="stage-more-wrap" ref={modeMenuRef}>
            <button
              type="button"
              className={`btn-minimal-action btn-stage-more ${showModePicker ? 'active' : ''}`}
              onClick={() => setShowModePicker(!showModePicker)}
              title="Question Options & Animation Style"
              aria-label="More options"
            >
              <MoreVertical size={15} />
            </button>

            {showModePicker && (
              <div className="stage-more-dropdown-menu">
                <div className="anim-dropdown-title">Question Reveal Style</div>
                {REVEAL_ANIMATION_MODES.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className={`anim-mode-item ${revealMode === m.id ? 'active' : ''}`}
                    onClick={() => handleSelectRevealMode(m.id)}
                  >
                    <span className="anim-mode-icon">{m.icon}</span>
                    <span className="anim-mode-name">{m.name}</span>
                    {revealMode === m.id && <Check size={13} className="check-mark" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Answer Key Box with Glow Explosion */}
      {isAnswerRevealed && (
        <div className="stage-answer-box answer-glow-enter">
          <span className="answer-header-label">OFFICIAL ANSWER:</span>
          <div className="answer-text">
            <QuestionRevealAnimator
              text={question.answer}
              triggerKey={`ans-${question.id}`}
              isAnswer={true}
              mode={revealMode}
              accentColor="var(--pounce-color, #ffd700)"
            />
          </div>
        </div>
      )}
    </div>
  );
};
