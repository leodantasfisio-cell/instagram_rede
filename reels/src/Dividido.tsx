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

// Tela dividida: mídias em cima, especialista falando embaixo, legenda na linha do meio.
type Cena = {arquivo: string; em: number; ate: number; de: number; pos?: string};
type Palavra = {texto: string; inicio: number; fim: number};
type Grupo = {inicio: number; fim: number; palavras: Palavra[]};
type Selo = {em: number; ate: number; texto: string; tipo: 'titulo' | 'pergunta' | 'resposta' | 'chip'};

export type EdicaoDividido = {
  duracao: number;
  fala: string;
  cenas: Cena[];
  legendas: Grupo[];
  selos: Selo[];
  cta: {titulo: string; botao: string; duracao: number};
};

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const MEIO = 960;
const SOBRE = 0.35; // sobreposição entre cenas para a transição

const Midia: React.FC<{c: Cena; i: number}> = ({c, i}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const total = (c.ate - c.em + SOBRE) * fps;
  const abre = i === 0 ? 100 : interpolate(frame, [0, SOBRE * fps], [0, 100], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const zoom = interpolate(frame, [0, total], [1.04, 1.12]);
  // alterna a direção da cortina
  const clip = i % 2 ? `inset(0 0 0 ${100 - abre}%)` : `inset(0 ${100 - abre}% 0 0)`;
  return (
    <AbsoluteFill style={{height: MEIO, overflow: 'hidden', clipPath: clip}}>
      <OffthreadVideo
        src={staticFile(c.arquivo)}
        trimBefore={Math.round(c.de * fps)}
        muted
        style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: c.pos ?? '50% 40%', transform: `scale(${zoom})`}}
      />
    </AbsoluteFill>
  );
};

const Legenda: React.FC<{g: Grupo}> = ({g}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = g.inicio + frame / fps;
  const e = spring({frame, fps, config: {damping: 15, stiffness: 220}});
  return (
    <AbsoluteFill style={{top: MEIO - 62, height: 124, alignItems: 'center', justifyContent: 'center'}}>
      <div
        style={{
          display: 'flex',
          gap: 14,
          padding: '14px 26px',
          borderRadius: 20,
          background: 'rgba(255,255,255,0.97)',
          boxShadow: '0 14px 34px rgba(0,0,0,0.35)',
          fontFamily: fonte,
          fontWeight: 800,
          fontSize: 50,
          transform: `scale(${interpolate(e, [0, 1], [0.85, 1])})`,
          opacity: Math.min(1, e * 1.5),
        }}
      >
        {g.palavras.map((p, k) => {
          const ativa = t >= p.inicio && t < p.fim + 0.05;
          return (
            <span
              key={k}
              style={{
                color: ativa ? '#fff' : cores.azulEscuro,
                background: ativa ? cores.azul : 'transparent',
                borderRadius: 10,
                padding: '0 8px',
                margin: '0 -8px',
              }}
            >
              {p.texto.toUpperCase()}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const SeloView: React.FC<{s: Selo; ordem: number}> = ({s, ordem}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const dur = (s.ate - s.em) * fps;
  const e = spring({frame, fps, config: {damping: 14, stiffness: 160}});
  const sai = interpolate(frame, [dur - 7, dur], [1, 0], clamp);
  if (s.tipo === 'titulo') {
    const barra = interpolate(frame, [0, 10], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
    return (
      <AbsoluteFill style={{height: MEIO, justifyContent: 'center', alignItems: 'center', opacity: sai}}>
        <div style={{background: cores.azul, padding: '18px 40px', clipPath: `inset(0 ${100 - barra * 100}% 0 0)`, boxShadow: '0 18px 40px rgba(0,0,0,0.4)'}}>
          <div style={{fontFamily: fonte, fontWeight: 800, fontSize: 66, color: '#fff', letterSpacing: 2, whiteSpace: 'nowrap', opacity: interpolate(frame, [6, 14], [0, 1], clamp)}}>{s.texto}</div>
        </div>
        <div style={{marginTop: 14, height: 8, width: 520 * barra, background: '#fff'}} />
      </AbsoluteFill>
    );
  }
  if (s.tipo === 'pergunta') {
    return (
      <AbsoluteFill style={{height: MEIO, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 140, opacity: sai}}>
        <div style={{background: '#fff', color: cores.azulEscuro, fontFamily: fonte, fontWeight: 800, fontSize: 58, padding: '22px 38px', borderRadius: 24, boxShadow: '0 18px 40px rgba(0,0,0,0.4)', transform: `translateY(${interpolate(e, [0, 1], [60, 0])}px)`, opacity: e}}>
          {s.texto}
        </div>
      </AbsoluteFill>
    );
  }
  if (s.tipo === 'resposta') {
    const anel = interpolate(frame, [0, 14], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
    return (
      <AbsoluteFill style={{height: MEIO, justifyContent: 'center', alignItems: 'center', opacity: sai}}>
        <div style={{position: 'absolute', width: 300 + 160 * anel, height: 300 + 160 * anel, borderRadius: '50%', border: `8px solid ${cores.azulClaro}`, opacity: 1 - anel}} />
        <div style={{width: 300, height: 300, borderRadius: '50%', background: cores.azul, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${e})`, boxShadow: '0 20px 50px rgba(0,0,0,0.45)'}}>
          <div style={{fontFamily: fonte, fontWeight: 800, fontSize: 110, color: '#fff'}}>{s.texto}</div>
        </div>
      </AbsoluteFill>
    );
  }
  // chip: tarja com marcador, empilhada no canto de baixo da metade de cima
  return (
    <AbsoluteFill style={{top: MEIO - 250 - ordem * 104, height: 100, paddingLeft: 44, opacity: sai}}>
      <div style={{alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(11,46,102,0.88)', padding: '14px 30px 14px 16px', borderRadius: 16, transform: `translateX(${interpolate(e, [0, 1], [-500, 0])}px)`, boxShadow: '0 12px 30px rgba(0,0,0,0.35)'}}>
        <div style={{width: 46, height: 46, borderRadius: '50%', background: cores.azulClaro, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: fonte, fontWeight: 800, fontSize: 30}}>✓</div>
        <div style={{fontFamily: fonte, fontWeight: 800, fontSize: 44, color: '#fff'}}>{s.texto}</div>
      </div>
    </AbsoluteFill>
  );
};

const Cta: React.FC<{cta: EdicaoDividido['cta']}> = ({cta}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const e = spring({frame, fps, config: {damping: 14}});
  const b = spring({frame: frame - 8, fps, config: {damping: 12}});
  return (
    <AbsoluteFill style={{background: `linear-gradient(160deg, ${cores.azul}, ${cores.azulEscuro})`, justifyContent: 'center', alignItems: 'center', fontFamily: fonte, clipPath: `circle(${interpolate(e, [0, 1], [0, 150])}% at 50% 50%)`}}>
      <div style={{color: '#fff', fontWeight: 800, fontSize: 72, textAlign: 'center', maxWidth: 900, lineHeight: 1.1}}>{cta.titulo}</div>
      <div style={{marginTop: 40, background: '#fff', color: cores.azul, fontWeight: 800, fontSize: 52, padding: '18px 44px', borderRadius: 999, transform: `scale(${b})`}}>{cta.botao}</div>
      <div style={{marginTop: 30, color: '#fff', fontWeight: 700, fontSize: 38, opacity: 0.9}}>{marcaAtiva.handle}</div>
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

export const DivididoReel: React.FC<{edicao: EdicaoDividido}> = ({edicao}) => {
  aplicarMarca('redeEscoliose');
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const f = (s: number) => Math.round(s * fps);
  const chips = edicao.selos.filter((s) => s.tipo === 'chip');
  const progresso = Math.min(1, frame / f(edicao.duracao));
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      {/* especialista, metade de baixo */}
      <AbsoluteFill style={{top: MEIO, height: 1920 - MEIO, overflow: 'hidden'}}>
        <OffthreadVideo src={staticFile(edicao.fala)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 26%'}} />
      </AbsoluteFill>
      {/* mídias, metade de cima */}
      {edicao.cenas.map((c, i) => {
        const ini = i === 0 ? c.em : c.em - SOBRE;
        return (
          <Sequence key={i} from={f(ini)} durationInFrames={f(c.ate) - f(ini)} layout="none">
            <Midia c={c} i={i} />
          </Sequence>
        );
      })}
      <AbsoluteFill style={{top: MEIO - 3, height: 6, background: cores.azulClaro, boxShadow: `0 0 18px ${cores.azulClaro}`}} />
      {/* barra de progresso e marca */}
      <AbsoluteFill style={{height: 8, width: 1080 * progresso, background: cores.azulClaro}} />
      <AbsoluteFill style={{top: 60, left: 'auto', right: 40, width: 'auto', height: 'auto'}}>
        <div style={{fontFamily: fonte, fontWeight: 700, fontSize: 30, color: '#fff', background: 'rgba(11,46,102,0.7)', padding: '8px 20px', borderRadius: 999}}>{marcaAtiva.handle}</div>
      </AbsoluteFill>
      {edicao.selos.map((s, i) => (
        <Sequence key={i} from={f(s.em)} durationInFrames={f(s.ate - s.em)}>
          <SeloView s={s} ordem={s.tipo === 'chip' ? chips.filter((x) => x.em < s.em && x.ate > s.em).length : 0} />
        </Sequence>
      ))}
      {edicao.legendas.map((g, i) => (
        <Sequence key={i} from={f(g.inicio)} durationInFrames={Math.max(1, f(Math.min(g.fim + 0.15, edicao.legendas[i + 1]?.inicio ?? g.fim + 0.15)) - f(g.inicio))}>
          <Legenda g={g} />
        </Sequence>
      ))}
      <Sequence from={f(edicao.duracao)}>
        <Cta cta={edicao.cta} />
      </Sequence>
      {edicao.selos.map((s, i) => (
        <Som key={i} arquivo={s.tipo === 'resposta' || s.tipo === 'titulo' ? 'sfx/impacto.wav' : 'sfx/pop.wav'} em={s.em} volume={0.45} />
      ))}
      <Som arquivo="sfx/brilho.wav" em={edicao.duracao + 0.2} volume={0.5} />
    </AbsoluteFill>
  );
};
