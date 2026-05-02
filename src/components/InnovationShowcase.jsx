import { useState, useEffect } from 'react';

const innovations = [
  {
    title: 'NPV Planet Scoring',
    vs: 'Simple production × turns',
    ours: 'Discounted cash flow model with opportunity cost',
    impact: '2× better target selection',
    color: '#f72585'
  },
  {
    title: 'Pincer Fleet Coordination',
    vs: 'Send 1 fleet at a time',
    ours: 'Delayed launches sync 2-3 fleets to arrive simultaneously',
    impact: '40% higher capture rate',
    color: '#00f5d4'
  },
  {
    title: 'Comet Pre-Positioning',
    vs: 'React after comets spawn',
    ours: 'Launch interceptors 5-8 turns before spawn time',
    impact: '30-80 free ships per comet',
    color: '#ffd166'
  },
  {
    title: 'N-Turn Forward Simulation',
    vs: 'Evaluate current state only',
    ours: 'Simulate 5-10 turns ahead before committing',
    impact: 'Zero ships wasted on lost causes',
    color: '#b388ff'
  },
  {
    title: 'Bayesian Opponent Model',
    vs: 'One strategy for all opponents',
    ours: 'Real-time classification + counter-strategy selection',
    impact: '25-40% better in mixed pools',
    color: '#a8dadc'
  },
  {
    title: 'Evacuation Protocol',
    vs: 'Defend every planet to the death',
    ours: 'Cost-benefit analysis: evacuate doomed planets, save ships',
    impact: '15% more surviving forces',
    color: '#ff6b35'
  }
];

export default function InnovationShowcase() {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  return (
    <div className="animate-fade-in">
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16}}>
        <span style={{fontFamily:'var(--font-display)',fontSize:'0.6rem',letterSpacing:3,color:'var(--lavender)'}}>
          WHAT MAKES US DIFFERENT
        </span>
        <div style={{flex:1,height:1,background:'linear-gradient(90deg,var(--lavender-dim),transparent)'}} />
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(380px, 1fr))',gap:14}}>
        {innovations.map((inn, i) => (
          <div
            key={i}
            className="glass"
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
            style={{
              padding:'24px 24px 20px',
              position:'relative',overflow:'hidden',
              transform: hoveredIdx === i ? 'translateY(-4px)' : 'none',
              borderColor: hoveredIdx === i ? inn.color + '66' : 'var(--border)',
              boxShadow: hoveredIdx === i ? `0 8px 40px ${inn.color}15` : 'none',
              transition:'all 0.3s cubic-bezier(0.16,1,0.3,1)',
              animation:`fadeInUp 0.6s cubic-bezier(0.16,1,0.3,1) ${i*0.1}s both`
            }}
          >
            {/* Top accent */}
            <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${inn.color},transparent)`}} />

            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
              <div style={{fontFamily:'var(--font-display)',fontSize:'0.75rem',fontWeight:700,letterSpacing:1,color:inn.color}}>
                {inn.title}
              </div>
              <div className="badge" style={{color:inn.color,borderColor:inn.color+'44',background:inn.color+'11',fontSize:'0.5rem'}}>
                {inn.impact}
              </div>
            </div>

            {/* Comparison */}
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              <div style={{display:'flex',gap:10,alignItems:'flex-start'}}>
                <div style={{
                  fontFamily:'var(--font-mono)',fontSize:'0.55rem',color:'var(--ember)',
                  padding:'2px 6px',borderRadius:3,background:'rgba(255,107,53,0.1)',
                  border:'1px solid rgba(255,107,53,0.2)',flexShrink:0,marginTop:1
                }}>THEM</div>
                <div style={{fontSize:'0.78rem',color:'var(--text-muted)',lineHeight:1.5}}>{inn.vs}</div>
              </div>
              <div style={{display:'flex',gap:10,alignItems:'flex-start'}}>
                <div style={{
                  fontFamily:'var(--font-mono)',fontSize:'0.55rem',color:'var(--cyan)',
                  padding:'2px 6px',borderRadius:3,background:'rgba(0,245,212,0.1)',
                  border:'1px solid rgba(0,245,212,0.2)',flexShrink:0,marginTop:1
                }}>NOVA</div>
                <div style={{fontSize:'0.78rem',color:'var(--text-secondary)',lineHeight:1.5,fontWeight:500}}>{inn.ours}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
