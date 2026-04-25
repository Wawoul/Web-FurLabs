/* global React, Icon */
const { useState: useStateS, useEffect: useEffectS, useRef: useRefS, useMemo } = React;

// ===== Ambient backdrop: bubbles + drifting helixes + grain =====
function Ambient() {
  const bubbles = React.useMemo(() => {
    const arr = [];
    for (let i = 0; i < 22; i++) {
      const size = 6 + Math.random() * 36;
      arr.push({
        size,
        left: Math.random() * 100,
        delay: -Math.random() * 18,
        duration: 14 + Math.random() * 16,
        hue: ['#ff3d9a','#3de7e4','#c8a6ff','#ffb43d'][Math.floor(Math.random()*4)],
      });
    }
    return arr;
  }, []);
  return (
    <div className="ambient" aria-hidden>
      <div className="grain" />
      {bubbles.map((b, i) => (
        <div key={i} className="bubble" style={{
          width: b.size, height: b.size,
          left: `${b.left}%`,
          bottom: `-${b.size}px`,
          animationDelay: `${b.delay}s`,
          animationDuration: `${b.duration}s`,
          background: `radial-gradient(circle at 30% 30%, ${b.hue}55, transparent 60%)`,
          borderColor: `${b.hue}33`,
        }}/>
      ))}
    </div>
  );
}

// ===== Logo =====
function Logo({ size = 'md' }) {
  const sizes = { sm: 22, md: 36, lg: 64, xl: 92 };
  const s = sizes[size] || 36;
  return (
    <span className="logo" style={{fontSize: s, lineHeight: 1}}>
      <span style={{
        background: 'linear-gradient(135deg, #ff3d9a 0%, #ff7ec0 50%, #c8a6ff 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}>Fur</span>
      <span className="logo-mark" style={{
        width: s*0.85, height: s*1.1, margin: `0 ${s*0.04}px`,
        position: 'relative', display: 'inline-block', verticalAlign: 'middle',
      }}>
        <FlaskMark size={s*1.05} />
      </span>
      <span style={{
        background: 'linear-gradient(135deg, #3de7e4 0%, #8af6f4 50%, #ffb43d 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}>Labs</span>
    </span>
  );
}

function FlaskMark({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 44" style={{display:'block'}}>
      <defs>
        <linearGradient id="flaskFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff3d9a" stopOpacity="0.3"/>
          <stop offset="0.6" stopColor="#3de7e4" stopOpacity="0.85"/>
          <stop offset="1" stopColor="#3de7e4"/>
        </linearGradient>
      </defs>
      <path d="M14 4 h12 v8 l8 22 c1 3 -1 6 -4 6 H8 c-3 0 -5 -3 -4 -6 l8-22 V4 z" fill="rgba(255,255,255,0.06)" stroke="#ffb43d" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M9 24 L31 24 L34 34 c1 3 -1 6 -4 6 H8 c-3 0 -5 -3 -4 -6 z" fill="url(#flaskFill)"/>
      <circle cx="14" cy="30" r="1.6" fill="#fff" opacity="0.7"/>
      <circle cx="22" cy="33" r="1" fill="#fff" opacity="0.5"/>
      <circle cx="26" cy="28" r="1.3" fill="#fff" opacity="0.6"/>
      <path d="M12 4 L28 4" stroke="#ffb43d" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );
}

// ===== Toast system (context-light, just a hook) =====
let toastIdSeq = 0;
function useToasts() {
  const [items, setItems] = useStateS([]);
  const push = (kind, message) => {
    const id = ++toastIdSeq;
    setItems(p => [...p, {id, kind, message}]);
    setTimeout(() => setItems(p => p.filter(t => t.id !== id)), 3500);
  };
  return { items, push };
}
function ToastStack({ items }) {
  return (
    <div className="toast-stack">
      {items.map(t => (
        <div key={t.id} className={`toast toast-${t.kind}`}>
          <span className="toast-icon">
            <Icon name={t.kind === 'success' ? 'check' : t.kind === 'error' ? 'x' : t.kind === 'warn' ? 'warn' : 'info'} size={18}/>
          </span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

// ===== Specimen avatar (procedural) =====
function SpecimenAvatar({ seed = 0, size = 44 }) {
  const palettes = [
    ['#ff3d9a','#ff7ec0'],
    ['#3de7e4','#8af6f4'],
    ['#ffb43d','#ffc966'],
    ['#5dffaa','#a4ffc8'],
    ['#c8a6ff','#e0c8ff'],
    ['#ff5e6c','#ff8a94'],
  ];
  const p = palettes[seed % palettes.length];
  const shape = seed % 3;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `radial-gradient(circle at 35% 30%, ${p[1]}, ${p[0]} 70%)`,
      border: '2px solid rgba(255,255,255,0.18)',
      display:'flex', alignItems:'center', justifyContent:'center',
      flexShrink: 0,
      boxShadow: `0 4px 16px ${p[0]}55`,
    }}>
      <svg width={size*0.55} height={size*0.55} viewBox="0 0 24 24" fill="none">
        {shape === 0 && (<>
          <circle cx="9" cy="10" r="1.6" fill="#fff"/>
          <circle cx="15" cy="10" r="1.6" fill="#fff"/>
          <path d="M8 15c1 1.5 2.5 2 4 2s3-0.5 4-2" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
          <path d="M5 6 L7 9 M19 6 L17 9" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" opacity="0.85"/>
        </>)}
        {shape === 1 && (<>
          <circle cx="9" cy="11" r="1.5" fill="#fff"/>
          <circle cx="15" cy="11" r="1.5" fill="#fff"/>
          <ellipse cx="12" cy="15" rx="2" ry="1.2" fill="#fff" opacity="0.85"/>
          <path d="M6 5 Q8 8 7 11 M18 5 Q16 8 17 11" stroke="#fff" strokeWidth="1.6" fill="none" opacity="0.9"/>
        </>)}
        {shape === 2 && (<>
          <path d="M8 9 L10 12 L8 13z M16 9 L14 12 L16 13z" fill="#fff"/>
          <path d="M9 16 Q12 18 15 16" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
          <path d="M5 7 Q12 4 19 7" stroke="#fff" strokeWidth="1.6" fill="none" opacity="0.8"/>
        </>)}
      </svg>
    </div>
  );
}

// ===== Eyebrow heading =====
function Eyebrow({ children }) {
  return <div className="eyebrow">{children}</div>;
}

// ===== Section title =====
function ScreenHeader({ eyebrow, title, subtitle, onBack, action }) {
  return (
    <div style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16, padding: '32px 40px 24px'}}>
      <div style={{display:'flex', gap:16, alignItems:'flex-start'}}>
        {onBack && (
          <button className="btn-icon" onClick={onBack} style={{marginTop: 4}} aria-label="Back">
            <Icon name="arrow-left" size={18}/>
          </button>
        )}
        <div>
          {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
          <h1 style={{fontSize: 38, marginTop: 8, lineHeight: 1.1, letterSpacing:'-0.01em'}}>{title}</h1>
          {subtitle && <p style={{color:'var(--text-mute)', marginTop: 8, fontSize: 15, maxWidth: 540}}>{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

// ===== Sample fursona art (procedural placeholders) =====
function FursonaPart({ part = 'head', seed = 0, size = 220, label, artist }) {
  const palettes = [
    ['#ff3d9a','#ff7ec0','#ffb43d'],
    ['#3de7e4','#8af6f4','#5dffaa'],
    ['#c8a6ff','#e0c8ff','#ff7ec0'],
    ['#ffb43d','#ffc966','#ff5e6c'],
  ];
  const p = palettes[seed % palettes.length];
  return (
    <div style={{
      width: size, aspectRatio: '2/1', borderRadius: 14,
      background: 'rgba(20,8,42,0.6)',
      border: '1px dashed rgba(255,255,255,0.18)',
      position: 'relative',
      overflow: 'hidden',
      display:'flex', alignItems:'center', justifyContent:'center',
    }}>
      <svg viewBox="0 0 200 100" style={{width:'100%', height:'100%'}}>
        {part === 'head' && (<>
          <ellipse cx="100" cy="55" rx="42" ry="38" fill={p[0]} opacity="0.85"/>
          <path d="M65 30 L75 10 L85 32z M115 32 L125 10 L135 30z" fill={p[2]}/>
          <circle cx="85" cy="55" r="6" fill="#fff"/>
          <circle cx="115" cy="55" r="6" fill="#fff"/>
          <circle cx="86" cy="56" r="3" fill="#1a0d2e"/>
          <circle cx="116" cy="56" r="3" fill="#1a0d2e"/>
          <ellipse cx="100" cy="72" rx="5" ry="3" fill={p[1]}/>
          <path d="M88 80 Q100 86 112 80" stroke="#1a0d2e" strokeWidth="2" fill="none" strokeLinecap="round"/>
        </>)}
        {part === 'torso' && (<>
          <path d="M70 5 Q100 0 130 5 L138 90 Q100 100 62 90 Z" fill={p[0]} opacity="0.85"/>
          <circle cx="100" cy="40" r="14" fill={p[2]}/>
          <path d="M50 30 L70 35 L70 75 L52 80z M150 30 L130 35 L130 75 L148 80z" fill={p[1]}/>
        </>)}
        {part === 'legs' && (<>
          <path d="M65 5 L75 80 L60 95 L82 95 L88 5z M135 5 L125 80 L140 95 L118 95 L112 5z" fill={p[0]} opacity="0.85"/>
          <ellipse cx="71" cy="92" rx="14" ry="6" fill={p[2]}/>
          <ellipse cx="129" cy="92" rx="14" ry="6" fill={p[2]}/>
        </>)}
      </svg>
      <div style={{position:'absolute', top:8, left:12, fontFamily:'var(--font-mono)', fontSize: 10, color:'var(--text-dim)', letterSpacing:'0.1em'}}>
        SPECIMEN-{String(seed).padStart(3,'0')}
      </div>
      {label && <div style={{position:'absolute', bottom: 10, left: 12, fontFamily:'var(--font-display)', fontWeight:600, fontSize: 12, color: 'var(--text-mute)'}}>{label}</div>}
      {artist && <div style={{position:'absolute', bottom: 10, right: 12, fontSize: 10, color: 'var(--text-dim)'}}>by {artist}</div>}
    </div>
  );
}

// ===== Combined fursona (full body, larger placeholder) =====
function FursonaFull({ seed = 0, ai = false, size = 280 }) {
  const palettes = [
    ['#ff3d9a','#ff7ec0','#ffb43d','#c8a6ff'],
    ['#3de7e4','#8af6f4','#5dffaa','#ffb43d'],
    ['#c8a6ff','#e0c8ff','#ff7ec0','#3de7e4'],
  ];
  const p = palettes[seed % palettes.length];
  return (
    <div style={{
      width: size, aspectRatio: '2/3',
      borderRadius: 16,
      background: ai
        ? `radial-gradient(circle at 50% 30%, ${p[0]}30, ${p[2]}15 50%, rgba(20,8,42,0.8) 100%)`
        : 'rgba(20,8,42,0.6)',
      border: ai ? `1px solid ${p[0]}55` : '1px dashed rgba(255,255,255,0.18)',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: ai ? `0 0 40px ${p[0]}33` : 'none',
    }}>
      <svg viewBox="0 0 200 300" style={{width:'100%', height:'100%'}}>
        {/* head */}
        <ellipse cx="100" cy="60" rx="42" ry="40" fill={p[0]} opacity={ai ? 1 : 0.85}/>
        <path d="M65 35 L75 12 L85 38z M115 38 L125 12 L135 35z" fill={p[2]}/>
        <circle cx="85" cy="60" r="6" fill="#fff"/>
        <circle cx="115" cy="60" r="6" fill="#fff"/>
        <circle cx="86" cy="61" r="3" fill="#1a0d2e"/>
        <circle cx="116" cy="61" r="3" fill="#1a0d2e"/>
        <ellipse cx="100" cy="78" rx="5" ry="3" fill={p[1]}/>
        <path d="M88 86 Q100 92 112 86" stroke="#1a0d2e" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        {/* torso */}
        <path d="M70 100 Q100 96 130 100 L138 195 Q100 205 62 195 Z" fill={p[1]} opacity={ai ? 1 : 0.85}/>
        <circle cx="100" cy="140" r="14" fill={p[3]}/>
        <path d="M50 130 L70 135 L70 180 L52 185z M150 130 L130 135 L130 180 L148 185z" fill={p[0]}/>
        {/* legs */}
        <path d="M65 200 L75 285 L60 295 L88 295 L88 200z M135 200 L125 285 L140 295 L112 295 L112 200z" fill={p[2]} opacity={ai ? 1 : 0.85}/>
        <ellipse cx="74" cy="293" rx="16" ry="5" fill={p[3]}/>
        <ellipse cx="126" cy="293" rx="16" ry="5" fill={p[3]}/>
        {ai && Array.from({length: 12}).map((_,i)=>(
          <circle key={i} cx={100 + Math.cos(i)*80} cy={150 + Math.sin(i*1.7)*100} r={1+Math.random()*2} fill="#fff" opacity={0.4+Math.random()*0.4}/>
        ))}
      </svg>
      {!ai && (
        <div style={{position:'absolute', top:10, left:12, fontFamily:'var(--font-mono)', fontSize: 10, color:'var(--text-dim)', letterSpacing:'0.1em'}}>
          RAW SAMPLE
        </div>
      )}
      {ai && (
        <div style={{position:'absolute', top:10, left:12, display:'flex', alignItems:'center', gap:6, fontFamily:'var(--font-display)', fontSize: 10, color: p[0], fontWeight:700, letterSpacing:'0.1em'}}>
          <Icon name="sparkle" size={12} color={p[0]}/> LAB-ENHANCED
        </div>
      )}
    </div>
  );
}

window.Ambient = Ambient;
window.Logo = Logo;
window.FlaskMark = FlaskMark;
window.useToasts = useToasts;
window.ToastStack = ToastStack;
window.SpecimenAvatar = SpecimenAvatar;
window.Eyebrow = Eyebrow;
window.ScreenHeader = ScreenHeader;
window.FursonaPart = FursonaPart;
window.FursonaFull = FursonaFull;
