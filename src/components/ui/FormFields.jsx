import React from 'react';
import { clean } from '../../lib/app-services';
import { B } from '../../lib/app-constants';

export const RichTextField = ({ label, value, onChange, placeholder, rows = 3, note }) => {
  const ref = React.useRef(null);

  const applyTag = (tagOpen, tagClose) => {
    if (!ref.current) return;
    const ta = ref.current;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const text = value ?? '';
    const selected = text.substring(start, end);
    const inserted = `${tagOpen}${selected || 'texto'}${tagClose}`;
    const newValue = `${text.substring(0, start)}${inserted}${text.substring(end)}`;
    onChange(newValue);
    const newPos = start + tagOpen.length + (selected ? selected.length : 5);
    setTimeout(() => ta.setSelectionRange(newPos, newPos), 10);
    ta.focus();
  };

  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: B.muted, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>}
      <div style={{ marginBottom: 6, display: 'flex', gap: 8 }}>
        <button type="button" onClick={() => applyTag('<b>', '</b>')} style={{ fontSize: 12, padding: '4px 6px', borderRadius: 6 }}>B</button>
        <button type="button" onClick={() => applyTag('<i>', '</i>')} style={{ fontSize: 12, padding: '4px 6px', borderRadius: 6 }}>I</button>
        <button type="button" onClick={() => applyTag('<u>', '</u>')} style={{ fontSize: 12, padding: '4px 6px', borderRadius: 6 }}>U</button>
        <button type="button" onClick={() => applyTag('<ul>\n<li>', '</li>\n</ul>')} style={{ fontSize: 12, padding: '4px 6px', borderRadius: 6 }}>• Lista</button>
      </div>
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        style={{ width: '100%', padding: '9px 12px', border: 'none', fontSize: 14, color: B.text, resize: 'vertical', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit', lineHeight: 1.5 }}
      />
      {note && <div style={{ fontSize: 11, color: B.muted, marginTop: 4 }}>{note}</div>}
    </div>
  );
};

export const Field = ({ label, value, onChange, placeholder, type = 'text', multi = false, rows = 3, note }) => {
  if (multi) return <RichTextField label={label} value={value} onChange={onChange} placeholder={placeholder} rows={rows} note={note} />;
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: B.muted, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>}
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={{ width: '100%', padding: '9px 12px', border: `1.5px solid ${B.border}`, borderRadius: 8, fontSize: 14, color: B.text, background: B.white, boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }} />
      {note && <div style={{ fontSize: 11, color: B.muted, marginTop: 4 }}>{note}</div>}
    </div>
  );
};

export const Sel = ({ label, value, onChange, options }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: B.muted, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>}
    <select value={value} onChange={(e) => onChange(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: `1.5px solid ${B.border}`, borderRadius: 8, fontSize: 14, color: B.text, background: B.white, outline: 'none', fontFamily: 'inherit' }}>
      {options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  </div>
);

export const SectionTitle = ({ children }) => (
  <div style={{ fontSize: 11, fontWeight: 700, color: B.purple, textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: `2px solid ${B.purpleLight}`, paddingBottom: 8, marginBottom: 16, marginTop: 8 }}>{children}</div>
);

export const InfoText = ({ text, isMobile }) => {
  if (!text) return null;
  return (
    <div style={{ fontSize: isMobile ? 14 : 15, color: B.text, lineHeight: 1.75, margin: 0, whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{ __html: clean(text) }} />
  );
};
