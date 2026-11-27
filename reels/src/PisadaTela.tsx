import {
  AbsoluteFill,
  Audio,
  Easing,
  interpolate,
  OffthreadVideo,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {aplicarMarca, cores, fonte, marcaAtiva} from './marca';

// "Seu pé na tela": cenas curtas, textos grandes em tarjas, mapa de pressão ilustrativo animado.
type Texto = {em: number; texto: string; rotulo?: string};
type Cena = {
  tipo: 'video' | 'janela' | 'mapa';
  arquivo?: string;
  de?: number;
  dur: number;
  pos?: string;
  gancho?: string;
  textos?: Texto[];
  cadeia?: {titulo: string; itens: string[]};
};
export type EdicaoPisadaTela = {cenas: Cena[]; cta: {titulo: string; rodape: string; duracao: number}};

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const T = 0.3; // transição

const Tarja: React.FC<{t: Texto; ordem: number; fim: number}> = ({t, ordem, fim}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const abre = interpolate(frame, [0, 10], [0, 100], {...clamp, easing: Easing.out(Easing.cubic)});
  const txt = interpolate(frame, [5, 14], [0, 1], clamp);
  const sai = interpolate(frame, [fim * fps - 6, fim * fps], [1, 0], clamp);
  return (
    <AbsoluteFill style={{top: 1180 + ordem * 200, paddingLeft: 50, paddingRight: 50, opacity: sai}}>
      <div style={{alignSelf: 'flex-start', display: 'flex', clipPath: `inset(0 ${100 - abre}% 0 0)`}}>
        <div style={{width: 12, background: cores.azulClaro}} />
        <div style={{background: 'rgba(255,255,255,0.96)', padding: '20px 34px 22px 26px', boxShadow: '0 16px 40px rgba(0,0,0,0.35)'}}>
          {t.rotulo ? <div style={{fontFamily: fonte, fontWeight: 800, fontSize: 30, letterSpacing: 5, color: cores.azul, opacity: txt}}>{t.rotulo}</div> : null}
          <div style={{fontFamily: fonte, fontWeight: 800, fontSize: 56, lineHeight: 1.12, color: cores.azulEscuro, opacity: txt, maxWidth: 900}}>{t.texto}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Gancho: React.FC<{texto: string}> = ({texto}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const palavras = texto.split(' ');
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', padding: 70, background: 'rgba(13,27,61,0.35)'}}>
      <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '6px 20px'}}>
        {palavras.map((p, k) => {
          const e = spring({frame: frame - k * 3, fps, config: {damping: 13, stiffness: 190}});
          const destaque = /pé|percebe/i.test(p);
          return (
            <span key={k} style={{fontFamily: fonte, fontWeight: 800, fontSize: 96, lineHeight: 1.08, color: destaque ? cores.azulClaro : '#fff', textShadow: '0 8px 30px rgba(0,0,0,0.6)', opacity: e, transform: `translateY(${interpolate(e, [0, 1], [50, 0])}px)`}}>
              {p}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const Cadeia: React.FC<{titulo: string; itens: string[]}> = ({titulo, itens}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t0 = spring({frame, fps, config: {damping: 14}});
  return (
    <AbsoluteFill style={{top: 980, alignItems: 'center'}}>
      <div style={{fontFamily: fonte, fontWeight: 800, fontSize: 54, color: '#fff', background: cores.azul, padding: '16px 34px', borderRadius: 18, opacity: t0, transform: `scale(${interpolate(t0, [0, 1], [0.8, 1])})`, boxShadow: '0 16px 40px rgba(0,0,0,0.4)'}}>{titulo}</div>
      {itens.map((it, k) => {
        const e = spring({frame: frame - 18 - k * 14, fps, config: {damping: 13}});
        const seta = interpolate(frame, [12 + k * 14, 20 + k * 14], [0, 1], clamp);
        return (
          <div key={k} style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            <div style={{width: 6, height: 44 * seta, background: '#fff', marginTop: 8}} />
            <div style={{fontFamily: fonte, fontWeight: 800, fontSize: 52, color: cores.azulEscuro, background: '#fff', padding: '14px 32px', borderRadius: 999, opacity: e, transform: `scale(${e})`, boxShadow: '0 14px 30px rgba(0,0,0,0.35)'}}>{it}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// Pé estilizado com mapa de calor (ilustrativo): azul pouca pressão, vermelho muita.
const Pe: React.FC<{x: number; espelho?: boolean; p: number; id: string}> = ({x, espelho, p, id}) => {
  const forma = 'M0,-300 C70,-300 110,-230 105,-120 C100,-20 70,40 80,130 C90,220 70,300 0,305 C-70,300 -95,230 -88,140 C-80,50 -110,-40 -100,-140 C-90,-250 -60,-300 0,-300 Z';
  const s = espelho ? -1 : 1;
  const r = (v: number) => v * p;
  return (
    <g transform={`translate(${x},860) scale(${s},1)`}>
      <defs>
        <clipPath id={`c${id}`}><path d={forma} /></clipPath>
        <radialGradient id={`q${id}`}><stop offset="0" stopColor="#E53935" /><stop offset="0.45" stopColor="#FFB300" /><stop offset="0.75" stopColor="#43A047" stopOpacity="0.8" /><stop offset="1" stopColor="#1E64F0" stopOpacity="0" /></radialGradient>
        <radialGradient id={`m${id}`}><stop offset="0" stopColor="#FFB300" /><stop offset="0.5" stopColor="#43A047" stopOpacity="0.8" /><stop offset="1" stopColor="#1E64F0" stopOpacity="0" /></radialGradient>
      </defs>
      <path d={forma} fill="#1E64F0" opacity={0.9} />
      <g clipPath={`url(#c${id})`}>
        <ellipse cx={0} cy={215} rx={r(120)} ry={r(120)} fill={`url(#q${id})`} />
        <ellipse cx={-40} cy={-150} rx={r(110)} ry={r(95)} fill={`url(#q${id})`} />
        <ellipse cx={45} cy={-120} rx={r(80)} ry={r(70)} fill={`url(#m${id})`} />
        <ellipse cx={-55} cy={40} rx={r(45)} ry={r(80)} fill={`url(#m${id})`} opacity={0.6} />
      </g>
      <path d={forma} fill="none" stroke="#fff" strokeWidth={6} />
    </g>
  );
};

const Mapa: React.FC<{dur: number}> = ({dur}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = interpolate(frame, [8, 40], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const leg = spring({frame: frame - 45, fps, config: {damping: 14}});
  const alvo = interpolate(frame, [95, 110], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const pulso = 1 + 0.06 * Math.sin((frame / fps) * Math.PI * 4);
  const e2 = spring({frame: frame - 112, fps, config: {damping: 13}});
  const perim = 2 * Math.PI * 140;
  return (
    <AbsoluteFill style={{background: `radial-gradient(circle at 50% 40%, #16306b, ${cores.azulEscuro})`}}>
      <AbsoluteFill style={{top: 200, alignItems: 'center'}}>
        <div style={{fontFamily: fonte, fontWeight: 800, fontSize: 30, letterSpacing: 6, color: cores.azulClaro}}>COMO LER O MAPA</div>
        <div style={{fontFamily: fonte, fontWeight: 800, fontSize: 64, color: '#fff', marginTop: 8}}>As cores da sua pisada</div>
      </AbsoluteFill>
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <Pe x={380} p={p} id="e" espelho />
        <Pe x={700} p={p} id="d" />
        <circle cx={700} cy={1075} r={140 * pulso} fill="none" stroke="#fff" strokeWidth={10} strokeDasharray={perim} strokeDashoffset={perim * (1 - alvo)} />
      </svg>
      <AbsoluteFill style={{top: 1240, left: 640, width: 400, height: 'auto', opacity: e2}}>
        <div style={{fontFamily: fonte, fontWeight: 800, fontSize: 44, color: '#fff', background: '#E53935', padding: '10px 24px', borderRadius: 14, alignSelf: 'flex-start'}}>Sobrecarga</div>
      </AbsoluteFill>
      <AbsoluteFill style={{top: 1400, alignItems: 'center', opacity: leg, transform: `translateY(${interpolate(leg, [0, 1], [40, 0])}px)`}}>
        <div style={{width: 820, height: 34, borderRadius: 17, background: 'linear-gradient(90deg, #1E64F0, #43A047, #FFB300, #E53935)', border: '4px solid #fff'}} />
        <div style={{width: 820, display: 'flex', justifyContent: 'space-between', marginTop: 16, fontFamily: fonte, fontWeight: 800, fontSize: 44, color: '#fff'}}>
          <span>🔵 pouca pressão</span>
          <span>muita 🔴</span>
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{top: 1640, alignItems: 'center'}}>
        <div style={{fontFamily: fonte, fontWeight: 700, fontSize: 28, color: 'rgba(255,255,255,0.7)'}}>exemplo ilustrativo</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const CenaView: React.FC<{c: Cena; i: number}> = ({c, i}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const total = (c.dur + T) * fps;
  const entra = i === 0 ? 1 : interpolate(frame, [0, T * fps], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const zoom = interpolate(frame, [0, total], [1.03, 1.1]);
  let fundo: React.ReactNode = null;
  if (c.tipo === 'mapa') fundo = <Mapa dur={c.dur} />;
  else if (c.tipo === 'janela') {
    fundo = (
      <AbsoluteFill style={{background: cores.azulEscuro}}>
        <OffthreadVideo src={staticFile(c.arquivo!)} trimBefore={Math.round((c.de ?? 0) * fps)} muted style={{position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(30px) brightness(0.6)', transform: 'scale(1.2)'}} />
        <AbsoluteFill style={{top: 420, alignItems: 'center'}}>
          <div style={{fontFamily: fonte, fontWeight: 800, fontSize: 30, letterSpacing: 5, color: '#fff', background: '#E53935', padding: '8px 20px', borderRadius: 8, marginBottom: 18}}>● REC · CÂMERA DE MARCHA</div>
          <OffthreadVideo src={staticFile(c.arquivo!)} trimBefore={Math.round((c.de ?? 0) * fps)} muted style={{width: 1000, borderRadius: 24, border: '6px solid #fff', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', transform: `scale(${zoom - 0.03})`}} />
        </AbsoluteFill>
      </AbsoluteFill>
    );
  } else {
    fundo = (
      <AbsoluteFill>
        <OffthreadVideo src={staticFile(c.arquivo!)} trimBefore={Math.round((c.de ?? 0) * fps)} muted style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: c.pos ?? '50% 50%', transform: `scale(${zoom})`}} />
        <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.35) 100%)'}} />
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{opacity: entra, transform: `scale(${interpolate(entra, [0, 1], [1.08, 1])})`}}>
      {fundo}
      {c.gancho ? <Gancho texto={c.gancho} /> : null}
      {(c.textos ?? []).map((t, k) => (
        <Sequence key={k} from={Math.round(t.em * fps)} durationInFrames={Math.round((c.dur + T - t.em) * fps)} layout="none">
          <Tarja t={t} ordem={k} fim={c.dur + T - t.em} />
        </Sequence>
      ))}
      {c.cadeia ? <Cadeia titulo={c.cadeia.titulo} itens={c.cadeia.itens} /> : null}
    </AbsoluteFill>
  );
};

const Cta: React.FC<{cta: EdicaoPisadaTela['cta']}> = ({cta}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const e = spring({frame, fps, config: {damping: 14}});
  const b = spring({frame: frame - 8, fps, config: {damping: 11}});
  return (
    <AbsoluteFill style={{background: `linear-gradient(160deg, ${cores.azul}, ${cores.azulEscuro})`, justifyContent: 'center', alignItems: 'center', fontFamily: fonte, clipPath: `circle(${interpolate(e, [0, 1], [0, 150])}% at 50% 50%)`}}>
      <div style={{fontSize: 120}}>👣</div>
      <div style={{color: '#fff', fontWeight: 800, fontSize: 76, textAlign: 'center', maxWidth: 900, lineHeight: 1.08, marginTop: 20}}>{cta.titulo}</div>
      <div style={{marginTop: 40, background: cores.azulClaro, color: '#fff', fontWeight: 800, fontSize: 52, padding: '18px 44px', borderRadius: 999, transform: `scale(${b})`}}>{marcaAtiva.handle}</div>
      <div style={{marginTop: 28, color: '#fff', fontWeight: 700, fontSize: 38, opacity: 0.9}}>{cta.rodape}</div>
    </AbsoluteFill>
  );
};

const Som: React.FC<{arquivo: string; em: number; volume: number}> = ({arquivo, em, volume}) => {
  const {fps} = useVideoConfig();
  return (
    <Sequence from={Math.max(0, Math.round(em * fps))} durationInFrames={Math.round(fps * 0.8)} layout="none">
      <Audio src={staticFile(arquivo)} volume={volume} />
    </Sequence>
  );
};

export const duracaoPisadaTela = (e: EdicaoPisadaTela) => e.cenas.reduce((s, c) => s + c.dur, 0) + e.cta.duracao;

export const PisadaTelaReel: React.FC<{edicao: EdicaoPisadaTela}> = ({edicao}) => {
  aplicarMarca('amoMeuPe');
  const {fps} = useVideoConfig();
  let t = 0;
  const inicios = edicao.cenas.map((c) => {
    const s = t;
    t += c.dur;
    return s;
  });
  const fimCenas = t;
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      {edicao.cenas.map((c, i) => {
        const ini = i === 0 ? 0 : inicios[i] - T;
        return (
          <Sequence key={i} from={Math.round(ini * fps)} durationInFrames={Math.round((inicios[i] + c.dur - ini) * fps)}>
            <CenaView c={c} i={i} />
          </Sequence>
        );
      })}
      <Sequence from={Math.round(fimCenas * fps)}>
        <Cta cta={edicao.cta} />
      </Sequence>
      {edicao.cenas.flatMap((c, i) => (c.textos ?? []).map((tx, k) => <Som key={`${i}-${k}`} arquivo="sfx/pop.wav" em={inicios[i] + tx.em} volume={0.45} />))}
      <Som arquivo="sfx/impacto.wav" em={0.05} volume={0.5} />
      {edicao.cenas.map((c, i) => (c.tipo === 'mapa' ? <Som key={`m${i}`} arquivo="sfx/brilho.wav" em={inicios[i] + 3.6} volume={0.5} /> : null))}
      <Som arquivo="sfx/brilho.wav" em={fimCenas + 0.2} volume={0.5} />
    </AbsoluteFill>
  );
};
