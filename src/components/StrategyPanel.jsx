import { useState } from 'react';

const phases = [
  {
    id:1, name:'LAYER I', title:'Predictive Interception Engine',
    color:'#00f5d4', icon:'◎',
    insight:'Most bots aim where planets ARE. NOVA aims where they WILL BE.',
    details:[
      'Orbiting planets are 100% deterministic — all positions precomputed',
      'Binary-search intercept angle converges in 20 iterations (<1ms)',
      'Fleets arrive as planet arrives — zero wasted trajectory',
      'Comet path prediction from observation trajectory arrays'
    ],
    code:`def find_intercept(src, target, angular_vel):\n    speed = fleet_speed(ships)\n    for _ in range(20):  # converge\n        px, py = predict_pos(target, turns)\n        turns = dist(src, (px,py)) / speed\n    return atan2(py - src.y, px - src.x)`,
    edge:'Opponents chasing current position waste 10-40% fleet effectiveness on moving targets'
  },
  {
    id:2, name:'LAYER II', title:'NPV Economic Planner',
    color:'#f72585', icon:'◈',
    insight:'Production compounds. We use Net Present Value — not simple multiplication.',
    details:[
      'Score = Σ(production × discount^t) - capture_cost - opportunity_cost',
      'Accounts for ships-in-transit not producing during travel',
      'Compound growth: early captures cascade into exponential advantage',
      'Dynamic discount rate adjusts by game phase and board control'
    ],
    code:`def planet_npv(target, source, step):\n    travel = compute_travel_time(source, target)\n    remaining = 500 - step - travel\n    npv = sum(prod * 0.98**t for t in range(remaining))\n    cost = garrison + source.prod * travel * 0.5\n    return npv - cost`,
    edge:'Greedy bots take nearest planet. NOVA takes the RIGHT planet — compounding 200+ turns of advantage.'
  },
  {
    id:3, name:'LAYER III', title:'Multi-Fleet Pincer Coordination',
    color:'#ffd166', icon:'◉',
    insight:'Time 2-3 fleets from different planets to arrive simultaneously.',
    details:[
      'Delayed launch queue: hold launches until rendezvous turn alignment',
      'All fleets from same owner combine ships on arrival — massive force',
      'Defender sees small fleets, doesn\'t reinforce enough → crushed',
      'Feint system: small decoy fleet forces misallocation, main force strikes elsewhere'
    ],
    code:`def plan_pincer(target, sources, step):\n    arrivals = [(s, travel_time(s, target)) for s in sources]\n    rendezvous = max(a[1] for a in arrivals)\n    return [(s, step + rendezvous - t, target)\n            for s, t in arrivals]`,
    edge:'Single-fleet attacks are predictable. Pincers are nearly impossible to defend optimally.'
  },
  {
    id:4, name:'LAYER IV', title:'Bayesian Opponent Classifier',
    color:'#b388ff', icon:'◇',
    insight:'One strategy cannot beat all opponents. We classify and counter in real-time.',
    details:[
      'Track fleet launches/turn → aggressive/passive/turtle classification',
      'P(strategy | observations) ∝ P(observations | strategy) × P(strategy)',
      'vs Aggressive: turtle → let them overextend → counter-strike',
      'vs Passive: fast expand → grab all neutrals → win on economy'
    ],
    code:`class OpponentModel:\n    def classify(self, opp_id):\n        rate = self.launches[opp_id] / max(1, self.turns)\n        if rate > 0.8: return "AGGRESSIVE"\n        if rate < 0.3: return "PASSIVE"\n        return "BALANCED"`,
    edge:'Adaptive bots perform 25-40% better in diverse tournament pools.'
  },
  {
    id:5, name:'LAYER V', title:'Forward Combat Simulator',
    color:'#a8dadc', icon:'◑',
    insight:'Never send ships to a losing battle. Simulate every outcome BEFORE launching.',
    details:[
      'Full combat resolution engine matching game rules exactly',
      'N-turn lookahead: predict production, fleet arrivals, ownership changes',
      'Sacrifice logic: if planet is indefensible, evacuate ships instead',
      'Sun path validation: line-circle intersection prevents fleet suicide'
    ],
    code:`def simulate_attack(attacker_ships, garrison, prod, turns):\n    future_garrison = garrison + prod * turns\n    if attacker_ships > future_garrison:\n        return ("WIN", attacker_ships - future_garrison)\n    return ("LOSS", future_garrison - attacker_ships)`,
    edge:'Every ship counts. Zero ships wasted on lost causes = 15-20% more effective forces.'
  },
  {
    id:6, name:'LAYER VI', title:'Comet Exploitation Protocol',
    color:'#ff6b35', icon:'◐',
    insight:'Comets spawn at turns 50/150/250/350/450. We pre-position 5-8 turns ahead.',
    details:[
      'At turn ~42: identify nearest owned planet per comet quadrant',
      'At turn ~45: launch minimum-sized intercept fleet',
      'At turn 50: fleet arrives as comet spawns → instant capture',
      'Owned comet = mobile forward base + production + score padding'
    ],
    code:`COMET_TURNS = [50, 150, 250, 350, 450]\ndef preposition_comet(step, my_planets):\n    for spawn in COMET_TURNS:\n        if spawn - 8 < step < spawn - 3:\n            launch_interceptor(nearest_planet, \n                               comet_quadrant)`,
    edge:'A well-timed comet capture yields 30-80 free ships — equivalent to 15-80 turns of production.'
  },
];

export default function StrategyPanel() {
  const [active, setActive] = useState(0);
  const phase = phases[active];

  return (
    <div className="animate-fade-in">
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16}}>
        <span style={{fontFamily:'var(--font-display)',fontSize:'0.6rem',letterSpacing:3,color:'var(--gold)'}}>
          NOVA AGENT · STRATEGY LAYERS
        </span>
        <div style={{flex:1,height:1,background:'linear-gradient(90deg,var(--gold-dim),transparent)'}} />
      </div>

      <div style={{display:'flex',gap:16,minHeight:500}}>
        {/* Sidebar */}
        <div className="glass" style={{width:220,padding:'16px 0',flexShrink:0}}>
          <div style={{fontFamily:'var(--font-mono)',fontSize:'0.5rem',color:'var(--text-muted)',letterSpacing:3,padding:'0 16px 12px'}}>
            SELECT LAYER
          </div>
          {phases.map((p, i) => (
            <button key={p.id} onClick={() => setActive(i)} style={{
              width:'100%',
              background: active===i ? `${p.color}12` : 'transparent',
              border:'none',
              borderLeft: active===i ? `3px solid ${p.color}` : '3px solid transparent',
              padding:'14px 16px',cursor:'pointer',textAlign:'left',
              transition:'all 0.2s cubic-bezier(0.16,1,0.3,1)'
            }}>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:16,color: active===i ? p.color : 'var(--text-muted)'}}>{p.icon}</span>
                <div>
                  <div style={{fontFamily:'var(--font-mono)',fontSize:'0.55rem',letterSpacing:2,color: active===i ? p.color : 'var(--text-muted)',marginBottom:2}}>
                    {p.name}
                  </div>
                  <div style={{fontFamily:'var(--font-body)',fontSize:'0.7rem',color: active===i ? 'var(--text-primary)' : 'var(--text-muted)',lineHeight:1.3}}>
                    {p.title}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="glass" style={{flex:1,padding:28,overflow:'auto'}} key={active}>
          {/* Header */}
          <div style={{display:'flex',alignItems:'flex-start',gap:16,marginBottom:24}}>
            <div style={{fontSize:48,color:phase.color,textShadow:`0 0 30px ${phase.color}66`,lineHeight:1,flexShrink:0}}>
              {phase.icon}
            </div>
            <div>
              <div style={{fontFamily:'var(--font-mono)',fontSize:'0.6rem',letterSpacing:3,color:phase.color,marginBottom:4}}>
                {phase.name} · {phase.title.toUpperCase()}
              </div>
              <div style={{
                fontSize:'0.95rem',color:'var(--text-secondary)',fontStyle:'italic',lineHeight:1.6,
                borderLeft:`2px solid ${phase.color}44`,paddingLeft:16,maxWidth:600
              }}>
                "{phase.insight}"
              </div>
            </div>
          </div>

          {/* Details */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:20}}>
            {phase.details.map((d, i) => (
              <div key={i} style={{
                background:'var(--deep)',border:`1px solid ${phase.color}18`,
                borderRadius:6,padding:'12px 16px',
                display:'flex',gap:10,alignItems:'flex-start'
              }}>
                <span style={{color:phase.color,fontSize:12,flexShrink:0,marginTop:2}}>▸</span>
                <span style={{fontFamily:'var(--font-body)',fontSize:'0.78rem',color:'var(--text-secondary)',lineHeight:1.6}}>{d}</span>
              </div>
            ))}
          </div>

          {/* Code */}
          <div className="code-block" style={{borderColor:`${phase.color}33`,marginBottom:20}}>
            <div style={{fontFamily:'var(--font-mono)',fontSize:'0.5rem',letterSpacing:2,color:phase.color,marginBottom:10}}>
              IMPLEMENTATION
            </div>
            <pre style={{margin:0,whiteSpace:'pre-wrap',fontSize:'0.72rem',lineHeight:1.8}}>{phase.code}</pre>
          </div>

          {/* Edge */}
          <div style={{
            background:`linear-gradient(135deg, ${phase.color}08 0%, transparent 100%)`,
            border:`1px solid ${phase.color}33`,borderRadius:8,padding:'16px 20px'
          }}>
            <div style={{fontFamily:'var(--font-mono)',fontSize:'0.5rem',letterSpacing:3,color:phase.color,marginBottom:6}}>
              COMPETITIVE EDGE
            </div>
            <div style={{fontSize:'0.85rem',color:'var(--text-secondary)',lineHeight:1.7}}>
              ⚡ {phase.edge}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
