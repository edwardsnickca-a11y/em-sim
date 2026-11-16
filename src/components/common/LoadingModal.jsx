// Full-screen overlay with a spinner, used while long operations run
// (STARTEX world building, joining an exercise). Matches the AAR overlay style.

export default function LoadingModal({ title, message, detail }) {
  return (
    <div role="status" aria-live="polite" style={{
      position:'fixed', inset:0, zIndex:1000,
      display:'flex', alignItems:'center', justifyContent:'center',
      background:'rgba(1,6,12,0.72)', backdropFilter:'blur(3px)',
    }}>
      <style>{'@keyframes nexus-loading-spin { to { transform: rotate(360deg); } }'}</style>
      <div style={{
        width:'min(460px, calc(100vw - 40px))', padding:'30px 28px',
        border:'1px solid rgba(65, 141, 255, 0.62)', borderRadius:10,
        background:'linear-gradient(180deg, rgba(6, 23, 38, 0.98), rgba(4, 17, 29, 0.98))',
        boxShadow:'0 24px 80px rgba(0,0,0,.55)', textAlign:'center', color:'#F4F8FE',
      }}>
        <div style={{
          width:54, height:54, margin:'0 auto 18px', borderRadius:'50%',
          border:'4px solid rgba(45,226,184,.18)', borderTopColor:'#2DE2B8',
          animation:'nexus-loading-spin 1s linear infinite',
        }} />
        <div style={{ fontSize:20, fontWeight:950, letterSpacing:'0.02em', marginBottom:10 }}>{title}</div>
        {message && <div style={{ color:'#B9C8D8', fontSize:14, lineHeight:1.6 }}>{message}</div>}
        {detail && <div style={{ color:'#6F8195', fontSize:12, lineHeight:1.5, marginTop:12 }}>{detail}</div>}
      </div>
    </div>
  )
}
