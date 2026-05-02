import { useState } from 'react';

export default function Footer() {
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState(null);

  async function runQuickTest() {
    try {
      setRunning(true);
      const res = await fetch('/api/runs/mock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'quick-run' }),
      });
      // Safely parse JSON — handle non-JSON or empty responses
      const ctype = res.headers.get('content-type') || '';
      let data = null;
      if (res.status === 204) {
        data = { id: null, message: 'No content' };
      } else if (ctype.includes('application/json')) {
        try {
          data = await res.json();
        } catch (e) {
          data = { error: 'Invalid JSON in response', detail: String(e) };
        }
      } else {
        const txt = await res.text();
        data = { error: 'Non-JSON response', status: res.status, body: txt };
      }
      setLastRun(data);
    } catch (e) {
      setLastRun({ error: String(e) });
    } finally {
      setRunning(false);
    }
  }

  return (
    <footer style={{
      borderTop:'1px solid var(--border)',
      padding:'24px 32px',
      background:'rgba(2,4,10,0.8)',
      backdropFilter:'blur(20px)',
      display:'flex',justifyContent:'space-between',alignItems:'center',
      flexWrap:'wrap',gap:16,marginTop:40
    }}>
      <div style={{display:'flex',alignItems:'center',gap:12}}>
        <div style={{
          width:28,height:28,borderRadius:'50%',
          background:'radial-gradient(circle at 35% 35%, #fff4 0%, var(--solar) 50%, #8B0000 100%)',
          boxShadow:'0 0 12px rgba(255,149,0,0.3)'
        }} />
        <div>
          <div style={{fontFamily:'var(--font-display)',fontSize:'0.7rem',fontWeight:700,letterSpacing:2,color:'var(--text-primary)'}}>
            ORBIT WARS · NOVA AGENT
          </div>
          <div style={{fontFamily:'var(--font-mono)',fontSize:'0.5rem',color:'var(--text-muted)',letterSpacing:1}}>
            KAGGLE FEATURED SIMULATION COMPETITION 2026
          </div>
        </div>
      </div>

      <div style={{display:'flex',gap:20,alignItems:'center'}}>
        {[
          { label:'PRIZE POOL', value:'$50,000' },
          { label:'TEAMS', value:'1000+' },
          { label:'AGENT VER', value:'NOVA v1.0' },
        ].map(s => (
          <div key={s.label} style={{textAlign:'center'}}>
            <div style={{fontFamily:'var(--font-display)',fontSize:'0.75rem',fontWeight:700,color:'var(--cyan)'}}>
              {s.value}
            </div>
            <div style={{fontFamily:'var(--font-mono)',fontSize:'0.45rem',color:'var(--text-muted)',letterSpacing:2}}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      <div style={{display:'flex',gap:12,alignItems:'center'}}>
        <button onClick={runQuickTest} disabled={running} style={{padding:'8px 12px',borderRadius:6,border:'none',cursor:'pointer',background:'var(--cyan)',color:'#001'}}>
          {running ? 'Running...' : 'Run Quick Test'}
        </button>
        {lastRun && (
          <div style={{fontSize:'0.85rem',color:'var(--text-muted)'}}>
            {lastRun.id ? `Run saved (#${lastRun.id})` : lastRun.error || 'Done'}
          </div>
        )}
      </div>
    </footer>
  );
}
