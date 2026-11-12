import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Activity, BarChart3, Boxes, Home, Layers, PanelLeftClose, PanelLeftOpen, Settings, Sparkles, Tags, Zap } from 'lucide-react';
import branding from '../config/branding.json';

const NAV = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/environments', label: 'Environments', icon: Layers },
  { to: '/resources', label: 'Resources', icon: Boxes },
  { to: '/ai-hub', label: 'AI Hub', icon: Sparkles },
  { to: '/tags', label: 'Tag Management', icon: Tags },
  { to: '/actions', label: 'Action Center', icon: Zap },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/monitoring', label: 'Monitoring', icon: Activity },
  { to: '/settings', label: 'Settings', icon: Settings },
];

const COLLAPSED_KEY = 'ppm.sidebarCollapsed.v1';

/** The user's last choice wins; on first use narrow screens start collapsed. */
function initialCollapsed(): boolean {
  try {
    const saved = localStorage.getItem(COLLAPSED_KEY);
    if (saved !== null) return saved === '1';
  } catch {
    // storage unavailable: fall through to the screen-width default
  }
  return window.innerWidth < 1000;
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSED_KEY, collapsed ? '1' : '0');
    } catch {
      // not persisted: the toggle still works for this session
    }
  }, [collapsed]);

  // Ctrl+B / Cmd+B toggles the menu, like in VS Code.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setCollapsed((c) => !c);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const toggleLabel = `${collapsed ? 'Expand' : 'Collapse'} menu (Ctrl+B)`;

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      <div className="brand">
        <div className="brand-text">
          <div className="brand-logo">{branding.brandName}</div>
          <div className="brand-sub">{branding.appName}</div>
        </div>
        <button
          type="button"
          className="sidebar-toggle"
          onClick={() => setCollapsed((c) => !c)}
          title={toggleLabel}
          aria-label={toggleLabel}
          aria-expanded={!collapsed}
        >
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>
      <nav className="nav">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} title={label} aria-label={label}>
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <strong>{branding.tagline}</strong>
        {branding.footer}
      </div>
    </aside>
  );
}
