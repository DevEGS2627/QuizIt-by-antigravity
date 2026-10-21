import React, { useState } from 'react';
import {
  Users,
  Settings,
  BookOpen,
  History,
  Palette,
  Cloud,
  Plus,
  Trash2,
  Edit2,
  Upload,
  Download,
  Search,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Save,
  Lock,
  LogOut,
  RefreshCw,
  FileText,
  Tv2
} from 'lucide-react';
import { csvService } from '../services/csvService';
import { supabaseService } from '../services/supabaseClient';
import { THEMES_LIST } from '../constants/initialData';

export const AdminControls = ({
  isAuthenticated,
  adminUser,
  onLogin,
  onLogout,
  teams,
  onUpdateTeams,
  rules,
  onUpdateRules,
  onResetAllScores,
  questions,
  onUpdateQuestions,
  onResetDrawEligibility,
  marksHistory,
  drawHistory,
  currentTheme,
  onSelectTheme,
  onLaunchPresentation
}) => {
  // Navigation inside Admin
  const [activeTab, setActiveTab] = useState('teams');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Teams editor state
  const [editingTeam, setEditingTeam] = useState(null);

  // Question bank search/filter state
  const [qSearch, setQSearch] = useState('');
  const [qRoundFilter, setQRoundFilter] = useState('all');
  const [qStatusFilter, setQStatusFilter] = useState('all');
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [csvNotice, setCsvNotice] = useState('');

  // Rules form state
  const [rulesDraft, setRulesDraft] = useState({ ...rules });
  const [rulesSavedNotice, setRulesSavedNotice] = useState('');

  // Supabase credentials state
  const [supabaseUrlInput, setSupabaseUrlInput] = useState(supabaseService.getConfig().url);
  const [supabaseKeyInput, setSupabaseKeyInput] = useState(supabaseService.getConfig().key);
  const [supabaseNotice, setSupabaseNotice] = useState('');

  // -------------------------------------------------------------
  // LOGIN FORM
  // -------------------------------------------------------------
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    const { user, error } = await supabaseService.loginAdmin(loginEmail, loginPassword);
    setIsLoggingIn(false);
    if (error) {
      setLoginError(error.message || 'Login failed. Please check your credentials.');
    } else {
      onLogin(user);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-login-wrapper">
        <div className="admin-login-card">
          <div className="login-card-header">
            <div className="admin-egs-crest-badge" title="The Espee Global School, Roorkee">
              <img src="/egs-logo.png" alt="The Espee Global School Logo" className="admin-crest-img" />
            </div>
            <h2>Judge & Operator Authorization</h2>
            <p>The Espee Global School, Roorkee • Inter-School Quizit Championship</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="admin-login-form">
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="admin@egs.edu"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
            </div>

            {loginError && (
              <div className="auth-error-banner">
                <AlertTriangle size={16} />
                <span>{loginError}</span>
              </div>
            )}

            <button type="submit" className="login-btn-primary" disabled={isLoggingIn}>
              {isLoggingIn ? 'Authenticating...' : 'Sign In as Operator'}
            </button>

            <div className="demo-credentials-helper">
              <span>Demo / Offline Quick Login:</span>
              <code>admin@egs.edu</code> / <code>admin123</code>
            </div>

            {onLaunchPresentation && (
              <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid rgba(255, 255, 255, 0.12)' }}>
                <button
                  type="button"
                  className="login-btn-primary"
                  style={{
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.18), rgba(217, 119, 6, 0.28))',
                    borderColor: 'rgba(245, 158, 11, 0.45)',
                    color: '#fef3c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                  onClick={onLaunchPresentation}
                >
                  <Tv2 size={16} />
                  <span>Launch Projector Screen Directly</span>
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // CSV IMPORT / EXPORT HANDLERS
  // -------------------------------------------------------------
  const handleCSVUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        const { imported, errors } = csvService.importQuestions(text);
        if (imported.length > 0) {
          // Merge or replace questions
          const updated = [...questions];
          imported.forEach((newQ) => {
            const existingIdx = updated.findIndex((q) => q.tag === newQ.tag);
            if (existingIdx !== -1) {
              updated[existingIdx] = { ...updated[existingIdx], ...newQ };
            } else {
              updated.push(newQ);
            }
          });
          onUpdateQuestions(updated);
          setCsvNotice(`Successfully imported ${imported.length} questions! ${errors.length > 0 ? `(${errors.length} warnings)` : ''}`);
        } else {
          setCsvNotice('No valid question rows found in file.');
        }
      } catch (err) {
        setCsvNotice(`CSV import failed: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportQuestionsCSV = () => {
    const csvContent = csvService.exportQuestions(questions);
    csvService.downloadFile(csvContent, `egs-quizit-questions-${Date.now()}.csv`);
  };

  const handleDownloadSampleTemplate = () => {
    const sample = csvService.generateSampleTemplate();
    csvService.downloadFile(sample, 'egs-quizit-sample-template.csv');
  };

  // Filtered questions
  const filteredQuestions = questions.filter((q) => {
    const matchSearch =
      q.tag.toLowerCase().includes(qSearch.toLowerCase()) ||
      q.question.toLowerCase().includes(qSearch.toLowerCase()) ||
      q.answer.toLowerCase().includes(qSearch.toLowerCase());
    const matchRound = qRoundFilter === 'all' || q.round === Number(qRoundFilter);
    const matchStatus = qStatusFilter === 'all' || q.status === qStatusFilter;
    return matchSearch && matchRound && matchStatus;
  });

  return (
    <div className="admin-workspace-container">
      {/* Admin Top Header */}
      <header className="admin-top-bar">
        <div className="admin-header-title">
          <div className="admin-header-crest-pill" title="The Espee Global School, Roorkee">
            <img src="/egs-logo.png" alt="EGS Logo" className="admin-header-crest-img" />
          </div>
          <div>
            <h2>Admin & Judge Control Center</h2>
            <span className="admin-operator-badge">
              The Espee Global School • Operator: {adminUser?.email || 'admin@egs.edu'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {onLaunchPresentation && (
            <button
              type="button"
              className="btn-admin-projector"
              onClick={onLaunchPresentation}
              title="Launch Fullscreen Projector Arena"
            >
              <Tv2 size={15} />
              <span>Launch Projector</span>
            </button>
          )}

          <button type="button" className="btn-logout" onClick={onLogout} title="Sign out of Admin">
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Quick Launch Projector Screen Banner */}
      <div className="admin-projector-banner">
        <div className="admin-projector-info">
          <h3>
            <Tv2 size={18} style={{ color: 'var(--accent)' }} />
            Auditorium Projector Arena
          </h3>
          <p>
            Duplicate your display to the stage projector. Features fine desert-sand particle animations, suspense reveals, and clean 70/30 layout.
          </p>
        </div>
        {onLaunchPresentation && (
          <button
            type="button"
            className="btn-admin-projector"
            onClick={onLaunchPresentation}
          >
            <Tv2 size={16} />
            <span>Open Projector Mode</span>
          </button>
        )}
      </div>

      {/* Admin Tabs Bar */}
      <nav className="admin-nav-tabs">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'teams' ? 'active' : ''}`}
          onClick={() => setActiveTab('teams')}
        >
          <Users size={16} />
          <span>Teams ({teams.length})</span>
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === 'rules' ? 'active' : ''}`}
          onClick={() => setActiveTab('rules')}
        >
          <Settings size={16} />
          <span>Scoring Rules</span>
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === 'questions' ? 'active' : ''}`}
          onClick={() => setActiveTab('questions')}
        >
          <BookOpen size={16} />
          <span>Question Bank ({questions.length})</span>
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <History size={16} />
          <span>Audit & Histories ({marksHistory.length})</span>
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === 'appearance' ? 'active' : ''}`}
          onClick={() => setActiveTab('appearance')}
        >
          <Palette size={16} />
          <span>Themes & Appearance</span>
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === 'supabase' ? 'active' : ''}`}
          onClick={() => setActiveTab('supabase')}
        >
          <Cloud size={16} />
          <span>Supabase Sync</span>
        </button>
      </nav>

      {/* TAB CONTENT AREAS */}
      <main className="admin-tab-body">
        {/* ========================================================= */}
        {/* TAB 1: TEAMS SETUP */}
        {/* ========================================================= */}
        {activeTab === 'teams' && (
          <div className="admin-panel-section">
            <div className="section-header-row">
              <div>
                <h3>Participating Teams & School Logos</h3>
                <p>Configure team names, represented schools, accent colors, and logos.</p>
              </div>
            </div>

            <div className="teams-management-grid">
              {teams.map((t, idx) => (
                <div key={t.id} className="team-manage-card" style={{ borderLeft: `5px solid ${t.color}` }}>
                  <div className="card-top">
                    <span className="team-num">Team #{idx + 1}</span>
                    <input
                      type="color"
                      value={t.color}
                      onChange={(e) => {
                        const updated = teams.map((item) =>
                          item.id === t.id ? { ...item, color: e.target.value } : item
                        );
                        onUpdateTeams(updated);
                      }}
                      className="color-picker-input"
                      title="Change Team Color"
                    />
                  </div>

                  <div className="team-field-group">
                    <label>Team Name</label>
                    <input
                      type="text"
                      value={t.name}
                      onChange={(e) => {
                        const updated = teams.map((item) =>
                          item.id === t.id ? { ...item, name: e.target.value } : item
                        );
                        onUpdateTeams(updated);
                      }}
                      className="text-input"
                    />
                  </div>

                  <div className="team-field-group">
                    <label>School / Institution</label>
                    <input
                      type="text"
                      value={t.school}
                      onChange={(e) => {
                        const updated = teams.map((item) =>
                          item.id === t.id ? { ...item, school: e.target.value } : item
                        );
                        onUpdateTeams(updated);
                      }}
                      className="text-input"
                    />
                  </div>

                  <div className="team-score-summary">
                    <span>Overall Points: <strong>{t.totalScore}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: SCORING RULES */}
        {/* ========================================================= */}
        {activeTab === 'rules' && (
          <div className="admin-panel-section">
            <div className="section-header-row">
              <div>
                <h3>Tournament Scoring Rules & Timing</h3>
                <p>Adjust paddle values, pounce deductions, and question durations.</p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                onUpdateRules(rulesDraft);
                setRulesSavedNotice('Scoring rules successfully updated and applied.');
                setTimeout(() => setRulesSavedNotice(''), 3000);
              }}
              className="rules-form"
            >
              <div className="form-grid-two">
                <div className="form-group">
                  <label>Correct Answer Points (Regular)</label>
                  <input
                    type="number"
                    value={rulesDraft.correctPoints}
                    onChange={(e) =>
                      setRulesDraft({ ...rulesDraft, correctPoints: Number(e.target.value) })
                    }
                    className="form-input"
                    required
                  />
                  <small>Awarded to the assigned team on correct answer.</small>
                </div>

                <div className="form-group">
                  <label>Wrong Answer Points (Regular)</label>
                  <input
                    type="number"
                    value={rulesDraft.wrongPoints}
                    onChange={(e) =>
                      setRulesDraft({ ...rulesDraft, wrongPoints: Number(e.target.value) })
                    }
                    className="form-input"
                    required
                  />
                  <small>Points deducted/awarded on incorrect direct answer.</small>
                </div>

                <div className="form-group">
                  <label>Pounce Correct Points</label>
                  <input
                    type="number"
                    value={rulesDraft.pounceCorrectPoints}
                    onChange={(e) =>
                      setRulesDraft({ ...rulesDraft, pounceCorrectPoints: Number(e.target.value) })
                    }
                    className="form-input"
                    required
                  />
                  <small>Awarded to a team with a registered pounce that answers correctly.</small>
                </div>

                <div className="form-group">
                  <label>Pounce Incorrect Penalty</label>
                  <input
                    type="number"
                    value={rulesDraft.pounceIncorrectPoints}
                    onChange={(e) =>
                      setRulesDraft({ ...rulesDraft, pounceIncorrectPoints: Number(e.target.value) })
                    }
                    className="form-input"
                    required
                  />
                  <small>Penalty deducted from a team whose pounce answer was incorrect.</small>
                </div>

                <div className="form-group">
                  <label>Default Question Timer (Seconds)</label>
                  <input
                    type="number"
                    value={rulesDraft.defaultTimerDuration}
                    onChange={(e) =>
                      setRulesDraft({ ...rulesDraft, defaultTimerDuration: Number(e.target.value) })
                    }
                    className="form-input"
                    required
                  />
                  <small>Starting duration when a new question is revealed.</small>
                </div>

                <div className="form-group">
                  <label>Audio Sound Effects</label>
                  <select
                    className="form-select"
                    value={rulesDraft.soundEnabled ? 'true' : 'false'}
                    onChange={(e) =>
                      setRulesDraft({ ...rulesDraft, soundEnabled: e.target.value === 'true' })
                    }
                  >
                    <option value="true">Enabled (Web Audio Chimes & Ticks)</option>
                    <option value="false">Muted / Silent Mode</option>
                  </select>
                  <small>Synthesized tones for timer urgency, draws, and paddles.</small>
                </div>
              </div>

              {rulesSavedNotice && (
                <div className="rules-success-banner">
                  <CheckCircle size={16} />
                  <span>{rulesSavedNotice}</span>
                </div>
              )}

              <div className="rules-actions-bar">
                <button type="submit" className="btn-primary">
                  <Save size={16} />
                  <span>Save Scoring Rules</span>
                </button>

                <button
                  type="button"
                  className="btn-danger"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to reset all team scores to zero? This action will reset scores across all rounds.')) {
                      onResetAllScores();
                    }
                  }}
                >
                  <RotateCcw size={16} />
                  <span>Reset All Scores to 0</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: QUESTION BANK */}
        {/* ========================================================= */}
        {activeTab === 'questions' && (
          <div className="admin-panel-section">
            <div className="section-header-row">
              <div>
                <h3>Question Bank Management ({questions.length} questions loaded)</h3>
                <p>Architected for 1,000+ questions across 6 rounds with CSV bulk import and tag search.</p>
              </div>

              <div className="header-actions-cluster">
                <label className="btn-action-outline upload-label">
                  <Upload size={15} />
                  <span>Bulk Import CSV</span>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCSVUpload}
                    style={{ display: 'none' }}
                  />
                </label>

                <button type="button" className="btn-action-outline" onClick={handleExportQuestionsCSV}>
                  <Download size={15} />
                  <span>Export CSV</span>
                </button>

                <button type="button" className="btn-action-ghost" onClick={handleDownloadSampleTemplate}>
                  <FileText size={15} />
                  <span>Sample Template</span>
                </button>

                <button
                  type="button"
                  className="btn-action-warning"
                  onClick={() => {
                    if (window.confirm('Reset all drawn questions back to available status? Audit histories will be preserved.')) {
                      onResetDrawEligibility();
                    }
                  }}
                >
                  <RefreshCw size={15} />
                  <span>Reset Draw Eligibility</span>
                </button>
              </div>
            </div>

            {csvNotice && (
              <div className="csv-notice-banner">
                <CheckCircle size={16} />
                <span>{csvNotice}</span>
              </div>
            )}

            {/* Search and Filters Bar */}
            <div className="questions-filter-bar">
              <div className="search-field-wrap">
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search by tag, question text, or answer..."
                  value={qSearch}
                  onChange={(e) => setQSearch(e.target.value)}
                  className="search-input"
                />
              </div>

              <select
                className="filter-select"
                value={qRoundFilter}
                onChange={(e) => setQRoundFilter(e.target.value)}
              >
                <option value="all">All Rounds (1-6)</option>
                <option value="1">Round 1 (General Knowledge)</option>
                <option value="2">Round 2 (Science & Tech)</option>
                <option value="3">Round 3 (History & Heritage)</option>
                <option value="4">Round 4 (Literature & Arts)</option>
                <option value="5">Round 5 (Sports & Games)</option>
                <option value="6">Round 6 (The Gauntlet)</option>
              </select>

              <select
                className="filter-select"
                value={qStatusFilter}
                onChange={(e) => setQStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="available">Available (Unused)</option>
                <option value="drawn">Drawn</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {/* Questions Table */}
            <div className="questions-table-scroll-container">
              <table className="questions-data-table">
                <thead>
                  <tr>
                    <th>Tag</th>
                    <th>Round</th>
                    <th>Question Text</th>
                    <th>Answer Key</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQuestions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="table-empty-row">
                        No questions match the current filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredQuestions.slice(0, 100).map((q) => (
                      <tr key={q.id}>
                        <td>
                          <span className="table-tag-pill">{q.tag}</span>
                        </td>
                        <td>Round {q.round}</td>
                        <td className="question-cell">{q.question}</td>
                        <td className="answer-cell">{q.answer}</td>
                        <td>
                          <span className={`status-badge status-${q.status}`}>
                            {q.status}
                          </span>
                        </td>
                        <td>
                          <div className="table-actions-cell">
                            <button
                              type="button"
                              className="btn-icon-subtle"
                              onClick={() => {
                                const newStatus = q.status === 'available' ? 'drawn' : 'available';
                                const updated = questions.map((item) =>
                                  item.id === q.id ? { ...item, status: newStatus } : item
                                );
                                onUpdateQuestions(updated);
                              }}
                              title="Toggle available/drawn status"
                            >
                              <RefreshCw size={14} />
                            </button>
                            <button
                              type="button"
                              className="btn-icon-subtle text-danger"
                              onClick={() => {
                                if (window.confirm(`Delete question ${q.tag}?`)) {
                                  onUpdateQuestions(questions.filter((item) => item.id !== q.id));
                                }
                              }}
                              title="Delete Question"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {filteredQuestions.length > 100 && (
              <p className="table-overflow-hint">
                Showing first 100 of {filteredQuestions.length} matched questions. Use search to narrow down.
              </p>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: AUDIT HISTORIES */}
        {/* ========================================================= */}
        {activeTab === 'history' && (
          <div className="admin-panel-section">
            <div className="section-header-row">
              <div>
                <h3>Audit Trail & Marks History</h3>
                <p>Complete immutable ledger of all score awards, pounces, draws, and corrections.</p>
              </div>

              <button
                type="button"
                className="btn-action-outline"
                onClick={() => {
                  const content = csvService.exportHistory(marksHistory, drawHistory);
                  csvService.downloadFile(content, `egs-quizit-audit-log-${Date.now()}.csv`);
                }}
              >
                <Download size={15} />
                <span>Export Audit Log (CSV)</span>
              </button>
            </div>

            <div className="history-table-container">
              <table className="history-data-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Action / Type</th>
                    <th>Team</th>
                    <th>Points Delta</th>
                    <th>Question Tag</th>
                    <th>Round</th>
                    <th>Audit Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {marksHistory.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="table-empty-row">
                        No scoring events recorded in this session yet.
                      </td>
                    </tr>
                  ) : (
                    marksHistory.map((item, idx) => (
                      <tr key={idx}>
                        <td className="timestamp-cell">
                          {new Date(item.timestamp).toLocaleTimeString()}
                        </td>
                        <td>
                          <span className={`event-type-badge event-${item.type}`}>
                            {item.type.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="team-cell">{item.teamName}</td>
                        <td className={`points-cell ${item.pointsDelta > 0 ? 'pos' : (item.pointsDelta < 0 ? 'neg' : 'zero')}`}>
                          {item.pointsDelta > 0 ? `+${item.pointsDelta}` : item.pointsDelta}
                        </td>
                        <td>{item.questionTag || '—'}</td>
                        <td>Round {item.round || '—'}</td>
                        <td className="reason-cell">{item.reason || 'Normal gameplay scoring'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: THEMES & APPEARANCE */}
        {/* ========================================================= */}
        {activeTab === 'appearance' && (
          <div className="admin-panel-section">
            <div className="section-header-row">
              <div>
                <h3>Arena Visual Themes (60-30-10 Engine)</h3>
                <p>Select any of the 7 curated themes. High contrast guaranteed for both operator and projector.</p>
              </div>
            </div>

            <div className="themes-gallery-grid">
              {THEMES_LIST.map((theme) => {
                const isSelected = currentTheme === theme.id;
                return (
                  <div
                    key={theme.id}
                    className={`theme-card-option ${isSelected ? 'selected' : ''}`}
                    onClick={() => onSelectTheme(theme.id)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="theme-color-palette-bar">
                      <div className="palette-stripe base" style={{ backgroundColor: theme.preview[0] }} title="60% Base Surface"></div>
                      <div className="palette-stripe panel" style={{ backgroundColor: theme.preview[1] }} title="30% Structural Panels"></div>
                      <div className="palette-stripe accent" style={{ backgroundColor: theme.preview[2] }} title="10% Vivid Accent"></div>
                    </div>

                    <div className="theme-card-info">
                      <div className="theme-name-row">
                        <h4>{theme.name}</h4>
                        {isSelected && <span className="active-tag">Active</span>}
                      </div>
                      <p className="theme-desc">{theme.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 6: SUPABASE CONNECTION */}
        {/* ========================================================= */}
        {activeTab === 'supabase' && (
          <div className="admin-panel-section">
            <div className="section-header-row">
              <div>
                <h3>Supabase Cloud Backend Configuration</h3>
                <p>Connect your Supabase project URL and Anon Publishable key for cross-device realtime sync.</p>
              </div>

              <div className="connection-status-pill">
                <span className={`status-dot ${supabaseService.isConfigured() ? 'online' : 'offline'}`} />
                <span>{supabaseService.isConfigured() ? 'Supabase Connected' : 'Running in Local-Only Mode'}</span>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                supabaseService.saveCustomConfig(supabaseUrlInput.trim(), supabaseKeyInput.trim());
              }}
              className="supabase-config-form"
            >
              <div className="form-group">
                <label>Supabase Project URL</label>
                <input
                  type="url"
                  placeholder="https://xyzcompany.supabase.co"
                  value={supabaseUrlInput}
                  onChange={(e) => setSupabaseUrlInput(e.target.value)}
                  className="form-input"
                />
                <small>Found in your Supabase Project Settings → API.</small>
              </div>

              <div className="form-group">
                <label>Supabase Anon Publishable Key</label>
                <input
                  type="text"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={supabaseKeyInput}
                  onChange={(e) => setSupabaseKeyInput(e.target.value)}
                  className="form-input"
                />
                <small>Safe to use in frontend. NEVER enter your Service Role Secret key.</small>
              </div>

              <div className="config-actions-row">
                <button type="submit" className="btn-primary">
                  <Save size={16} />
                  <span>Save Credentials & Reconnect</span>
                </button>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    supabaseService.saveCustomConfig('', '');
                  }}
                >
                  Reset to Local-Only Mode
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};
