/* global React, Icon, ScreenHeader, SpecimenAvatar */
const { useState: useS3, useEffect: useE3, useRef: useR3 } = React;

const drawPlayers = [
  { id: 1, name: 'Dr. Whiskers', seed: 0, status: 'submitted' },
  { id: 2, name: 'Specimen.42', seed: 1, status: 'drawing' },
  { id: 3, name: 'Lab-Foxglove', seed: 2, status: 'submitted' },
  { id: 4, name: 'Prof. Pawsworth', seed: 3, status: 'drawing' },
  { id: 5, name: 'Glitch', seed: 4, status: 'quit' },
];

const PRESET_COLORS = [
  '#000000','#ffffff','#9ca3af','#525f7f',
  '#ff3d9a','#ff5e6c','#ffb43d','#ffc857',
  '#5dffaa','#3de7e4','#c8a6ff','#a78bfa',
  '#8b4513','#a0522d','#d2b48c','#ffe4b5',
  '#fef3c7','#fdba74','#fb7185','#f0abfc',
];

function DrawScreen({ go, push }) {
  const [tool, setTool] = useS3('brush');
  const [color, setColor] = useS3('#ff3d9a');
  const [size, setSize] = useS3(8);
  const [submitted, setSubmitted] = useS3(false);
  const [time, setTime] = useS3(82);
  const [paths, setPaths] = useS3([]);
  const [drawing, setDrawing] = useS3(false);
  const svgRef = useR3(null);

  useE3(() => {
    if (submitted) return;
    const t = setInterval(() => setTime(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [submitted]);

  const timerColor = time <= 10 ? 'var(--coral)' : time <= 30 ? 'var(--amber)' : 'var(--cyan)';
  const timerPulse = time <= 10 ? 'pulse 0.6s ease-in-out infinite' : 'none';

  const startStroke = (e) => {
    if (submitted) return;
    const pt = getPt(e);
    setDrawing(true);
    setPaths(p => [...p, { color: tool === 'eraser' ? '#1a0d2e' : color, size, points: [pt] }]);
  };
  const moveStroke = (e) => {
    if (!drawing || submitted) return;
    const pt = getPt(e);
    setPaths(p => {
      const cp = [...p];
      cp[cp.length-1] = { ...cp[cp.length-1], points: [...cp[cp.length-1].points, pt] };
      return cp;
    });
  };
  const endStroke = () => setDrawing(false);
  const getPt = (e) => {
    const r = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 800;
    const y = ((e.clientY - r.top) / r.height) * 400;
    return [x, y];
  };
  const undo = () => setPaths(p => p.slice(0, -1));
  const clear = () => setPaths([]);

  return (
    <div className="page-enter" style={{height:'100%', display:'flex', flexDirection:'column'}}>
      {/* Top bar */}
      <div style={{
        padding: '20px 32px', display:'flex', alignItems:'center', justifyContent:'space-between',
        borderBottom: '1px solid var(--panel-border)', gap: 16,
      }}>
        <div style={{display:'flex', alignItems:'center', gap: 16}}>
          <div className="badge badge-cyan"><Icon name="dna" size={11}/> ROUND 2 / 3</div>
          <div>
            <div style={{fontFamily:'var(--font-display)', fontSize: 22, fontWeight: 600, lineHeight: 1.1}}>
              Draw the <span style={{color:'var(--magenta)', textTransform:'uppercase'}}>Torso</span>
            </div>
            <div style={{fontSize: 12, color:'var(--text-mute)', marginTop: 4}}>
              For <span style={{color:'var(--gold)', fontWeight: 600}}>Lab-Foxglove</span>'s specimen · Stay within the canvas
            </div>
          </div>
        </div>

        <div style={{display:'flex', alignItems:'center', gap: 18}}>
          {/* Lab timer */}
          <div style={{
            display:'flex', alignItems:'center', gap: 14,
            padding: '8px 18px',
            background: 'rgba(20,8,42,0.7)',
            border: `1.5px solid ${timerColor}`,
            borderRadius: 14,
            boxShadow: `0 0 20px ${timerColor}40`,
            animation: timerPulse,
          }}>
            <Icon name="clock" size={16} color={timerColor}/>
            <span className="mono" style={{fontSize: 28, fontWeight: 700, color: timerColor, lineHeight: 1, fontVariantNumeric:'tabular-nums'}}>
              {String(Math.floor(time/60)).padStart(2,'0')}:{String(time%60).padStart(2,'0')}
            </span>
          </div>
        </div>
      </div>

      <div style={{flex:1, display:'grid', gridTemplateColumns:'220px 1fr 280px', overflow:'hidden'}}>
        {/* Player sidebar */}
        <div style={{
          padding: 20, borderRight:'1px solid var(--panel-border)',
          display:'flex', flexDirection:'column', gap: 14, overflowY:'auto',
        }}>
          <div className="eyebrow"><Icon name="user" size={11}/> Participants</div>
          {drawPlayers.map(p => (
            <div key={p.id} style={{
              display:'flex', alignItems:'center', gap: 10,
              padding: 10, borderRadius: 12,
              background: p.status === 'submitted' ? 'rgba(93,255,170,0.08)' : 'rgba(255,255,255,0.03)',
              border: '1px solid ' + (p.status === 'submitted' ? 'rgba(93,255,170,0.3)' : 'var(--panel-border)'),
              opacity: p.status === 'quit' ? 0.4 : 1,
            }}>
              <SpecimenAvatar seed={p.seed} size={32}/>
              <div style={{flex:1, minWidth: 0}}>
                <div style={{fontSize: 13, fontWeight: 600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{p.name}</div>
                <div style={{fontSize: 10, color:'var(--text-dim)', marginTop: 2, display:'flex', alignItems:'center', gap: 4}}>
                  {p.status === 'submitted' && (<><Icon name="check" size={10} color="var(--green)"/> <span style={{color:'var(--green)'}}>Sample collected</span></>)}
                  {p.status === 'drawing' && (<><span className="dot dot-magenta" style={{width: 6, height: 6}}/> In progress…</>)}
                  {p.status === 'quit' && <span>(quit)</span>}
                </div>
              </div>
            </div>
          ))}
          <div style={{
            marginTop: 8, padding: 12, borderRadius: 12,
            background: 'rgba(61,231,228,0.05)', border: '1px dashed rgba(61,231,228,0.25)',
            display:'flex', alignItems:'center', gap: 10, fontSize: 11, color:'var(--text-mute)',
          }}>
            <div style={{
              width: 18, height: 18, borderRadius:'50%',
              border: '2px solid var(--cyan)', borderRightColor:'transparent',
              animation: 'spin 0.8s linear infinite',
            }}/>
            Awaiting submissions…
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>

        {/* Canvas */}
        <div style={{padding: 24, display:'flex', flexDirection:'column', gap: 16, alignItems:'center', overflow:'auto'}}>
          <div style={{position:'relative', width:'100%', maxWidth: 720}}>
            {/* Hint zone top - shows previous artist's edge */}
            <div style={{
              fontSize: 10, color:'var(--text-dim)', fontFamily:'var(--font-mono)',
              letterSpacing:'0.15em', marginBottom: 6, display:'flex', justifyContent:'space-between',
            }}>
              <span>↑ HEAD CONTINUATION (previous artist)</span>
              <span>800 × 400</span>
            </div>
            <div style={{
              position:'relative',
              borderRadius: 14,
              overflow:'hidden',
              background:
                'repeating-linear-gradient(45deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 8px, transparent 8px, transparent 16px), #0e051f',
              border: '1.5px solid rgba(61,231,228,0.3)',
              boxShadow: '0 10px 40px rgba(0,0,0,0.4), inset 0 0 60px rgba(61,231,228,0.04)',
              aspectRatio: '2/1',
              cursor: tool === 'brush' ? 'crosshair' : tool === 'eraser' ? 'cell' : 'pointer',
            }}>
              {/* Top hint - previous edge sample */}
              <div style={{position:'absolute', top: 0, left: 0, right: 0, height: 30,
                background:'linear-gradient(180deg, rgba(255,61,154,0.2), transparent)',
                pointerEvents:'none', zIndex: 1,
              }}>
                <svg viewBox="0 0 800 30" style={{width:'100%', height:'100%'}}>
                  <path d="M340 0 Q380 25 400 30 Q420 25 460 0" fill="#ff3d9a" opacity="0.6"/>
                </svg>
              </div>
              <svg
                ref={svgRef}
                viewBox="0 0 800 400"
                style={{width:'100%', height:'100%', display:'block'}}
                onMouseDown={startStroke}
                onMouseMove={moveStroke}
                onMouseUp={endStroke}
                onMouseLeave={endStroke}
              >
                {paths.map((path, i) => (
                  <polyline
                    key={i}
                    points={path.points.map(p => p.join(',')).join(' ')}
                    stroke={path.color}
                    strokeWidth={path.size}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ))}
              </svg>
              {/* Bottom hint zone - dashed */}
              <div style={{
                position:'absolute', bottom: 0, left: 0, right: 0, height: 50,
                borderTop: '1.5px dashed rgba(255,180,61,0.45)',
                background: 'linear-gradient(0deg, rgba(255,180,61,0.08), transparent)',
                pointerEvents:'none', zIndex: 1,
                display:'flex', alignItems:'flex-end', padding: '0 12px 6px',
              }}>
                <span style={{fontSize: 10, color:'var(--gold)', fontFamily:'var(--font-mono)', letterSpacing:'0.15em', opacity: 0.85}}>
                  ↓ HINT ZONE — DRAW HERE FOR NEXT ARTIST
                </span>
              </div>
            </div>
            <div style={{fontSize: 10, color:'var(--text-dim)', fontFamily:'var(--font-mono)', letterSpacing:'0.15em', marginTop: 6}}>
              ↓ LEGS HANDOFF (next artist)
            </div>
          </div>
        </div>

        {/* Tool palette */}
        <div style={{
          padding: 20, borderLeft:'1px solid var(--panel-border)',
          display:'flex', flexDirection:'column', gap: 18, overflowY:'auto',
        }}>
          <div>
            <div className="eyebrow" style={{marginBottom: 10}}><Icon name="brush" size={11}/> Tools</div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 6}}>
              {[
                {id:'brush', icon:'brush', label:'Brush'},
                {id:'eraser', icon:'eraser', label:'Eraser'},
                {id:'fill', icon:'bucket', label:'Fill'},
                {id:'pick', icon:'pipette', label:'Pick'},
              ].map(t => (
                <button key={t.id} onClick={() => setTool(t.id)} className={'btn-icon ' + (tool === t.id ? 'active':'')} title={t.label} style={{height: 44, width:'auto'}}>
                  <Icon name={t.icon} size={18}/>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="eyebrow" style={{marginBottom: 10}}><Icon name="palette" size={11}/> Color</div>
            <div style={{display:'flex', alignItems:'center', gap: 10, marginBottom: 10}}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: color,
                border: '2px solid rgba(255,255,255,0.2)',
                boxShadow: `0 0 16px ${color}60`,
              }}/>
              <input
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                style={{
                  flex: 1, height: 44, border: 'none', borderRadius: 12,
                  background: 'rgba(255,255,255,0.05)', cursor: 'pointer',
                }}
              />
            </div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap: 4}}>
              {PRESET_COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)} style={{
                  aspectRatio:'1', borderRadius: 8, background: c,
                  border: color === c ? '2px solid white' : '1px solid rgba(255,255,255,0.1)',
                  cursor:'pointer',
                  boxShadow: color === c ? `0 0 12px ${c}` : 'none',
                }}/>
              ))}
            </div>
          </div>

          <div>
            <div className="eyebrow" style={{marginBottom: 10}}><span>● </span>Brush size</div>
            <div style={{display:'flex', alignItems:'center', gap: 12}}>
              <input
                type="range"
                min="1" max="40" value={size}
                onChange={e => setSize(parseInt(e.target.value))}
                style={{flex: 1, accentColor: 'var(--magenta)'}}
              />
              <div style={{
                width: 44, height: 44, display:'flex', alignItems:'center', justifyContent:'center',
                borderRadius: 12, background: 'rgba(20,8,42,0.6)', border: '1px solid var(--panel-border)',
              }}>
                <div style={{
                  width: Math.min(size, 30), height: Math.min(size, 30), borderRadius:'50%',
                  background: color,
                }}/>
              </div>
            </div>
            <div style={{fontFamily:'var(--font-mono)', fontSize: 11, color:'var(--text-dim)', textAlign:'right', marginTop: 4}}>
              {size}px
            </div>
          </div>

          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap: 8}}>
            <button className="btn btn-secondary btn-sm" onClick={undo} disabled={!paths.length}>
              <Icon name="undo" size={14}/> Undo
            </button>
            <button className="btn btn-danger btn-sm" onClick={clear} disabled={!paths.length}>
              <Icon name="trash" size={14}/> Clear
            </button>
          </div>

          <div style={{flex: 1}}/>

          <button
            className={submitted ? 'btn btn-secondary' : 'btn btn-primary'}
            onClick={() => { setSubmitted(true); push('success', 'Sample collected!'); setTimeout(() => go('reveal'), 1100); }}
            disabled={submitted}
            style={{justifyContent:'center', padding: '16px 20px'}}
          >
            {submitted ? (<><Icon name="check" size={16}/> Sample submitted</>) : (<><Icon name="sparkle" size={16}/> Submit Sample</>)}
          </button>
        </div>
      </div>
    </div>
  );
}

window.DrawScreen = DrawScreen;
