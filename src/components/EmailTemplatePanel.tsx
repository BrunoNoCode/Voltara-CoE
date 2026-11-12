import { useRef, useState, type KeyboardEvent, type ReactNode, type RefObject } from 'react';
import { ChevronDown, ChevronUp, Eye, EyeOff, ImagePlus, Link2, Trash2 } from 'lucide-react';
import { SidePanel } from './ui';
import {
  DEFAULT_CLEANUP_DESIGN,
  PLACEHOLDERS,
  SAMPLE_ROWS,
  emailBodyHtml,
  emailHtml,
  designColorsValid,
  isHexColor,
  sectionColor,
  sectionLayout,
  newId,
  renderDesign,
  renderTemplate,
  resolveLogo,
  sampleVarsFor,
  saveEmailTemplate,
  saveLogo,
  useEmailLogos,
  type EmailCard,
  type EmailDesign,
  type EmailSectionKey,
  type EmailTemplate,
} from '../lib/actions';

/** Preview HTML with sample data: the branded layout when a design is set, otherwise the plain text layout. */
function previewHtml(body: string, design?: EmailDesign) {
  const vars = sampleVarsFor(design);
  return design
    ? emailHtml({ body: renderTemplate(body, vars), design: renderDesign(design, vars), rows: SAMPLE_ROWS })
    : emailBodyHtml(renderTemplate(body, vars));
}

type TextTarget = HTMLInputElement | HTMLTextAreaElement;

/** Builds the `[text](url)` markup the e-mail renderer turns into a link. Returns an error message when the URL is unusable. */
function linkMarkup(text: string, url: string): { markup?: string; error?: string } {
  let u = url.trim();
  if (!u) return { error: 'Enter a URL.' };
  const placeholder = u.startsWith('{{');
  if (!placeholder && !/^https?:\/\//i.test(u)) u = `https://${u}`;
  u = u.replace(/\s/g, '%20').replace(/\)/g, '%29');
  if (!placeholder && !/^https?:\/\/[^/.]+\.[^/]+/i.test(u)) return { error: 'Enter a web address like https://example.com.' };
  const label = text.replace(/\]/g, '').replace(/\s*\n\s*/g, ' ').trim();
  return { markup: label ? `[${label}](${u})` : u };
}

/** "Link" button plus an inline form (display text + URL) that inserts a link at the cursor of the given field. */
function useLinkInsert(ref: RefObject<TextTarget | null>, value: string, onChange: (v: string) => void) {
  const [draft, setDraft] = useState<{ start: number; end: number; text: string; url: string; error?: string } | null>(null);

  const open = () => {
    const el = ref.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    setDraft({ start, end, text: value.slice(start, end), url: '' });
  };

  const apply = () => {
    if (!draft) return;
    const { markup, error } = linkMarkup(draft.text, draft.url);
    if (!markup) return setDraft({ ...draft, error });
    onChange(value.slice(0, draft.start) + markup + value.slice(draft.end));
    setDraft(null);
    const pos = draft.start + markup.length;
    requestAnimationFrame(() => {
      ref.current?.focus();
      ref.current?.setSelectionRange(pos, pos);
    });
  };

  const keys = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      apply();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setDraft(null);
    }
  };

  const button = (
    <button type="button" className="link-btn small link-insert-btn" onMouseDown={(e) => e.preventDefault()} onClick={open} title="Insert a link with display text">
      <Link2 size={13} /> Link
    </button>
  );

  const form = draft && (
    <div className="link-insert">
      <input className="input" aria-label="Display text" placeholder="Display text" value={draft.text} onKeyDown={keys} onChange={(e) => setDraft({ ...draft, text: e.target.value })} />
      <input className="input" aria-label="URL" placeholder="https://…" autoFocus value={draft.url} onKeyDown={keys} onChange={(e) => setDraft({ ...draft, url: e.target.value, error: undefined })} />
      <button type="button" className="btn btn-sm btn-primary" onClick={apply}>
        Insert
      </button>
      <button type="button" className="btn btn-sm" onClick={() => setDraft(null)}>
        Cancel
      </button>
      {draft.error && <span className="small link-insert-err">{draft.error}</span>}
    </div>
  );

  return { button, form };
}

/** Subject + body editor with placeholder buttons (inserted at the cursor) and a sample preview. */
export function EmailFields({
  subject,
  body,
  design,
  onChange,
  onDesignChange,
  idPrefix,
}: {
  subject: string;
  body: string;
  design?: EmailDesign;
  onChange: (change: { subject?: string; body?: string }) => void;
  /** When given, the branded layout can be switched on and edited. */
  onDesignChange?: (design: EmailDesign | undefined) => void;
  idPrefix: string;
}) {
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const subjectRef = useRef<HTMLInputElement>(null);
  const lastFocus = useRef<'subject' | 'body'>('body');
  const [preview, setPreview] = useState(false);
  const bodyLink = useLinkInsert(bodyRef, body, (next) => onChange({ body: next }));
  useEmailLogos(); // re-render the preview when an uploaded logo is stored

  const insert = (key: string) => {
    const token = `{{${key}}}`;
    const target = lastFocus.current === 'subject' ? subjectRef.current : bodyRef.current;
    const value = lastFocus.current === 'subject' ? subject : body;
    const start = target?.selectionStart ?? value.length;
    const end = target?.selectionEnd ?? value.length;
    const next = value.slice(0, start) + token + value.slice(end);
    onChange(lastFocus.current === 'subject' ? { subject: next } : { body: next });
    requestAnimationFrame(() => {
      target?.focus();
      target?.setSelectionRange(start + token.length, start + token.length);
    });
  };

  return (
    <>
      <div className="field">
        <label htmlFor={`${idPrefix}-subject`}>Subject</label>
        <input
          ref={subjectRef}
          id={`${idPrefix}-subject`}
          className="input"
          value={subject}
          onFocus={() => (lastFocus.current = 'subject')}
          onChange={(e) => onChange({ subject: e.target.value })}
        />
      </div>
      <div className="field">
        <div className="row">
          <label htmlFor={`${idPrefix}-body`} style={{ margin: 0 }}>
            {design ? 'Introduction' : 'Message'}
          </label>
          <span className="spacer" />
          <button className="link-btn small" onClick={() => setPreview(!preview)}>
            {preview ? <EyeOff size={13} /> : <Eye size={13} />} {preview ? 'Edit' : 'Preview with sample data'}
          </button>
        </div>
        {preview ? (
          <div className="email-preview">
            <div className="email-preview-subject">{renderTemplate(subject, sampleVarsFor(design)) || <span className="muted">(no subject)</span>}</div>
            <div className={`email-preview-body${design ? ' branded' : ''}`} dangerouslySetInnerHTML={{ __html: previewHtml(body, design) }} />
          </div>
        ) : (
          <>
            <textarea
              ref={bodyRef}
              id={`${idPrefix}-body`}
              className="input"
              rows={design ? 6 : 10}
              value={body}
              onFocus={() => (lastFocus.current = 'body')}
              onChange={(e) => onChange({ body: e.target.value })}
            />
            <div className="placeholder-bar">
              <span className="small muted">Insert:</span>
              {PLACEHOLDERS.map((p) => (
                <button key={p.key} className="chip tag placeholder-chip" onMouseDown={(e) => e.preventDefault()} onClick={() => insert(p.key)} title={`{{${p.key}}}`}>
                  {p.label}
                </button>
              ))}
              {bodyLink.button}
            </div>
            {bodyLink.form}
          </>
        )}
      </div>
      {onDesignChange && !preview && <EmailDesignEditor idPrefix={idPrefix} design={design} onChange={onDesignChange} />}
    </>
  );
}

/* ---------- Branded layout editor ---------- */

/** Reads an image file and scales it down to at most 400 px wide (PNG data URL). */
function readLogo(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Not an image'));
      img.onload = () => {
        const scale = Math.min(1, 400 / (img.naturalWidth || 400));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round((img.naturalWidth || 400) * scale));
        canvas.height = Math.max(1, Math.round((img.naturalHeight || 100) * scale));
        canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function ColorField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (v: string) => void }) {
  const valid = isHexColor(value);
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="color-field">
        <input type="color" aria-label={`${label} picker`} value={valid ? value.trim() : '#000000'} onChange={(e) => onChange(e.target.value)} />
        <input id={id} className="input" value={value} placeholder="#000028" maxLength={7} onChange={(e) => onChange(e.target.value)} />
      </div>
      {!valid && <span className="small" style={{ color: 'var(--bad)' }}>Use a hex code like #000028.</span>}
    </div>
  );
}

function TextField({ id, label, value, onChange, rows }: { id: string; label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const link = useLinkInsert(rows ? areaRef : inputRef, value, onChange);
  return (
    <div className="field">
      <div className="row">
        <label htmlFor={id} style={{ margin: 0 }}>
          {label}
        </label>
        <span className="spacer" />
        {link.button}
      </div>
      {rows ? (
        <textarea ref={areaRef} id={id} className="input" rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input ref={inputRef} id={id} className="input" value={value} onChange={(e) => onChange(e.target.value)} />
      )}
      {link.form}
    </div>
  );
}

/** Card text area with its own link button (a component so each card gets its own hook). */
function CardText({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const link = useLinkInsert(ref, value, onChange);
  return (
    <>
      <textarea ref={ref} aria-label="Text" className="input" rows={2} value={value} placeholder="Text" onChange={(e) => onChange(e.target.value)} />
      <div className="row">
        <span className="spacer" />
        {link.button}
      </div>
      {link.form}
    </>
  );
}

interface SectionMove {
  hidden: boolean;
  first: boolean;
  last: boolean;
  onMove: (dir: -1 | 1) => void;
  onHide: (hidden: boolean) => void;
}

function Section({ title, hint, move, children }: { title: string; hint?: string; move?: SectionMove; children: ReactNode }) {
  return (
    <div className={`design-section-wrap${move ? ' has-controls' : ''}${move?.hidden ? ' is-hidden' : ''}`}>
      <details className="design-section">
        <summary>
          {title}
          {move?.hidden && <span className="small"> (hidden)</span>}
          {hint && <span className="small muted"> · {hint}</span>}
        </summary>
        <div className="design-section-body">{children}</div>
      </details>
      {/* Outside <summary> so clicking the controls doesn't open or close the section. */}
      {move && (
        <div className="design-section-controls">
          <button className="icon-move" disabled={move.first} onClick={() => move.onMove(-1)} title="Move up" aria-label={`Move ${title} up`}>
            <ChevronUp size={14} />
          </button>
          <button className="icon-move" disabled={move.last} onClick={() => move.onMove(1)} title="Move down" aria-label={`Move ${title} down`}>
            <ChevronDown size={14} />
          </button>
          <label title="Leave this section out of the e-mail">
            <input type="checkbox" checked={move.hidden} onChange={(e) => move.onHide(e.target.checked)} /> Hide
          </label>
        </div>
      )}
    </div>
  );
}

function CardsEditor({
  idPrefix,
  cards,
  withIcon,
  withMarker,
  onChange,
}: {
  idPrefix: string;
  cards: EmailCard[];
  withIcon?: boolean;
  /** Steps: editable circle text (defaults to the step number, empty = no circle). */
  withMarker?: boolean;
  onChange: (cards: EmailCard[]) => void;
}) {
  const set = (i: number, patch: Partial<EmailCard>) => onChange(cards.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  return (
    <>
      {cards.map((c, i) => (
        <div key={i} className="design-card">
          <div className="row">
            <strong className="small">#{i + 1}</strong>
            <span className="spacer" />
            <button className="link-btn small" onClick={() => onChange(cards.filter((_, j) => j !== i))} title="Remove">
              <Trash2 size={13} /> Remove
            </button>
          </div>
          <div className="design-card-head">
            {withIcon && (
              <input aria-label="Icon" className="input design-icon" value={c.icon ?? ''} placeholder="🙂" onChange={(e) => set(i, { icon: e.target.value })} />
            )}
            {withMarker && (
              <input
                aria-label="Circle text"
                title="Text in the circle: the step number by default, any short text (✓, A, …), or empty for no circle"
                className="input design-icon"
                value={c.marker ?? String(i + 1)}
                placeholder="none"
                maxLength={6}
                // Typing the default number back keeps the automatic numbering.
                onChange={(e) => set(i, { marker: e.target.value === String(i + 1) ? undefined : e.target.value })}
              />
            )}
            <input aria-label="Title" id={`${idPrefix}-${i}-title`} className="input" value={c.title} placeholder="Title" onChange={(e) => set(i, { title: e.target.value })} />
          </div>
          <CardText value={c.text} onChange={(text) => set(i, { text })} />
        </div>
      ))}
      {cards.length < 6 && (
        <button className="btn btn-sm" onClick={() => onChange([...cards, withIcon ? { icon: '', title: '', text: '' } : { title: '', text: '' }])}>
          Add
        </button>
      )}
    </>
  );
}

/** Switch for the branded layout plus its colours, logo and section texts. */
export function EmailDesignEditor({ idPrefix, design, onChange }: { idPrefix: string; design?: EmailDesign; onChange: (d: EmailDesign | undefined) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [logoError, setLogoError] = useState('');
  useEmailLogos();

  if (!design)
    return (
      <div className="design-toggle">
        <label className="row" style={{ gap: 8, cursor: 'pointer' }}>
          <input type="checkbox" checked={false} onChange={() => onChange(DEFAULT_CLEANUP_DESIGN)} />
          <span>
            <strong>Use branded layout</strong>
            <span className="small muted"> · banner, logo, info boxes, resource table and footer</span>
          </span>
        </label>
      </div>
    );

  const d = design;
  const layout = sectionLayout(d);
  // Saving the layout explicitly ends the old "empty title = hidden" behaviour for this design.
  const set = (patch: Partial<EmailDesign>) => onChange({ ...d, sectionOrder: layout.order, hiddenSections: layout.hidden, ...patch });
  const move = (k: EmailSectionKey, dir: -1 | 1) => {
    const order = [...layout.order];
    const i = order.indexOf(k);
    [order[i], order[i + dir]] = [order[i + dir], order[i]];
    set({ sectionOrder: order });
  };
  const hide = (k: EmailSectionKey, hidden: boolean) =>
    set({ hiddenSections: hidden ? [...layout.hidden, k] : layout.hidden.filter((h) => h !== k) });
  const f = (key: keyof EmailDesign, label: string, rows?: number) => (
    <TextField id={`${idPrefix}-d-${key}`} label={label} rows={rows} value={d[key] as string} onChange={(v) => set({ [key]: v } as Partial<EmailDesign>)} />
  );
  const sc = sectionColor(d);
  // Optional section colours show their effective value until edited.
  const c = (key: keyof EmailDesign, label: string, effective: string) => (
    <ColorField id={`${idPrefix}-d-${key}`} label={label} value={(d[key] as string | undefined) ?? effective} onChange={(v) => set({ [key]: v } as Partial<EmailDesign>)} />
  );
  // A section is named after its title, so the layout can be reused for other purposes.
  const name = (title: string, fallback: string) => title.trim() || fallback;
  const logoSrc = resolveLogo(d.logo);
  const logoUrl = d.logo.startsWith('stored:') ? '' : d.logo;

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setLogoError('');
    try {
      set({ logo: saveLogo(await readLogo(file)) });
    } catch {
      setLogoError('This file could not be read as an image.');
    }
  };

  // Content sections between the banners, shown in e-mail order.
  const sections: Record<EmailSectionKey, { title: string; hint?: string; body: ReactNode }> = {
    intro: {
      title: 'Introduction',
      body: <span className="small muted">The text is edited in the Introduction field above.</span>,
    },
    table: {
      title: name(d.tableTitle, 'Resource table'),
      hint: 'filled with the matched resources',
      body: (
        <>
          {f('tableTitle', 'Title')}
          {f('tableSubtitle', 'Subtitle', 2)}
          <div className="design-grid">
            {c('tableHeaderColor', 'Header background', sc.tableHeader)}
            {c('tableHeaderTextColor', 'Header text', sc.tableHeaderText)}
          </div>
        </>
      ),
    },
    why: {
      title: name(d.whyTitle, 'Reason box'),
      body: (
        <>
          {f('whyTitle', 'Title')}
          {f('whyText', 'Text', 2)}
          <div className="design-grid">{c('whyColor', 'Background', sc.why)}</div>
          <label className="small muted">Criteria</label>
          <CardsEditor idPrefix={`${idPrefix}-crit`} cards={d.criteria} withIcon onChange={(criteria) => set({ criteria })} />
        </>
      ),
    },
    delete: {
      title: name(d.deleteTitle, 'Deletion notice'),
      body: (
        <>
          {f('deleteTitle', 'Title')}
          {f('deleteText', 'Text', 2)}
          <div className="design-grid">{c('deleteColor', 'Background', sc.delete)}</div>
          <div className="design-grid">
            {f('deletionDateLabel', 'Date label')}
            <div className="field">
              <label htmlFor={`${idPrefix}-d-date`}>Deletion date</label>
              <input id={`${idPrefix}-d-date`} type="date" className="input" value={d.deletionDate} onChange={(e) => set({ deletionDate: e.target.value })} />
            </div>
          </div>
          <span className="small muted">
            Also available in the texts as <code>{'{{deletionDate}}'}</code>.
          </span>
        </>
      ),
    },
    steps: {
      title: name(d.stepsTitle, 'Steps'),
      body: (
        <>
          {f('stepsTitle', 'Title')}
          {f('stepsSubtitle', 'Subtitle')}
          <div className="design-grid">
            {c('stepNumberColor', 'Number background', sc.stepNumber)}
            {c('stepNumberTextColor', 'Number font', sc.stepNumberText)}
          </div>
          <label className="small muted">Steps · the small box before the title is the circle text (number, other text, or empty for none)</label>
          <CardsEditor idPrefix={`${idPrefix}-step`} cards={d.steps} withMarker onChange={(steps) => set({ steps })} />
        </>
      ),
    },
    closing: {
      title: 'Closing',
      body: (
        <>
          {f('closing', 'Closing text', 3)}
          {f('signature', 'Signature', 2)}
        </>
      ),
    },
  };

  return (
    <div className="design-editor">
      <div className="design-toggle">
        <label className="row" style={{ gap: 8, cursor: 'pointer' }}>
          <input type="checkbox" checked onChange={() => onChange(undefined)} />
          <span>
            <strong>Use branded layout</strong>
            <span className="small muted"> · reorder the sections with the arrows, or hide them</span>
          </span>
        </label>
        <span className="spacer" />
        <button className="link-btn small" onClick={() => onChange({ ...DEFAULT_CLEANUP_DESIGN, logo: d.logo })} title="Restore the default texts and colours (keeps the logo)">
          Reset to default
        </button>
      </div>

      <Section title="Banner, logo & colours">
        <div className="design-grid">
          <ColorField id={`${idPrefix}-d-header`} label="Top banner" value={d.headerColor} onChange={(v) => set({ headerColor: v })} />
          <ColorField id={`${idPrefix}-d-footer`} label="Bottom banner" value={d.footerColor} onChange={(v) => set({ footerColor: v })} />
          <ColorField id={`${idPrefix}-d-accent`} label="Accent" value={d.accentColor} onChange={(v) => set({ accentColor: v })} />
        </div>
        <div className="field">
          <label>Logo</label>
          <div className="logo-field">
            <div className="logo-thumb" style={{ background: isHexColor(d.headerColor) ? d.headerColor : '#000028' }}>
              {logoSrc ? <img src={logoSrc} alt="Logo" /> : <span className="small">No logo</span>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 0 }}>
              <div className="row" style={{ gap: 6 }}>
                <button className="btn btn-sm" onClick={() => fileRef.current?.click()}>
                  <ImagePlus size={14} /> {d.logo ? 'Change logo' : 'Upload logo'}
                </button>
                {d.logo && (
                  <button className="btn btn-sm" onClick={() => set({ logo: '' })}>
                    <Trash2 size={14} /> Remove
                  </button>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/gif,image/svg+xml,image/webp"
                hidden
                onChange={(e) => {
                  void upload(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
              <input
                aria-label="Logo URL"
                className="input"
                placeholder="…or an https:// image URL"
                value={logoUrl}
                onChange={(e) => set({ logo: e.target.value.trim() })}
              />
            </div>
          </div>
          {logoError && <span className="small" style={{ color: 'var(--bad)' }}>{logoError}</span>}
          <span className="small muted">
            Uploaded logos are embedded in the e-mail. Some Outlook desktop versions block embedded images — a public https:// URL is the most reliable.
          </span>
        </div>
        {f('headerTitle', 'Banner title')}
        {f('headerSubtitle', 'Banner subtitle')}
      </Section>

      {layout.order.map((k, i) => {
        const s = sections[k];
        return (
          <Section
            key={k}
            title={s.title}
            hint={s.hint}
            move={{ hidden: layout.hidden.includes(k), first: i === 0, last: i === layout.order.length - 1, onMove: (dir) => move(k, dir), onHide: (h) => hide(k, h) }}
          >
            {s.body}
          </Section>
        );
      })}

      <Section title="Footer" hint="bottom banner">
        <div className="design-grid">
          {f('footerBrand', 'Footer brand')}
          {f('footerText', 'Footer text')}
        </div>
      </Section>
    </div>
  );
}

/** Create or edit a reusable e-mail template. */
export function EmailTemplatePanel({
  template,
  existingNames,
  onClose,
  onSaved,
}: {
  /** Undefined = new template; a template without id = new template prefilled (duplicate / save as). */
  template?: Partial<EmailTemplate>;
  existingNames: { id: string; name: string }[];
  onClose: () => void;
  onSaved?: (t: EmailTemplate) => void;
}) {
  const [name, setName] = useState(template?.name ?? '');
  const [subject, setSubject] = useState(template?.subject ?? '');
  const [body, setBody] = useState(template?.body ?? '');
  const [design, setDesign] = useState<EmailDesign | undefined>(template?.design);
  const editing = !!template?.id;
  const trimmed = name.trim();
  const duplicate = existingNames.some((t) => t.id !== template?.id && t.name.trim().toLowerCase() === trimmed.toLowerCase());
  const colorsValid = !design || designColorsValid(design);
  const valid = !!trimmed && !duplicate && !!subject.trim() && (!!body.trim() || !!design) && colorsValid;

  const save = () => {
    const t: EmailTemplate = { id: template?.id ?? newId('tpl'), name: trimmed, subject, body, ...(design ? { design } : {}), updatedAt: new Date().toISOString() };
    saveEmailTemplate(t);
    onSaved?.(t);
    onClose();
  };

  return (
    <SidePanel
      title={editing ? 'Edit e-mail template' : 'New e-mail template'}
      onClose={onClose}
      wide
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" disabled={!valid} onClick={save}>
            {editing ? 'Save template' : 'Create template'}
          </button>
        </>
      }
    >
      <div className="field">
        <label htmlFor="tpl-name">Template name</label>
        <input id="tpl-name" className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        {duplicate && <span className="small" style={{ color: 'var(--bad)' }}>A template with this name already exists.</span>}
      </div>
      <EmailFields
        idPrefix="tpl"
        subject={subject}
        body={body}
        design={design}
        onDesignChange={setDesign}
        onChange={(c) => {
          if (c.subject !== undefined) setSubject(c.subject);
          if (c.body !== undefined) setBody(c.body);
        }}
      />
      <p className="small muted" style={{ margin: 0 }}>
        Placeholders such as <code>{'{{recipientName}}'}</code> work in every text and are filled in per recipient when a rule is evaluated. Templates and uploaded logos are saved in this browser and included in the settings export.
      </p>
    </SidePanel>
  );
}
