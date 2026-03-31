import { B } from '../../lib/app-constants';
import { getProductTypes, getProductTypeLabel } from '../../lib/app-services';

export const Tag = ({ label, color = B.purpleLight, text = B.purple, size = 'sm' }) => (
  <span style={{
    background: color,
    color: text,
    padding: size === 'sm' ? '2px 10px' : '4px 14px',
    borderRadius: 20,
    fontSize: size === 'sm' ? 11 : 13,
    fontWeight: 700,
    letterSpacing: '0.03em',
    whiteSpace: 'nowrap'
  }}>
    {label}
  </span>
);

export const Btn = ({ children, onClick, variant = 'primary', size = 'md', disabled = false, sx = {} }) => {
  const v = {
    primary: { background: B.purple, color: B.white, border: 'none' },
    secondary: { background: 'transparent', color: B.purple, border: `1.5px solid ${B.purple}` },
    ghost: { background: 'transparent', color: B.muted, border: `1.5px solid ${B.border}` },
    danger: { background: B.red, color: B.white, border: 'none' },
    green: { background: B.green, color: B.white, border: 'none' }
  };
  const s = { sm: '5px 12px', md: '9px 20px', lg: '12px 28px' };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...v[variant],
        padding: s[size],
        borderRadius: 8,
        fontWeight: 700,
        fontSize: size === 'sm' ? 12 : 14,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        fontFamily: 'inherit',
        ...sx
      }}
    >
      {children}
    </button>
  );
};

export const ProductTypeTags = ({ product, size = 'sm' }) => (
  <>
    {getProductTypes(product).map((typeId) => {
      const styles = {
        protocol: { color: B.blueLight, text: B.blue },
        skincare: { color: B.greenLight, text: B.green },
        kit_professional: { color: B.purpleLight, text: B.purpleDark },
        kit_homecare: { color: B.goldLight, text: '#7A5C1E' }
      };
      const style = styles[typeId] || { color: B.purpleLight, text: B.purpleDark };
      return <Tag key={typeId} label={getProductTypeLabel(typeId)} color={style.color} text={style.text} size={size} />;
    })}
  </>
);

export const BuyLink = ({ href, children, isMobile, sx = {} }) => {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="no-print"
      style={{
        background: B.purpleDark,
        color: B.white,
        padding: isMobile ? '8px 14px' : '9px 22px',
        borderRadius: 8,
        fontWeight: 700,
        fontSize: isMobile ? 12 : 14,
        textDecoration: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        ...sx
      }}
    >
      {children || 'Comprar agora'}
    </a>
  );
};
