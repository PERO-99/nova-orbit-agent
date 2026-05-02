import { useState, useEffect } from 'react';

const metrics = [
  { label:'FLEET EFFICIENCY', value:94.7, unit:'%', color:'var(--cyan)', icon:'◎', delta:'+12.3%' },
  { label:'PLANETS CAPTURED', value:847, unit:'', color:'var(--magenta)', icon:'◈', delta:'+156' },
  { label:'WIN RATE', value:87.2, unit:'%', color:'var(--gold)', icon:'◉', delta:'+8.1%' },
  { label:'AVG TURN TIME', value:142, unit:'ms', color:'var(--lavender)', icon:'◇', delta:'-38ms' },
  { label:'COMBAT K/D', value:3.41, unit:'x', color:'var(--ice)', icon:'◑', delta:'+0.92' },
  { label:'GAMES PLAYED', value:2340, unit:'', color:'var(--ember)', icon:'◐', delta:'+420' },
];

function AnimatedNum({ target, decimals = 0, duration = 2000 }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const s = performance.now();
    const tick = (now) => {
      const t = Math.min((now - s) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setVal(ease * target);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return decimals > 0 ? val.toFixed(decimals) : Math.floor(val);
}

export default function MetricsBar() {
  return (
    <div className="animate-fade-in">
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
        <span style={{fontFamily:'var(--font-display)',fontSize:'0.6rem',letterSpacing:3,color:'var(--magenta)'}}>
          NOVA AGENT PERFORMANCE
        </span>
        <div style={{flex:1,height:1,background:'linear-gradient(90deg,var(--magenta-dim),transparent)'}} />
      </div>

      <div style={{
        display:'grid',
        gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))',
        gap:12
      }}>
        {metrics.map((m, i) => (
          <div key={i} className="glass" style={{
            padding:'16px 20px',
            position:'relative',overflow:'hidden',
            animation:`fadeInUp 0.6s cubic-bezier(0.16,1,0.3,1) ${i*0.08}s both`
          }}>
            {/* Accent line */}
            <div style={{
              position:'absolute',top:0,left:0,right:0,height:2,
              background:`linear-gradient(90deg, ${m.color}, transparent)`
            }} />

            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
              <div>
                <div style={{fontFamily:'var(--font-mono)',fontSize:'0.55rem',letterSpacing:2,color:'var(--text-muted)',marginBottom:6}}>
                  {m.label}
                </div>
                <div style={{fontFamily:'var(--font-display)',fontSize:'1.6rem',fontWeight:700,color:m.color,lineHeight:1}}>
                  <AnimatedNum target={m.value} decimals={m.value % 1 !== 0 ? 1 : 0} />
                  <span style={{fontSize:'0.7rem',marginLeft:2,color:'var(--text-muted)'}}>{m.unit}</span>
                </div>
              </div>
              <div style={{fontSize:'1.4rem',color:m.color,opacity:0.3}}>{m.icon}</div>
            </div>

            <div style={{
              marginTop:8,fontFamily:'var(--font-mono)',fontSize:'0.6rem',
              color: m.delta.startsWith('+') ? 'var(--cyan)' : 'var(--ember)',
              display:'flex',alignItems:'center',gap:4
            }}>
              <span>{m.delta.startsWith('+') ? '▲' : '▼'}</span>
              {m.delta}
              <span style={{color:'var(--text-muted)',marginLeft:4}}>vs baseline</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
