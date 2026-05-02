import { useState, useEffect } from 'react';

export default function Header({ activeSection, setActiveSection }) {
  const [scrolled, setScrolled] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  useEffect(() => {
    const iv = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  const deadline = new Date('2026-06-23T23:59:00Z');
  const daysLeft = Math.max(0, Math.ceil((deadline - time) / 86400000));
  const hoursLeft = Math.max(0, Math.floor(((deadline - time) % 86400000) / 3600000));

  return (
    <>
      <header style={{
        position:'sticky',top:0,zIndex:100,
        background: scrolled ? 'rgba(2,4,10,0.92)' : 'rgba(2,4,10,0.7)',
        backdropFilter:'blur(30px)',WebkitBackdropFilter:'blur(30px)',
        borderBottom:`1px solid ${scrolled ? 'var(--border-glow)' : 'var(--border)'}`,
        boxShadow: scrolled ? '0 4px 30px rgba(0,0,0,0.5)' : 'none',
        transition:'all 0.3s cubic-bezier(0.16,1,0.3,1)'
      }}>
        <div style={{
          maxWidth:1440,margin:'0 auto',padding:'12px 24px',
          display:'flex',alignItems:'center',gap:32
        }}>
          {/* Logo */}
          <div style={{display:'flex',alignItems:'center',gap:12,flexShrink:0}}>
            <div style={{width:42,height:42,position:'relative'}}>
              <div style={{
                position:'absolute',inset:0,
                border:'2px solid var(--cyan-dim)',borderRadius:'50%',
                animation:'orbit 8s linear infinite'
              }}/>
              <div style={{
                position:'absolute',top:'50%',left:'50%',width:16,height:16,
                margin:'-8px 0 0 -8px',borderRadius:'50%',
                background:'radial-gradient(circle at 35% 35%, #fff8 0%, var(--solar) 40%, #8B0000 100%)',
                boxShadow:'0 0 20px rgba(255,149,0,0.5)',
                animation:'breathe 3s ease-in-out infinite'
              }}/>
              <div style={{
                position:'absolute',top:2,left:'50%',width:7,height:7,marginLeft:-3.5,
                borderRadius:'50%',background:'var(--cyan)',boxShadow:'0 0 8px var(--cyan)',
                animation:'orbit 8s linear infinite',transformOrigin:'3.5px 19px'
              }}/>
            </div>
            <div style={{display:'flex',flexDirection:'column'}}>
              <span style={{fontFamily:'var(--font-mono)',fontSize:'0.55rem',letterSpacing:2.5,color:'var(--cyan)',lineHeight:1.2}}>
                KAGGLE · FEATURED SIMULATION
              </span>
              <span style={{fontFamily:'var(--font-display)',fontSize:'1.25rem',fontWeight:800,letterSpacing:3,color:'var(--text-primary)',lineHeight:1.2}}>
                ORBIT WARS
              </span>
            </div>
          </div>

          <div style={{flex:1}} />

          {/* Status */}
          <div style={{display:'flex',alignItems:'center',gap:20,flexShrink:0}}>
            <div style={{textAlign:'right'}}>
              <div style={{fontFamily:'var(--font-mono)',fontSize:'1rem',fontWeight:700,color:'var(--gold)',lineHeight:1}}>
                {daysLeft}<span style={{fontSize:'0.65rem',color:'var(--text-muted)',marginLeft:1}}>D</span>{' '}
                {hoursLeft}<span style={{fontSize:'0.65rem',color:'var(--text-muted)',marginLeft:1}}>H</span>
              </div>
              <div style={{fontFamily:'var(--font-mono)',fontSize:'0.5rem',letterSpacing:2,color:'var(--text-muted)',marginTop:2}}>
                UNTIL DEADLINE
              </div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:6,fontFamily:'var(--font-mono)',fontSize:'0.6rem',fontWeight:600,letterSpacing:2,color:'var(--cyan)'}}>
              <div style={{width:8,height:8,borderRadius:'50%',background:'var(--cyan)',boxShadow:'0 0 10px var(--cyan)',animation:'pulse 2s ease-in-out infinite'}}/>
              ACTIVE
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
