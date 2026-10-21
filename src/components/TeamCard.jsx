import React, { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';

export const TeamCard = ({
  team,
  isActiveTeam = false,
  roundIndex = 0,
  rank = null,
  compact = false,
  onSelectTeam,
  onTogglePounce
}) => {
  const currentRoundScore = team.scoresByRound[roundIndex] || 0;

  // Animated score counter state
  const [displayTotal, setDisplayTotal] = useState(team.totalScore);

  useEffect(() => {
    if (displayTotal !== team.totalScore) {
      const diff = team.totalScore - displayTotal;
      const step = diff > 0 ? 1 : -1;
      const timer = setInterval(() => {
        setDisplayTotal((prev) => {
          if (prev === team.totalScore) {
            clearInterval(timer);
            return prev;
          }
          return prev + step;
        });
      }, 35);
      return () => clearInterval(timer);
    }
  }, [team.totalScore, displayTotal]);

  const rankInfo = rank ? (
    rank === 1 ? { text: '1st', className: 'rank-gold', title: '1st Place' } :
    rank === 2 ? { text: '2nd', className: 'rank-silver', title: '2nd Place' } :
    rank === 3 ? { text: '3rd', className: 'rank-bronze', title: '3rd Place' } :
    { text: `${rank}th`, className: 'rank-neutral', title: `Rank ${rank}` }
  ) : null;

  return (
    <div
      className={`team-card ${isActiveTeam ? 'is-active-team' : ''} ${team.hasPounced ? 'is-pounced' : ''} ${compact ? 'is-compact' : ''} ${rank === 1 ? 'is-first-place' : ''}`}
      style={{
        '--team-accent': team.color || 'var(--accent)'
      }}
      onClick={() => onSelectTeam && onSelectTeam(team.id)}
      role="button"
      tabIndex={0}
      title={`${team.name} — ${team.school}`}
    >
      {/* Left indicator accent line */}
      <div className="team-card-accent-bar" style={{ backgroundColor: team.color }} />

      <div className="team-card-main">
        {/* Header Info */}
        <div className="team-card-info-col">
          <div className="team-title-row">
            {rankInfo && (
              <span className={`rank-podium-badge ${rankInfo.className}`} title={rankInfo.title}>
                {rankInfo.text}
              </span>
            )}
            <h3 className="team-name">{team.name}</h3>
            {team.hasPounced && (
              <span className="pounce-badge">
                <Zap size={11} /> Pounce
              </span>
            )}
          </div>
          {!compact && <span className="team-school">{team.school}</span>}
        </div>

        {/* Scores */}
        <div className="team-card-score-col">
          <div className="score-unit round-pts">
            <span className="score-lbl">R{roundIndex + 1}</span>
            <span className="score-val">
              {currentRoundScore > 0 ? `+${currentRoundScore}` : currentRoundScore}
            </span>
          </div>

          <div className="score-divider-pipe" />

          <div className="score-unit total-pts">
            <span className="score-lbl">Total</span>
            <span className="score-val highlight">{displayTotal}</span>
          </div>
        </div>
      </div>

      {/* Quick Pounce toggle for operator */}
      {onTogglePounce && (
        <button
          type="button"
          className={`btn-minimal-pounce ${team.hasPounced ? 'pounced' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onTogglePounce(team.id);
          }}
          title={team.hasPounced ? 'Cancel Pounce' : 'Register Pounce'}
        >
          <Zap size={12} />
          <span>{team.hasPounced ? 'Pounced' : 'Pounce'}</span>
        </button>
      )}
    </div>
  );
};
