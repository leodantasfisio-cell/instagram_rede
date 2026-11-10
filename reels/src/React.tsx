import {
  AbsoluteFill,
  Audio,
  Easing,
  Freeze,
  interpolate,
  OffthreadVideo,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {aplicarMarca, cores, fonte, marcaAtiva} from './marca';

// React com "cabeça flutuante": o fisioterapeuta recortado (webm com alfa) por cima das cenas da paciente.
type Cena = {arquivo: string; de: number; em: number; ate: number; congelarEm?: number};
type Gancho = {em: number; ate: number; texto: string; tipo: 'titulo' | 'pilula' | 'selo' | 'siga'};
type Circulo = {em: number; ate: number; x: number; y: number; r: number; rotulo: string};

export type EdicaoReact = {
  duracao: number;
  cenas: Cena[];
  ganchos: Gancho[];
  circulos: Circulo[];
  impactos: number[];
};

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const Fundo: React.FC<{c: Cena; i: number}> = ({c, i}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const total = (c.ate - c.em) * fps;
  const entrada = interpolate(frame, [0, 8], [0.18, 0], {...clamp, easing: Easing.out(Easing.cubic)});
  const empurra = interpolate(frame, [0, total], [1.04, 1.12]);
  const desfoque = i % 2 ? interpolate(frame, [0, 7], [18, 0], clamp) : 0;
  const clarao = i % 2 ? 0 : interpolate(frame, [0, 2, 8], [0.85, 0.6, 0], clamp);
  const congela = c.congelarEm !== undefined ? Math.round((c.congelarEm - c.em) * fps) : null;
  const video = (
    <OffthreadVideo
      src={staticFile(c.arquivo)}
      trimBefore={Math.round(c.de * fps)}
      muted
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        transform: `translateY(-260px) scale(${1.3 + empurra - 1.04 + entrada})`,
        filter: desfoque ? `blur(${desfoque}px)` : undefined,
      }}
    />
  );
  return (
    <AbsoluteFill>
      {congela !== null && frame >= congela ? (
        <Freeze frame={congela}>{video}</Freeze>
      ) : (
        video
      )}
      {congela !== null && frame >= congela ? (
        <AbsoluteFill style={{backgroundColor: 'rgba(0,0,0,0.25)'}} />
      ) : null}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.45) 100%)'}} />
      <AbsoluteFill style={{backgroundColor: '#fff', opacity: clarao}} />
    </AbsoluteFill>
  );
};

// O fisioterapeuta recortado, no canto de baixo, com contorno branco e leve "soco" nos impactos.
const Cabeca: React.FC<{impactos: number[]}> = ({impactos}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const soco = impactos.reduce((z, em) => {
    const d = t - em;
    return d < 0 || d > 0.5 ? z : Math.max(z, interpolate(d, [0, 0.08, 0.5], [0, 0.08, 0]));
  }, 0);
  const respira = 1 + 0.008 * Math.sin(t * 1.4);
  return (
    <AbsoluteFill>
      <OffthreadVideo
        src={staticFile('media/react/fisio.webm')}
        transparent
        muted
        style={{
          position: 'absolute',
          width: 1080 * 0.6,
          height: 1920 * 0.6,
          right: -70,
          bottom: -30,
          transform: `scale(${respira + soco})`,
          transformOrigin: '60% 100%',
          filter: 'drop-shadow(0 0 6px #fff) drop-shadow(0 0 2px #fff) drop-shadow(0 18px 30px rgba(0,0,0,0.5))',
        }}
      />
    </AbsoluteFill>
  );
};

const Texto: React.FC<{g: Gancho}> = ({g}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const dur = (g.ate - g.em) * fps;
  const entra = spring({frame, fps, config: {damping: 11, stiffness: 170}});
  const sai = interpolate(frame, [dur - 6, dur], [1, 0], clamp);
  if (g.tipo === 'titulo') {
    const tremida = frame < 10 ? Math.sin(frame * 2.3) * (10 - frame) * 1.4 : 0;
    return (
      <AbsoluteFill style={{alignItems: 'center', paddingTop: 230, fontFamily: fonte, opacity: sai}}>
        {g.texto.split('|').map((linha, k) => {
          const e = spring({frame: frame - k * 7, fps, config: {damping: 10, stiffness: 200}});
          return (
            <div
              key={k}
              style={{
                fontWeight: 800,
                fontSize: 108,
                lineHeight: 1.05,
                color: k ? cores.azulClaro : cores.branco,
                textShadow: `0 6px 0 ${k ? '#0b3d22' : cores.azulEscuro}, 0 18px 40px rgba(0,0,0,0.6)`,
                transform: `translate(${tremida}px,0) scale(${interpolate(e, [0, 1], [2.2, 1])})`,
                opacity: Math.min(1, e * 2),
                textAlign: 'center',
              }}
            >
              {linha}
            </div>
          );
        })}
      </AbsoluteFill>
    );
  }
  const estiloBase: React.CSSProperties = {
    fontFamily: fonte,
    fontWeight: 800,
    borderRadius: 26,
    boxShadow: '0 14px 40px rgba(0,0,0,0.4)',
    opacity: Math.min(entra, sai),
  };
  if (g.tipo === 'siga') {
    const pulso = 1 + 0.05 * Math.max(0, Math.sin((frame / fps) * Math.PI * 3));
    return (
      <AbsoluteFill style={{alignItems: 'center', paddingTop: 300}}>
        <div style={{...estiloBase, padding: '22px 40px', background: cores.azul, color: '#fff', fontSize: 52, transform: `scale(${interpolate(entra, [0, 1], [0.5, 1]) * pulso})`}}>
          Siga {marcaAtiva.handle}
        </div>
      </AbsoluteFill>
    );
  }
  if (g.tipo === 'selo') {
    return (
      <AbsoluteFill style={{alignItems: 'flex-start', paddingTop: 260, paddingLeft: 50}}>
        <div style={{...estiloBase, padding: '16px 30px', background: '#202020', color: '#fff', fontSize: 44, borderLeft: `14px solid ${cores.azulClaro}`, transform: `rotate(-3deg) scale(${interpolate(entra, [0, 1], [0.6, 1])})`}}>
          {g.texto}
        </div>
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{alignItems: 'flex-start', paddingTop: 260, paddingLeft: 50}}>
      <div style={{...estiloBase, padding: '18px 32px', background: 'rgba(255,255,255,0.97)', color: '#202020', fontSize: 54, maxWidth: 940, transform: `translateX(${interpolate(entra, [0, 1], [-220, 0])}px)`}}>
        {g.texto}
      </div>
    </AbsoluteFill>
  );
};

const Marca: React.FC<{c: Circulo}> = ({c}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const desenha = interpolate(frame, [0, 12], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const rot = spring({frame: frame - 8, fps, config: {damping: 12}});
  const pulso = 1 + 0.04 * Math.sin((frame / fps) * Math.PI * 4);
  const perim = 2 * Math.PI * c.r;
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <circle cx={c.x} cy={c.y} r={c.r * pulso} fill="none" stroke={cores.azulClaro} strokeWidth={12} strokeDasharray={perim} strokeDashoffset={perim * (1 - desenha)} strokeLinecap="round" transform={`rotate(-90 ${c.x} ${c.y})`} />
      </svg>
      <div
        style={{
          position: 'absolute',
          left: Math.max(40, c.x - 260),
          top: c.y - c.r - 120,
          padding: '12px 26px',
          borderRadius: 999,
          background: cores.azulClaro,
          color: '#fff',
          fontFamily: fonte,
          fontWeight: 800,
          fontSize: 46,
          opacity: rot,
          transform: `scale(${interpolate(rot, [0, 1], [0.5, 1])})`,
        }}
      >
        {c.rotulo}
      </div>
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

export const ReactReel: React.FC<{edicao: EdicaoReact; semCabeca?: boolean}> = ({edicao, semCabeca}) => {
  aplicarMarca('centroAmputados');
  const {fps} = useVideoConfig();
  const f = (s: number) => Math.round(s * fps);
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      {edicao.cenas.map((c, i) => (
        <Sequence key={i} from={f(c.em)} durationInFrames={f(c.ate) - f(c.em)} layout="none">
          <Fundo c={c} i={i} />
        </Sequence>
      ))}
      {edicao.circulos.map((c, i) => (
        <Sequence key={i} from={f(c.em)} durationInFrames={f(c.ate - c.em)}>
          <Marca c={c} />
        </Sequence>
      ))}
      {semCabeca ? null : <Cabeca impactos={edicao.impactos} />}
      {edicao.ganchos.map((g, i) => (
        <Sequence key={i} from={f(g.em)} durationInFrames={f(g.ate - g.em)}>
          <Texto g={g} />
        </Sequence>
      ))}
      <Audio src={staticFile('media/react/fala.m4a')} />
      {edicao.cenas.slice(1).map((c, i) => (
        <Som key={i} arquivo="sfx/whoosh.wav" em={c.em - 0.15} volume={0.35} />
      ))}
      {edicao.ganchos.map((g, i) => (
        <Som key={`g${i}`} arquivo={g.tipo === 'titulo' ? 'sfx/impacto.wav' : 'sfx/pop.wav'} em={g.em} volume={0.5} />
      ))}
      {edicao.impactos.map((em, i) => (
        <Som key={`i${i}`} arquivo="sfx/impacto.wav" em={em} volume={0.6} />
      ))}
      {edicao.circulos.map((c, i) => (
        <Som key={`c${i}`} arquivo="sfx/brilho.wav" em={c.em} volume={0.5} />
      ))}
    </AbsoluteFill>
  );
};
