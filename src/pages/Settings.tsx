import { useRef, useState, type ChangeEvent } from 'react';
import { AlertTriangle, Download, Plus, RotateCcw, Upload, X } from 'lucide-react';
import { DEFAULT_HIDDEN_OWNERS, setHiddenOwners, useHiddenOwners } from '../lib/hideSystem';
import { useStore } from '../state/AppStore';
import { Toast } from '../components/ui';
import { StorageUsage } from '../components/StorageUsage';
import { buildSettingsFile, downloadSettingsFile, parseSettingsFile, type SettingsFile } from '../lib/settingsTransfer';
import { importActions, importEmailLogos, useActionRules, useEmailTemplates } from '../lib/actions';

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

function HiddenOwnersCard() {
  const owners = useHiddenOwners();
  const [draft, setDraft] = useState('');
  const isDefault = owners.length === DEFAULT_HIDDEN_OWNERS.length && owners.every((o, i) => o === DEFAULT_HIDDEN_OWNERS[i]);

  const add = () => {
    if (!draft.trim()) return;
    setHiddenOwners([...owners, draft]);
    setDraft('');
  };

  return (
    <div className="card card-pad settings-card">
      <div className="card-title">Hide MSFT-owned</div>
      <p className="muted" style={{ marginTop: 0 }}>
        Power Platform environments contain many apps, flows, agents and AI models that Microsoft installs and owns (system solutions, first-party
        apps, prebuilt AI Builder models). When “Hide MSFT-owned” is ticked, resources whose owner is in this list are left out of the resource
        tables, counts, charts, the Home page, the AI Hub environment list and Action Center rules that exclude them.
      </p>
      <p className="muted small">
        Owners are matched on the full name shown in the Owner column, ignoring upper/lower case and a leading “#” (e.g. “# SYSTEM”). The
        list is saved in this browser and included in the settings export.
      </p>
      <div className="chips" style={{ gap: 8, margin: '12px 0' }}>
        {owners.length === 0 && <span className="muted small">No owners — nothing is hidden.</span>}
        {owners.map((o) => (
          <span key={o} className="type-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {o}
            <button className="icon-btn" style={{ width: 18, height: 18, borderRadius: 4 }} title={`Remove “${o}”`} aria-label={`Remove ${o}`} onClick={() => setHiddenOwners(owners.filter((x) => x !== o))}>
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
      <div className="row">
        <input className="input" placeholder="Owner name, e.g. Microsoft Corporation" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} style={{ minWidth: 280 }} />
        <button className="btn" onClick={add} disabled={!draft.trim()}>
          <Plus size={16} /> Add
        </button>
        <button className="btn btn-soft" onClick={() => setHiddenOwners(DEFAULT_HIDDEN_OWNERS)} disabled={isDefault}>
          <RotateCcw size={16} /> Reset to defaults
        </button>
      </div>
    </div>
  );
}

export function Settings() {
  const { tags, user, importSettings } = useStore();
  const rules = useActionRules();
  const templates = useEmailTemplates();
  const input = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<{ name: string; file: SettingsFile }>();
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const exportSettings = () => {
    const file = buildSettingsFile(tags, user.fullName || undefined);
    downloadSettingsFile(file);
    setToast(
      `Exported ${plural(file.tags.length, 'tag')}, ${plural(Object.keys(file.environments).length, 'environment setting')}, ${plural(file.actionRules?.length ?? 0, 'action rule')} and ${plural(file.emailTemplates?.length ?? 0, 'e-mail template')}`,
    );
  };

  const chooseFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const chosen = e.target.files?.[0];
    e.target.value = ''; // allow picking the same file again
    if (!chosen) return;
    setError('');
    setPending(undefined);
    try {
      setPending({ name: chosen.name, file: parseSettingsFile(await chosen.text()) });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The file could not be read.');
    }
  };

  const confirmImport = () => {
    if (!pending) return;
    const s = importSettings(pending.file);
    const { actionRules = [], emailTemplates = [] } = pending.file;
    importEmailLogos(pending.file.emailLogos);
    importActions(actionRules, emailTemplates);
    setPending(undefined);
    const parts = [`${plural(s.tagsAdded, 'tag')} added`, `${s.tagsUpdated} updated`, `${plural(s.environments, 'environment setting')} applied`];
    if (actionRules.length || emailTemplates.length) parts.push(`${plural(actionRules.length, 'action rule')} and ${plural(emailTemplates.length, 'e-mail template')} merged`);
    setToast(`Imported: ${parts.join(', ')}`);
  };

  const p = pending?.file;
  const envCount = p ? Object.keys(p.environments).length : 0;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Settings</h1>
          <p>Your monitor settings are saved in this browser. Export them to a file to use them on another device or share them with a colleague.</p>
        </div>
      </div>

      <div className="card card-pad settings-card">
        <div className="card-title">Backup &amp; transfer</div>
        <p className="muted" style={{ marginTop: 0 }}>The settings file contains:</p>
        <ul className="settings-list">
          <li>Tag and environment flag definitions ({plural(tags.length, 'tag')} now)</li>
          <li>Which environments you monitor, their custom flags and display names</li>
          <li>The “Hide MSFT-owned” preference and its list of owners</li>
          <li>
            Action Center rules and e-mail templates ({plural(rules.length, 'rule')}, {plural(templates.length, 'template')} now)
          </li>
        </ul>
        <p className="muted small">
          No resource data or credentials are included. Importing merges the file into your current settings: tags with the same name are
          replaced, other tags are kept.
        </p>

        <div className="row" style={{ marginTop: 16 }}>
          <button className="btn btn-primary" onClick={exportSettings}>
            <Download size={16} /> Export settings
          </button>
          <button className="btn" onClick={() => input.current?.click()}>
            <Upload size={16} /> Import settings…
          </button>
          <input ref={input} type="file" accept=".json,application/json" hidden onChange={chooseFile} />
        </div>

        {error && (
          <div className="notice notice-bad" style={{ marginTop: 16 }}>
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        {pending && p && (
          <div className="import-preview">
            <div className="card-title" style={{ marginBottom: 10 }}>
              Import “{pending.name}”?
            </div>
            <dl className="kv">
              <dt>Exported</dt>
              <dd>{p.exportedAt ? new Date(p.exportedAt).toLocaleString() : 'Unknown'}</dd>
              {p.exportedBy && (
                <>
                  <dt>Exported by</dt>
                  <dd>{p.exportedBy}</dd>
                </>
              )}
              <dt>Tags &amp; flags</dt>
              <dd>{p.tags.length}</dd>
              <dt>Environment settings</dt>
              <dd>{envCount}</dd>
              <dt>Hide MSFT-owned</dt>
              <dd>
                {p.hideSystem ? 'On' : 'Off'}
                {p.hiddenOwners ? ` · ${plural(p.hiddenOwners.length, 'owner')}` : ''}
              </dd>
              <dt>Action rules</dt>
              <dd>{p.actionRules?.length ?? 0}</dd>
              <dt>E-mail templates</dt>
              <dd>{p.emailTemplates?.length ?? 0}</dd>
            </dl>
            <div className="row" style={{ marginTop: 14 }}>
              <button className="btn btn-primary" onClick={confirmImport}>
                Import
              </button>
              <button className="btn" onClick={() => setPending(undefined)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <HiddenOwnersCard />

      <StorageUsage />

      {toast && <Toast message={toast} onDone={() => setToast('')} />}
    </>
  );
}
