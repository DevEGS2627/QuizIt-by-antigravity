import React from 'react';
import { Award, TrendingUp, Zap, Target, Download, Trophy, BarChart3, Medal, CheckCircle2, XCircle } from 'lucide-react';
import { csvService } from '../services/csvService';

export const StatsDashboard = ({
  teams,
  rounds,
  activeRound,
  marksHistory,
  drawHistory,
  questions
}) => {
  // Sort teams descending by totalScore
  const sortedTeams = [...teams].sort((a, b) => b.totalScore - a.totalScore);
  const leader = sortedTeams[0];

  // Calculate detailed analytics for each team
  const teamAnalytics = teams.map((team) => {
    const teamMarks = marksHistory.filter((m) => m.teamId === team.id);
    const regularCorrect = teamMarks.filter((m) => m.type === 'correct').length;
    const regularWrong = teamMarks.filter((m) => m.type === 'wrong').length;
    const pounceCorrect = teamMarks.filter((m) => m.type === 'pounce_correct').length;
    const pounceIncorrect = teamMarks.filter((m) => m.type === 'pounce_incorrect').length;
    const totalPounces = pounceCorrect + pounceIncorrect;
    const pounceSuccessRate = totalPounces > 0 ? Math.round((pounceCorrect / totalPounces) * 100) : 0;
    
    // Points gained/lost via pounces
    const pouncePointsNet = teamMarks
      .filter((m) => m.type.startsWith('pounce'))
      .reduce((acc, curr) => acc + (curr.pointsDelta || 0), 0);

    // Highest scoring round
    let highestRound = 1;
    let maxRoundScore = -999;
    team.scoresByRound.forEach((score, idx) => {
      if (score > maxRoundScore) {
        maxRoundScore = score;
        highestRound = idx + 1;
      }
    });

    return {
      ...team,
      regularCorrect,
      regularWrong,
      pounceCorrect,
      pounceIncorrect,
      totalPounces,
      pounceSuccessRate,
      pouncePointsNet,
      highestRound,
      maxRoundScore: maxRoundScore > -999 ? maxRoundScore : 0
    };
  });

  const handleExportScoresCSV = () => {
    const content = csvService.exportScores(teams, rounds);
    csvService.downloadFile(content, `egs-quizit-scores-${Date.now()}.csv`);
  };

  return (
    <div className="stats-dashboard-container">
      {/* Dashboard Top Hero */}
      <div className="stats-hero-banner">
        <div className="hero-text-block">
          <div className="hero-badge">
            <Trophy size={16} />
            <span>Tournament Leaderboard & Analytics</span>
          </div>
          <h2>Live Arena Standings & Score Matrix</h2>
          <p>
            Real-time standings, cumulative round-by-round progression, and strategic pounce analytics.
          </p>
        </div>

        <div className="hero-actions-block">
          <button type="button" className="btn-export-csv" onClick={handleExportScoresCSV}>
            <Download size={16} />
            <span>Export Scores Matrix (CSV)</span>
          </button>
        </div>
      </div>

      {/* Podium Cards for Top 3 */}
      <div className="podium-grid">
        {sortedTeams.slice(0, 3).map((team, idx) => {
          const medals = ['Gold', 'Silver', 'Bronze'];
          const medalColors = ['#f59e0b', '#94a3b8', '#b45309'];
          return (
            <div
              key={team.id}
              className={`podium-card rank-${idx + 1}`}
              style={{ '--podium-accent': team.color }}
            >
              <div className="podium-badge" style={{ backgroundColor: `${medalColors[idx]}25`, color: medalColors[idx] }}>
                <Medal size={20} />
                <span>{medals[idx]} • #{idx + 1}</span>
              </div>

              <h3 className="podium-team-name">{team.name}</h3>
              <p className="podium-school-name">{team.school}</p>

              <div className="podium-score-wrap">
                <span className="podium-score-val">{team.totalScore}</span>
                <span className="podium-pts-label">PTS</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Round-by-Round Score Breakdown Matrix Table */}
      <div className="stats-section-card">
        <div className="section-card-header">
          <div className="header-title-block">
            <BarChart3 size={20} className="text-accent" />
            <h3>Round-by-Round Score Matrix</h3>
          </div>
          <span className="matrix-round-label">Current: Round {activeRound}</span>
        </div>

        <div className="matrix-table-wrap">
          <table className="matrix-data-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Team</th>
                <th>School</th>
                {rounds.map((r) => (
                  <th key={r.id} className={activeRound === r.id ? 'active-col' : ''}>
                    {r.badge}
                  </th>
                ))}
                <th className="total-col-header">Total Points</th>
              </tr>
            </thead>
            <tbody>
              {sortedTeams.map((team, idx) => (
                <tr key={team.id} className={idx === 0 ? 'leader-row' : ''}>
                  <td className="rank-cell">
                    <span className={`rank-tag rank-${idx + 1}`}>#{idx + 1}</span>
                  </td>
                  <td className="team-name-cell">
                    <span className="team-color-indicator" style={{ backgroundColor: team.color }}></span>
                    <strong>{team.name}</strong>
                  </td>
                  <td className="school-cell">{team.school}</td>
                  {rounds.map((r, rIdx) => {
                    const score = team.scoresByRound[rIdx] || 0;
                    return (
                      <td key={r.id} className={`score-matrix-cell ${activeRound === r.id ? 'active-col' : ''}`}>
                        {score > 0 ? `+${score}` : (score < 0 ? score : '0')}
                      </td>
                    );
                  })}
                  <td className="total-score-cell">
                    <strong>{team.totalScore}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SVG Score Progression Line Chart */}
      <div className="stats-section-card">
        <div className="section-card-header">
          <div className="header-title-block">
            <TrendingUp size={20} className="text-accent" />
            <h3>Cumulative Score Progression Across Rounds</h3>
          </div>
        </div>

        <div className="progression-chart-wrap">
          <svg viewBox="0 0 800 240" className="progression-svg" preserveAspectRatio="none">
            {/* Grid lines */}
            {[0, 1, 2, 3, 4].map((i) => {
              const y = 20 + i * 45;
              return (
                <line
                  key={i}
                  x1="50"
                  y1={y}
                  x2="780"
                  y2={y}
                  stroke="var(--border-subtle)"
                  strokeDasharray="4 4"
                />
              );
            })}

            {/* X-axis labels */}
            {rounds.map((r, idx) => {
              const x = 70 + idx * 135;
              return (
                <text key={r.id} x={x} y="225" fill="var(--text-muted)" fontSize="12" textAnchor="middle">
                  {r.badge}
                </text>
              );
            })}

            {/* Lines for each team */}
            {teams.map((team) => {
              // Calculate cumulative scores
              let running = 0;
              const points = team.scoresByRound.map((s, idx) => {
                running += s;
                const x = 70 + idx * 135;
                // Normalize max score scale
                const maxScale = Math.max(100, ...teams.map((t) => t.totalScore));
                const y = 195 - (running / maxScale) * 160;
                return { x, y: Math.max(25, Math.min(195, y)) };
              });

              const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');

              return (
                <g key={team.id}>
                  <polyline
                    fill="none"
                    stroke={team.color}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={polylinePoints}
                    opacity="0.85"
                  />
                  {points.map((p, pIdx) => (
                    <circle
                      key={pIdx}
                      cx={p.x}
                      cy={p.y}
                      r="4"
                      fill={team.color}
                      stroke="var(--bg-primary)"
                      strokeWidth="2"
                    />
                  ))}
                </g>
              );
            })}
          </svg>

          {/* Legend */}
          <div className="chart-legend-row">
            {teams.map((t) => (
              <div key={t.id} className="legend-item">
                <span className="legend-dot" style={{ backgroundColor: t.color }}></span>
                <span className="legend-name">{t.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pounce Strategy & Efficiency Analytics Grid */}
      <div className="stats-section-card">
        <div className="section-card-header">
          <div className="header-title-block">
            <Zap size={20} className="text-pounce" />
            <h3>Pounce Efficiency & Accuracy Analytics</h3>
          </div>
        </div>

        <div className="team-analytics-grid">
          {teamAnalytics.map((ta) => (
            <div key={ta.id} className="analytics-card" style={{ borderTop: `4px solid ${ta.color}` }}>
              <div className="card-team-header">
                <h4 style={{ color: ta.color }}>{ta.name}</h4>
                <span className="school-sub">{ta.school}</span>
              </div>

              <div className="analytics-metrics-list">
                <div className="metric-row">
                  <span className="metric-label">Regular Correct / Wrong:</span>
                  <span className="metric-val">
                    <span className="text-success">{ta.regularCorrect}</span> /{' '}
                    <span className="text-danger">{ta.regularWrong}</span>
                  </span>
                </div>

                <div className="metric-row">
                  <span className="metric-label">Pounce Attempts:</span>
                  <span className="metric-val">{ta.totalPounces}</span>
                </div>

                <div className="metric-row">
                  <span className="metric-label">Pounce Success Rate:</span>
                  <span className="metric-val font-bold">
                    {ta.pounceSuccessRate}%
                  </span>
                </div>

                <div className="metric-row">
                  <span className="metric-label">Net Pounce Points:</span>
                  <span className={`metric-val ${ta.pouncePointsNet > 0 ? 'text-success' : (ta.pouncePointsNet < 0 ? 'text-danger' : '')}`}>
                    {ta.pouncePointsNet > 0 ? `+${ta.pouncePointsNet}` : ta.pouncePointsNet}
                  </span>
                </div>

                <div className="metric-row">
                  <span className="metric-label">Best Round:</span>
                  <span className="metric-val">
                    Round {ta.highestRound} (+{ta.maxRoundScore} pts)
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
