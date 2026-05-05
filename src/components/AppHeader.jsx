import { useState } from 'react'
import TrueHealthAgeLogo from '../assets/logos/truehealthage.png'
import TrueHealthProtocolLogo from '../assets/logos/truehealthprotocol.png'
import '../styles/AppHeader.css'

export default function AppHeader({ currentPhase, userEmail, onLogout }) {
  const [showUserMenu, setShowUserMenu] = useState(false)

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="logo-section">
          <div className="logo-placeholder">TrueHealth</div>
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
