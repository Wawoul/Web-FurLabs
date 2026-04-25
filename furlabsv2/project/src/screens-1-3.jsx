/* global React, Icon, Logo, FlaskMark, ScreenHeader, Eyebrow */
const { useState: useS1, useEffect: useE1 } = React;

// ===== Screen 1: Title / Home =====
function TitleScreen({ go }) {
  return (
    <div className="page-enter" style={{
      height:'100%', display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center', padding: '40px',
      position:'relative',
    }}>
      <div style={{textAlign:'center', maxWidth: 720}}>
        <div style={{display:'inline-flex', alignItems:'center', gap:8, marginBottom: 24,
          padding: '6px 14px', borderRadius:999,
          background: 'rgba(61,231,228,0.08)', border:'1px solid rgba(61,231,228,0.25)',
          color: 'var(--cyan)', fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform:'uppercase',
          fontFamily:'var(--font-display)'
        }}>
          <span className="dot dot-cyan"/> Lab status: online · 12 active sessions
        </div>

        <div style={{marginBottom: 16}}>
          <Logo size="xl"/>
        </div>

        <p style={{
          fontFamily:'var(--font-display)', fontSize: 22, fontWeight: 500,
          color:'var(--text-mute)', marginBottom: 8,
        }}>
          Create Together. Reveal the Unexpected.
        </p>
        <p style={{color:'var(--text-dim)', fontSize: 15, marginBottom: 44, maxWidth: 440, marginLeft:'auto', marginRight:'auto'}}>
          A collaborative fursona laboratory. Sketch a body part — your collaborators sketch the rest. Our AI splices the experiment.
        </p>

        <div style={{display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap'}}>
          <button className="btn btn-primary btn-lg" onClick={() => go('create')}>
            <Icon name="plus" size={18}/> Create Lobby
          </button>
          <button className="btn btn-secondary btn-lg" onClick={() => go('join')}>
            <Icon name="enter" size={18}/> Join Lobby
          </button>
          <button className="btn btn-secondary btn-lg" onClick={() => go('gallery')}>
            <Icon name="gallery" size={18}/> Gallery
          </button>
        </div>

        {/* Decorative trio of orbiting flasks */}
        <div style={{display:'flex', justifyContent:'center', gap:36, marginTop: 56, opacity: 0.85}}>
          {[0,1,2].map(i => (
            <div key={i} style={{
              padding: 16, borderRadius: 16,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              display:'flex', flexDirection:'column', alignItems:'center', gap: 6,
              minWidth: 120,
            }}>
              <div style={{display:'flex', gap:4, alignItems:'center', color:['#ff3d9a','#3de7e4','#ffb43d'][i]}}>
                <Icon name={['brush','dna','sparkle'][i]} size={18}/>
              </div>
              <div style={{fontFamily:'var(--font-display)', fontSize: 13, fontWeight: 600}}>
                {['Sketch','Combine','Reveal'][i]}
              </div>
              <div style={{fontSize: 11, color:'var(--text-dim)', textAlign:'center'}}>
                {['Draw your part in private','Hand off to the lab','See the chimera'][i]}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{position:'absolute', bottom: 18, left: 0, right: 0, textAlign:'center',
        fontFamily:'var(--font-mono)', fontSize: 11, color:'var(--text-dim)', letterSpacing:'0.1em'}}>
        FUR-LABS · v0.4.2-beta · build 2026.04
      </div>
    </div>
  );
}

// ===== Screen 2: Create Lobby =====
function CreateLobbyScreen({ go, push }) {
  const [name, setName] = useS1('');
  const [duration, setDuration] = useS1(120);
  const presets = [
    {v: 60, label:'Quick', desc:'1m'},
    {v: 120, label:'Standard', desc:'2m'},
    {v: 180, label:'Extended', desc:'3m'},
    {v: 300, label:'Marathon', desc:'5m'},
  ];

  return (
    <div className="page-enter" style={{height:'100%', display:'flex', flexDirection:'column'}}>
      <ScreenHeader
        eyebrow={<><Icon name="flask" size={12}/> New session</>}
        title="Initialize Experiment"
        subtitle="Configure the lab parameters. You'll be the lead scientist."
        onBack={() => go('title')}
      />
      <div style={{flex:1, padding:'0 40px 32px', display:'flex', justifyContent:'center', alignItems:'flex-start'}}>
        <div className="panel panel-strong" style={{width:'100%', maxWidth: 580, padding: 36, display:'flex', flexDirection:'column', gap: 28}}>

          <div className="input-group">
            <label className="input-label"><Icon name="user" size={14}/> Scientist Name</label>
            <div className="input-icon">
              <span className="icon-prefix"><Icon name="user" size={18}/></span>
              <input className="input" placeholder="Dr. Whiskers" value={name} onChange={e => setName(e.target.value)} maxLength={20}/>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label"><Icon name="clock" size={14}/> Experiment Duration</label>
            <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 10}}>
              {presets.map(p => (
                <button
                  key={p.v}
                  onClick={() => setDuration(p.v)}
                  style={{
                    padding: '14px 10px',
                    borderRadius: 14,
                    background: duration === p.v
                      ? 'linear-gradient(135deg, rgba(255,61,154,0.2), rgba(61,231,228,0.15))'
                      : 'rgba(20,8,42,0.5)',
                    border: duration === p.v ? '1.5px solid var(--magenta)' : '1px solid var(--panel-border)',
                    boxShadow: duration === p.v ? '0 0 24px rgba(255,61,154,0.3)' : 'none',
                    transition: 'all 0.18s',
                    cursor:'pointer',
                  }}
                >
                  <div style={{fontFamily:'var(--font-display)', fontWeight: 600, fontSize: 14, color: 'var(--text)'}}>
                    {p.label}
                  </div>
                  <div style={{fontFamily:'var(--font-mono)', fontSize: 13, color: duration===p.v ? 'var(--cyan)' : 'var(--text-dim)', marginTop: 2}}>
                    {p.desc}
                  </div>
                </button>
              ))}
            </div>
            {/* Visual test tube fill */}
            <div style={{display:'flex', alignItems:'center', gap: 12, marginTop: 8, padding: '10px 14px',
              background:'rgba(20,8,42,0.5)', border:'1px solid var(--panel-border)', borderRadius: 12}}>
              <Icon name="flask" size={20} color="var(--cyan)"/>
              <div style={{flex:1, height: 8, background:'rgba(255,255,255,0.06)', borderRadius:4, overflow:'hidden'}}>
                <div style={{
                  height:'100%',
                  width: `${(duration/300)*100}%`,
                  background: 'linear-gradient(90deg, #3de7e4, #5dffaa)',
                  borderRadius: 4,
                  boxShadow:'0 0 12px rgba(61,231,228,0.6)',
                  transition: 'width 0.3s ease',
                }}/>
              </div>
              <span className="mono" style={{fontSize: 13, color:'var(--cyan)', minWidth: 40, textAlign:'right'}}>
                {duration}s
              </span>
            </div>
          </div>

          <div style={{display:'flex', gap: 12, justifyContent:'flex-end', marginTop: 8}}>
            <button className="btn btn-ghost" onClick={() => go('title')}>
              <Icon name="arrow-left" size={16}/> Back
            </button>
            <button
              className="btn btn-primary"
              disabled={!name.trim()}
              onClick={() => { push('success', 'Lab session initialized'); go('waiting'); }}
            >
              Create Lab <Icon name="arrow-right" size={16}/>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== Screen 3: Join Lobby =====
function JoinLobbyScreen({ go, push }) {
  const [name, setName] = useS1('');
  const [code, setCode] = useS1(['','','','','','']);
  const refs = React.useRef([]);

  const setCell = (i, v) => {
    const c = v.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,1);
    setCode(prev => {
      const n = [...prev]; n[i] = c; return n;
    });
    if (c && i < 5) refs.current[i+1]?.focus();
  };
  const onKey = (i, e) => {
    if (e.key === 'Backspace' && !code[i] && i > 0) refs.current[i-1]?.focus();
  };

  const filled = code.every(c => c);

  return (
    <div className="page-enter" style={{height:'100%', display:'flex', flexDirection:'column'}}>
      <ScreenHeader
        eyebrow={<><Icon name="lock" size={12}/> Secure access</>}
        title="Enter Lab Code"
        subtitle="6-character access code from your host. Case insensitive."
        onBack={() => go('title')}
      />
      <div style={{flex:1, padding:'0 40px 32px', display:'flex', justifyContent:'center', alignItems:'flex-start'}}>
        <div className="panel panel-strong" style={{width:'100%', maxWidth: 580, padding: 36, display:'flex', flexDirection:'column', gap: 28}}>

          <div className="input-group">
            <label className="input-label"><Icon name="user" size={14}/> Scientist Name</label>
            <div className="input-icon">
              <span className="icon-prefix"><Icon name="user" size={18}/></span>
              <input className="input" placeholder="Dr. Whiskers" value={name} onChange={e => setName(e.target.value)} maxLength={20}/>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label"><Icon name="lock" size={14}/> Access Code</label>
            <div className="code-input">
              {code.map((c, i) => (
                <input
                  key={i}
                  ref={el => refs.current[i] = el}
                  className={`code-cell ${c ? 'filled':''}`}
                  value={c}
                  onChange={e => setCell(i, e.target.value)}
                  onKeyDown={e => onKey(i, e)}
                  maxLength={1}
                  inputMode="text"
                  aria-label={`Code character ${i+1}`}
                />
              ))}
            </div>
            <div style={{display:'flex', alignItems:'center', gap: 8, marginTop: 4, fontSize: 12, color: filled ? 'var(--green)' : 'var(--text-dim)'}}>
              {filled ? (<><Icon name="check" size={14}/> Scanning... access granted.</>) : (<><div className="dot dot-gray"/> Awaiting code</>)}
            </div>
          </div>

          <div style={{display:'flex', gap: 12, justifyContent:'flex-end', marginTop: 8}}>
            <button className="btn btn-ghost" onClick={() => go('title')}>
              <Icon name="arrow-left" size={16}/> Back
            </button>
            <button
              className="btn btn-primary"
              disabled={!name.trim() || !filled}
              onClick={() => { push('info', 'Joined lab session'); go('waiting'); }}
            >
              Join Lab <Icon name="enter" size={16}/>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

window.TitleScreen = TitleScreen;
window.CreateLobbyScreen = CreateLobbyScreen;
window.JoinLobbyScreen = JoinLobbyScreen;
