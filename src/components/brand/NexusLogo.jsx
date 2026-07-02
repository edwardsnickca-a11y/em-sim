function NexusIconMark({ size = 44, className = '', style = {} }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label="NEXUS EOC Command Vector mark"
      style={{ display: 'block', flex: '0 0 auto', ...style }}
    >
      <defs>
        <linearGradient id="nexusVectorTeal" x1="12" y1="78" x2="86" y2="18" gradientUnits="userSpaceOnUse">
          <stop stopColor="#45A3FF" />
          <stop offset="0.54" stopColor="#2DE2B8" />
          <stop offset="1" stopColor="#36E0D0" />
        </linearGradient>
        <filter id="nexusVectorShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#000000" floodOpacity="0.45" />
        </filter>
      </defs>

      <circle cx="50" cy="50" r="42" fill="#061522" stroke="#24445F" strokeWidth="2" />
      <path d="M23 23 A38 38 0 0 1 77 23" fill="none" stroke="#45A3FF" strokeWidth="1.7" opacity="0.62" />
      <path d="M21 75 A38 38 0 0 0 79 75" fill="none" stroke="#2DE2B8" strokeWidth="1.7" opacity="0.66" />
      <path d="M18 35 A30 30 0 0 1 82 35" fill="none" stroke="#36E0D0" strokeWidth="1.25" opacity="0.45" />
      <path d="M18 65 A30 30 0 0 0 82 65" fill="none" stroke="#45A3FF" strokeWidth="1.25" opacity="0.40" />

      <path
        d="M18 76 L37 24 L62 61 L82 20"
        fill="none"
        stroke="url(#nexusVectorTeal)"
        strokeWidth="15"
        strokeLinejoin="miter"
        strokeLinecap="square"
        opacity="0.95"
        filter="url(#nexusVectorShadow)"
      />
      <path
        d="M18 76 L37 24 L62 61 L82 20"
        fill="none"
        stroke="#F4F8FE"
        strokeWidth="8.5"
        strokeLinejoin="miter"
        strokeLinecap="square"
      />
      <polygon points="82,20 88,11 86,28" fill="#2DE2B8" />
      <polygon points="18,76 12,88 25,80" fill="#45A3FF" opacity="0.88" />
    </svg>
  )
}

export default function NexusLogo({
  size = 'md',
  subtitle = 'Simulated Emergency Operations Platform',
  compact = false,
  showSubtitle = true,
  style = {},
}) {
  const sizes = {
    sm: { mark: 42, word: 19, sub: 10, gap: 12, tracking: '0.115em' },
    md: { mark: 50, word: 24, sub: 10.5, gap: 14, tracking: '0.08em' },
    lg: { mark: 56, word: 29, sub: 11, gap: 14, tracking: '0.06em' },
  }
  const cfg = sizes[size] || sizes.md

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: cfg.gap, minWidth: 0, ...style }}>
      <NexusIconMark size={cfg.mark} />
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            color: '#F4F8FE',
            fontFamily: 'Inter, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
            fontSize: cfg.word,
            fontWeight: 950,
            letterSpacing: cfg.tracking,
            lineHeight: 1,
            whiteSpace: 'nowrap',
          }}
        >
          NEXUS <span style={{ color: '#2DE2B8' }}>EOC</span>
        </div>
        {showSubtitle && (
          <div
            style={{
              color: compact ? '#6F8195' : '#91A8BD',
              fontSize: cfg.sub,
              marginTop: compact ? 6 : 7,
              letterSpacing: compact ? '0.14em' : '0.02em',
              textTransform: compact ? 'uppercase' : 'none',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
    </div>
  )
}

export { NexusIconMark }
