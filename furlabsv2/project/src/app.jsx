/* global React, ReactDOM, Ambient, ToastStack, useToasts, Icon, Logo,
   TitleScreen, CreateLobbyScreen, JoinLobbyScreen, WaitingRoomScreen,
   StyleSelectScreen, DrawScreen, RevealScreen, GalleryScreen */

const { useState: useSA, useEffect: useEA } = React;

const SCREENS = [
  { id:'title', label:'01 · Title' },
  { id:'create', label:'02 · Create Lobby' },
  { id:'join', label:'03 · Join Lobby' },
  { id:'waiting', label:'04 · Waiting Room' },
  { id:'style', label:'05 · Style Selection' },
  { id:'draw', label:'06 · Drawing' },
  { id:'reveal', label:'07 · Reveal' },
  { id:'gallery', label:'08 · Gallery' },
];

function App() {
  const [screen, setScreen] = useSA('title');
  const [device, setDevice] = useSA('desktop');
  const [navOpen, setNavOpen] = useSA(false);
  const { items, push } = useToasts();

  // Welcome toast on first load
  useEA(() => {
    setTimeout(() => push('info', 'Welcome to Fur-Labs · use ⌘ to skip ahead'), 800);
  }, []);

  const go = (s) => {
    setScreen(s);
    setNavOpen(false);
  };

  const renderScreen = () => {
    switch (screen) {
      case 'title': return <TitleScreen go={go}/>;
      case 'create': return <CreateLobbyScreen go={go} push={push}/>;
      case 'join': return <JoinLobbyScreen go={go} push={push}/>;
      case 'waiting': return <WaitingRoomScreen go={go} push={push}/>;
      case 'style': return <StyleSelectScreen go={go}/>;
      case 'draw': return <DrawScreen go={go} push={push}/>;
      case 'reveal': return <RevealScreen go={go} push={push}/>;
      case 'gallery': return <GalleryScreen go={go}/>;
      default: return <TitleScreen go={go}/>;
    }
  };

  const screenEl = (
    <div className="screen" data-screen-label={SCREENS.find(s => s.id === screen)?.label}>
      <div className="screen-content">
        {renderScreen()}
      </div>
    </div>
  );

  return (
    <>
      <Ambient/>
      <div className="app-shell">
        {device === 'desktop' ? screenEl : (
          <div className="mobile-frame">{screenEl}</div>
        )}
      </div>

      {/* Top chrome */}
      <div className="app-chrome">
        <div style={{
          display:'flex', alignItems:'center', gap: 6,
          padding: '0 12px',
          fontFamily:'var(--font-mono)', fontSize: 11, color:'var(--text-dim)',
          letterSpacing:'0.1em',
        }}>
          <span className="dot dot-green"/> {SCREENS.find(s => s.id === screen)?.label || screen}
        </div>
        <button className="chrome-btn" onClick={() => setNavOpen(true)}>
          <Icon name="menu" size={14}/> Screens
        </button>
        <button className={`chrome-btn ${device === 'desktop' ? 'active':''}`} onClick={() => setDevice('desktop')} aria-label="Desktop">
          <Icon name="desktop" size={14}/>
        </button>
        <button className={`chrome-btn ${device === 'mobile' ? 'active':''}`} onClick={() => setDevice('mobile')} aria-label="Mobile">
          <Icon name="mobile" size={14}/>
        </button>
      </div>

      {/* Screen index drawer */}
      {navOpen && (
        <div onClick={() => setNavOpen(false)} style={{
          position:'fixed', inset: 0, zIndex: 200,
          background:'rgba(10,4,24,0.7)', backdropFilter:'blur(8px)',
          display:'flex', alignItems:'center', justifyContent:'center',
          padding: 32,
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background:'var(--panel-strong)',
            border:'1px solid var(--panel-border-strong)',
            borderRadius: 22, padding: 28, width:'100%', maxWidth: 520,
            boxShadow:'0 30px 80px rgba(0,0,0,0.6)',
          }}>
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 18}}>
              <div>
                <div className="eyebrow"><Icon name="menu" size={11}/> Quick navigation</div>
                <h2 style={{fontSize: 22, marginTop: 6}}>Jump to screen</h2>
              </div>
              <button className="btn-icon" onClick={() => setNavOpen(false)}><Icon name="x" size={16}/></button>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap: 8}}>
              {SCREENS.map(s => (
                <button key={s.id} onClick={() => go(s.id)} style={{
                  padding: '14px 16px', borderRadius: 12,
                  background: screen === s.id ? 'linear-gradient(135deg, rgba(255,61,154,0.18), rgba(61,231,228,0.12))' : 'rgba(255,255,255,0.03)',
                  border: screen === s.id ? '1.5px solid var(--magenta)' : '1px solid var(--panel-border)',
                  color:'var(--text)', textAlign:'left',
                  fontFamily:'var(--font-display)', fontSize: 14, fontWeight: 600,
                  cursor:'pointer', transition:'all 0.18s',
                }}>
                  {s.label}
                </button>
              ))}
            </div>
            <div style={{
              marginTop: 14, padding: '10px 14px', borderRadius: 10,
              background: 'rgba(61,231,228,0.06)', border: '1px solid rgba(61,231,228,0.2)',
              fontSize: 12, color:'var(--text-mute)',
              display:'flex', alignItems:'center', gap: 8,
            }}>
              <Icon name="info" size={14} color="var(--cyan)"/>
              Detail modal lives inside the Gallery screen — open Gallery and click any specimen.
            </div>
          </div>
        </div>
      )}

      <ToastStack items={items}/>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
