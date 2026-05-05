import { useState } from 'react'
import '../styles/AppHeader.css'

export default function AppHeader({ currentPhase, userEmail, onLogout }) {
  const [showUserMenu, setShowUserMenu] = useState(false)

  // Determine which logo to show based on current phase
  const getLogoText = () => {
    if (currentPhase?.includes('phase2') || currentPhase === 'results') {
      return 'TrueHealth Protocol'
    }
    return 'TrueHealth Age'
  }

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="logo-section">
          {/* Logo Placeholder - Replace src with actual logo path */}
          <div className="logo-container">
            <div className="logo-placeholder">
              <svg viewBox="0 0 40 40" width="40" height="40" xmlns="http://www.w3.org/2000/svg">
                {/* Heart health icon placeholder */}
                <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="2"/>
                <path d="M20 12 C20 12, 12 16, 12 22 C12 27, 16 30, 20 30 C24 30, 28 27, 28 22 C28 16, 20 12, 20 12"
                      fill="currentColor" opacity="0.8"/>
              </svg>
            </div>
          </div>
          <div className="brand-text">
            <h1 className="brand-name">{getLogoText()}</h1>
            <p className="brand-tagline">Health Assessment</p>
          </div>
        </div>

        {userEmail && (
          <div className="user-section">
            <div className="user-menu-trigger" onClick={() => setShowUserMenu(!showUserMenu)}>
              <span className="user-initial">{userEmail.charAt(0).toUpperCase()}</span>
            </div>
            {showUserMenu && (
              <div className="user-menu">
                <div className="user-email">{userEmail}</div>
                <button className="logout-btn" onClick={onLogout}>
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
