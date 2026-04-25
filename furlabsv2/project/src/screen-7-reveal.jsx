/* global React, Icon, ScreenHeader, FursonaPart, FursonaFull, SpecimenAvatar */
const { useState: useS4, useEffect: useE4 } = React;

const fursonaList = [
  { id: 1, owner: 'Dr. Whiskers', seed: 0, aiReady: true },
  { id: 2, owner: 'Specimen.42', seed: 1, aiReady: true },
  { id: 3, owner: 'Lab-Foxglove', seed: 2, aiReady: false, generating: true },
  { id: 4, owner: 'Prof. Pawsworth', seed: 3, aiReady: false },
];

const partsByPlayer = {
  0: [
    { type:'head', artist:'Specimen.42' },
    { type:'torso', artist:'Lab-Foxglove' },
    { type:'legs', artist:'Prof. Pawsworth' },
  ],
  1: [
    { type:'head', artist:'Dr. Whiskers' },
    { type:'torso', artist:'Prof. Pawsworth' },
    { type:'legs', artist:'Glitch', quit: true },
  ],
  2: [
    { type:'head', artist:'Prof. Pawsworth' },
    { type:'torso', artist:'Dr. Whiskers' },
    { type:'legs', artist:'Specimen.42' },
  ],
  3: [
    { type:'head', artist:'Lab-Foxglove' },
    { type:'torso', artist:'Specimen.42' },
    { type:'legs', artist:'Dr. Whiskers' },
  ],
};

// Big reveal layout: vertical stack of 3 cards. Each card is "covered" until clicked.
function PartRevealCard({ part, artist, quit, seed, idx, autoUnlocked, onZoom }) {
  const [revealed, setRevealed] = useS4(false);

  useE4(() => {
    setRevealed(false);
  }, [seed]);

  useE4(() => {
    if (autoUnlocked) {
      const t = setTimeout(() => setRevealed(true), 200);
      return () => clearTimeout(t);
    }
  }, [autoUnlocked, seed]);

  const partColors = {
    head: '#ff3d9a',
    torso: '#3de7e4',
    legs: '#ffb43d',
  };
  const tint = partColors[part];

  return (
    <div style={{
      position:'relative',
      borderRadius: 22,
      padding: 20,
      background: revealed
        ? `linear-gradient(135deg, ${tint}12, rgba(20,8,42,0.6))`
        : 'rgba(20,8,42,0.7)',
      border: revealed ? `1.5px solid ${tint}55` : '1.5px solid var(--panel-border)',
      boxShadow: revealed ? `0 0 30px ${tint}25` : 'none',
      transition: 'all 0.4s ease',
    }}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 14}}>
        <div style={{display:'flex', alignItems:'center', gap: 10}}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: `${tint}25`, border: `1px solid ${tint}55`,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontFamily:'var(--font-mono)', fontSize: 13, fontWeight: 700, color: tint,
          }}>
            {idx + 1}
          </div>
          <div>
            <div style={{fontFamily:'var(--font-display)', fontSize: 18, fontWeight: 600, textTransform:'uppercase', letterSpacing:'0.05em', color: tint}}>
              {part}
            </div>
            <div style={{fontSize: 12, color:'var(--text-mute)', marginTop: 2}}>
              Drawn by <span style={{color: quit ? 'var(--text-dim)' : 'var(--gold)', fontWeight: 600}}>
                {artist}
              </span>
              {quit && <span className="badge badge-quit" style={{marginLeft: 8}}>(quit)</span>}
            </div>
          </div>
        </div>
        {revealed && (
          <button className="btn btn-secondary btn-sm" onClick={onZoom}>
            <Icon name="sparkle" size={13}/> Zoom in
          </button>
        )}
      </div>

      <div
        onClick={() => !revealed && setRevealed(true)}
        style={{
          position:'relative',
          borderRadius: 14,
          overflow:'hidden',
          cursor: revealed ? 'pointer' : 'pointer',
        }}
        onClickCapture={() => revealed && onZoom()}
      >
        <div style={{
          opacity: revealed ? 1 : 0,
          transform: revealed ? 'scale(1)' : 'scale(0.96)',
          transition: 'all 0.6s cubic-bezier(.18,.89,.32,1.28)',
          filter: revealed ? 'none' : 'blur(20px)',
        }}>
          <FursonaPart part={part} seed={seed} size={'100%'} />
        </div>

        {!revealed && (
          <div style={{
            position:'absolute', inset: 0,
            background: `radial-gradient(circle at 50% 50%, ${tint}25, rgba(20,8,42,0.95))`,
            border: `1.5px dashed ${tint}66`,
            borderRadius: 14,
            display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap: 10,
            backdropFilter: 'blur(8px)',
          }}>
            <div style={{
              width: 64, height: 64, borderRadius:'50%',
              background: `radial-gradient(circle at 35% 30%, ${tint}, ${tint}66)`,
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow: `0 0 30px ${tint}80`,
              animation: 'pulse 1.6s ease-in-out infinite',
            }}>
              <Icon name="flask" size={28} color="white"/>
            </div>
            <div style={{fontFamily:'var(--font-display)', fontWeight: 600, fontSize: 16, color: tint}}>
              Click to Reveal
            </div>
            <div style={{fontFamily:'var(--font-mono)', fontSize: 10, color:'var(--text-dim)', letterSpacing:'0.15em'}}>
              SAMPLE-{String(idx+1).padStart(2,'0')}-LOCKED
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Full-body reveal card (raw or AI)
function FullRevealCard({ kind, seed, autoUnlocked, onZoom, push }) {
  const [revealed, setRevealed] = useS4(false);
  useE4(() => { setRevealed(false); }, [seed, kind]);
  useE4(() => {
    if (autoUnlocked) {
      const t = setTimeout(() => setRevealed(true), kind === 'ai' ? 700 : 350);
      return () => clearTimeout(t);
    }
  }, [autoUnlocked, seed, kind]);

  const isAI = kind === 'ai';
  const tint = isAI ? '#ff3d9a' : '#3de7e4';

  return (
    <div style={{
      padding: 18, borderRadius: 22,
      display:'flex', flexDirection:'column', gap: 12,
      background: revealed
        ? (isAI
            ? 'linear-gradient(135deg, rgba(255,61,154,0.1), rgba(200,166,255,0.08))'
            : 'rgba(20,8,42,0.5)')
        : 'rgba(20,8,42,0.7)',
      border: revealed
        ? (isAI ? '1.5px solid rgba(255,61,154,0.35)' : '1px solid var(--panel-border)')
        : '1.5px solid var(--panel-border)',
      boxShadow: revealed && isAI ? '0 0 30px rgba(255,61,154,0.15)' : 'none',
      transition: 'all 0.4s ease',
    }}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div>
          <div className="eyebrow" style={{color: isAI ? 'var(--magenta)' : 'var(--cyan)'}}>
            <Icon name={isAI ? 'sparkle' : 'brush'} size={11}/>
            {isAI ? '✦ The Lab ✦' : 'Raw stitched'}
          </div>
          <div style={{fontFamily:'var(--font-display)', fontWeight: 600, marginTop: 4, fontSize: 16}}>
            {isAI ? 'Lab Enhancement' : 'The Original'}
          </div>
        </div>
        {revealed && (
          <button className="btn btn-secondary btn-sm" onClick={onZoom}>
            <Icon name="sparkle" size={13}/> Zoom
          </button>
        )}
      </div>

      <div
        onClick={() => !revealed ? setRevealed(true) : onZoom()}
        style={{
          position:'relative', borderRadius: 14, overflow:'hidden',
          cursor:'pointer',
          minHeight: 240,
          display:'flex', alignItems:'center', justifyContent:'center',
        }}
      >
        <div style={{
          opacity: revealed ? 1 : 0,
          transform: revealed ? 'scale(1)' : 'scale(0.94)',
          filter: revealed ? 'none' : 'blur(20px)',
          transition: 'all 0.7s cubic-bezier(.18,.89,.32,1.28)',
        }}>
          <FursonaFull seed={seed} ai={isAI} size={220}/>
        </div>

        {!revealed && (
          <div style={{
            position:'absolute', inset: 0,
            background: `radial-gradient(circle at 50% 50%, ${tint}25, rgba(20,8,42,0.95))`,
            border: `1.5px dashed ${tint}66`,
            borderRadius: 14,
            display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap: 12,
            backdropFilter:'blur(8px)',
          }}>
            <div style={{
              width: 72, height: 72, borderRadius:'50%',
              background: `radial-gradient(circle at 35% 30%, ${tint}, ${tint}66)`,
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow: `0 0 30px ${tint}80`,
              animation: 'pulse 1.6s ease-in-out infinite',
            }}>
              <Icon name={isAI ? 'sparkle' : 'flask'} size={32} color="white"/>
            </div>
            <div style={{fontFamily:'var(--font-display)', fontWeight: 600, fontSize: 17, color: tint}}>
              {isAI ? 'Reveal Lab Enhancement' : 'Reveal Final Specimen'}
            </div>
            <div style={{fontFamily:'var(--font-mono)', fontSize: 10, color:'var(--text-dim)', letterSpacing:'0.15em'}}>
              {isAI ? 'AI-SPLICED · LOCKED' : 'RAW-STITCHED · LOCKED'}
            </div>
          </div>
        )}
      </div>

      {revealed && isAI && (
        <>
          <div style={{
            padding: '10px 14px',
            background: 'rgba(20,8,42,0.5)', borderRadius: 12,
            fontSize: 11, fontFamily:'var(--font-mono)', color:'var(--text-mute)',
            display:'flex', justifyContent:'space-between',
          }}>
            <span>STYLE: <span style={{color:'var(--cyan)'}}>CARTOON</span></span>
            <span>BG: <span style={{color:'var(--cyan)'}}>FOREST</span></span>
          </div>
          <div style={{display:'flex', gap: 8}}>
            <button className="btn btn-secondary btn-sm" style={{flex:1}} onClick={(e) => { e.stopPropagation(); push('success', 'Drawing saved'); }}>
              <Icon name="download" size={13}/> Raw
            </button>
            <button className="btn btn-primary btn-sm" style={{flex:1}} onClick={(e) => { e.stopPropagation(); push('success', 'Saved both versions'); }}>
              <Icon name="download" size={13}/> Save Both
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function RevealScreen({ go, push }) {
  const [active, setActive] = useS4(0);
  const [autoReveal, setAutoReveal] = useS4(false);
  const [zoom, setZoom] = useS4(null); // {part, artist, seed} or null
  const fursona = fursonaList[active];
  const parts = partsByPlayer[active] || partsByPlayer[0];

  useE4(() => {
    setAutoReveal(false);
  }, [active]);

  const revealAll = () => setAutoReveal(true);

  return (
    <div className="page-enter" style={{height:'100%', display:'flex', flexDirection:'column'}}>
      <div style={{
        padding: '24px 36px', display:'flex', alignItems:'center', justifyContent:'space-between',
        borderBottom: '1px solid var(--panel-border)', flexWrap:'wrap', gap: 16,
      }}>
        <div style={{display:'flex', alignItems:'center', gap: 18}}>
          <button className="btn-icon" onClick={() => go('title')} aria-label="Home">
            <Icon name="arrow-left" size={18}/>
          </button>
          <div>
            <div className="eyebrow" style={{marginBottom: 6}}><Icon name="sparkle" size={11}/> Lab Results · Specimen {String(active+1).padStart(2,'0')} of {fursonaList.length}</div>
            <div style={{fontSize: 30, fontFamily:'var(--font-display)', fontWeight: 600, lineHeight: 1.1}}>
              {fursona.owner}'s Specimen
            </div>
          </div>
        </div>
        <div style={{display:'flex', alignItems:'center', gap: 10}}>
          <button className="btn btn-secondary btn-sm" onClick={revealAll}>
            <Icon name="sparkle" size={13}/> Reveal all
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => go('title')}>
            <Icon name="play" size={13}/> New Experiment
          </button>
        </div>
      </div>

      <div style={{flex:1, display:'grid', gridTemplateColumns:'260px 1fr 1fr', gap: 0, overflow:'hidden'}}>
        {/* Sidebar - all fursonas */}
        <div style={{padding: 22, borderRight:'1px solid var(--panel-border)', display:'flex', flexDirection:'column', gap: 10, overflowY:'auto'}}>
          <div className="eyebrow"><Icon name="dna" size={11}/> Specimens</div>
          {fursonaList.map((f, i) => (
            <button key={f.id} onClick={() => setActive(i)} style={{
              padding: 12, borderRadius: 14,
              background: active === i ? 'linear-gradient(135deg, rgba(255,61,154,0.15), rgba(61,231,228,0.1))' : 'rgba(255,255,255,0.03)',
              border: active === i ? '1.5px solid var(--magenta)' : '1px solid var(--panel-border)',
              boxShadow: active === i ? '0 0 16px rgba(255,61,154,0.25)' : 'none',
              display:'flex', alignItems:'center', gap: 12, cursor:'pointer',
              textAlign:'left', transition:'all 0.18s',
            }}>
              <SpecimenAvatar seed={f.seed} size={42}/>
              <div style={{flex:1, minWidth: 0}}>
                <div style={{fontSize: 14, fontWeight: 600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{f.owner}</div>
                <div style={{fontSize: 11, color: f.aiReady ? 'var(--green)' : f.generating ? 'var(--gold)' : 'var(--text-dim)', marginTop: 3, display:'flex', alignItems:'center', gap: 4}}>
                  {f.aiReady && (<><Icon name="check" size={10}/> Lab complete</>)}
                  {!f.aiReady && f.generating && (<><span className="dot" style={{width:6, height:6, background:'var(--gold)', boxShadow:'0 0 6px var(--gold)', animation:'pulse 1.2s ease-in-out infinite'}}/> Generating…</>)}
                  {!f.aiReady && !f.generating && <span>Pending</span>}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Middle column: Sequential reveals (each part its own card) */}
        <div style={{overflowY:'auto', padding: '24px 28px', display:'flex', flexDirection:'column', gap: 14}}>
          <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between'}}>
            <h3 style={{fontSize: 20}}>Specimen components</h3>
            <span style={{fontSize: 11, color:'var(--text-dim)', fontFamily:'var(--font-mono)'}}>3 PARTS · CLICK TO UNLOCK</span>
          </div>
          {parts.map((p, i) => (
            <PartRevealCard
              key={`${active}-${i}`}
              idx={i}
              part={p.type}
              artist={p.artist}
              quit={p.quit}
              seed={fursona.seed*7 + i*3}
              autoUnlocked={autoReveal}
              onZoom={() => setZoom({ ...p, seed: fursona.seed*7 + i*3 })}
            />
          ))}
        </div>

        {/* Right column: Combined + AI Lab */}
        <div style={{overflowY:'auto', padding: '24px 28px', borderLeft:'1px solid var(--panel-border)', display:'flex', flexDirection:'column', gap: 18}}>
          <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between'}}>
            <h3 style={{fontSize: 20}}>Final specimen</h3>
            <span style={{fontSize: 11, color:'var(--text-dim)', fontFamily:'var(--font-mono)'}}>STITCHED & ENHANCED</span>
          </div>

          {/* Raw stitched - click to reveal */}
          <FullRevealCard
            key={`raw-${active}`}
            kind="raw"
            seed={fursona.seed}
            autoUnlocked={autoReveal}
            onZoom={() => setZoom({ kind:'raw', seed: fursona.seed })}
            push={push}
          />

          {/* AI lab */}
          {fursona.aiReady ? (
            <FullRevealCard
              key={`ai-${active}`}
              kind="ai"
              seed={fursona.seed}
              autoUnlocked={autoReveal}
              onZoom={() => setZoom({ kind:'ai', seed: fursona.seed })}
              push={push}
            />
          ) : (
            <div style={{display:'none'}}/>
          )}
          {!fursona.aiReady && (
            <div className="panel" style={{
              padding: 18, display:'flex', flexDirection:'column', gap: 14,
              background: 'rgba(20,8,42,0.5)',
              border: '1.5px dashed rgba(255,61,154,0.3)',
            }}>
              <div className="eyebrow" style={{color:'var(--magenta)'}}><Icon name="sparkle" size={11}/> ✦ The Lab ✦</div>
              <div style={{display:'flex', justifyContent:'center', alignItems:'center', minHeight: 220, flexDirection:'column', gap: 14}}>
                <div style={{
                  width: 64, height: 64, borderRadius:'50%',
                  border: '3px solid var(--magenta)', borderRightColor:'transparent',
                  animation: 'spin 1.2s linear infinite',
                }}/>
                <div style={{textAlign:'center'}}>
                  <div style={{fontFamily:'var(--font-display)', fontWeight:600, color:'var(--magenta)', fontSize: 16}}>Creating in the Lab…</div>
                  <div style={{fontSize: 11, color:'var(--text-dim)', marginTop: 4, fontFamily:'var(--font-mono)'}}>
                    Splicing genome · Rendering style
                  </div>
                </div>
              </div>
              <button className="btn btn-secondary btn-sm">
                <Icon name="sparkle" size={13}/> Generate in Lab!
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Zoom modal */}
      {zoom && <ZoomModal zoom={zoom} fursona={fursona} onClose={() => setZoom(null)}/>}
    </div>
  );
}

function ZoomModal({ zoom, fursona, onClose }) {
  return (
    <div onClick={onClose} style={{
      position:'absolute', inset: 0, zIndex: 80,
      background: 'rgba(10,4,24,0.85)',
      backdropFilter: 'blur(16px)',
      display:'flex', alignItems:'center', justifyContent:'center', padding: 32,
      animation: 'page-in 0.25s ease',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        position:'relative',
        background: 'var(--panel-strong)',
        border: '1px solid var(--panel-border-strong)',
        borderRadius: 24, padding: 32,
        maxWidth: zoom.type ? 720 : 880, width:'100%',
        maxHeight: '90vh',
        display:'flex', flexDirection:'column', alignItems:'center', gap: 20,
        boxShadow:'0 30px 80px rgba(0,0,0,0.6)',
      }}>
        <button onClick={onClose} className="btn-icon" style={{position:'absolute', top: 14, right: 14, zIndex: 10}}>
          <Icon name="x" size={18}/>
        </button>

        <div style={{textAlign:'center'}}>
          {zoom.type ? (
            <>
              <div className="eyebrow" style={{justifyContent:'center'}}>
                <Icon name="brush" size={11}/> Component zoom
              </div>
              <div style={{fontFamily:'var(--font-display)', fontSize: 28, fontWeight: 600, marginTop: 6, textTransform:'uppercase', letterSpacing:'0.04em'}}>
                {fursona.owner}'s {zoom.type}
              </div>
              <div style={{fontSize: 13, color:'var(--text-mute)', marginTop: 4}}>
                Drawn by <span style={{color:'var(--gold)', fontWeight: 600}}>{zoom.artist}</span>
                {zoom.quit && <span className="badge badge-quit" style={{marginLeft: 8}}>(quit)</span>}
              </div>
            </>
          ) : (
            <>
              <div className="eyebrow" style={{justifyContent:'center', color: zoom.kind === 'ai' ? 'var(--magenta)' : 'var(--cyan)'}}>
                <Icon name={zoom.kind === 'ai' ? 'sparkle' : 'brush'} size={11}/>
                {zoom.kind === 'ai' ? '✦ Lab Enhancement ✦' : 'Raw stitched'}
              </div>
              <div style={{fontFamily:'var(--font-display)', fontSize: 28, fontWeight: 600, marginTop: 6}}>
                {fursona.owner}'s Specimen
              </div>
            </>
          )}
        </div>

        <div style={{flex: 1, display:'flex', alignItems:'center', justifyContent:'center', minHeight: 0}}>
          {zoom.type
            ? <div style={{width: 600, maxWidth:'100%'}}><FursonaPart part={zoom.type} seed={zoom.seed} size={'100%'}/></div>
            : <FursonaFull seed={zoom.seed} ai={zoom.kind === 'ai'} size={360}/>
          }
        </div>

        <div style={{display:'flex', gap: 10}}>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Close</button>
          <button className="btn btn-primary btn-sm">
            <Icon name="download" size={14}/> Download
          </button>
        </div>
      </div>
    </div>
  );
}

window.RevealScreen = RevealScreen;
