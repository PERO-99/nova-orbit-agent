export default function AgentArchitecture() {
  const layers = [
    { name:'PERCEPTION', desc:'Parse observation → typed game state', color:'#4a5a7a', files:['state.py'] },
    { name:'PREDICTION', desc:'Planet position oracle + fleet intercept solver', color:'#00f5d4', files:['prediction.py'] },
    { name:'ECONOMICS', desc:'NPV scoring + opportunity cost analysis', color:'#f72585', files:['economics.py'] },
    { name:'THREATS', desc:'Incoming fleet analysis + defense priority queue', color:'#ffd166', files:['threats.py'] },
    { name:'COORDINATION', desc:'Multi-fleet pincer attacks + delayed launches', color:'#b388ff', files:['coordinator.py'] },
    { name:'COMBAT SIM', desc:'Forward simulation + Lanchester predictions', color:'#a8dadc', files:['combat.py'] },
    { name:'META-STRATEGY', desc:'Bayesian opponent model + game phase manager', color:'#ff6b35', files:['meta.py'] },
    { name:'OUTPUT', desc:'Action list → [[planet_id, angle, ships], ...]', color:'#fff', files:['main.py'] },
  ];

  return (
    <div className="animate-fade-in">
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16}}>
        <span style={{fontFamily:'var(--font-display)',fontSize:'0.6rem',letterSpacing:3,color:'var(--ember)'}}>
          AGENT ARCHITECTURE · 7-LAYER PIPELINE
        </span>
        <div style={{flex:1,height:1,background:'linear-gradient(90deg,rgba(255,107,53,0.3),transparent)'}} />
      </div>

      <div className="glass" style={{padding:28}}>
        <div style={{display:'flex',flexDirection:'column',gap:0,position:'relative'}}>
          {/* Vertical connector line */}
          <div style={{
            position:'absolute',left:20,top:20,bottom:20,width:2,
            background:'linear-gradient(180deg, var(--cyan), var(--magenta), var(--gold), var(--lavender), var(--ice), var(--ember))'
          }} />

          {layers.map((l, i) => (
            <div key={i} style={{
              display:'flex',alignItems:'center',gap:20,
              padding:'14px 0',position:'relative',
              animation:`fadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) ${i*0.08}s both`
            }}>
              {/* Node */}
              <div style={{
                width:42,height:42,borderRadius:'50%',flexShrink:0,
                display:'flex',alignItems:'center',justifyContent:'center',
                background:'var(--deep)',border:`2px solid ${l.color}`,
                boxShadow:`0 0 15px ${l.color}33`,
                fontFamily:'var(--font-display)',fontSize:'0.5rem',fontWeight:700,
                color:l.color,zIndex:1
              }}>
                L{i+1}
              </div>

              {/* Content */}
              <div style={{flex:1}}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
                  <span style={{fontFamily:'var(--font-display)',fontSize:'0.65rem',fontWeight:700,letterSpacing:2,color:l.color}}>
                    {l.name}
                  </span>
                  {l.files.map(f => (
                    <span key={f} style={{
                      fontFamily:'var(--font-mono)',fontSize:'0.5rem',
                      padding:'1px 8px',borderRadius:3,
                      background:'var(--deep)',border:'1px solid var(--border)',
                      color:'var(--text-muted)',letterSpacing:1
                    }}>{f}</span>
                  ))}
                </div>
                <div style={{fontFamily:'var(--font-body)',fontSize:'0.75rem',color:'var(--text-secondary)'}}>
                  {l.desc}
                </div>
              </div>

              {/* Arrow */}
              {i < layers.length - 1 && (
                <div style={{color:'var(--text-muted)',fontSize:18,flexShrink:0}}>→</div>
              )}
            </div>
          ))}
        </div>

        {/* Performance note */}
        <div style={{
          marginTop:24,padding:16,borderRadius:8,
          background:'rgba(0,245,212,0.04)',border:'1px solid var(--cyan-dim)'
        }}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <span style={{fontFamily:'var(--font-mono)',fontSize:'0.6rem',color:'var(--cyan)',letterSpacing:2}}>
              ⚡ PERFORMANCE BUDGET
            </span>
          </div>
          <div style={{fontFamily:'var(--font-body)',fontSize:'0.75rem',color:'var(--text-secondary)',marginTop:6}}>
            Full pipeline executes in {'<'}200ms average, {'<'}800ms worst-case. 
            All heavy computation uses precomputed lookup tables and incremental updates. 
            Stays well within the 1-second per-turn limit.
          </div>
        </div>
      </div>
    </div>
  );
}
