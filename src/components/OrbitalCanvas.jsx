import { useRef, useEffect, useState, useCallback } from 'react';

const TAU = Math.PI * 2;
const SUN = { x: 50, y: 50, r: 10 };
const BOARD = 100;

function generatePlanets(count = 28) {
  const planets = [];
  const groups = Math.floor(count / 4);
  for (let g = 0; g < groups; g++) {
    const ox = 15 + Math.random() * 30;
    const oy = 15 + Math.random() * 30;
    const prod = 1 + Math.floor(Math.random() * 5);
    const r = 1 + Math.log(prod);
    const ships = 5 + Math.floor(Math.random() * 50);
    const owner = g === 0 ? 0 : (g === 1 ? 1 : -1);
    const coords = [[ox,oy],[BOARD-ox,oy],[ox,BOARD-oy],[BOARD-ox,BOARD-oy]];
    coords.forEach((c,i) => {
      const ow = g === 0 ? (i===0?0:(i===3?1:-1)) : (g===1?(i===1?2:(i===2?3:-1)):-1);
      planets.push({ id: planets.length, owner: ow, x:c[0], y:c[1], radius:r, ships, production:prod,
        orbitalRadius: Math.sqrt((c[0]-50)**2+(c[1]-50)**2),
        angle: Math.atan2(c[1]-50, c[0]-50),
        speed: 0.02 + Math.random()*0.03,
        isOrbiting: Math.sqrt((c[0]-50)**2+(c[1]-50)**2) + r < 40
      });
    });
  }
  return planets;
}

function generateFleets(planets) {
  const fleets = [];
  const owned = planets.filter(p => p.owner >= 0);
  for (let i = 0; i < 6; i++) {
    const src = owned[Math.floor(Math.random()*owned.length)];
    if (!src) continue;
    const tgt = planets[Math.floor(Math.random()*planets.length)];
    fleets.push({
      id: i, owner: src.owner, x: src.x, y: src.y,
      tx: tgt.x, ty: tgt.y, progress: Math.random(),
      ships: 5 + Math.floor(Math.random()*30),
      angle: Math.atan2(tgt.y-src.y, tgt.x-src.x)
    });
  }
  return fleets;
}

const COLORS = {
  0: '#00f5d4', 1: '#f72585', 2: '#ffd166', 3: '#b388ff', '-1': '#4a5a7a'
};

export default function OrbitalCanvas() {
  const canvasRef = useRef(null);
  const stateRef = useRef({ planets: generatePlanets(), fleets: [], step: 0, particles: [] });
  const [hovered, setHovered] = useState(null);
  const animRef = useRef(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width = canvas.offsetWidth * 2;
    const H = canvas.height = canvas.offsetHeight * 2;
    const scale = Math.min(W, H) / BOARD;
    const ox = (W - BOARD * scale) / 2;
    const oy = (H - BOARD * scale) / 2;
    const s = stateRef.current;
    s.step += 0.015;

    ctx.clearRect(0, 0, W, H);

    const tx = (x) => ox + x * scale;
    const ty = (y) => oy + y * scale;
    const ts = (r) => r * scale;

    // Grid
    ctx.strokeStyle = 'rgba(30,45,85,0.3)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= BOARD; i += 10) {
      ctx.beginPath(); ctx.moveTo(tx(i), ty(0)); ctx.lineTo(tx(i), ty(BOARD)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(tx(0), ty(i)); ctx.lineTo(tx(BOARD), ty(i)); ctx.stroke();
    }

    // Orbit rings
    ctx.setLineDash([4, 6]);
    s.planets.forEach(p => {
      if (!p.isOrbiting) return;
      ctx.strokeStyle = 'rgba(30,45,85,0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(tx(50), ty(50), ts(p.orbitalRadius), 0, TAU);
      ctx.stroke();
    });
    ctx.setLineDash([]);

    // Sun corona
    const coronaR = ts(SUN.r);
    for (let i = 5; i >= 0; i--) {
      const r = coronaR * (1 + i * 0.4);
      const alpha = 0.04 - i * 0.006;
      ctx.beginPath();
      ctx.arc(tx(50), ty(50), r, 0, TAU);
      ctx.fillStyle = `rgba(255,149,0,${alpha})`;
      ctx.fill();
    }

    // Sun body
    const sunGrad = ctx.createRadialGradient(tx(50), ty(50), 0, tx(50), ty(50), coronaR);
    sunGrad.addColorStop(0, '#fff8');
    sunGrad.addColorStop(0.3, '#ff9500');
    sunGrad.addColorStop(0.7, '#ff6b00');
    sunGrad.addColorStop(1, '#cc440055');
    ctx.beginPath();
    ctx.arc(tx(50), ty(50), coronaR * (1 + Math.sin(s.step*2)*0.03), 0, TAU);
    ctx.fillStyle = sunGrad;
    ctx.fill();
    ctx.shadowColor = '#ff9500';
    ctx.shadowBlur = 30;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Update & draw planets
    s.planets.forEach(p => {
      if (p.isOrbiting) {
        const a = p.angle + p.speed * s.step;
        p.cx = 50 + p.orbitalRadius * Math.cos(a);
        p.cy = 50 + p.orbitalRadius * Math.sin(a);
      } else {
        p.cx = p.x;
        p.cy = p.y;
      }

      const px = tx(p.cx);
      const py = ty(p.cy);
      const pr = ts(p.radius) * 1.2;
      const c = COLORS[p.owner] || COLORS['-1'];

      // Glow
      ctx.shadowColor = c;
      ctx.shadowBlur = pr * 2;
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, TAU);
      ctx.fillStyle = c + '33';
      ctx.fill();
      ctx.shadowBlur = 0;

      // Planet body
      const pGrad = ctx.createRadialGradient(px - pr*0.3, py - pr*0.3, 0, px, py, pr);
      pGrad.addColorStop(0, '#ffffff88');
      pGrad.addColorStop(0.5, c);
      pGrad.addColorStop(1, c + '88');
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, TAU);
      ctx.fillStyle = pGrad;
      ctx.fill();

      // Label
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.max(8, pr*0.9)}px "JetBrains Mono"`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.ships, px, py);

      // Production indicator
      ctx.fillStyle = c;
      ctx.font = `${Math.max(6, pr*0.55)}px "JetBrains Mono"`;
      ctx.fillText('⚙' + p.production, px, py + pr + 8);
    });

    // Fleets
    if (s.fleets.length < 4 && Math.random() < 0.02) {
      s.fleets = generateFleets(s.planets);
    }
    s.fleets = s.fleets.filter(f => {
      f.progress += 0.004;
      if (f.progress > 1) return false;
      const fx = f.x + (f.tx - f.x) * f.progress;
      const fy = f.y + (f.ty - f.y) * f.progress;
      const c = COLORS[f.owner] || '#fff';

      // Trail
      for (let t = 0; t < 5; t++) {
        const tp = Math.max(0, f.progress - t * 0.015);
        const ttx = f.x + (f.tx - f.x) * tp;
        const tty = f.y + (f.ty - f.y) * tp;
        ctx.beginPath();
        ctx.arc(tx(ttx), ty(tty), 2 - t * 0.3, 0, TAU);
        ctx.fillStyle = c + Math.floor(60 - t * 10).toString(16).padStart(2,'0');
        ctx.fill();
      }

      // Fleet dot
      ctx.beginPath();
      ctx.arc(tx(fx), ty(fy), 3, 0, TAU);
      ctx.fillStyle = c;
      ctx.shadowColor = c;
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Ship count
      ctx.fillStyle = c;
      ctx.font = '9px "JetBrains Mono"';
      ctx.textAlign = 'center';
      ctx.fillText(f.ships, tx(fx), ty(fy) - 8);
      return true;
    });

    // Particles
    s.particles = s.particles.filter(p => {
      p.life -= 0.02;
      if (p.life <= 0) return false;
      p.x += p.vx;
      p.y += p.vy;
      ctx.beginPath();
      ctx.arc(tx(p.x), ty(p.y), 1.5 * p.life, 0, TAU);
      ctx.fillStyle = p.color + Math.floor(p.life * 255).toString(16).padStart(2,'0');
      ctx.fill();
      return true;
    });

    // Spawn particles at sun
    if (Math.random() < 0.3) {
      const a = Math.random() * TAU;
      s.particles.push({
        x: 50 + Math.cos(a) * (SUN.r + 1),
        y: 50 + Math.sin(a) * (SUN.r + 1),
        vx: Math.cos(a) * 0.15,
        vy: Math.sin(a) * 0.15,
        life: 0.6 + Math.random() * 0.4,
        color: Math.random() > 0.5 ? '#ff9500' : '#ffd166'
      });
    }

    animRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  return (
    <div className="animate-fade-in" style={{position:'relative'}}>
      <div style={{
        display:'flex',alignItems:'center',gap:8,marginBottom:12
      }}>
        <span style={{fontFamily:'var(--font-display)',fontSize:'0.6rem',letterSpacing:3,color:'var(--cyan)'}}>
          LIVE ORBITAL SIMULATION
        </span>
        <div style={{flex:1,height:1,background:'linear-gradient(90deg,var(--cyan-dim),transparent)'}} />
      </div>

      <div className="glass" style={{padding:0,overflow:'hidden',position:'relative'}}>
        <canvas
          ref={canvasRef}
          style={{width:'100%',height:520,display:'block',cursor:'crosshair'}}
        />

        {/* Overlay info */}
        <div style={{
          position:'absolute',bottom:16,left:16,
          display:'flex',gap:16,flexWrap:'wrap'
        }}>
          {Object.entries({0:'PLAYER 1',1:'PLAYER 2',2:'PLAYER 3',3:'PLAYER 4','-1':'NEUTRAL'}).map(([k,v]) => (
            <div key={k} style={{
              display:'flex',alignItems:'center',gap:6,
              fontFamily:'var(--font-mono)',fontSize:'0.6rem',
              color:'var(--text-secondary)',letterSpacing:1
            }}>
              <div style={{width:8,height:8,borderRadius:'50%',background:COLORS[k],boxShadow:`0 0 6px ${COLORS[k]}66`}} />
              {v}
            </div>
          ))}
        </div>

        <div style={{
          position:'absolute',top:16,right:16,
          fontFamily:'var(--font-mono)',fontSize:'0.6rem',
          color:'var(--text-muted)',letterSpacing:1,
          background:'rgba(2,4,10,0.7)',padding:'4px 10px',
          borderRadius:4,border:'1px solid var(--border)'
        }}>
          100×100 CONTINUOUS SPACE
        </div>
      </div>
    </div>
  );
}
