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
import {Legendas} from './Legendas';
import {aplicarMarca, cores, fonte, marcaAtiva, marcas} from './marca';
import type {Palavra} from './tipos';

// Reel montado a partir de vários clipes (ver scripts/montar_montagem.py).
export type TrechoVideo = {
  arquivo: string;
  de: number;
  velocidade: number;
  em: number;
  duracao: number;
  volume: number;
  congelar?: boolean;
};
export type TrechoAudio = {arquivo: string; de: number; velocidade: number; em: number; duracao: number};
export type Texto =
  | {tipo: 'destaque'; em: number; duracao: number; valor: string; sub?: string}
  | {tipo: 'pilula'; em: number; duracao: number; texto: string; ordem: number}
  | {tipo: 'seta'; em: number; duracao: number; texto: string; x: number; y: number; rotulo: [number, number]; ordem: number};
export type Bloco = {id: string; em: number; duracao: number; painel?: string | null};
export type EdicaoMontagem = {
  fps: number;
  marca: keyof typeof marcas;
  video: TrechoVideo[];
  audio: TrechoAudio[];
  textos: Texto[];
  blocos: Bloco[];
  cta: {titulo: string; botao: string; rodape: string; duracao: number};
  duracaoFala: number;
  legendas?: Palavra[];
  palavrasChave?: string[];
  impactos?: number[];
};

const DESCIDA = 470;

const divisaoPainel = (blocos: Bloco[], t: number, tr = 0.3) =>
  blocos
    .filter((b) => b.painel)
    .reduce(
      (v, b) =>
        Math.max(
          v,
          interpolate(t, [b.em - tr, b.em, b.em + b.duracao - 0.1, b.em + b.duracao + tr - 0.1], [0, 1, 1, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.inOut(Easing.cubic),
          }),
        ),
      0,
    );

// Cada trecho entra com um "soco" de zoom; nas viradas de bloco, alterna clarão e zoom com desfoque.
const Segmento: React.FC<{seg: TrechoVideo; indice: number; viradaTipo: number | null; blocos: Bloco[]}> = ({
  seg,
  indice,
  viradaTipo,
  blocos,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const total = Math.round(seg.duracao * fps);
  const t = seg.em + frame / fps;
  const entrada = interpolate(frame, [0, 7], [0.12, 0], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const empurra = interpolate(frame, [0, total], [1.02, 1.08]);
  const giro = (indice % 2 === 0 ? 1 : -1) * interpolate(frame, [0, total], [0.6, 0]);
  const desfoque = viradaTipo === 1 ? interpolate(frame, [0, 6], [14, 0], {extrapolateRight: 'clamp'}) : 0;
  const dividida = divisaoPainel(blocos, t);
  const volume = (f: number) => seg.volume * Math.min(1, (f + 1) / 2, (total - f) / 2);
  if (seg.congelar) {
    return (
      <AbsoluteFill>
        <Freeze frame={0}>
          <OffthreadVideo
            src={staticFile(seg.arquivo)}
            trimBefore={Math.round(seg.de * fps)}
            muted
            style={{width: '100%', height: '100%', objectFit: 'cover'}}
          />
        </Freeze>
        <AbsoluteFill style={{backgroundColor: 'rgba(0,0,0,0.25)'}} />
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill>
      <OffthreadVideo
        src={staticFile(seg.arquivo)}
        trimBefore={Math.round(seg.de * fps)}
        playbackRate={seg.velocidade}
        volume={seg.volume ? volume : 0}
        muted={!seg.volume}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `translateY(${dividida * DESCIDA}px) scale(${empurra + entrada}) rotate(${giro}deg)`,
          filter: desfoque ? `blur(${desfoque}px)` : undefined,
        }}
      />
      {viradaTipo === 0 ? (
        <AbsoluteFill
          style={{backgroundColor: '#fff', opacity: interpolate(frame, [0, 2, 7], [0.8, 0.6, 0], {extrapolateRight: 'clamp'})}}
        />
      ) : null}
    </AbsoluteFill>
  );
};

const Destaque: React.FC<{valor: string; sub?: string; duracao: number}> = ({valor, sub, duracao}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const entra = spring({frame, fps, config: {damping: 12, stiffness: 130}});
  const subE = spring({frame: frame - 8, fps, config: {damping: 200}, durationInFrames: 10});
  const sai = interpolate(frame, [duracao * fps - 6, duracao * fps], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const profundidade = Array.from({length: 12}, (_, k) => `0 ${k + 1}px 0 ${cores.azulEscuro}`).join(', ');
  return (
    <AbsoluteFill style={{alignItems: 'center', paddingTop: 230, fontFamily: fonte, opacity: sai}}>
      <div style={{perspective: 1200}}>
        <div
          style={{
            fontWeight: 800,
            fontSize: 210,
            letterSpacing: -6,
            color: cores.branco,
            textShadow: `${profundidade}, 0 24px 40px rgba(0,0,0,0.45)`,
            transform: `rotateX(${interpolate(entra, [0, 1], [85, 0])}deg) scale(${interpolate(entra, [0, 1], [0.6, 1])})`,
            opacity: Math.min(1, entra * 1.6),
          }}
        >
          {valor}
        </div>
      </div>
      {sub ? (
        <div
          style={{
            marginTop: 6,
            padding: '14px 30px',
            borderRadius: 999,
            background: cores.azul,
            color: cores.branco,
            fontWeight: 800,
            fontSize: 42,
            opacity: subE,
            transform: `translateY(${interpolate(subE, [0, 1], [20, 0])}px)`,
          }}
        >
          {sub}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

const Pilula: React.FC<{texto: string; ordem: number; duracao: number}> = ({texto, ordem, duracao}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const entra = spring({frame, fps, config: {damping: 14, stiffness: 150}});
  const sai = interpolate(frame, [duracao * fps - 6, duracao * fps], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{paddingTop: 250 + ordem * 118, paddingLeft: 60, fontFamily: fonte}}>
      <div
        style={{
          alignSelf: 'flex-start',
          display: 'flex',
          alignItems: 'center',
          gap: 18,
          padding: '18px 34px 18px 22px',
          borderRadius: 22,
          background: 'rgba(255,255,255,0.96)',
          boxShadow: '0 12px 36px rgba(0,0,0,0.3)',
          color: '#202020',
          fontWeight: 800,
          fontSize: 50,
          opacity: Math.min(entra, sai),
          transform: `translateX(${interpolate(entra, [0, 1], [-200, 0])}px) scale(${interpolate(entra, [0, 1], [0.85, 1])})`,
        }}
      >
        <div style={{width: 14, height: 54, borderRadius: 7, background: cores.azul}} />
        {texto}
      </div>
    </AbsoluteFill>
  );
};

const Seta: React.FC<{texto: string; x: number; y: number; rotulo: [number, number]; duracao: number}> = ({
  texto,
  x,
  y,
  rotulo,
  duracao,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const linha = interpolate(frame, [0, 8], [0, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const rot = spring({frame: frame - 4, fps, config: {damping: 14, stiffness: 150}});
  const sai = interpolate(frame, [duracao * fps - 5, duracao * fps], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const pulso = 1 + 0.25 * Math.abs(Math.sin((frame / fps) * Math.PI * 2));
  const [lx, ly] = rotulo;
  const largura = 40 + texto.length * 27;
  const ax = lx + largura;
  const ay = ly + 40;
  return (
    <AbsoluteFill style={{opacity: sai}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        <line
          x1={ax}
          y1={ay}
          x2={ax + (x - ax) * linha}
          y2={ay + (y - ay) * linha}
          stroke={cores.branco}
          strokeWidth={6}
          strokeLinecap="round"
        />
        <circle cx={x} cy={y} r={16 * pulso * linha} fill={cores.azulClaro} stroke={cores.branco} strokeWidth={5} />
      </svg>
      <div
        style={{
          position: 'absolute',
          left: lx,
          top: ly,
          width: largura,
          height: 80,
          borderRadius: 20,
          background: cores.branco,
          color: '#202020',
          fontFamily: fonte,
          fontWeight: 800,
          fontSize: 44,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
          borderLeft: `12px solid ${cores.azul}`,
          opacity: rot,
          transform: `scale(${interpolate(rot, [0, 1], [0.7, 1])})`,
        }}
      >
        {texto}
      </div>
    </AbsoluteFill>
  );
};

// Ilustração: quadril balançando entre uma perna longa e uma curta (20 cm).
const PainelPernas: React.FC<{abertura: number}> = ({abertura}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const passo = Math.sin(t * Math.PI * 1.6);
  const inclinacao = 6 + 5 * passo;
  const regua = interpolate(frame, [12, 30], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const cx = 540;
  const quadrilY = 300;
  const esq = {x: cx - 120, topo: quadrilY + Math.tan((inclinacao * Math.PI) / 180) * -120};
  const dir = {x: cx + 120, topo: quadrilY + Math.tan((inclinacao * Math.PI) / 180) * 120};
  const chao = 820;
  const curta = 200;
  return (
    <AbsoluteFill style={{height: 960, transform: `translateY(${(abertura - 1) * 960}px)`}}>
      <AbsoluteFill
        style={{
          height: 960,
          background: `radial-gradient(circle at 50% 35%, ${cores.azul} 0%, ${cores.azulEscuro} 85%)`,
          borderBottom: `6px solid ${cores.branco}`,
          overflow: 'hidden',
        }}
      >
        <svg width={1080} height={960} viewBox="0 0 1080 960">
          <line x1={120} y1={chao} x2={960} y2={chao} stroke="rgba(255,255,255,0.35)" strokeWidth={4} />
          <line x1={esq.x} y1={esq.topo} x2={esq.x} y2={chao} stroke={cores.branco} strokeWidth={58} strokeLinecap="round" />
          <line x1={dir.x} y1={dir.topo} x2={dir.x} y2={chao - curta} stroke={cores.branco} strokeWidth={58} strokeLinecap="round" />
          <g transform={`rotate(${inclinacao} ${cx} ${quadrilY})`}>
            <rect x={cx - 210} y={quadrilY - 38} width={420} height={76} rx={38} fill={cores.azulClaro} />
          </g>
          <g opacity={regua} stroke={cores.branco} strokeWidth={5}>
            <line x1={dir.x + 70} y1={chao - curta} x2={dir.x + 70} y2={chao} />
            <line x1={dir.x + 50} y1={chao - curta} x2={dir.x + 90} y2={chao - curta} />
            <line x1={dir.x + 50} y1={chao} x2={dir.x + 90} y2={chao} />
          </g>
          <text x={dir.x + 110} y={chao - curta / 2 + 22} fill={cores.branco} opacity={regua} fontFamily={fonte} fontWeight={800} fontSize={64}>
            20 cm
          </text>
          <text x={36} y={930} fill="rgba(255,255,255,0.6)" fontFamily={fonte} fontWeight={500} fontSize={24}>
            Ilustração
          </text>
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const PainelSequencia: React.FC<{bloco: Bloco; blocos: Bloco[]}> = ({bloco, blocos}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const abertura = divisaoPainel(blocos, bloco.em - 0.3 + frame / fps);
  return <PainelPernas abertura={abertura} />;
};

const Enviar: React.FC<{tamanho: number; cor: string}> = ({tamanho, cor}) => (
  <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill={cor}>
    <path d="M2.5 11.2 20.6 3.4c.8-.3 1.5.4 1.2 1.2l-7.8 18.1c-.3.8-1.5.8-1.8-.1l-2-6.6-6.6-2c-.9-.3-.9-1.5-.1-1.8z" />
  </svg>
);

const Final: React.FC<{cta: EdicaoMontagem['cta']}> = ({cta}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const fundo = interpolate(frame, [0, 8], [0, 1], {extrapolateRight: 'clamp'});
  const titulo = spring({frame: frame - 4, fps, config: {damping: 14, stiffness: 120}});
  const botao = spring({frame: frame - 12, fps, config: {damping: 11, stiffness: 120}});
  const pulso = frame > 30 ? 1 + 0.04 * Math.max(0, Math.sin(((frame - 30) / fps) * Math.PI * 2)) : 1;
  return (
    <AbsoluteFill
      style={{
        opacity: fundo,
        background: `radial-gradient(circle at 50% 30%, ${cores.azulClaro} 0%, ${cores.azul} 45%, ${cores.azulEscuro} 100%)`,
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 200,
        fontFamily: fonte,
        color: cores.branco,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontWeight: 800,
          fontSize: 84,
          lineHeight: 1.1,
          maxWidth: 900,
          opacity: titulo,
          transform: `translateY(${interpolate(titulo, [0, 1], [40, 0])}px)`,
        }}
      >
        {cta.titulo}
      </div>
      <div
        style={{
          marginTop: 50,
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          padding: '26px 52px',
          borderRadius: 999,
          background: cores.branco,
          color: cores.azulEscuro,
          fontWeight: 800,
          fontSize: 52,
          boxShadow: '0 16px 50px rgba(0,0,0,0.3)',
          opacity: botao,
          transform: `scale(${interpolate(botao, [0, 1], [0.7, 1]) * pulso})`,
        }}
      >
        <Enviar tamanho={50} cor={cores.azul} />
        {cta.botao}
      </div>
      <div style={{marginTop: 60, fontWeight: 700, fontSize: 40, opacity: botao}}>{cta.rodape}</div>
      <div style={{marginTop: 14, fontWeight: 700, fontSize: 36, opacity: botao * 0.9}}>{marcaAtiva.handle}</div>
    </AbsoluteFill>
  );
};

const Progresso: React.FC<{total: number}> = ({total}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', top: 0, left: 0, right: 0, height: 10, background: 'rgba(255,255,255,0.35)'}}>
        <div style={{height: '100%', width: `${Math.min(1, frame / total) * 100}%`, background: cores.azulClaro}} />
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

export const Montagem: React.FC<{edicao: EdicaoMontagem}> = ({edicao}) => {
  aplicarMarca(edicao.marca);
  const {fps} = useVideoConfig();
  const f = (s: number) => Math.round(s * fps);
  const fimFala = f(edicao.duracaoFala);
  const inicioBloco = new Set(edicao.blocos.map((b) => f(b.em)));
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      {edicao.video.map((seg, i) => {
        const virada = i > 0 && inicioBloco.has(f(seg.em));
        const indiceBloco = edicao.blocos.findIndex((b) => f(b.em) === f(seg.em));
        return (
          <Sequence key={i} from={f(seg.em)} durationInFrames={Math.max(1, f(seg.em + seg.duracao) - f(seg.em))} layout="none">
            <Segmento seg={seg} indice={i} viradaTipo={virada ? indiceBloco % 2 : null} blocos={edicao.blocos} />
          </Sequence>
        );
      })}

      {edicao.audio.map((a, i) => (
        <Sequence key={i} from={f(a.em)} durationInFrames={f(a.duracao)} layout="none">
          <Audio src={staticFile(a.arquivo)} trimBefore={Math.round(a.de * fps)} playbackRate={a.velocidade} />
        </Sequence>
      ))}

      {edicao.blocos
        .filter((b) => b.painel)
        .map((b) => (
          <Sequence key={b.id} from={f(b.em - 0.3)} durationInFrames={f(b.duracao + 0.6)}>
            <PainelSequencia bloco={b} blocos={edicao.blocos} />
          </Sequence>
        ))}

      {edicao.textos.map((tx, i) => (
        <Sequence key={i} from={f(tx.em)} durationInFrames={f(tx.duracao)}>
          {tx.tipo === 'destaque' ? (
            <Destaque valor={tx.valor} sub={tx.sub} duracao={tx.duracao} />
          ) : tx.tipo === 'seta' ? (
            <Seta texto={tx.texto} x={tx.x} y={tx.y} rotulo={tx.rotulo} duracao={tx.duracao} />
          ) : (
            <Pilula texto={tx.texto} ordem={tx.ordem} duracao={tx.duracao} />
          )}
        </Sequence>
      ))}

      {edicao.legendas?.length ? (
        <Sequence durationInFrames={fimFala}>
          <Legendas palavras={edicao.legendas} palavrasChave={edicao.palavrasChave ?? []} telas={[]} />
        </Sequence>
      ) : null}

      <Sequence durationInFrames={fimFala}>
        <Progresso total={fimFala} />
      </Sequence>

      <Sequence from={fimFala}>
        <Final cta={edicao.cta} />
      </Sequence>

      {edicao.blocos.slice(1).map((b) => (
        <Som key={b.id} arquivo="sfx/whoosh.wav" em={b.em - 0.18} volume={0.35} />
      ))}
      {edicao.textos.map((tx, i) => (
        <Som key={`p${i}`} arquivo={tx.tipo === 'destaque' ? 'sfx/brilho.wav' : 'sfx/pop.wav'} em={tx.em} volume={0.5} />
      ))}
      {(edicao.impactos ?? []).map((em, i) => (
        <Som key={`i${i}`} arquivo="sfx/impacto.wav" em={em} volume={0.8} />
      ))}
      <Som arquivo="sfx/whoosh.wav" em={edicao.duracaoFala - 0.18} volume={0.4} />
      <Som arquivo="sfx/brilho.wav" em={edicao.duracaoFala + 0.4} volume={0.5} />
    </AbsoluteFill>
  );
};
