import { lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Activity, BarChart3 } from 'lucide-react';
import './styles/theme.css';
import { AppStoreProvider, useStore } from './state/AppStore';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { Home } from './pages/Home';
import { Placeholder } from './pages/Placeholder';
import { Toast } from './components/ui';
import { useNotifications, useSendProcessor } from './lib/sendJobs';
import { useDeleteProcessor } from './lib/deleteJobs';
import { useThresholdProcessor } from './lib/thresholdJobs';
import { STORAGE_FULL_EVENT } from './data/liveEnvironments';

// Pages other than Home load on first visit, keeping the initial bundle small.
const Environments = lazy(() => import('./pages/Environments').then((m) => ({ default: m.Environments })));
const AddEnvironment = lazy(() => import('./pages/AddEnvironment').then((m) => ({ default: m.AddEnvironment })));
const EnvironmentDetails = lazy(() => import('./pages/EnvironmentDetails').then((m) => ({ default: m.EnvironmentDetails })));
const Resources = lazy(() => import('./pages/Resources').then((m) => ({ default: m.Resources })));
const AiHub = lazy(() => import('./pages/AiHub').then((m) => ({ default: m.AiHub })));
const TagManagement = lazy(() => import('./pages/TagManagement').then((m) => ({ default: m.TagManagement })));
const ActionCenter = lazy(() => import('./pages/ActionCenter').then((m) => ({ default: m.ActionCenter })));
const ActionRuleBuilder = lazy(() => import('./pages/ActionRuleBuilder').then((m) => ({ default: m.ActionRuleBuilder })));
const Settings = lazy(() => import('./pages/Settings').then((m) => ({ default: m.Settings })));

function PageLoading() {
  return (
    <div className="card placeholder">
      <p className="muted">Loading…</p>
    </div>
  );
}

function AppRoutes() {
  const { loading } = useStore();
  // Pages read store data during their first render (e.g. wizard preselection), so wait for the snapshot.
  if (loading) {
    return (
      <div className="card placeholder">
        <p className="muted">Loading environments…</p>
      </div>
    );
  }
  return (
    <Suspense fallback={<PageLoading />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/environments" element={<Environments />} />
        <Route path="/environments/new" element={<AddEnvironment />} />
        <Route path="/environments/:id" element={<EnvironmentDetails />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/ai-hub" element={<AiHub />} />
        <Route path="/tags" element={<TagManagement />} />
        <Route path="/actions" element={<ActionCenter />} />
        <Route path="/actions/new" element={<ActionRuleBuilder key="new" />} />
        <Route path="/actions/:id" element={<ActionRuleBuilder />} />
        <Route
          path="/reports"
          element={<Placeholder title="Reports" icon={<BarChart3 size={28} />} description="Scheduled and ad-hoc reports on environments, resources and usage will be available here." />}
        />
        <Route
          path="/monitoring"
          element={<Placeholder title="Monitoring" icon={<Activity size={28} />} description="Health checks, alerts and run failures across your monitored environments will appear here." />}
        />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

interface ToastState {
  message: ReactNode;
  duration?: number;
}

/**
 * Runs the e-mail send queue, the delete queue and the threshold queue, and pops up a toast for each new notification.
 * Nothing is synced on app start (not even Azure groups): pages show cached data and their Sync buttons refresh it.
 */
function BackgroundJobs() {
  useSendProcessor();
  useDeleteProcessor(useStore().removeResource);
  useThresholdProcessor();
  const notes = useNotifications();
  const seen = useRef<Set<string> | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const notify = useCallback((message: ReactNode, duration?: number) => setToast({ message, duration }), []);

  // Warn once per session when the browser cache is full: synced data would be lost on the next refresh.
  useEffect(() => {
    let warned = false;
    const onFull = () => {
      if (warned) return;
      warned = true;
      notify('The browser storage is full: some synced data could not be cached and will be gone after a refresh.', 12000);
    };
    window.addEventListener(STORAGE_FULL_EVENT, onFull);
    return () => window.removeEventListener(STORAGE_FULL_EVENT, onFull);
  }, [notify]);
  useEffect(() => {
    if (!seen.current) {
      seen.current = new Set(notes.map((n) => n.id)); // existing ones were shown before
      return;
    }
    const fresh = notes.filter((n) => !seen.current!.has(n.id));
    fresh.forEach((n) => seen.current!.add(n.id));
    if (fresh.length) setToast({ message: fresh[0]!.text });
  }, [notes]);
  return toast ? <Toast message={toast.message} duration={toast.duration} onDone={() => setToast(null)} /> : null;
}

export default function App() {
  return (
    <HashRouter>
      <AppStoreProvider>
        <BackgroundJobs />
        <div className="shell">
          <Sidebar />
          <div className="main">
            <TopBar />
            <main className="content">
              <AppRoutes />
            </main>
          </div>
        </div>
      </AppStoreProvider>
    </HashRouter>
  );
}
