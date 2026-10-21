import React from 'react';
import { Zap, X, Check, Users } from 'lucide-react';
import { audioService } from '../services/audioService';

export const PounceModal = ({
  isOpen,
  onClose,
  teams,
  activeTeamId,
  onTogglePounce,
  soundEnabled = true
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog pounce-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <Zap size={22} className="modal-icon text-pounce" />
            <div>
              <h3 className="modal-heading">Register Team Pounces</h3>
              <p className="modal-sub">
                Select which non-assigned teams buzzed to pounce on this question.
              </p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="pounce-teams-grid">
          {teams.map((team) => {
            const isAssigned = team.id === activeTeamId;
            return (
              <div
                key={team.id}
                className={`pounce-card-item ${team.hasPounced ? 'pounced-active' : ''} ${isAssigned ? 'assigned-disabled' : ''}`}
                onClick={() => {
                  if (isAssigned) return;
                  if (soundEnabled && !team.hasPounced) audioService.playPounce();
                  onTogglePounce(team.id);
                }}
              >
                <div className="item-badge" style={{ backgroundColor: `${team.color}25`, color: team.color }}>
                  <Users size={20} />
                </div>

                <div className="item-info">
                  <div className="item-name">{team.name}</div>
                  <div className="item-sub">
                    {isAssigned ? 'Owner of this question' : team.school}
                  </div>
                </div>

                <div className="item-status">
                  {isAssigned ? (
                    <span className="status-pill owner">Question Owner</span>
                  ) : team.hasPounced ? (
                    <span className="status-pill pounced">
                      <Zap size={14} /> Pounced
                    </span>
                  ) : (
                    <span className="status-pill ready">Click to Pounce</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
