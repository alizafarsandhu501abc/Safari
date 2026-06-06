import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const linkClass = ({ isActive }) =>
    `relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
      isActive
        ? 'text-white bg-white/[0.08] shadow-[0_0_15px_rgba(6,182,212,0.15)]'
        : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
    }`;

  return (
    <nav className="glass-strong sticky top-0 z-50" style={{ borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-8">
          <span className="text-xl font-bold gradient-text tracking-tight cursor-pointer" onClick={() => navigate('/dashboard')}>
            Safari
          </span>

          {/* Nav Links */}
          <div className="flex items-center gap-1">
            <NavLink to="/dashboard" className={linkClass}>
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                Dashboard
              </span>
            </NavLink>
            <NavLink to="/audit-logs" className={linkClass}>
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Audit Logs
              </span>
            </NavLink>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white"
              style={{ background: 'var(--gradient-primary)' }}>
              {user?.username?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <span className="text-sm font-medium text-slate-300">
              {user?.username || 'User'}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-300 cursor-pointer"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
