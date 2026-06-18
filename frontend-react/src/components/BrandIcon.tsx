import React from 'react';

interface BrandIconProps {
  size?: number | string;
  className?: string;
  style?: React.CSSProperties;
}

export function BrandIcon({ size = 24, className = '', style }: BrandIconProps) {
  const customStyles: React.CSSProperties = {
    ...style,
    width: size,
    height: size,
    display: 'inline-block',
  };

  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 100 100" 
      className={`brand-icon-svg ${className}`}
      style={customStyles}
    >
      {/* Row 1 */}
      <rect className="node-bg" x="8" y="8" width="12" height="12" rx="3" fill="var(--brand-icon-bg)" />
      <rect className="node-bg" x="26" y="8" width="12" height="12" rx="3" fill="var(--brand-icon-bg)" />
      <rect className="node-signal-muted" x="44" y="8" width="12" height="12" rx="3" fill="var(--brand-icon-signal-muted)" />
      <rect className="node-bg" x="62" y="8" width="12" height="12" rx="3" fill="var(--brand-icon-bg)" />
      <rect className="node-bg" x="80" y="8" width="12" height="12" rx="3" fill="var(--brand-icon-bg)" />

      {/* Row 2 */}
      <rect className="node-bg" x="8" y="26" width="12" height="12" rx="3" fill="var(--brand-icon-bg)" />
      <rect className="node-bg" x="26" y="26" width="12" height="12" rx="3" fill="var(--brand-icon-bg)" />
      <rect className="node-signal-bright" x="44" y="26" width="12" height="12" rx="3" fill="var(--brand-icon-signal-bright)" />
      <rect className="node-bg" x="62" y="26" width="12" height="12" rx="3" fill="var(--brand-icon-bg)" />
      <rect className="node-bg" x="80" y="26" width="12" height="12" rx="3" fill="var(--brand-icon-bg)" />

      {/* Row 3 */}
      <rect className="node-bg" x="8" y="44" width="12" height="12" rx="3" fill="var(--brand-icon-bg)" />
      <rect className="node-bg" x="26" y="44" width="12" height="12" rx="3" fill="var(--brand-icon-bg)" />
      <rect className="node-insight" x="44" y="44" width="12" height="12" rx="3" fill="var(--brand-icon-insight)" />
      <rect className="node-bg" x="62" y="44" width="12" height="12" rx="3" fill="var(--brand-icon-bg)" />
      <rect className="node-bg" x="80" y="44" width="12" height="12" rx="3" fill="var(--brand-icon-bg)" />

      {/* Row 4 */}
      <rect className="node-bg" x="8" y="62" width="12" height="12" rx="3" fill="var(--brand-icon-bg)" />
      <rect className="node-bg" x="26" y="62" width="12" height="12" rx="3" fill="var(--brand-icon-bg)" />
      <rect className="node-signal-bright" x="44" y="62" width="12" height="12" rx="3" fill="var(--brand-icon-signal-bright)" />
      <rect className="node-bg" x="62" y="62" width="12" height="12" rx="3" fill="var(--brand-icon-bg)" />
      <rect className="node-bg" x="80" y="62" width="12" height="12" rx="3" fill="var(--brand-icon-bg)" />

      {/* Row 5 */}
      <rect className="node-bg" x="8" y="80" width="12" height="12" rx="3" fill="var(--brand-icon-bg)" />
      <rect className="node-bg" x="26" y="80" width="12" height="12" rx="3" fill="var(--brand-icon-bg)" />
      <rect className="node-signal-muted" x="44" y="80" width="12" height="12" rx="3" fill="var(--brand-icon-signal-muted)" />
      <rect className="node-bg" x="62" y="80" width="12" height="12" rx="3" fill="var(--brand-icon-bg)" />
      <rect className="node-bg" x="80" y="80" width="12" height="12" rx="3" fill="var(--brand-icon-bg)" />
    </svg>
  );
}
