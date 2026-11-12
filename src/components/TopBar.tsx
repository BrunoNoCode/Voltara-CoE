import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Bell, CheckCircle2, CircleHelp, Info } from 'lucide-react';
import { useStore } from '../state/AppStore';
import { fmtAgo, initials } from '../lib/format';
import { clearNotifications, markNotificationsRead, useNotifications, type AppNotification } from '../lib/sendJobs';

const KIND_ICON: Record<AppNotification['kind'], ReactNode> = {
  error: <AlertTriangle size={15} className="note-ic bad" />,
  success: <CheckCircle2 size={15} className="note-ic ok" />,
  info: <Info size={15} className="note-ic" />,
};

function Notifications() {
  const notes = useNotifications();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unread = notes.some((n) => !n.read);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  // Everything visible while the panel is open counts as read.
  useEffect(() => {
    if (open && unread) markNotificationsRead();
  }, [open, unread]);

  return (
    <div className="menu-anchor" ref={ref}>
      <button className="icon-btn" aria-label="Notifications" onClick={() => setOpen((o) => !o)}>
        <Bell size={19} />
        {unread && <span className="badge-dot" />}
      </button>
      {open && (
        <div className="menu notes-menu" role="menu">
          <div className="notes-head">
            <strong>Notifications</strong>
            {notes.length > 0 && (
              <button className="link-btn" onClick={clearNotifications}>
                Clear all
              </button>
            )}
          </div>
          {notes.length === 0 && <div className="muted small notes-empty">No notifications.</div>}
          {notes.map((n) => (
            <button
              key={n.id}
              role="menuitem"
              className="note-item"
              onClick={() => {
                setOpen(false);
                if (n.link) navigate(n.link);
              }}
            >
              {KIND_ICON[n.kind]}
              <span>
                <span className="wrap">{n.text}</span>
                <span className="small muted note-time">{fmtAgo(n.at)}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function TopBar() {
  const { user } = useStore();

  return (
    <header className="topbar">
      <div className="topbar-right">
        <button className="icon-btn" aria-label="Help">
          <CircleHelp size={19} />
        </button>
        <Notifications />
        <div className="row">
          <div className="avatar">{initials(user.fullName || '?')}</div>
          <div className="user-meta">
            <div className="name">{user.fullName || '…'}</div>
            <div className="role">Environment Owner</div>
          </div>
        </div>
      </div>
    </header>
  );
}
