import { useState, useEffect, useRef } from 'react';

export default function CombatSimulator() {
  const [attacker, setAttacker] = useState(120);
  const [defender, setDefender] = useState(80);
  const [production, setProduction] = useState(3);
  const [travelTurns, setTravelTurns] = useState(10);
  const [result, setResult] = useState(null);
  const [animating, setAnimating] = useState(false);

  const simulate = () => {
    setAnimating(true);
    const futureGarrison = defender + production * travelTurns;
    const diff = attacker - futureGarrison;
    setTimeout(() => {
      setResult({
        attackerShips: attacker,
        defenderFuture: futureGarrison,
        defenderBase: defender,
        produced: production * travelTurns,
        winner: diff > 0 ? 'ATTACKER' : (diff < 0 ? 'DEFENDER' : 'TIE'),
        surviving: Math.abs(diff),
        recommendation: diff > 10 ? 'ATTACK — Clear victory' :
          diff > 0 ? 'RISKY — Marginal win, consider sending more' :
          diff > -10 ? 'ABORT — Narrow loss, save ships' :
          'ABORT — Defender too strong'
      });
      setAnimating(false);
    }, 600);
  };

  return (
    <div className="animate-fade-in">
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16}}>
        <span style={{fontFamily:'var(--font-display)',fontSize:'0.6rem',letterSpacing:3,color:'var(--ice)'}}>
          COMBAT OUTCOME SIMULATOR
        </span>
        <div style={{flex:1,height:1,background:'linear-gradient(90deg,rgba(168,218,220,0.3),transparent)'}} />
      </div>

      <div className="glass" style={{padding:28}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr auto 1fr',gap:24,alignItems:'start'}}>
          {/* Attacker */}
          <div>
            <div style={{fontFamily:'var(--font-mono)',fontSize:'0.55rem',letterSpacing:2,color:'var(--cyan)',marginBottom:12}}>
              ◎ ATTACKER FLEET
            </div>
            <label style={{fontFamily:'var(--font-mono)',fontSize:'0.6rem',color:'var(--text-muted)',letterSpacing:1,display:'block',marginBottom:6}}>
              SHIPS: {attacker}
            </label>
            <input type="range" min="10" max="500" value={attacker} onChange={e => setAttacker(+e.target.value)}
              style={{width:'100%',accentColor:'var(--cyan)'}} />

            <label style={{fontFamily:'var(--font-mono)',fontSize:'0.6rem',color:'var(--text-muted)',letterSpacing:1,display:'block',marginTop:14,marginBottom:6}}>
              TRAVEL TIME: {travelTurns} TURNS
            </label>
            <input type="range" min="1" max="50" value={travelTurns} onChange={e => setTravelTurns(+e.target.value)}
              style={{width:'100%',accentColor:'var(--cyan)'}} />
          </div>

          {/* VS */}
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',paddingTop:30}}>
            <div style={{
              width:60,height:60,borderRadius:'50%',
              display:'flex',alignItems:'center',justifyContent:'center',
              background:'var(--deep)',border:'2px solid var(--border-glow)',
              fontFamily:'var(--font-display)',fontSize:'0.8rem',fontWeight:800,
              color:'var(--text-muted)',letterSpacing:2
            }}>VS</div>
            <button onClick={simulate} style={{
              marginTop:20,fontFamily:'var(--font-display)',fontSize:'0.6rem',fontWeight:700,
              letterSpacing:2,padding:'10px 24px',borderRadius:6,
              border:'1px solid var(--magenta-dim)',background:'rgba(247,37,133,0.1)',
              color:'var(--magenta)',cursor:'pointer',
              transition:'all 0.3s cubic-bezier(0.16,1,0.3,1)',
              boxShadow: animating ? '0 0 30px rgba(247,37,133,0.3)' : 'none'
            }}>
              {animating ? '⚡ SIMULATING...' : '▶ SIMULATE'}
            </button>
          </div>

          {/* Defender */}
          <div>
            <div style={{fontFamily:'var(--font-mono)',fontSize:'0.55rem',letterSpacing:2,color:'var(--magenta)',marginBottom:12}}>
              ◈ DEFENDER PLANET
            </div>
            <label style={{fontFamily:'var(--font-mono)',fontSize:'0.6rem',color:'var(--text-muted)',letterSpacing:1,display:'block',marginBottom:6}}>
              GARRISON: {defender}
            </label>
            <input type="range" min="5" max="300" value={defender} onChange={e => setDefender(+e.target.value)}
              style={{width:'100%',accentColor:'var(--magenta)'}} />

            <label style={{fontFamily:'var(--font-mono)',fontSize:'0.6rem',color:'var(--text-muted)',letterSpacing:1,display:'block',marginTop:14,marginBottom:6}}>
              PRODUCTION: {production}/TURN
            </label>
            <input type="range" min="1" max="5" value={production} onChange={e => setProduction(+e.target.value)}
              style={{width:'100%',accentColor:'var(--magenta)'}} />
          </div>
        </div>

        {/* Result */}
        {result && (
          <div style={{
            marginTop:24,padding:20,borderRadius:10,
            background: result.winner === 'ATTACKER' ? 'rgba(0,245,212,0.06)' : 'rgba(247,37,133,0.06)',
            border: `1px solid ${result.winner === 'ATTACKER' ? 'var(--cyan-dim)' : 'var(--magenta-dim)'}`,
            animation:'fadeInUp 0.4s cubic-bezier(0.16,1,0.3,1) both'
          }}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:16}}>
              <div>
                <div style={{
                  fontFamily:'var(--font-display)',fontSize:'1rem',fontWeight:800,letterSpacing:2,
                  color: result.winner === 'ATTACKER' ? 'var(--cyan)' : 'var(--magenta)',
                  marginBottom:4
                }}>
                  {result.winner === 'TIE' ? '💀 MUTUAL DESTRUCTION' : `🏆 ${result.winner} WINS`}
                </div>
                <div style={{fontFamily:'var(--font-mono)',fontSize:'0.7rem',color:'var(--text-secondary)'}}>
                  {result.recommendation}
                </div>
              </div>

              <div style={{display:'flex',gap:20}}>
                <div style={{textAlign:'center'}}>
                  <div style={{fontFamily:'var(--font-mono)',fontSize:'0.5rem',color:'var(--text-muted)',letterSpacing:1}}>ATTACKER</div>
                  <div style={{fontFamily:'var(--font-display)',fontSize:'1.3rem',fontWeight:700,color:'var(--cyan)'}}>{result.attackerShips}</div>
                </div>
                <div style={{textAlign:'center'}}>
                  <div style={{fontFamily:'var(--font-mono)',fontSize:'0.5rem',color:'var(--text-muted)',letterSpacing:1}}>DEF+PROD</div>
                  <div style={{fontFamily:'var(--font-display)',fontSize:'1.3rem',fontWeight:700,color:'var(--magenta)'}}>
                    {result.defenderBase}+{result.produced}
                  </div>
                </div>
                <div style={{textAlign:'center'}}>
                  <div style={{fontFamily:'var(--font-mono)',fontSize:'0.5rem',color:'var(--text-muted)',letterSpacing:1}}>SURVIVING</div>
                  <div style={{fontFamily:'var(--font-display)',fontSize:'1.3rem',fontWeight:700,color:'var(--gold)'}}>{result.surviving}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
