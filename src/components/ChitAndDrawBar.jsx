import React, { useState, useEffect, useRef } from 'react';
import { Dices, ArrowRight, AlertCircle, ChevronDown, Check } from 'lucide-react';
import { audioService } from '../services/audioService';

export const ChitAndDrawBar = ({
  rounds,
  activeRound,
  onSelectRound,
  questions,
  onDrawQuestion,
  onRevealByTag,
  disabled = false,
  soundEnabled = true
}) => {
  const [tagInput, setTagInput] = useState('');
  const [tagError, setTagError] = useState('');
  const [tagSuccess, setTagSuccess] = useState('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [reelDisplayTag, setReelDisplayTag] = useState('');
  const [showRoundPicker, setShowRoundPicker] = useState(false);
  const reelIntervalRef = useRef(null);

  const activeRoundObj = rounds.find((r) => Number(r.id) === Number(activeRound)) || rounds[0];
  
  // Safe round matching (coerces string or number)
  const roundQuestions = questions.filter((q) => Number(q.round) === Number(activeRound));
  const availableQuestions = roundQuestions.filter((q) => q.status === 'available');
  
  // Resilient pool: prefer unplayed questions in active round, fallback to all round questions, fallback to entire bank
  const pool = availableQuestions.length > 0
    ? availableQuestions
    : (roundQuestions.length > 0 ? roundQuestions : questions);

  const handleChitSubmit = (e) => {
    e.preventDefault();
    setTagError('');
    setTagSuccess('');
    let clean = tagInput.trim().toUpperCase();
    if (!clean) return;

    // Normalize pure number input e.g. "3" -> "R1-003"
    if (/^\d+$/.test(clean)) {
      clean = `R${activeRound}-${clean.padStart(3, '0')}`;
    }

    // Try finding exact tag or normalized tag
    let found = questions.find((q) => q.tag.toUpperCase() === clean);
    if (!found) {
      // Try fuzzy search (e.g. "R1-3" matches "R1-003")
      found = questions.find(
        (q) => q.tag.replace(/[^A-Z0-9]/gi, '').toUpperCase() === clean.replace(/[^A-Z0-9]/gi, '')
      );
    }

    if (!found) {
      setTagError(`Chit tag "${clean}" not found in Question Bank.`);
      if (soundEnabled) audioService.playWrong();
      return;
    }

    if (soundEnabled) audioService.playDrawSelected();
    setTagSuccess(`Loaded Chit #${found.tag}`);
    setTimeout(() => setTagSuccess(''), 2500);
    onRevealByTag(found.tag);
    setTagInput('');
  };

  const handleRandomDraw = () => {
    if (disabled || questions.length === 0) return;

    // If already spinning and clicked again, instantly finish draw without waiting
    if (isSpinning) {
      if (reelIntervalRef.current) clearInterval(reelIntervalRef.current);
      const instantPick = pool[Math.floor(Math.random() * pool.length)];
      setIsSpinning(false);
      setReelDisplayTag(instantPick.tag);
      if (soundEnabled) audioService.playDrawSelected();
      onDrawQuestion(instantPick);
      return;
    }

    setTagError('');
    setTagSuccess('');

    if (pool.length === 0) {
      setTagError(`No questions available in Question Bank.`);
      if (soundEnabled) audioService.playWrong();
      return;
    }

    setIsSpinning(true);

    const selected = pool[Math.floor(Math.random() * pool.length)];
    let ticks = 0;
    const totalTicks = 6;
    const allTags = (roundQuestions.length > 0 ? roundQuestions : questions).map((q) => q.tag);

    reelIntervalRef.current = setInterval(() => {
      ticks++;
      const randomTag = allTags[Math.floor(Math.random() * allTags.length)] || selected.tag;
      setReelDisplayTag(randomTag);
      if (soundEnabled) audioService.playReelTick();

      if (ticks >= totalTicks) {
        clearInterval(reelIntervalRef.current);
        setReelDisplayTag(selected.tag);
        if (soundEnabled) audioService.playDrawSelected();
        setIsSpinning(false);
        onDrawQuestion(selected);
      }
    }, 60);
  };

  useEffect(() => {
    return () => {
      if (reelIntervalRef.current) clearInterval(reelIntervalRef.current);
    };
  }, []);

  return (
    <div className="airbnb-search-bar-wrapper">
      {/* Floating Capsule Bar with Frosted Glassmorphism */}
      <div className="floating-capsule-bar">
        {/* Segment 1: Round Selector */}
        <div className="capsule-segment round-segment">
          <button
            type="button"
            className="btn-round-dropdown"
            onClick={() => setShowRoundPicker(!showRoundPicker)}
            title="Switch Active Round"
          >
            <div className="segment-text-col">
              <span className="segment-micro-label">STAGE</span>
              <span className="segment-main-val">
                {activeRoundObj.badge} • {activeRoundObj.name}
              </span>
            </div>
            <ChevronDown size={13} className="segment-chevron" />
          </button>

          {showRoundPicker && (
            <div className="round-popover-menu" onClick={() => setShowRoundPicker(false)}>
              {rounds.map((r) => {
                const availCount = questions.filter(
                  (q) => Number(q.round) === Number(r.id) && q.status === 'available'
                ).length;
                return (
                  <button
                    key={r.id}
                    type="button"
                    className={`popover-round-row ${activeRound === r.id ? 'active' : ''}`}
                    onClick={() => onSelectRound(r.id)}
                  >
                    <span className="r-badge">{r.badge}</span>
                    <span className="r-name">{r.name}</span>
                    <span className="r-count">{availCount} left</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="capsule-divider" />

        {/* Segment 2: Chit Input Field (Instant lookup) */}
        <form className="capsule-segment chit-segment" onSubmit={handleChitSubmit}>
          <div className="segment-text-col input-wrap">
            <span className="segment-micro-label">CHIT TAG</span>
            <input
              type="text"
              placeholder={`e.g. R${activeRound}-001 or 1`}
              value={tagInput}
              onChange={(e) => {
                setTagInput(e.target.value);
                setTagError('');
              }}
              className="capsule-text-input"
            />
          </div>

          <button
            type="submit"
            className="btn-capsule-submit"
            disabled={!tagInput.trim()}
            title="Reveal Question Tag (Enter)"
          >
            <span className="kbd-hint">↵</span>
            <ArrowRight size={13} />
          </button>
        </form>

        <div className="capsule-divider" />

        {/* Segment 3: Fair Random Draw */}
        <div className="capsule-segment draw-segment">
          <button
            type="button"
            className={`btn-capsule-draw ${isSpinning ? 'spinning' : ''}`}
            onClick={handleRandomDraw}
            disabled={questions.length === 0}
            title={
              availableQuestions.length === 0
                ? 'All round questions played — will cycle pool for extra turns'
                : `Draw fair random question (${availableQuestions.length} remaining in Round ${activeRound})`
            }
          >
            <Dices size={15} />
            <span>
              {isSpinning
                ? `${reelDisplayTag || 'Drawing'}...`
                : availableQuestions.length === 0 && roundQuestions.length > 0
                ? 'Random Draw (Pool)'
                : 'Random Draw'}
            </span>
          </button>
        </div>
      </div>

      {tagError && (
        <div className="capsule-error-toast">
          <AlertCircle size={13} />
          <span>{tagError}</span>
        </div>
      )}

      {tagSuccess && (
        <div className="capsule-success-toast">
          <Check size={13} />
          <span>{tagSuccess}</span>
        </div>
      )}
    </div>
  );
};
