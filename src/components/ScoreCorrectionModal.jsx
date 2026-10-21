import React, { useState } from 'react';
import { Edit3, X, Check, AlertCircle } from 'lucide-react';

export const ScoreCorrectionModal = ({
  isOpen,
  onClose,
  teams,
  rounds,
  activeRound,
  onSaveCorrection
}) => {
  const [selectedTeamId, setSelectedTeamId] = useState(teams[0]?.id || '');
  const [targetRound, setTargetRound] = useState(activeRound);
  const [pointsDelta, setPointsDelta] = useState(10);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a reason or note for this score correction (audit requirement).');
      return;
    }
    setError('');
    onSaveCorrection({
      teamId: selectedTeamId,
      round: Number(targetRound),
      pointsDelta: Number(pointsDelta),
      reason: reason.trim()
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog correction-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <Edit3 size={22} className="modal-icon text-warning" />
            <div>
              <h3 className="modal-heading">Score Correction & Audit Adjustment</h3>
              <p className="modal-sub">Amend marks with an explicit reason for the permanent audit trail.</p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Select Team</label>
            <select
              className="form-select"
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
            >
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.school}) — Current Total: {t.totalScore}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Round</label>
              <select
                className="form-select"
                value={targetRound}
                onChange={(e) => setTargetRound(Number(e.target.value))}
              >
                {rounds.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.badge}: {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Points Adjustment (+/-)</label>
              <input
                type="number"
                className="form-input"
                value={pointsDelta}
                onChange={(e) => setPointsDelta(Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Correction Reason / Audit Note *</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="e.g. Judge overruled question R2-004 answer; technical glitch reset; bonus awarded"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="form-error-msg">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              <Check size={16} />
              <span>Apply Score Correction</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
