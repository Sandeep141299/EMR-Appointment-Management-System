import { Link, Outlet } from 'react-router-dom';
import {
  ChevronDown,
  CircleHelp,
  Command,
  LogOut,
  Plus,
  Search,
  Stethoscope,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useLocation } from 'react-router-dom';
import { NAV_ITEMS_BY_ROLE } from '../config/roleConfig.js';

export default function AppLayout() {
  const { user, role, signOut } = useAuth();
  const location = useLocation();
  const navItems = NAV_ITEMS_BY_ROLE[role] || [];
  const currentPath = `${location.pathname}${location.search}`;
  const isNavItemActive = (to) => {
    const [targetPath, targetQuery] = to.split('?');
    if (targetPath !== location.pathname) return false;
    if (!targetQuery) return true;
    return new URLSearchParams(targetQuery).toString() === location.search.slice(1);
  };
  const activeNavItem = navItems.find(({ to }) => to === currentPath)
    || navItems.find(({ to }) => !to.includes('?') && isNavItemActive(to));

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="Careflow home">
          <span className="brand-mark"><Plus size={19} strokeWidth={3} /></span>
          <span>careflow<small>CLINIC MANAGEMENT</small></span>
        </a>

        <div className="workspace-switcher">
          <span className="workspace-icon"><Stethoscope size={16} /></span>
          <span><strong>Northstar Clinic</strong><small>Enterprise workspace</small></span>
          <ChevronDown size={15} />
        </div>

        <div className="nav-caption">WORKSPACE</div>
        <nav className="main-nav">
          {navItems.map(({ label, to, icon: Icon }) => {
            const isActive = isNavItemActive(to);
            return (
              <Link key={label} to={to} aria-current={isActive ? 'page' : undefined} className={`nav-link${isActive ? ' active' : ''}`}>
                <Icon size={18} /> {label}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <button className="help-link" type="button"><CircleHelp size={17} /> Help & support</button>
          <div className="user-card">
            <span className="user-avatar">{user?.name?.slice(0, 1)?.toUpperCase() || 'U'}</span>
            <span className="user-info"><strong>{user?.name || 'User'}</strong><small>{user?.role?.replace('_', ' ')}</small></span>
            <button className="icon-button logout-button" type="button" onClick={signOut} aria-label="Sign out" title="Sign out">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <div className="breadcrumbs"><span>Workspace</span><span className="crumb-divider">/</span><strong>{activeNavItem?.label || 'Dashboard'}</strong></div>
          <div className="topbar-actions">
            <button className="search-shortcut" type="button"><Search size={15} /><span>Search anything</span><kbd>⌘ K</kbd></button>
            <span className="topbar-divider" />
            <button className="icon-button command-button" type="button" aria-label="Quick commands"><Command size={18} /></button>
            <span className="topbar-avatar">{user?.name?.slice(0, 1)?.toUpperCase() || 'U'}</span>
          </div>
        </header>
        <main className="main-content"><Outlet /></main>
      </div>
    </div>
  );
}
