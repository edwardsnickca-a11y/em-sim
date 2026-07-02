import primaryLogoDark from '../../assets/brand/nexus-eoc-primary-logo-dark.png'
import primaryLogoLight from '../../assets/brand/nexus-eoc-primary-logo-light.png'
import iconDark from '../../assets/brand/nexus-eoc-icon-dark.png'
import iconLight from '../../assets/brand/nexus-eoc-icon-light.png'
import emblemReport from '../../assets/brand/nexus-eoc-emblem-report.png'
import wordmarkDark from '../../assets/brand/nexus-eoc-wordmark-dark.png'
import wordmarkLight from '../../assets/brand/nexus-eoc-wordmark-light.png'

const LOGO_SOURCES = {
  primary: {
    dark: primaryLogoDark,
    light: primaryLogoLight,
  },
  icon: {
    dark: iconDark,
    light: iconLight,
  },
  emblem: {
    dark: emblemReport,
    light: emblemReport,
  },
  wordmark: {
    dark: wordmarkDark,
    light: wordmarkLight,
  },
}

const HEIGHTS = {
  xs: 32,
  sm: 44,
  md: 52,
  lg: 60,
  xl: 72,
}

export default function NexusLogo({
  variant = 'primary',
  tone = 'dark',
  size = 'md',
  alt = 'NEXUS EOC',
  style = {},
  imageStyle = {},
}) {
  const selectedVariant = LOGO_SOURCES[variant] || LOGO_SOURCES.primary
  const src = selectedVariant[tone] || selectedVariant.dark
  const height = typeof size === 'number' ? size : HEIGHTS[size] || HEIGHTS.md

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        minWidth: 0,
        lineHeight: 0,
        ...style,
      }}
    >
      <img
        src={src}
        alt={alt}
        style={{
          height,
          width: 'auto',
          display: 'block',
          objectFit: 'contain',
          ...imageStyle,
        }}
      />
    </span>
  )
}

export {
  primaryLogoDark,
  primaryLogoLight,
  iconDark,
  iconLight,
  emblemReport,
  wordmarkDark,
  wordmarkLight,
}
