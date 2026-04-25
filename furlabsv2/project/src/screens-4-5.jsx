/* global React, Icon, ScreenHeader, SpecimenAvatar */
const { useState: useS2 } = React;

const samplePlayers = [
  { id: 1, name: 'Dr. Whiskers', host: true, ready: true, seed: 0 },
  { id: 2, name: 'Specimen.42', host: false, ready: true, seed: 1 },
  { id: 3, name: 'Lab-Foxglove', host: false, ready: false, seed: 2 },
  { id: 4, name: 'Prof. Pawsworth', host: false, ready: true, seed: 3 },
  { id: 5, name: 'Glitch', host: false, ready: false, seed: 4, quit: true },
];

// ===== Screen 4: Waiting Room =====
function WaitingRoomScreen({ go, push }) {
  const [ready, setReady] = useS2(false);
  const [copied, setCopied] = useS2(false);
  const code = 'XK7-94B';

  const copy = () => {
    navigator.clipboard?.writeText(code).catch(()=>{});
    setCopied(true);
    push('success', 'Lab code copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const allReady = samplePlayers.filter(p => !p.quit).every(p => p.ready) && ready;

  return (
    <div className="page-enter" style={{height:'100%', display:'flex', flexDirection:'column'}}>
      <ScreenHeader
        eyebrow={<><Icon name="dna" size={12}/> Lobby · 4/8 specimens</>}
        title="Lab Briefing"
        subtitle="Share the code below. Once everyone's ready, the host begins the experiment."
        onBack={() => go('title')}
      />
      <div style={{flex:1, padding:'0 40px 32px', display:'grid', gridTemplateColumns:'1fr 1.4fr', gap: 24, alignContent:'start'}}>

        {/* Code panel */}
        <div className="panel panel-strong" style={{padding: 28, display:'flex', flexDirection:'column', gap:20}}>
          <div className="eyebrow"><Icon name="lock" size={12}/> Access label</div>
          <div style={{
            background:'rgba(20,8,42,0.7)',
            border: '1.5px dashed rgba(61,231,228,0.4)',
            borderRadius: 16,
            padding: '24px 16px',
            textAlign:'center',
            position:'relative',
          }}>
            <div style={{fontFamily:'var(--font-mono)', fontSize: 11, color:'var(--text-dim)', letterSpacing:'0.2em', marginBottom: 6}}>
              SPECIMEN-LOT-ID
            </div>
            <div className="mono" style={{
              fontSize: 42, fontWeight: 700,
              background: 'linear-gradient(90deg, #3de7e4, #5dffaa)',
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
              letterSpacing:'0.1em',
            }}>
              {code}
            </div>
            <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginTop:8, fontSize: 11, color:'var(--text-dim)', fontFamily:'var(--font-mono)'}}>
              <span className="dot dot-green"/> EXP. 60 MIN
            </div>
          </div>
          <button
            className={copied ? 'btn btn-cyan' : 'btn btn-secondary'}
            onClick={copy}
            style={{justifyContent:'center'}}
          >
            <Icon name={copied ? 'check':'copy'} size={16}/>
            {copied ? 'Copied!' : 'Copy Code'}
          </button>

          <div style={{borderTop: '1px solid var(--panel-border)', paddingTop: 20, display:'flex', flexDirection:'column', gap: 14}}>
            <div className="eyebrow"><Icon name="clock" size={12}/> Parameters</div>
            <div style={{display:'flex', justifyContent:'space-between', fontSize: 13}}>
              <span style={{color:'var(--text-mute)'}}>Round duration</span>
              <span className="mono text-cyan">120s</span>
            </div>
            <div style={{display:'flex', justifyContent:'space-between', fontSize: 13}}>
              <span style={{color:'var(--text-mute)'}}>Rounds</span>
              <span className="mono text-cyan">3 · head/torso/legs</span>
            </div>
            <div style={{display:'flex', justifyContent:'space-between', fontSize: 13}}>
              <span style={{color:'var(--text-mute)'}}>Lead scientist</span>
              <span style={{color:'var(--gold)', fontWeight:600}}>Dr. Whiskers</span>
            </div>
          </div>
        </div>

        {/* Players list */}
        <div className="panel" style={{padding: 28, display:'flex', flexDirection:'column', gap: 20}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <div className="eyebrow"><Icon name="user" size={12}/> Test subjects</div>
            <span style={{fontSize: 12, color:'var(--text-mute)', fontFamily:'var(--font-mono)'}}>
              {samplePlayers.filter(p => !p.quit && p.ready).length}/{samplePlayers.filter(p => !p.quit).length} ready
            </span>
          </div>

          <div style={{display:'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12}}>
            {samplePlayers.map(p => (
              <div key={p.id} className="panel" style={{
                padding: 14,
                display:'flex', alignItems:'center', gap: 12,
                opacity: p.quit ? 0.45 : 1,
                borderColor: p.ready && !p.quit ? 'rgba(93,255,170,0.35)' : 'var(--panel-border)',
                background: p.ready && !p.quit ? 'rgba(93,255,170,0.05)' : 'var(--panel)',
              }}>
                <SpecimenAvatar seed={p.seed} size={42}/>
                <div style={{flex:1, minWidth: 0}}>
                  <div style={{display:'flex', alignItems:'center', gap: 6, fontWeight: 600, fontSize: 14}}>
                    <span style={{overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{p.name}</span>
                  </div>
                  <div style={{display:'flex', alignItems:'center', gap: 6, marginTop: 4}}>
                    {p.host && <span className="badge badge-host"><Icon name="crown" size={10}/> Host</span>}
                    {p.quit ? <span className="badge badge-quit">Quit</span>
                      : p.ready ? <span className="badge badge-ready"><Icon name="check" size={10}/> Ready</span>
                      : <span className="badge" style={{background:'rgba(255,180,61,0.12)', color:'var(--gold)', border:'1px solid rgba(255,180,61,0.25)'}}><span className="dot dot-magenta" style={{width:6,height:6,background:'var(--gold)', boxShadow:'0 0 6px var(--gold)'}}/> Waiting</span>}
                  </div>
                </div>
              </div>
            ))}
            {/* empty slot */}
            {Array.from({length: 3}).map((_, i) => (
              <div key={`e${i}`} style={{
                padding: 14, borderRadius: 16,
                border: '1px dashed rgba(255,255,255,0.08)',
                display:'flex', alignItems:'center', justifyContent:'center', gap: 8,
                color:'var(--text-dim)', fontSize: 12, fontFamily:'var(--font-mono)',
              }}>
                <Icon name="plus" size={14}/> SLOT OPEN
              </div>
            ))}
          </div>

          <div style={{
            marginTop: 4,
            padding: 16,
            borderRadius: 16,
            background: ready ? 'linear-gradient(135deg, rgba(93,255,170,0.15), rgba(61,231,228,0.1))' : 'rgba(20,8,42,0.5)',
            border: ready ? '1px solid rgba(93,255,170,0.4)' : '1px solid var(--panel-border)',
            display:'flex', alignItems:'center', justifyContent:'space-between', gap: 16,
            transition: 'all 0.25s',
          }}>
            <div>
              <div style={{fontFamily:'var(--font-display)', fontWeight: 600, fontSize: 15, color: ready ? 'var(--green)' : 'var(--text)'}}>
                {ready ? 'You are ready for the experiment' : 'Mark yourself ready'}
              </div>
              <div style={{fontSize: 12, color:'var(--text-dim)', marginTop: 2}}>
                Toggle when you've put your goggles on.
              </div>
            </div>
            <button
              onClick={() => setReady(r => !r)}
              style={{
                width: 64, height: 36, borderRadius: 999,
                background: ready ? 'linear-gradient(90deg, #5dffaa, #3de7e4)' : 'rgba(255,255,255,0.08)',
                border: '1px solid ' + (ready ? 'rgba(93,255,170,0.6)' : 'var(--panel-border-strong)'),
                position:'relative', cursor:'pointer',
                boxShadow: ready ? '0 0 16px rgba(93,255,170,0.4)' : 'none',
                transition: 'all 0.25s',
              }}
              aria-label="Ready toggle"
            >
              <span style={{
                position:'absolute', top: 3, left: ready ? 31 : 3,
                width: 28, height: 28, borderRadius: '50%',
                background: 'white',
                transition: 'left 0.25s cubic-bezier(.18,.89,.32,1.28)',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                {ready && <Icon name="check" size={14} color="#0a2a2a"/>}
              </span>
            </button>
          </div>

          <div style={{display:'flex', gap: 12, justifyContent:'flex-end', marginTop: 4}}>
            <button className="btn btn-danger" onClick={() => go('title')}>
              <Icon name="arrow-left" size={14}/> Leave Lab
            </button>
            <button
              className="btn btn-primary"
              disabled={!allReady}
              onClick={() => go('style')}
            >
              <Icon name="play" size={14}/> Begin Experiment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== Screen 5: Style Selection =====
const ART_STYLES = [
  { id:'cartoon', name:'Cartoon', icon:'palette', tint:'#ff3d9a' },
  { id:'pixel', name:'Pixel Art', icon:'gallery', tint:'#3de7e4' },
  { id:'anime', name:'Anime', icon:'sparkle', tint:'#c8a6ff' },
  { id:'watercolor', name:'Watercolor', icon:'brush', tint:'#5dffaa' },
  { id:'sketch', name:'Sketch', icon:'pipette', tint:'#ffb43d' },
  { id:'cell', name:'Cell-Shaded', icon:'flask', tint:'#ff5e6c' },
];
const BACKGROUNDS = [
  { id:'gradient', name:'Gradient' },
  { id:'beach', name:'Beach' },
  { id:'forest', name:'Forest' },
  { id:'space', name:'Space' },
  { id:'city', name:'City' },
  { id:'moon', name:'Moon' },
  { id:'party', name:'Party' },
  { id:'cozy', name:'Cozy Room' },
];

function StyleSelectScreen({ go }) {
  const [style, setStyle] = useS2('cartoon');
  const [bg, setBg] = useS2('forest');
  const [customStyle, setCustomStyle] = useS2('');
  const [customBg, setCustomBg] = useS2('');

  return (
    <div className="page-enter" style={{height:'100%', display:'flex', flexDirection:'column'}}>
      <ScreenHeader
        eyebrow={<><Icon name="sparkle" size={12}/> Final calibration</>}
        title="Set Lab Parameters"
        subtitle="These choices guide how the AI splices and renders your team's specimen."
        onBack={() => go('waiting')}
      />
      <div style={{flex:1, padding:'0 40px 32px', display:'flex', flexDirection:'column', gap: 20, overflowY:'auto'}}>

        <div className="panel" style={{padding: 24}}>
          <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom: 16}}>
            <h3 style={{fontSize: 20}}>Art Style</h3>
            <span style={{fontSize: 12, color:'var(--text-dim)', fontFamily:'var(--font-mono)'}}>SELECT 1</span>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap: 12}}>
            {ART_STYLES.map(s => {
              const sel = style === s.id;
              return (
                <button key={s.id} onClick={() => setStyle(s.id)} style={{
                  padding: 16, borderRadius: 16,
                  background: sel ? `linear-gradient(135deg, ${s.tint}30, ${s.tint}10)` : 'rgba(20,8,42,0.5)',
                  border: sel ? `1.5px solid ${s.tint}` : '1px solid var(--panel-border)',
                  boxShadow: sel ? `0 0 24px ${s.tint}40` : 'none',
                  display:'flex', flexDirection:'column', alignItems:'center', gap: 10,
                  transition:'all 0.18s', cursor:'pointer', position:'relative',
                }}>
                  {sel && (
                    <div style={{position:'absolute', top: 6, right: 6, width: 18, height: 18, borderRadius:'50%', background: s.tint, display:'flex', alignItems:'center', justifyContent:'center'}}>
                      <Icon name="check" size={11} color="#1a0d2e"/>
                    </div>
                  )}
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: `radial-gradient(circle at 30% 30%, ${s.tint}90, ${s.tint}40)`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                  }}>
                    <Icon name={s.icon} size={22} color="white"/>
                  </div>
                  <div style={{fontFamily:'var(--font-display)', fontSize: 13, fontWeight: 600}}>{s.name}</div>
                </button>
              );
            })}
          </div>
          <div style={{marginTop: 12, display:'flex', alignItems:'center', gap: 10}}>
            <span style={{fontSize: 12, color:'var(--text-dim)', fontFamily:'var(--font-mono)', letterSpacing:'0.1em'}}>OR</span>
            <input
              className="input"
              placeholder="Type your own style…  (e.g. claymation, vaporwave)"
              value={customStyle}
              onChange={e => setCustomStyle(e.target.value)}
              style={{flex:1, padding: '10px 14px', fontSize: 14}}
            />
          </div>
        </div>

        <div className="panel" style={{padding: 24}}>
          <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom: 16}}>
            <h3 style={{fontSize: 20}}>Background Scene</h3>
            <span style={{fontSize: 12, color:'var(--text-dim)', fontFamily:'var(--font-mono)'}}>SELECT 1</span>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(8, 1fr)', gap: 10}}>
            {BACKGROUNDS.map((b, i) => {
              const sel = bg === b.id;
              const grads = [
                'linear-gradient(135deg, #ff3d9a, #c8a6ff)',
                'linear-gradient(135deg, #3de7e4, #ffb43d)',
                'linear-gradient(135deg, #5dffaa, #3de7e4)',
                'linear-gradient(135deg, #14082a, #c8a6ff)',
                'linear-gradient(135deg, #ff5e6c, #ffb43d)',
                'linear-gradient(135deg, #c8a6ff, #1a0d2e)',
                'linear-gradient(135deg, #ff3d9a, #ffb43d)',
                'linear-gradient(135deg, #ff7ec0, #ffc966)',
              ];
              return (
                <button key={b.id} onClick={() => setBg(b.id)} style={{
                  padding: 8, borderRadius: 14,
                  background: sel ? 'rgba(255,255,255,0.06)' : 'rgba(20,8,42,0.4)',
                  border: sel ? `1.5px solid var(--magenta)` : '1px solid var(--panel-border)',
                  boxShadow: sel ? `0 0 20px rgba(255,61,154,0.3)` : 'none',
                  display:'flex', flexDirection:'column', gap: 6,
                  transition:'all 0.18s', cursor:'pointer',
                }}>
                  <div style={{
                    height: 50, borderRadius: 8,
                    background: grads[i],
                  }}/>
                  <div style={{fontFamily:'var(--font-display)', fontSize: 11, fontWeight: 600, textAlign:'center'}}>{b.name}</div>
                </button>
              );
            })}
          </div>
          <div style={{marginTop: 12, display:'flex', alignItems:'center', gap: 10}}>
            <span style={{fontSize: 12, color:'var(--text-dim)', fontFamily:'var(--font-mono)', letterSpacing:'0.1em'}}>OR</span>
            <input
              className="input"
              placeholder="Type your own scene…  (e.g. underwater nightclub)"
              value={customBg}
              onChange={e => setCustomBg(e.target.value)}
              style={{flex:1, padding: '10px 14px', fontSize: 14}}
            />
          </div>
        </div>

        <div style={{display:'flex', gap: 12, justifyContent:'space-between', alignItems:'center'}}>
          <div style={{fontSize: 12, color:'var(--text-dim)', display:'flex', alignItems:'center', gap:6}}>
            <Icon name="info" size={14}/> Other players are also calibrating their parameters.
          </div>
          <button className="btn btn-primary btn-lg" onClick={() => go('draw')}>
            Begin Creation <Icon name="sparkle" size={16}/>
          </button>
        </div>
      </div>
    </div>
  );
}

window.WaitingRoomScreen = WaitingRoomScreen;
window.StyleSelectScreen = StyleSelectScreen;
