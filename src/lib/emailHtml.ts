// E-mail HTML rendering: the plain layout (text with links and pipe tables) and the branded layout (banner, info boxes,
// resource table, steps, footer). Everything uses inline styles and layout tables so it renders in Outlook.

/** A titled block in the branded layout (cleanup criteria, numbered steps). */
export interface EmailCard {
  icon?: string;
  /** Steps only: text in the circle. Unset = the step number, '' = no circle. */
  marker?: string;
  title: string;
  text: string;
}

/** Content sections of the branded layout, between the banner and the footer. */
export type EmailSectionKey = 'intro' | 'table' | 'why' | 'delete' | 'steps' | 'closing';
export const EMAIL_SECTIONS: EmailSectionKey[] = ['intro', 'table', 'why', 'delete', 'steps', 'closing'];

/** Branded layout of a template. */
export interface EmailDesign {
  /** Order of the content sections; missing ones follow in the default order. */
  sectionOrder?: EmailSectionKey[];
  /** Sections left out of the e-mail. Unset (designs saved before it existed) = sections with an empty title are hidden. */
  hiddenSections?: EmailSectionKey[];
  headerColor: string;
  footerColor: string;
  accentColor: string;
  /** '' = no logo, an https:// image URL, or `stored:<id>` for an uploaded image (see the logo store in actions.ts). */
  logo: string;
  headerTitle: string;
  headerSubtitle: string;
  whyTitle: string;
  whyText: string;
  criteria: EmailCard[];
  tableTitle: string;
  tableSubtitle: string;
  deleteTitle: string;
  deleteText: string;
  deletionDateLabel: string;
  /** yyyy-mm-dd; shown as "30 April 2026". */
  deletionDate: string;
  stepsTitle: string;
  stepsSubtitle: string;
  steps: EmailCard[];
  closing: string;
  signature: string;
  footerBrand: string;
  footerText: string;
  // Section colours (optional: designs saved before they existed use the accent-based defaults).
  /** Resource table header background / text. */
  tableHeaderColor?: string;
  tableHeaderTextColor?: string;
  /** "Why" box background. */
  whyColor?: string;
  /** Deletion notice background. */
  deleteColor?: string;
  /** Step number circle background / digit. */
  stepNumberColor?: string;
  stepNumberTextColor?: string;
}

/** Colour fields of a design and what they fall back to when not set. */
export const sectionColor = (d: EmailDesign) => {
  const accent = color(d.accentColor, '#009999');
  return {
    tableHeader: color(d.tableHeaderColor ?? '', '#f4f5f7'),
    tableHeaderText: color(d.tableHeaderTextColor ?? '', '#4a4a5a'),
    why: color(d.whyColor ?? '', tint(accent, 0.9)),
    delete: color(d.deleteColor ?? '', '#fdecef'),
    stepNumber: color(d.stepNumberColor ?? '', accent),
    stepNumberText: color(d.stepNumberTextColor ?? '', '#ffffff'),
  };
};

/** Effective section order and hidden sections of a design. */
export function sectionLayout(d: EmailDesign): { order: EmailSectionKey[]; hidden: EmailSectionKey[] } {
  const saved = (d.sectionOrder ?? []).filter((k, i, a) => EMAIL_SECTIONS.includes(k) && a.indexOf(k) === i);
  const order = [...saved, ...EMAIL_SECTIONS.filter((k) => !saved.includes(k))];
  const titles: Partial<Record<EmailSectionKey, string>> = { table: d.tableTitle, why: d.whyTitle, delete: d.deleteTitle, steps: d.stepsTitle };
  const hidden = d.hiddenSections
    ? d.hiddenSections.filter((k) => EMAIL_SECTIONS.includes(k))
    : EMAIL_SECTIONS.filter((k) => titles[k] !== undefined && !titles[k]!.trim());
  return { order, hidden };
}

/** Every colour of the design is a valid hex code (optional ones may be unset). */
export function designColorsValid(d: EmailDesign) {
  const optional = [d.tableHeaderColor, d.tableHeaderTextColor, d.whyColor, d.deleteColor, d.stepNumberColor, d.stepNumberTextColor];
  return [d.headerColor, d.footerColor, d.accentColor].every(isHexColor) && optional.every((c) => c === undefined || isHexColor(c));
}

export type EmailRowGroup = 'App' | 'Flow' | 'Table' | 'Agent' | 'Other';

/** One resource row of the branded resource table. */
export interface EmailRow {
  env: string;
  name: string;
  /** Pill text: the group, or the resource type for "Other". */
  type: string;
  group: EmailRowGroup;
  owner: string;
  lastActivity: string;
  url: string;
}

export const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// [text](https://…) links and bare https:// URLs, matched on the escaped text.
const LINK_RE = /\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s<]+)/g;
const LINK_STYLE = 'color:#007a7a;text-decoration:underline';

const linkify = (escaped: string, arrow = false) =>
  escaped.replace(LINK_RE, (_m, label: string | undefined, href: string | undefined, bare: string | undefined) =>
    label
      ? `<a href="${href}" target="_blank" rel="noreferrer" style="${LINK_STYLE}">${label}${arrow ? '&nbsp;&#8599;' : ''}</a>`
      : `<a href="${bare}" target="_blank" rel="noreferrer" style="${LINK_STYLE}">${bare}</a>`,
  );

// Markdown-style pipe tables (| a | b |) → HTML table; the first row is the header, |---| rows are skipped.
const TABLE_STYLE = 'border-collapse:separate;border-spacing:0;border:1px solid #d6d6d6;border-radius:8px;overflow:hidden;margin:12px 0;font-size:13px';
const TH_STYLE = 'background:#1f5fae;color:#ffffff;font-weight:600;text-align:left;padding:10px 14px;white-space:nowrap';
const TD_STYLE = 'padding:10px 14px;border-top:1px solid #e1e1e1;vertical-align:top;color:#1f1f1f';
const PILL_STYLE = 'display:inline-block;background:#fff4ce;color:#8a5a00;border-radius:12px;padding:3px 10px;font-size:12px;font-weight:600;white-space:nowrap';
const tableCells = (line: string) =>
  line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());

function tableHtml(lines: string[]) {
  const [head = [], ...body] = lines.map(tableCells).filter((cs) => !cs.every((c) => /^:?-{2,}:?$/.test(c)));
  const statusCol = head.findIndex((h) => /^status$/i.test(h));
  const th = head.map((h) => `<th style="${TH_STYLE}">${h}</th>`).join('');
  const rows = body
    .map((cs) => `<tr>${cs.map((c, i) => `<td style="${TD_STYLE}">${i === statusCol && c ? `<span style="${PILL_STYLE}">${c}</span>` : linkify(c, true)}</td>`).join('')}</tr>`)
    .join('');
  return `<div style="overflow-x:auto"><table style="${TABLE_STYLE}"><thead><tr>${th}</tr></thead><tbody>${rows}</tbody></table></div>`;
}

/** Text → inner HTML: escaped, line breaks kept, links clickable, pipe tables as tables. */
function textHtml(text: string) {
  const lines = escapeHtml(text).split(/\r?\n/);
  const isRow = (l: string) => l.trim().startsWith('|');
  const parts: string[] = [];
  let buf: string[] = [];
  const flush = () => {
    if (buf.length) parts.push(buf.map((l) => linkify(l)).join('<br>'));
    buf = [];
  };
  for (let i = 0; i < lines.length; ) {
    if (!isRow(lines[i])) {
      buf.push(lines[i++]);
      continue;
    }
    // A table is a block, so the blank lines around it are dropped (the table has its own margin).
    while (buf.length && !buf[buf.length - 1].trim()) buf.pop();
    flush();
    const start = i;
    while (i < lines.length && isRow(lines[i])) i++;
    parts.push(tableHtml(lines.slice(start, i)));
    while (i < lines.length && !lines[i].trim()) i++;
  }
  flush();
  return parts.join('');
}

const FONT = "font-family:'Segoe UI',Arial,sans-serif";

/** Plain e-mail body → HTML. Used for the sent e-mail and its previews. */
export function emailBodyHtml(text: string) {
  return `<div style="${FONT};font-size:14px">${textHtml(text)}</div>`;
}

/* ---------- Branded layout ---------- */

const HEX_RE = /^#[0-9a-f]{6}$/i;
export const isHexColor = (s: string) => HEX_RE.test(s.trim());
const color = (s: string, fallback: string) => (isHexColor(s) ? s.trim() : fallback);

/** Mixes a hex colour with white (amount 0…1 = share of white). */
function tint(hex: string, amount: number) {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => mix(c).toString(16).padStart(2, '0')).join('')}`;
}

/** Mixes a hex colour with black (amount 0…1 = share of black). */
function shade(hex: string, amount: number) {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c: number) => Math.round(c * (1 - amount));
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => mix(c).toString(16).padStart(2, '0')).join('')}`;
}

/** yyyy-mm-dd → "30 April 2026"; anything else is shown as typed. */
export function longDate(s: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!m) return s;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return isNaN(d.getTime()) ? s : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

// Short design texts: escaped, links clickable, line breaks kept.
const txt = (s: string) => escapeHtml(s).split(/\r?\n/).map((l) => linkify(l)).join('<br>');

const PILLS: Record<EmailRowGroup, { bg: string; fg: string }> = {
  App: { bg: '#f1e8fd', fg: '#7a3ec8' },
  Flow: { bg: '#e5effc', fg: '#1f5fae' },
  Table: { bg: '#e3f5ea', fg: '#1e7d3c' },
  Agent: { bg: '#fdeee2', fg: '#c05a12' },
  Other: { bg: '#eeeeee', fg: '#555555' },
};

function resourceTable(rows: EmailRow[], headBg: string, headFg: string) {
  const th = (label: string) =>
    `<th style="text-align:left;padding:10px 12px;font-size:12px;font-weight:600;color:${headFg};background:${headBg};border-bottom:1px solid #e3e5e8;white-space:nowrap">${label}</th>`;
  const td = 'padding:10px 12px;font-size:13px;color:#1f1f2e;border-bottom:1px solid #eceef1;vertical-align:middle';
  const body = rows
    .map((r) => {
      const p = PILLS[r.group];
      return (
        `<tr>` +
        `<td style="${td}">${escapeHtml(r.env)}</td>` +
        `<td style="${td};font-weight:600">${escapeHtml(r.name)}</td>` +
        `<td style="${td}"><span style="display:inline-block;background:${p.bg};color:${p.fg};border-radius:12px;padding:3px 10px;font-size:12px;font-weight:600;white-space:nowrap">${escapeHtml(r.type)}</span></td>` +
        `<td style="${td}">${escapeHtml(r.owner || '—')}</td>` +
        `<td style="${td};white-space:nowrap">${escapeHtml(r.lastActivity || '—')}</td>` +
        `<td style="${td};white-space:nowrap"><a href="${escapeHtml(r.url)}" target="_blank" rel="noreferrer" style="color:#1f1f2e;font-weight:600;text-decoration:none">Open &rarr;</a></td>` +
        `</tr>`
      );
    })
    .join('');
  return (
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border-spacing:0;border:1px solid #e3e5e8;border-radius:10px;overflow:hidden;margin:12px 0 0">` +
    `<thead><tr>${th('Environment')}${th('Resource name')}${th('Type')}${th('Owner')}${th('Last activity')}${th('Access')}</tr></thead>` +
    `<tbody>${body || `<tr><td colspan="6" style="${td};color:#6b6b7b">No resources</td></tr>`}</tbody></table>`
  );
}

/**
 * Cards side by side, at most `perRow` per row, all columns the same width. The cells of a row are table cells, so a
 * background in `cellStyle` makes every card of the row as tall as the tallest one. `spacing` is the gap between cards
 * (and around them, as with cellspacing); short last rows are filled with empty cells so the columns stay aligned.
 */
function cardGrid(cards: EmailCard[], perRow: number, cell: (c: EmailCard, i: number) => string, opts: { spacing?: number; cellStyle?: string } = {}) {
  const spacing = opts.spacing ?? 0;
  const w = Math.floor(100 / perRow);
  const rows: string[] = [];
  for (let i = 0; i < cards.length; i += perRow) {
    const chunk = cards.slice(i, i + perRow);
    const cells = chunk.map((c, j) => `<td width="${w}%" valign="top" style="vertical-align:top;${opts.cellStyle ?? ''}">${cell(c, i + j)}</td>`);
    for (let k = chunk.length; k < perRow; k++) cells.push(`<td width="${w}%"></td>`);
    rows.push(`<tr>${cells.join('')}</tr>`);
  }
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="${spacing}" style="border-collapse:separate;border-spacing:${spacing}px;table-layout:fixed">${rows.join('')}</table>`;
}

/**
 * Step circle (a pill for longer text). Classic Outlook ignores border-radius, so it gets a VML shape instead; other
 * clients (and the in-app preview, which drops conditional comments) get the rounded div.
 */
function stepMarker(marker: string, bg: string, fg: string) {
  const label = escapeHtml(marker);
  const text = `color:${fg};font-size:14px;font-weight:700;${FONT}`;
  const w = Math.max(28, marker.length * 8 + 16);
  return (
    `<!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" arcsize="50%" fillcolor="${bg}" stroked="f" style="width:${w}px;height:28px;v-text-anchor:middle">` +
    `<v:textbox inset="0,0,0,0"><center style="${text}">${label}</center></v:textbox></v:roundrect><![endif]-->` +
    `<!--[if !mso]><!--><div style="display:inline-block;min-width:28px;height:28px;line-height:28px;padding:0 8px;box-sizing:border-box;border-radius:14px;background:${bg};${text};text-align:center;white-space:nowrap">${label}</div><!--<![endif]-->`
  );
}

interface BrandedEmail {
  body: string;
  design: EmailDesign;
  rows: EmailRow[];
  /** Resolved logo image source (URL or data URL); '' = none. */
  logoSrc: string;
}

function brandedHtml({ body, design: d, rows, logoSrc }: BrandedEmail) {
  const header = color(d.headerColor, '#000028');
  const footer = color(d.footerColor, '#000028');
  const accent = color(d.accentColor, '#009999');
  const sc = sectionColor(d);
  const h2 = (s: string) => (s.trim() ? `<div style="font-size:18px;font-weight:700;color:#000028;margin:0 0 4px">${txt(s)}</div>` : '');
  const sub = (s: string) => (s.trim() ? `<div style="font-size:13px;color:#5a5a6e;margin:0 0 8px">${txt(s)}</div>` : '');

  const sections: Record<EmailSectionKey, () => string> = {
    intro: () => (body.trim() ? `<div style="font-size:14px;line-height:1.6;color:#1f1f2e">${textHtml(body)}</div>` : ''),
    table: () => h2(d.tableTitle) + sub(d.tableSubtitle) + resourceTable(rows, sc.tableHeader, sc.tableHeaderText),
    why: () => {
    const mint = sc.why;
    const criteria = d.criteria.filter((c) => c.title.trim() || c.text.trim());
    const head =
      (d.whyTitle.trim() ? `<div style="font-size:16px;font-weight:700;color:#000028;margin-bottom:6px"><span style="margin-right:8px">&#127807;</span>${txt(d.whyTitle)}</div>` : '') +
      (d.whyText.trim() ? `<div style="font-size:13px;line-height:1.5;color:#33334a">${txt(d.whyText)}</div>` : '');
    // The grid's 12px cellspacing plus 8px cell padding puts the cards 20px from the box edge, in line with the title.
    const grid = criteria.length
      ? cardGrid(
          criteria,
          Math.min(criteria.length, 4),
          (c) =>
            (c.icon ? `<div style="font-size:20px;line-height:1;margin-bottom:6px">${escapeHtml(c.icon)}</div>` : '') +
            `<div style="font-size:13px;font-weight:700;color:#000028;margin-bottom:4px">${txt(c.title)}</div>` +
            `<div style="font-size:12px;line-height:1.5;color:#4a4a5a">${txt(c.text)}</div>`,
          { spacing: 12, cellStyle: 'background:#ffffff;border-radius:8px;padding:12px' },
        )
      : '';
    return (
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${mint};border-left:4px solid ${accent};border-radius:10px;border-collapse:separate">` +
        (head ? `<tr><td style="padding:20px 20px ${grid ? '4px' : '20px'}">${head}</td></tr>` : '') +
        (grid ? `<tr><td style="padding:${head ? '0' : '8px'} 8px 8px">${grid}</td></tr>` : '') +
        `</table>`
    );
    },
    delete: () => {
    const date = longDate(d.deletionDate);
    const border = shade(sc.delete, 0.1);
    // The date sits in a white badge on the right, centred against the text on the left.
    const badge = date.trim()
      ? `<td width="190" valign="middle" align="right" style="width:190px;padding:20px 20px 20px 0;vertical-align:middle">` +
        `<table role="presentation" width="170" cellpadding="0" cellspacing="0" style="width:170px;background:#ffffff;border:1px solid ${border};border-radius:8px;border-collapse:separate">` +
        (d.deletionDateLabel.trim()
          ? `<tr><td align="center" style="padding:10px 12px 2px;text-align:center;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#8a3a4e">${txt(d.deletionDateLabel)}</td></tr>`
          : '') +
        `<tr><td align="center" style="padding:${d.deletionDateLabel.trim() ? '2px' : '10px'} 12px 10px;text-align:center;font-size:18px;font-weight:700;color:#b4234a;white-space:nowrap">${escapeHtml(date)}</td></tr>` +
        `</table></td>`
      : '';
    return (
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${sc.delete};border:1px solid ${border};border-radius:10px;border-collapse:separate"><tr>` +
        `<td width="44" valign="middle" style="width:44px;padding:20px 0 20px 20px;font-size:24px;line-height:1;vertical-align:middle">&#128465;</td>` +
        `<td valign="middle" style="padding:20px 16px 20px 12px;vertical-align:middle">` +
        (d.deleteTitle.trim() ? `<div style="font-size:15px;font-weight:700;color:#b4234a;margin-bottom:4px">${txt(d.deleteTitle)}</div>` : '') +
        (d.deleteText.trim() ? `<div style="font-size:13px;line-height:1.5;color:#5a2a36">${txt(d.deleteText)}</div>` : '') +
        `</td>` +
        badge +
        `</tr></table>`
    );
    },
    steps: () => {
    const steps = d.steps.filter((s) => s.title.trim() || s.text.trim());
    return (
      h2(d.stepsTitle) +
        sub(d.stepsSubtitle) +
        (steps.length
          ? cardGrid(
              steps,
              Math.min(steps.length, 3),
              (s, i) => {
                const marker = (s.marker ?? String(i + 1)).trim();
                return (
                  `<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse"><tr>` +
                  (marker ? `<td valign="top" style="vertical-align:top;padding-right:10px">${stepMarker(marker, sc.stepNumber, sc.stepNumberText)}</td>` : '') +
                  `<td valign="top" style="vertical-align:top"><div style="font-size:13px;font-weight:700;color:#000028;margin:4px 0">${txt(s.title)}</div>` +
                  `<div style="font-size:12px;line-height:1.5;color:#4a4a5a">${txt(s.text)}</div></td></tr></table>`
                );
              },
              { cellStyle: 'padding:8px 16px 0 0' },
            )
          : '')
    );
    },
    closing: () =>
      d.closing.trim() || d.signature.trim()
        ? `<div style="font-size:14px;line-height:1.6;color:#1f1f2e">` +
          (d.closing.trim() ? `<div style="margin-bottom:12px">${txt(d.closing)}</div>` : '') +
          (d.signature.trim() ? `<div style="font-weight:600">${txt(d.signature)}</div>` : '') +
          `</div>`
        : '',
  };
  const { order, hidden } = sectionLayout(d);
  const parts = order.filter((k) => !hidden.includes(k)).map((k) => sections[k]()).filter(Boolean);

  const logo = logoSrc
    ? `<td width="1" valign="middle" style="padding-right:16px;vertical-align:middle"><img src="${escapeHtml(logoSrc)}" alt="" height="48" style="display:block;height:48px;width:auto;max-width:160px;border:0"></td>`
    : '';
  const headerRow =
    `<tr><td style="background:${header};padding:28px 32px">` +
    `<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse"><tr>${logo}<td valign="middle" style="vertical-align:middle">` +
    `<div style="font-size:22px;font-weight:700;color:#ffffff">${txt(d.headerTitle)}</div>` +
    (d.headerSubtitle.trim() ? `<div style="font-size:14px;color:${tint(accent, 0.35)};margin-top:4px">${txt(d.headerSubtitle)}</div>` : '') +
    `</td></tr></table></td></tr>`;
  const footerRow =
    d.footerBrand.trim() || d.footerText.trim()
      ? `<tr><td style="background:${footer};padding:20px 32px">` +
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse"><tr>` +
        `<td valign="middle" style="vertical-align:middle;font-size:18px;font-weight:700;letter-spacing:2px;color:#ffffff">${txt(d.footerBrand)}</td>` +
        `<td valign="middle" align="right" style="vertical-align:middle;text-align:right;font-size:13px;color:${tint(accent, 0.35)}">${txt(d.footerText)}</td>` +
        `</tr></table></td></tr>`
      : '';

  return (
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;border-collapse:collapse;${FONT}"><tr><td align="center" style="padding:24px 12px">` +
    `<table role="presentation" width="80%" cellpadding="0" cellspacing="0" style="width:80%;background:#ffffff;border-radius:12px;overflow:hidden;border-collapse:separate;${FONT}">` +
    headerRow +
    // One row per section with the gap as cell padding: Outlook ignores margins on tables, so the sections would touch.
    `<tr><td style="padding:32px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">` +
    parts.map((p, i) => `<tr><td style="padding:0 0 ${i < parts.length - 1 ? 32 : 0}px">${p}</td></tr>`).join('') +
    `</table></td></tr>` +
    footerRow +
    `</table></td></tr></table>`
  );
}

/** The e-mail as sent: the branded layout when the template has a design, otherwise the plain text layout. */
export function renderEmailHtml(e: { body: string; design?: EmailDesign; rows?: EmailRow[]; logoSrc?: string }) {
  return e.design ? brandedHtml({ body: e.body, design: e.design, rows: e.rows ?? [], logoSrc: e.logoSrc ?? '' }) : emailBodyHtml(e.body);
}
