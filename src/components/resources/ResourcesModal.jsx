import NexusLogo from '../brand/NexusLogo'

const DS = {
  bg:'#020B13',
  panel:'#071421',
  panel2:'rgba(8, 24, 39, 0.94)',
  border:'rgba(87, 146, 198, 0.30)',
  borderStrong:'rgba(65, 141, 255, 0.62)',
  teal:'#2DE2B8',
  blue:'#45A3FF',
  amber:'#F59B22',
  purple:'#A855F7',
  text:'#F4F8FE',
  muted:'#B9C8D8',
  dim:'#6F8195',
}

const resources = [
  {
    title:'Platform Overview',
    eyebrow:'One-page elevator pitch',
    body:'What NEXUS EOC is, who it is for, and why the platform is different.',
    href:'/NEXUS_EOC_Platform_Overview.pdf',
    accent:DS.teal,
  },
  {
    title:'User Guide',
    eyebrow:'Player handbook',
    body:'How to set up an exercise, use the live interface, submit responses, end the run, and download outputs.',
    href:'/NEXUS_EOC_User_Guide.pdf',
    accent:DS.blue,
  },
  {
    title:'Reference List',
    eyebrow:'Validated doctrine and scenario links',
    body:'Scenario-specific and general emergency management references used to support planning, play, and debrief.',
    href:'/NEXUS_EOC_Reference_List.pdf',
    accent:DS.amber,
  },
]

function FileIcon({ color }) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 3h8l4 4v14H6V3Z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6M9 17h6" />
    </svg>
  )
}

function ResourceCard({ resource }) {
  return (
    <a
      href={resource.href}
      target="_blank"
      rel="noreferrer"
      style={{
        display:'grid',
        gridTemplateColumns:'46px 1fr',
        gap:14,
        padding:18,
        borderRadius:6,
        border:`1px solid ${DS.border}`,
        background:'rgba(3, 13, 23, 0.72)',
        color:DS.text,
        textDecoration:'none',
        boxShadow:'0 18px 40px rgba(0,0,0,0.18)',
      }}
    >
      <div style={{ width:46, height:46, borderRadius:'50%', border:`1px solid ${resource.accent}`, display:'grid', placeItems:'center', background:'rgba(2,11,19,0.58)' }}>
        <FileIcon color={resource.accent} />
      </div>
      <div>
        <div style={{ color:resource.accent, fontSize:11, letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:900, marginBottom:6 }}>{resource.eyebrow}</div>
        <div style={{ fontSize:19, fontWeight:950, lineHeight:1.12, marginBottom:8 }}>{resource.title}</div>
        <div style={{ color:DS.muted, fontSize:13, lineHeight:1.55 }}>{resource.body}</div>
        <div style={{ marginTop:12, color:resource.accent, fontSize:12, fontWeight:900, letterSpacing:'0.08em', textTransform:'uppercase' }}>Open PDF →</div>
      </div>
    </a>
  )
}

export default function ResourcesModal({ onClose }) {
  return (
    <div
      role="presentation"
      onClick={onClose}
      style={{ position:'fixed', inset:0, zIndex:1200, background:'rgba(0, 6, 12, 0.82)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', padding:22, boxSizing:'border-box' }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label="NEXUS EOC Resources"
        onClick={e => e.stopPropagation()}
        style={{ width:'min(920px, 100%)', border:`1px solid ${DS.borderStrong}`, borderRadius:8, overflow:'hidden', background:`radial-gradient(circle at 80% 10%, rgba(46,131,255,0.18), transparent 28%), linear-gradient(135deg, ${DS.panel}, ${DS.bg})`, boxShadow:'0 34px 120px rgba(0,0,0,0.62)' }}
      >
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:18, padding:'20px 22px', borderBottom:`1px solid ${DS.border}`, background:'rgba(2, 11, 19, 0.70)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:14, minWidth:0 }}>
            <NexusLogo variant="primary" tone="dark" size={42} imageStyle={{ maxWidth:'260px' }} />
            <div style={{ width:1, height:38, background:DS.border }} />
            <div>
              <div style={{ color:DS.blue, fontSize:12, fontWeight:900, letterSpacing:'0.13em', textTransform:'uppercase' }}>Resources</div>
              <div style={{ color:DS.text, fontSize:20, fontWeight:950, lineHeight:1.1 }}>Documentation Library</div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Resources"
            style={{ width:38, height:38, borderRadius:'50%', border:`1px solid ${DS.border}`, background:'rgba(3,13,23,0.72)', color:DS.text, cursor:'pointer', fontSize:20, lineHeight:1 }}
          >
            ×
          </button>
        </div>

        <div style={{ padding:24 }}>
          <p style={{ margin:'0 0 18px', color:DS.muted, fontSize:14, lineHeight:1.6, maxWidth:760 }}>
            Use these documents to brief the platform, orient players, and support scenario planning or debrief. Each document opens in a new tab.
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3, minmax(0, 1fr))', gap:14 }}>
            {resources.map(resource => <ResourceCard key={resource.title} resource={resource} />)}
          </div>
        </div>
      </section>
    </div>
  )
}
