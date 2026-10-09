import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Coluna3D} from './Coluna3D';
import {cores, fonte} from './marca';
import type {Escala, Tela} from './tipos';

const ALTURA = 960;

const Cabecalho: React.FC<{tela: Tela}> = ({tela}) => (
  <div
    style={{
      position: 'absolute',
      top: 70,
      left: 0,
      right: 0,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 18,
      fontFamily: fonte,
      color: cores.branco,
    }}
  >
    {tela.numero ? (
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 18,
          background: cores.branco,
          color: cores.azul,
          fontWeight: 800,
          fontSize: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {tela.numero}
      </div>
    ) : null}
    <div style={{fontWeight: 800, fontSize: 40, letterSpacing: 2, textTransform: 'uppercase'}}>{tela.titulo}</div>
  </div>
);

const Ilustracao: React.FC = () => (
  <div
    style={{
      position: 'absolute',
      right: 36,
      bottom: 150,
      fontFamily: fonte,
      fontWeight: 500,
      fontSize: 24,
      color: 'rgba(255,255,255,0.65)',
    }}
  >
    Ilustração
  </div>
);

// Ângulo de Cobb desenhado passo a passo sobre uma coluna estilizada.
const Cobb: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = (de: number, ate: number) =>
    interpolate(frame, [de * fps, ate * fps], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    });
  const coluna = p(0.1, 1.0);
  const linhas = p(1.0, 1.8);
  const perp = p(1.8, 2.6);
  const arco = p(2.6, 3.3);
  // Curva em S estilizada; vértebras ao longo dela.
  const ponto = (s: number) => ({x: 540 + 70 * Math.sin(s * Math.PI * 2 - 0.6), y: 190 + s * 560});
  const vertebras = Array.from({length: 15}, (_, i) => i / 14);
  const sup = ponto(3 / 14);
  const inf = ponto(10 / 14);
  const angSup = -0.32;
  const angInf = 0.32;
  const L = 330 * linhas;
  const linha = (c: {x: number; y: number}, a: number, l: number) => ({
    x1: c.x - Math.cos(a) * l,
    y1: c.y - Math.sin(a) * l,
    x2: c.x + Math.cos(a) * l,
    y2: c.y + Math.sin(a) * l,
  });
  const ls = linha(sup, angSup, L);
  const li = linha(inf, angInf, L);
  // Perpendiculares saindo da ponta esquerda das linhas e se cruzando.
  const ps = {x: sup.x - Math.cos(angSup) * 250, y: sup.y - Math.sin(angSup) * 250};
  const pi = {x: inf.x - Math.cos(angInf) * 250, y: inf.y - Math.sin(angInf) * 250};
  const cruz = {x: 140, y: (ps.y + pi.y) / 2};
  return (
    <svg width={1080} height={ALTURA} viewBox={`0 0 1080 ${ALTURA}`}>
      {vertebras.map((s, i) => {
        const c = ponto(s);
        const visivel = interpolate(coluna, [i / 15, (i + 1) / 15], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        const inclinacao = (Math.cos(s * Math.PI * 2 - 0.6) * 0.45 * 180) / Math.PI / 2.4;
        const destaque = i === 3 || i === 10;
        return (
          <rect
            key={i}
            x={c.x - 46}
            y={c.y - 15}
            width={92}
            height={30}
            rx={8}
            fill={destaque ? cores.branco : 'rgba(255,255,255,0.55)'}
            opacity={visivel}
            transform={`rotate(${inclinacao} ${c.x} ${c.y})`}
          />
        );
      })}
      <g stroke={cores.branco} strokeWidth={6} strokeLinecap="round" opacity={linhas}>
        <line {...ls} />
        <line {...li} />
      </g>
      <g stroke={cores.azulClaro} strokeWidth={5} strokeDasharray="14 10" opacity={perp}>
        <line x1={ps.x} y1={ps.y} x2={ps.x + (cruz.x - ps.x) * perp} y2={ps.y + (cruz.y - ps.y) * perp} />
        <line x1={pi.x} y1={pi.y} x2={pi.x + (cruz.x - pi.x) * perp} y2={pi.y + (cruz.y - pi.y) * perp} />
      </g>
      <path
        d={`M ${cruz.x + 70} ${cruz.y - 40} A 80 80 0 0 1 ${cruz.x + 70} ${cruz.y + 40}`}
        fill="none"
        stroke={cores.branco}
        strokeWidth={7}
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - arco}
      />
      <text
        x={cruz.x + 100}
        y={cruz.y + 14}
        fill={cores.branco}
        fontFamily={fonte}
        fontWeight={800}
        fontSize={40}
        opacity={arco}
      >
        ângulo de Cobb
      </text>
    </svg>
  );
};

// Faixas de graus com o número da faixa atual girando em 3D.
const EscalaPainel: React.FC<{escala: Escala; inicio: number}> = ({escala, inicio}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = inicio + frame / fps;
  let atual = -1;
  escala.faixas.forEach((f, i) => {
    if (t >= f.em) atual = i;
  });
  const tons = [cores.azulClaro, cores.branco, '#FFD7D7'];
  return (
    // Conteúdo acima da faixa de baixo do painel, onde fica a legenda.
    <AbsoluteFill style={{alignItems: 'center', paddingTop: 170, fontFamily: fonte, color: cores.branco}}>
      <div style={{perspective: 1400, width: 1080, height: 300, position: 'relative'}}>
        {escala.faixas.map((f, i) => {
          const local = frame - Math.round((f.em - inicio) * fps);
          const entra = spring({frame: local, fps, config: {damping: 14, stiffness: 110}});
          const proxima = escala.faixas[i + 1];
          const saiLocal = proxima ? frame - Math.round((proxima.em - inicio) * fps) : -1;
          const sai = proxima ? spring({frame: saiLocal, fps, config: {damping: 200}, durationInFrames: 10}) : 0;
          if (local < 0 || sai >= 1) return null;
          const giro = interpolate(entra, [0, 1], [-95, 0]) + interpolate(sai, [0, 1], [0, 95]);
          // Camadas deslocadas dão profundidade de letra extrudada.
          const profundidade = Array.from({length: 10}, (_, k) => `0 ${k + 1}px 0 ${cores.azulEscuro}`).join(', ');
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 20,
                textAlign: 'center',
                whiteSpace: 'nowrap',
                fontWeight: 800,
                fontSize: 200,
                letterSpacing: -6,
                color: tons[i] ?? cores.branco,
                textShadow: `${profundidade}, 0 26px 40px rgba(0,0,0,0.35)`,
                transform: `rotateX(${giro}deg)`,
                transformOrigin: '50% 50% -60px',
                opacity: interpolate(Math.abs(giro), [0, 90], [1, 0], {extrapolateRight: 'clamp'}),
              }}
            >
              {f.numero}
            </div>
          );
        })}
      </div>
      <div style={{height: 70, fontWeight: 800, fontSize: 52, marginTop: 4}}>
        {atual >= 0 ? escala.faixas[atual].texto : ''}
      </div>
      <div style={{display: 'flex', gap: 14, marginTop: 26}}>
        {escala.faixas.map((f, i) => (
          <div
            key={i}
            style={{
              width: 270,
              height: 64,
              borderRadius: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 30,
              background: i === atual ? cores.branco : 'rgba(255,255,255,0.18)',
              color: i === atual ? cores.azul : 'rgba(255,255,255,0.85)',
              opacity: i <= atual ? 1 : 0.5,
              transform: `scale(${i === atual ? 1.06 : 1})`,
            }}
          >
            {f.graus}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// Metade de cima da tela dividida. `abertura` vai de 0 (fechado) a 1.
export const PainelSuperior: React.FC<{tela: Tela; escala: Escala | null; abertura: number}> = ({
  tela,
  escala,
  abertura,
}) => (
  <AbsoluteFill style={{height: ALTURA, transform: `translateY(${(abertura - 1) * ALTURA}px)`}}>
    <AbsoluteFill
      style={{
        height: ALTURA,
        background: `radial-gradient(circle at 50% 35%, ${cores.azul} 0%, ${cores.azulEscuro} 85%)`,
        borderBottom: `6px solid ${cores.branco}`,
        overflow: 'hidden',
      }}
    >
      {tela.tipo === 'escaneamento' ? (
        <AbsoluteFill style={{top: 40}}>
          <Coluna3D largura={1080} altura={ALTURA - 60} />
          <Ilustracao />
        </AbsoluteFill>
      ) : null}
      {tela.tipo === 'cobb' ? (
        <AbsoluteFill style={{top: 70}}>
          <Cobb />
          <Ilustracao />
        </AbsoluteFill>
      ) : null}
      {tela.tipo === 'escala' && escala ? <EscalaPainel escala={escala} inicio={tela.de} /> : null}
      <Cabecalho tela={tela} />
    </AbsoluteFill>
  </AbsoluteFill>
);
