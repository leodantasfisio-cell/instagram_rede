import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {cores, fonte} from './marca';

// Trilha de etapas: mapa do caminho em tela cheia, trilha fixa no topo, selo de cada etapa e ícones.
export type Trilha = {
  passos: string[];
  marcos: {passo: number; em: number}[];
  mapa: {em: number; duracao: number; antes: number; foco: number} | null;
  gancho: {linha1: string; linha2: string; em: number; em2: number; duracao: number} | null;
};

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const GRAFITE = '#202020';

// Gancho: "AMPUTOU." bate na tela com tremida; "E agora?" entra numa pílula verde.
export const Gancho: React.FC<{g: NonNullable<Trilha['gancho']>}> = ({g}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const bate = spring({frame, fps, config: {damping: 9, stiffness: 220}});
  const tremida = frame < 10 ? Math.sin(frame * 2.3) * (10 - frame) * 1.6 : 0;
  const linha2 = spring({frame: frame - g.em2 * fps, fps, config: {damping: 11, stiffness: 160}});
  const sai = interpolate(frame, [g.duracao * fps - 8, g.duracao * fps], [1, 0], clamp);
  return (
    <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 430, fontFamily: fonte, opacity: sai}}>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,30,15,0.7) 85%)'}} />
      <div
        style={{
          fontWeight: 800,
          fontSize: 170,
          letterSpacing: -4,
          color: cores.branco,
          textShadow: `0 8px 0 ${cores.azulEscuro}, 0 24px 50px rgba(0,0,0,0.55)`,
          transform: `translate(${tremida}px, ${-tremida / 2}px) scale(${interpolate(bate, [0, 1], [2.4, 1])})`,
          opacity: Math.min(1, bate * 2),
        }}
      >
        {g.linha1}
      </div>
      <div
        style={{
          marginTop: 10,
          padding: '16px 46px',
          borderRadius: 999,
          background: cores.azulClaro,
          color: cores.branco,
          fontWeight: 800,
          fontSize: 96,
          boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
          opacity: linha2,
          transform: `translateY(${interpolate(linha2, [0, 1], [60, 0])}px) rotate(${interpolate(linha2, [0, 1], [-8, -2])}deg)`,
        }}
      >
        {g.linha2}
      </div>
    </AbsoluteFill>
  );
};

// Ícones simples (traço branco) para etapas e treino.
const Icone: React.FC<{nome: string; tamanho: number; cor?: string}> = ({nome, tamanho, cor = cores.branco}) => {
  const p = {fill: 'none', stroke: cor, strokeWidth: 2.2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
  const desenhos: Record<string, React.ReactNode> = {
    // 1 cicatrização: curativo
    Cicatrização: (
      <g {...p}>
        <rect x="3" y="8.5" width="18" height="7" rx="3.5" transform="rotate(-35 12 12)" />
        <path d="M10.5 11.2h.01M13.5 12.8h.01M12 10.4h.01M12 13.6h.01" strokeWidth={2.8} />
      </g>
    ),
    // 2 preparação do coto: faixa enrolando
    'Preparação do coto': (
      <g {...p}>
        <path d="M8 3v13a4 4 0 0 0 8 0V3" />
        <path d="M8 7l8 3M8 11l8 3" />
      </g>
    ),
    // 3 condicionamento: haltere
    Condicionamento: (
      <g {...p}>
        <path d="M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5M6.5 12h11" />
      </g>
    ),
    // 4 avaliação: prancheta
    Avaliação: (
      <g {...p}>
        <rect x="5" y="4" width="14" height="17" rx="2" />
        <path d="M9 4V3h6v1M8.5 11l2 2 4-4M8.5 17h7" />
      </g>
    ),
    // 5 protetização: perna com prótese
    Protetização: (
      <g {...p}>
        <path d="M9 2.5h6l-.5 7h-5z" />
        <path d="M12 9.5v9M12 18.5c0 2 1 2.5 3.5 2.5H18" />
      </g>
    ),
    // 6 treino: pessoa andando
    Treino: (
      <g {...p}>
        <circle cx="13" cy="4" r="2" />
        <path d="M11 21l2-6-3-3 1-4 4 3 3 1M10 12l-3 3M13 15l3 6" />
      </g>
    ),
    // 7 autonomia: estrela/check
    Autonomia: (
      <g {...p}>
        <circle cx="12" cy="12" r="9" />
        <path d="M7.5 12.5l3 3 6-6.5" />
      </g>
    ),
    distancia: (
      <g {...p}>
        <path d="M4 19c4 0 3-7 8-7s4-7 8-7" strokeDasharray="2 3" />
        <circle cx="4" cy="19" r="1.6" fill={cor} />
        <path d="M20 2.5v5M20 2.5l3 1.4-3 1.4" />
      </g>
    ),
    rampaSobe: (
      <g {...p}>
        <path d="M3 20h18L3 9z" />
        <path d="M11 6l5-2.5L15 9" />
      </g>
    ),
    rampaDesce: (
      <g {...p}>
        <path d="M21 20H3L21 9z" />
        <path d="M8 3.5l5 2.5-4.5 2" />
      </g>
    ),
    escadaSobe: (
      <g {...p}>
        <path d="M3 20h4v-4h4v-4h4V8h5" />
        <path d="M5 9l5-5M10 4H6.5M10 4v3.5" />
      </g>
    ),
    escadaDesce: (
      <g {...p}>
        <path d="M21 20h-4v-4h-4v-4H9V8H4" />
        <path d="M14 4l5 5M19 9h-3.5M19 9V5.5" />
      </g>
    ),
  };
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24">
      {desenhos[nome]}
    </svg>
  );
};

// Posições do mapa: zigue-zague descendo a tela.
const NOS = [
  [270, 470],
  [810, 640],
  [270, 810],
  [810, 980],
  [270, 1150],
  [810, 1320],
  [540, 1520],
] as const;

const caminho = () =>
  NOS.slice(1).reduce((d, [x, y], i) => {
    const [px, py] = NOS[i];
    const my = (py + y) / 2;
    return `${d} C ${px} ${my}, ${x} ${my}, ${x} ${y}`;
  }, `M ${NOS[0][0]} ${NOS[0][1]}`);

export const Mapa: React.FC<{trilha: Trilha}> = ({trilha}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const m = trilha.mapa!;
  const t = frame / fps;
  const entra = interpolate(frame, [0, 8], [0, 1], clamp);
  const desenho = interpolate(t, [0.1, 1.4], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  // Fecha encolhendo para o topo, onde a trilha fixa continua.
  const fecha = interpolate(t, [m.duracao - 0.45, m.duracao], [0, 1], {...clamp, easing: Easing.in(Easing.cubic)});
  const antes = spring({frame: frame - m.antes * fps, fps, config: {damping: 14, stiffness: 120}});
  const foco = spring({frame: frame - m.foco * fps, fps, config: {damping: 10, stiffness: 140}});
  const pulso = 1 + 0.08 * Math.max(0, Math.sin((t - m.foco) * Math.PI * 3));
  const titulo = spring({frame: frame - 3, fps, config: {damping: 14}});
  return (
    <AbsoluteFill
      style={{
        opacity: entra * (1 - fecha),
        transform: `translateY(${-fecha * 700}px) scale(${1 - fecha * 0.7})`,
        fontFamily: fonte,
      }}
    >
      <AbsoluteFill style={{background: `radial-gradient(circle at 50% 40%, rgba(0,107,60,0.94) 0%, rgba(20,20,20,0.96) 100%)`}} />
      <div
        style={{
          position: 'absolute',
          top: 230,
          width: '100%',
          textAlign: 'center',
          color: cores.branco,
          fontWeight: 800,
          fontSize: 64,
          lineHeight: 1.1,
          opacity: titulo,
          transform: `translateY(${interpolate(titulo, [0, 1], [-30, 0])}px)`,
        }}
      >
        O caminho tem etapas
      </div>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        <path d={caminho()} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={14} strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - desenho} />
        <path d={caminho()} fill="none" stroke={cores.azulClaro} strokeWidth={14} strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - (antes * 2 + foco) / 6} />
      </svg>
      {/* Chave dos 3 primeiros passos: o corpo se prepara antes da prótese. */}
      <div
        style={{
          position: 'absolute',
          left: 60,
          top: 395,
          width: 960,
          height: 500,
          borderRadius: 40,
          border: `5px dashed ${cores.azulClaro}`,
          opacity: antes * (1 - interpolate(foco, [0, 1], [0, 0.6])),
          transform: `scale(${interpolate(antes, [0, 1], [0.9, 1])})`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 340,
          display: 'flex',
          justifyContent: 'center',
          opacity: antes,
          transform: `scale(${interpolate(antes, [0, 1], [0.6, 1])})`,
        }}
      >
        <div style={{padding: '10px 28px', borderRadius: 999, background: cores.branco, color: cores.azulEscuro, fontWeight: 800, fontSize: 38}}>
          Antes da prótese: o corpo se prepara
        </div>
      </div>
      {trilha.passos.map((nome, i) => {
        const [x, y] = NOS[i];
        const aparece = spring({frame: frame - (0.25 + i * 0.17) * fps, fps, config: {damping: 12, stiffness: 170}});
        const aceso = i < 3 ? antes : i === 3 ? foco : 0;
        const escala = interpolate(aparece, [0, 1], [0.3, 1]) * (i === 3 ? 1 + foco * 0.25 * pulso : 1);
        const direita = x < 540 || i === 6;
        return (
          <div key={nome} style={{position: 'absolute', left: x - 70, top: y - 70, width: 140, height: 140, opacity: aparece}}>
            <div
              style={{
                width: 140,
                height: 140,
                borderRadius: 70,
                background: aceso > 0.5 ? cores.azulClaro : GRAFITE,
                border: `6px solid ${cores.branco}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: `scale(${escala})`,
                boxShadow: aceso > 0.5 ? `0 0 ${50 * aceso}px ${cores.azulClaro}` : '0 10px 30px rgba(0,0,0,0.4)',
              }}
            >
              <Icone nome={nome} tamanho={78} />
            </div>
            <div
              style={{
                position: 'absolute',
                top: i === 6 ? 150 : 28,
                ...(i === 6 ? {left: -130, width: 400, textAlign: 'center'} : direita ? {left: 160, width: 420} : {right: 160, width: 420, textAlign: 'right'}),
                color: cores.branco,
                fontWeight: 800,
                fontSize: 44,
                lineHeight: 1.05,
                whiteSpace: nome.includes(' ') ? 'normal' : 'nowrap',
              }}
            >
              <span style={{color: cores.azulClaro}}>{i + 1}. </span>
              {nome}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// Trilha fixa no topo: 7 pontos, a pegada anda até a etapa atual; ao acender uma etapa, um selo grande aparece e sobe.
export const TrilhaTopo: React.FC<{trilha: Trilha; inicio: number}> = ({trilha, inicio}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = inicio + frame / fps;
  const n = trilha.passos.length;
  const x0 = 110;
  const x1 = 970;
  const px = (i: number) => x0 + ((x1 - x0) * i) / (n - 1);
  const marcos = [...trilha.marcos].sort((a, b) => a.em - b.em);
  // Posição contínua da pegada (índice da etapa, 0 a 6).
  const pos = marcos.reduce((p, m) => {
    const s = spring({frame: (t - m.em) * fps, fps, config: {damping: 16, stiffness: 90}});
    return t >= m.em ? p + (m.passo - 1 - p) * s : p;
  }, marcos[0] ? marcos[0].passo - 1 : 0);
  const entra = interpolate(frame, [0, 10], [0, 1], clamp);
  const ultimo = [...marcos].reverse().find((m) => m.em <= t);
  const atual = ultimo ? ultimo.passo : 0;
  const y = 170;
  return (
    <AbsoluteFill style={{fontFamily: fonte, opacity: entra}}>
      <div style={{position: 'absolute', left: x0, top: y - 5, width: x1 - x0, height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.45)'}} />
      <div style={{position: 'absolute', left: x0, top: y - 5, width: (px(pos) - x0), height: 10, borderRadius: 5, background: cores.azulClaro}} />
      {trilha.passos.map((nome, i) => {
        const feito = i < atual;
        const corrente = i === atual - 1;
        return (
          <div
            key={nome}
            style={{
              position: 'absolute',
              left: px(i) - (corrente ? 26 : 18),
              top: y - (corrente ? 26 : 18),
              width: corrente ? 52 : 36,
              height: corrente ? 52 : 36,
              borderRadius: 30,
              background: feito ? cores.azulClaro : 'rgba(32,32,32,0.85)',
              border: `4px solid ${cores.branco}`,
              color: cores.branco,
              fontWeight: 800,
              fontSize: corrente ? 26 : 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 16px rgba(0,0,0,0.35)',
            }}
          >
            {i + 1}
          </div>
        );
      })}
      <div style={{position: 'absolute', left: px(pos) - 24, top: y - 82, fontSize: 44, transform: `rotate(${Math.sin(t * 9) * 8}deg)`}}>👣</div>
      {atual ? (
        <div
          style={{
            position: 'absolute',
            top: y + 38,
            left: Math.min(Math.max(px(atual - 1) - 200, 30), 650),
            width: 400,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              padding: '8px 22px',
              borderRadius: 999,
              background: cores.branco,
              color: cores.azulEscuro,
              fontWeight: 800,
              fontSize: 32,
              boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
            }}
          >
            {trilha.passos[atual - 1]}
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// Selo grande da etapa que acabou de acender.
export const SeloEtapa: React.FC<{numero: number; nome: string; duracao: number}> = ({numero, nome, duracao}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const entra = spring({frame, fps, config: {damping: 11, stiffness: 170}});
  const sobe = interpolate(frame, [duracao * fps - 9, duracao * fps], [0, 1], {...clamp, easing: Easing.in(Easing.cubic)});
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 470, fontFamily: fonte}}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 24,
          padding: '22px 44px 22px 22px',
          borderRadius: 999,
          background: cores.branco,
          boxShadow: '0 20px 60px rgba(0,0,0,0.45)',
          opacity: entra * (1 - sobe),
          transform: `translateY(${-sobe * 1150}px) scale(${interpolate(entra, [0, 1], [0.4, 1]) * (1 - sobe * 0.6)}) rotate(${interpolate(entra, [0, 1], [-10, 0])}deg)`,
        }}
      >
        <div
          style={{
            width: 110,
            height: 110,
            borderRadius: 55,
            background: cores.azul,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icone nome={nome} tamanho={70} />
        </div>
        <div style={{color: GRAFITE}}>
          <div style={{fontWeight: 700, fontSize: 32, color: cores.azul}}>Etapa {numero}</div>
          <div style={{fontWeight: 800, fontSize: 64, lineHeight: 1}}>{nome}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Cartões do treino: entram um a um, no tempo da palavra; "distância" ocupa a linha inteira.
export const CartaoIcone: React.FC<{icone: string; texto: string; ordem: number; duracao: number}> = ({icone, texto, ordem, duracao}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const entra = spring({frame, fps, config: {damping: 12, stiffness: 180}});
  const sai = interpolate(frame, [duracao * fps - 6, duracao * fps], [1, 0], clamp);
  const larga = icone === 'distancia';
  const k = ordem - 1;
  const left = larga ? 60 : 60 + (k % 2) * 490;
  const top = larga ? 1200 : 1385 + Math.floor(k / 2) * 185;
  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        width: larga ? 960 : 470,
        height: 165,
        borderRadius: 32,
        background: 'rgba(255,255,255,0.97)',
        boxShadow: '0 16px 40px rgba(0,0,0,0.35)',
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        padding: '0 26px',
        fontFamily: fonte,
        fontWeight: 800,
        fontSize: larga ? 46 : 42,
        color: GRAFITE,
        opacity: Math.min(entra, sai),
        transform: `translateY(${interpolate(entra, [0, 1], [80, 0])}px) scale(${interpolate(entra, [0, 1], [0.7, 1])})`,
      }}
    >
      <div style={{width: 110, height: 110, borderRadius: 26, background: cores.azul, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
        <Icone nome={icone} tamanho={76} />
      </div>
      {texto}
    </div>
  );
};
