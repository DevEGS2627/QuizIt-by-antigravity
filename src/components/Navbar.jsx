import React, { useState, useRef, useEffect } from 'react';
import {
  Tv2,
  Volume2,
  VolumeX,
  Menu,
  X,
  Lock,
  Palette,
  RotateCw,
  Sparkles,
  Check
} from 'lucide-react';
import { APP_THEMES } from '../constants/initialData';

export const Navbar = ({
  activeView,
  onNavigate,
  rules,
  onToggleSound,
  onLaunchPresentation,
  isAuthenticated = false,
  adminUser = null,
  currentTheme = 'cyber-neon',
  onSelectTheme,
  autoAdvanceTurn = true,
  onToggleAutoAdvance
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const themeMenuRef = useRef(null);

  // Close theme dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target)) {
        setThemeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Navigation items: Visitors see Overview and Stats.
  // Admins/Judges see Overview, Stats, and Admin Controls.
  const navItems = isAuthenticated
    ? [
        { id: 'home', label: 'Overview' },
        { id: 'stats', label: 'Stats' },
        { id: 'admin', label: 'Admin' }
      ]
    : [
        { id: 'home', label: 'Overview' },
        { id: 'stats', label: 'Stats' }
      ];

  const activeThemeObj = APP_THEMES.find((t) => t.id === currentTheme) || APP_THEMES[0];

  return (
    <header className="navbar-glass-shell">
      <div className="navbar-inner">
        {/* The Espee Global School official brand mark */}
        <div
          className="navbar-brand-minimal egs-brand-container"
          onClick={() => onNavigate('home')}
          role="button"
          tabIndex={0}
          title="The Espee Global School, Roorkee - Evolve to Excel"
        >
          <div className="egs-nav-crest-wrap">
            <img
              src="/egs-logo.png"
              alt="The Espee Global School Logo"
              className="egs-nav-logo-img"
            />
          </div>
          <div className="egs-brand-text-block">
            <span className="egs-school-brand-title">ESPEE GLOBAL</span>
            <span className="egs-sub-arena-tag">QUIZIT ARENA</span>
          </div>
        </div>

        {/* Apple / Lovable Segmented Pill Control */}
        <nav className="segmented-nav-control">
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`segmented-tab-btn ${isActive ? 'active' : ''}`}
                onClick={() => {
                  onNavigate(item.id);
                  setMobileMenuOpen(false);
                }}
              >
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Utility Actions */}
        <div className="navbar-actions-group">
          {/* Quick Auto-Advance Turn Toggle */}
          {onToggleAutoAdvance && (
            <button
              type="button"
              className={`btn-auto-turn-toggle ${autoAdvanceTurn ? 'active' : ''}`}
              onClick={onToggleAutoAdvance}
              title={autoAdvanceTurn ? 'Auto-Advance: Enabled (Moves "Question For" to next team automatically)' : 'Auto-Advance: Disabled'}
            >
              <RotateCw size={12} className={autoAdvanceTurn ? 'spin-icon-subtle' : ''} />
              <span>Auto-Turn: <strong>{autoAdvanceTurn ? 'ON' : 'OFF'}</strong></span>
            </button>
          )}

          {/* Theme Palette Dropdown */}
          <div className="theme-nav-dropdown-wrap" ref={themeMenuRef}>
            <button
              type="button"
              className="btn-theme-picker-pill"
              onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
              title="Change Color Theme"
            >
              <span className="theme-pip-dot" style={{ backgroundColor: activeThemeObj.primary }} />
              <span className="theme-name-nav">{activeThemeObj.name.split(' ')[1] || 'Theme'}</span>
              <Palette size={13} />
            </button>

            {themeDropdownOpen && (
              <div className="theme-dropdown-glass-menu">
                <div className="theme-dropdown-header">
                  <Sparkles size={12} />
                  <span>Vibrant Color Themes</span>
                </div>
                <div className="theme-options-grid">
                  {APP_THEMES.map((th) => {
                    const isSelected = currentTheme === th.id;
                    return (
                      <button
                        key={th.id}
                        type="button"
                        className={`theme-option-row ${isSelected ? 'selected' : ''}`}
                        onClick={() => {
                          if (onSelectTheme) onSelectTheme(th.id);
                          setThemeDropdownOpen(false);
                        }}
                      >
                        <div className="theme-row-dots">
                          <span className="theme-color-dot" style={{ backgroundColor: th.primary }} />
                          <span className="theme-color-dot secondary" style={{ backgroundColor: th.secondary }} />
                        </div>
                        <span className="theme-option-label">{th.name}</span>
                        {isSelected && <Check size={13} className="theme-check-icon" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sound Pill */}
          <button
            type="button"
            className={`btn-glass-icon ${rules?.soundEnabled ? 'active' : ''}`}
            onClick={onToggleSound}
            title={rules?.soundEnabled ? 'Sound On' : 'Sound Muted'}
          >
            {rules?.soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>

          {/* Dedicated One-Click Projector Mode Launch Button */}
          <button
            type="button"
            className="btn-projector-launch"
            onClick={onLaunchPresentation}
            title="Launch Projector Screen"
          >
            <Tv2 size={14} />
            <span>Projector</span>
          </button>

          {!isAuthenticated && (
            <button
              type="button"
              className="btn-admin-login-pill"
              onClick={() => onNavigate('admin')}
              title="Judge & Operator Login"
            >
              <Lock size={12} />
              <span>Judge</span>
            </button>
          )}

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            className="mobile-menu-trigger"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-drawer-glass">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`mobile-drawer-link ${activeView === item.id ? 'active' : ''}`}
              onClick={() => {
                onNavigate(item.id);
                setMobileMenuOpen(false);
              }}
            >
              <span>{item.label}</span>
            </button>
          ))}
          {isAuthenticated ? (
            <button
              type="button"
              className="mobile-drawer-link projector-accent"
              onClick={() => {
                onLaunchPresentation();
                setMobileMenuOpen(false);
              }}
            >
              <span>Launch Projector Screen</span>
            </button>
          ) : (
            <button
              type="button"
              className="mobile-drawer-link"
              onClick={() => {
                onNavigate('admin');
                setMobileMenuOpen(false);
              }}
            >
              <span>Judge Login</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
};
