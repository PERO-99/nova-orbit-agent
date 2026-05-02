export default function Timeline() {
  const phases = [
    { week:'WEEK 1-2', title:'Foundation', items:['Submit baseline NOVA agent','Gather win/loss data against pool','Fix edge cases: sun collision, OOB, comet timing'], status:'active', color:'var(--cyan)' },
    { week:'WEEK 3-4', title:'Optimization', items:['Tune NPV scoring weights from replay analysis','Implement pincer coordination','Add comet pre-positioning protocol'], status:'upcoming', color:'var(--magenta)' },
    { week:'WEEK 5-6', title:'Advanced AI', items:['Bayesian opponent classifier live','N-turn forward simulation','Feint & sacrifice logic'], status:'upcoming', color:'var(--gold)' },
    { week:'WEEK 7-8', title:'Final Push', items:['Stress test: 1000 games vs diverse pool','Micro-optimize turn time to <150ms','Submit final 2 agents by June 23'], status:'upcoming', color:'var(--lavender)' },
  ];

  return (
    <div className="animate-fade-in">
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16}}>
        <span style={{fontFamily:'var(--font-display)',fontSize:'0.6rem',letterSpacing:3,color:'var(--gold)'}}>
          COMPETITION ROADMAP
        </span>
        <div style={{flex:1,height:1,background:'linear-gradient(90deg,var(--gold-dim),transparent)'}} />
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))',gap:14}}>
        {phases.map((p, i) => (
          <div key={i} className="glass" style={{
            padding:'24px 20px',position:'relative',overflow:'hidden',
            borderColor: p.status === 'active' ? p.color + '55' : 'var(--border)',
            animation:`fadeInUp 0.6s cubic-bezier(0.16,1,0.3,1) ${i*0.1}s both`
          }}>
            <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${p.color},transparent)`}} />
            
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
              <span style={{fontFamily:'var(--font-display)',fontSize:'0.6rem',fontWeight:700,letterSpacing:2,color:p.color}}>
                {p.week}
              </span>
              {p.status === 'active' && (
                <div className="badge" style={{color:p.color,borderColor:p.color+'44',background:p.color+'11'}}>
                  <div style={{width:5,height:5,borderRadius:'50%',background:p.color,animation:'pulse 2s ease-in-out infinite'}} />
                  ACTIVE
                </div>
              )}
            </div>
            
            <div style={{fontFamily:'var(--font-display)',fontSize:'0.8rem',fontWeight:600,color:'var(--text-primary)',marginBottom:12,letterSpacing:1}}>
              {p.title}
            </div>
            
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {p.items.map((item, j) => (
                <div key={j} style={{display:'flex',alignItems:'flex-start',gap:8}}>
                  <div style={{
                    width:14,height:14,borderRadius:3,flexShrink:0,marginTop:2,
                    border: `1.5px solid ${p.status === 'active' && j===0 ? p.color : 'var(--border-glow)'}`,
                    background: p.status === 'active' && j===0 ? p.color+'22' : 'transparent',
                    display:'flex',alignItems:'center',justifyContent:'center',
                    fontSize:'0.5rem',color:p.color
                  }}>
                    {p.status === 'active' && j===0 ? '✓' : ''}
                  </div>
                  <span style={{fontFamily:'var(--font-body)',fontSize:'0.72rem',color:'var(--text-secondary)',lineHeight:1.5}}>
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
