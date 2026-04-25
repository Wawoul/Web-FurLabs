/* global React, Icon, ScreenHeader, FursonaFull */
const { useState: useS5 } = React;

const galleryItems = Array.from({length: 24}).map((_, i) => ({
  id: i,
  seed: i,
  owner: ['Dr. Whiskers','Specimen.42','Lab-Foxglove','Prof. Pawsworth','Glitch','Helix','Vex','Nyx'][i % 8],
  date: ['2 days ago','1 week ago','3 weeks ago','Today','Yesterday','5 days ago'][i % 6],
  ai: i % 3 !== 1,
}));

function GalleryScreen({ go }) {
  const [page, setPage] = useS5(0);
  const [detail, setDetail] = useS5(null);
  const perPage = 12;
  const total = galleryItems.length;
  const slice = galleryItems.slice(page*perPage, page*perPage+perPage);

  return (
    <div className="page-enter" style={{height:'100%', display:'flex', flexDirection:'column'}}>
      <ScreenHeader
        eyebrow={<><Icon name="gallery" size={12}/> {total} specimens archived</>}
        title="Specimen Archive"
        subtitle="Every successful experiment, preserved."
        onBack={() => go('title')}
      />
      <div style={{flex:1, padding:'0 40px 24px', overflowY:'auto'}}>
        <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 16}}>
          {slice.map(item => (
            <button key={item.id} onClick={() => setDetail(item)} style={{
              padding: 0, background:'transparent', border:'none', cursor:'pointer',
              borderRadius: 18, overflow:'hidden',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0) scale(1)'}
            >
              <div className="panel" style={{padding: 14, display:'flex', flexDirection:'column', gap: 12, alignItems:'center'}}>
                <FursonaFull seed={item.seed} ai={item.ai} size={'100%'}/>
                <div style={{width:'100%', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <div style={{textAlign:'left'}}>
                    <div style={{fontFamily:'var(--font-display)', fontWeight: 600, fontSize: 14}}>{item.owner}</div>
                    <div style={{fontSize: 11, color:'var(--text-dim)', marginTop: 2}}>{item.date}</div>
                  </div>
                  {item.ai
                    ? <span className="badge badge-magenta"><Icon name="sparkle" size={10}/> Lab</span>
                    : <span className="badge badge-cyan">Raw</span>}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Pagination */}
      <div style={{
        padding: '16px 40px', borderTop:'1px solid var(--panel-border)',
        display:'flex', alignItems:'center', justifyContent:'space-between',
      }}>
        <span style={{fontSize: 12, color:'var(--text-dim)', fontFamily:'var(--font-mono)'}}>
          PAGE {page+1} OF {Math.ceil(total/perPage)} · {total} TOTAL
        </span>
        <div style={{display:'flex', gap: 8}}>
          <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => Math.max(0, p-1))} disabled={page === 0}>
            <Icon name="arrow-left" size={14}/> Previous
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => Math.min(Math.ceil(total/perPage)-1, p+1))} disabled={page === Math.ceil(total/perPage)-1}>
            Next <Icon name="arrow-right" size={14}/>
          </button>
        </div>
      </div>

      {detail && <DetailModal item={detail} onClose={() => setDetail(null)}/>}
    </div>
  );
}

function DetailModal({ item, onClose }) {
  const [tab, setTab] = useS5('lab');
  return (
    <div style={{
      position:'absolute', inset: 0, zIndex: 50,
      background: 'rgba(10, 4, 24, 0.78)',
      backdropFilter: 'blur(12px)',
      display:'flex', alignItems:'center', justifyContent:'center',
      padding: 32,
      animation: 'page-in 0.25s ease',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        position:'relative',
        background: 'var(--panel-strong)',
        border:'1px solid var(--panel-border-strong)',
        borderRadius: 24,
        padding: 32,
        maxWidth: 720, width:'100%',
        display:'flex', gap: 28,
        boxShadow:'0 30px 80px rgba(0,0,0,0.6)',
      }}>
        <button onClick={onClose} className="btn-icon" style={{position:'absolute', top: 12, right: 12, zIndex: 10}}>
          <Icon name="x" size={18}/>
        </button>

        <div style={{flexShrink: 0}}>
          <FursonaFull seed={item.seed} ai={tab === 'lab'} size={260}/>
        </div>
        <div style={{flex:1, display:'flex', flexDirection:'column', gap: 16}}>
          <div>
            <div className="eyebrow"><Icon name="dna" size={11}/> Specimen #{String(item.id).padStart(3,'0')}</div>
            <h2 style={{fontSize: 28, marginTop: 6}}>{item.owner}</h2>
            <div style={{fontSize: 13, color:'var(--text-mute)', marginTop: 4}}>Archived {item.date}</div>
          </div>

          <div style={{display:'flex', background:'rgba(20,8,42,0.6)', borderRadius: 12, padding: 4, gap: 4}}>
            {[
              {id:'raw', label:'Raw', icon:'brush'},
              {id:'lab', label:'Lab Version', icon:'sparkle'},
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                flex:1, padding:'10px', borderRadius: 8,
                background: tab === t.id ? 'linear-gradient(135deg, var(--magenta), var(--cyan))' : 'transparent',
                color: tab === t.id ? 'white' : 'var(--text-mute)',
                fontSize: 13, fontWeight: 600, fontFamily:'var(--font-display)',
                display:'inline-flex', alignItems:'center', justifyContent:'center', gap: 6,
                cursor:'pointer', border:'none',
              }}>
                <Icon name={t.icon} size={14}/> {t.label}
              </button>
            ))}
          </div>

          <div style={{
            padding: 14, borderRadius: 12,
            background: 'rgba(20,8,42,0.5)', border: '1px solid var(--panel-border)',
            display:'grid', gridTemplateColumns:'1fr 1fr', gap: 10,
            fontSize: 12, fontFamily:'var(--font-mono)',
          }}>
            <div><span style={{color:'var(--text-dim)'}}>STYLE</span><br/><span style={{color:'var(--cyan)'}}>CARTOON</span></div>
            <div><span style={{color:'var(--text-dim)'}}>BACKGROUND</span><br/><span style={{color:'var(--cyan)'}}>FOREST</span></div>
            <div><span style={{color:'var(--text-dim)'}}>HEAD BY</span><br/><span style={{color:'var(--gold)'}}>Specimen.42</span></div>
            <div><span style={{color:'var(--text-dim)'}}>TORSO BY</span><br/><span style={{color:'var(--gold)'}}>Lab-Foxglove</span></div>
          </div>

          <div style={{flex: 1}}/>
          <button className="btn btn-primary">
            <Icon name="download" size={14}/> Download {tab === 'lab' ? 'Lab Version' : 'Raw'}
          </button>
        </div>
      </div>
    </div>
  );
}

window.GalleryScreen = GalleryScreen;
