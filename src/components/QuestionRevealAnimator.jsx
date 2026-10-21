import React, { useEffect, useState, useMemo, useRef } from 'react';

/**
 * QuestionRevealAnimator: 100% Smooth, Hardware-Accelerated Cinematic Question Reveal
 * 
 * Features:
 * - ZERO screen flicker: question is rendered immediately in steady layout
 * - ZERO annoying sounds: completely silent question reveal
 * - 5 high-voltage visual modes:
 *    1. 'laser-scan' (Cyber Laser Beam Sweep & Ionization)
 *    2. 'word-cascade' (Default: Cascading Shimmer, Focus & Pop)
 *    3. 'kinetic-3d' (3D Horizon Perspective Spring Unfold)
 *    4. 'matrix-glitch' (Quantum Matrix Glyph Decryption)
 *    5. 'smooth-fade' (Soft Glow & Contrast Fade)
 */

export const REVEAL_ANIMATION_MODES = [
  { id: 'word-cascade', name: '✨ Word Cascade & Focus', icon: '✨' },
  { id: 'laser-scan', name: '⚡ Cyber Laser Sweep', icon: '⚡' },
  { id: 'kinetic-3d', name: '🚀 3D Horizon Unfold', icon: '🚀' },
  { id: 'matrix-glitch', name: '👾 Quantum Matrix Decrypt', icon: '👾' },
  { id: 'smooth-fade', name: '🌟 Soft Glow Fade', icon: '🌟' }
];

const MATRIX_GLYPHS = '01#@$%&*<>[]{}~+=XYZΩΨΔ⚡';

export const QuestionRevealAnimator = ({
  text = '',
  triggerKey = '',
  isAnswer = false,
  mode = 'word-cascade',
  accentColor = 'var(--accent)',
  onComplete
}) => {
  // Normalize mode in case of legacy stored values
  const activeMode = useMemo(() => {
    if (mode === 'sand-vortex') return 'word-cascade';
    const exists = REVEAL_ANIMATION_MODES.some((m) => m.id === mode);
    return exists ? mode : 'word-cascade';
  }, [mode]);

  // Matrix decryption state
  const [matrixText, setMatrixText] = useState(text);
  const [matrixDone, setMatrixDone] = useState(false);
  const matrixIntervalRef = useRef(null);

  // Handle matrix decryption mode
  useEffect(() => {
    if (activeMode !== 'matrix-glitch' || !text) {
      setMatrixText(text);
      setMatrixDone(true);
      return;
    }

    if (matrixIntervalRef.current) {
      clearInterval(matrixIntervalRef.current);
    }

    setMatrixDone(false);
    const totalChars = text.length;
    const durationMs = Math.min(800, Math.max(400, totalChars * 18));
    const stepTimeMs = 24;
    const totalSteps = Math.ceil(durationMs / stepTimeMs);
    let currentStep = 0;

    matrixIntervalRef.current = setInterval(() => {
      currentStep++;
      const progress = Math.min(1, currentStep / totalSteps);
      const revealedCount = Math.floor(progress * totalChars);

      let scrambled = '';
      for (let i = 0; i < totalChars; i++) {
        if (i < revealedCount) {
          scrambled += text[i];
        } else if (text[i] === ' ' || text[i] === '\n') {
          scrambled += text[i];
        } else {
          scrambled += MATRIX_GLYPHS[Math.floor(Math.random() * MATRIX_GLYPHS.length)];
        }
      }

      setMatrixText(scrambled);

      if (progress >= 1) {
        clearInterval(matrixIntervalRef.current);
        setMatrixText(text);
        setMatrixDone(true);
        if (onComplete) onComplete();
      }
    }, stepTimeMs);

    return () => {
      if (matrixIntervalRef.current) clearInterval(matrixIntervalRef.current);
    };
  }, [triggerKey, text, activeMode, onComplete]);

  // Split into words for cascade and laser animations
  const words = useMemo(() => {
    if (!text) return [];
    return text.split(/(\s+)/); // Preserves spaces exactly
  }, [text]);

  if (!text) return null;

  // 1. MATRIX GLITCH DECRYPTOR
  if (activeMode === 'matrix-glitch') {
    return (
      <div
        key={`matrix-${triggerKey}`}
        className={`reveal-anim-wrap mode-matrix ${isAnswer ? 'is-answer' : ''}`}
      >
        <span className={`matrix-decrypt-text ${matrixDone ? 'is-decrypted' : 'is-scrambling'}`}>
          {matrixText}
        </span>
      </div>
    );
  }

  // 2. 3D HORIZON PERSPECTIVE UNFOLD
  if (activeMode === 'kinetic-3d') {
    return (
      <div
        key={`k3d-${triggerKey}`}
        className={`reveal-anim-wrap mode-kinetic-3d ${isAnswer ? 'is-answer' : ''}`}
      >
        <div className="kinetic-3d-card">
          <div className="kinetic-3d-text">{text}</div>
          <div className="kinetic-border-flash" aria-hidden="true" />
        </div>
      </div>
    );
  }

  // 3. CYBER LASER BEAM SWEEP
  if (activeMode === 'laser-scan') {
    return (
      <div
        key={`laser-${triggerKey}`}
        className={`reveal-anim-wrap mode-laser-scan ${isAnswer ? 'is-answer' : ''}`}
      >
        {/* Full-width sweeping laser blade */}
        <div className="laser-sweep-track" aria-hidden="true">
          <div className="laser-sweep-blade" />
          <div className="laser-sweep-glow" />
        </div>

        {/* Text illuminated with staggered ionization */}
        <div className="laser-text-container">
          {words.map((chunk, idx) => {
            if (/^\s+$/.test(chunk)) {
              return <span key={`space-${idx}`}>{chunk}</span>;
            }
            return (
              <span
                key={`laser-word-${idx}`}
                className="laser-scan-word"
                style={{
                  animationDelay: `${Math.min(0.04 * idx, 0.7)}s`
                }}
              >
                {chunk}
              </span>
            );
          })}
        </div>
      </div>
    );
  }

  // 4. SOFT GLOW FADE
  if (activeMode === 'smooth-fade') {
    return (
      <div
        key={`fade-${triggerKey}`}
        className={`reveal-anim-wrap mode-smooth-fade ${isAnswer ? 'is-answer' : ''}`}
      >
        <div className="smooth-fade-text">{text}</div>
      </div>
    );
  }

  // 5. WORD CASCADE & FOCUS (Default flagship)
  return (
    <div
      key={`cascade-${triggerKey}`}
      className={`reveal-anim-wrap mode-word-cascade ${isAnswer ? 'is-answer' : ''}`}
    >
      <div className="word-cascade-container">
        {words.map((chunk, idx) => {
          if (/^\s+$/.test(chunk)) {
            return <span key={`space-${idx}`}>{chunk}</span>;
          }
          return (
            <span
              key={`cascade-word-${idx}`}
              className="reveal-cascade-word"
              style={{
                animationDelay: `${Math.min(0.038 * idx, 0.85)}s`
              }}
            >
              {chunk}
            </span>
          );
        })}
      </div>
    </div>
  );
};
