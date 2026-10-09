import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {cores, fonte} from './marca';

const Selo: React.FC = () => (
  <div
    style={{
      fontFamily: fonte,
      fontWeight: 700,
      fontSize: 34,
      letterSpacing: 1,
      color: cores.branco,
      opacity: 0.9,
    }}
  >
    @rede_escoliose_rn
  </div>
);

// Gancho: números grandes entrando em 3D, no topo, nos primeiros segundos.
export const Gancho: React.FC<{texto: string; subtexto?: string; duracao: number}> = ({texto, subtexto, duracao}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const entra = spring({frame, fps, config: {damping: 13, stiffness: 120}});
  const sub = spring({frame: frame - 8, fps, config: {damping: 200}, durationInFrames: 10});
  const sai = interpolate(frame, [duracao * fps - 8, duracao * fps], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const profundidade = Array.from({length: 8}, (_, k) => `0 ${k + 1}px 0 ${cores.azul}`).join(', ');
  return (
    <AbsoluteFill style={{alignItems: 'center', paddingTop: 210, opacity: sai, fontFamily: fonte}}>
      <div style={{perspective: 1200}}>
        <div
          style={{
            fontWeight: 800,
            fontSize: 118,
            letterSpacing: -3,
            color: cores.branco,
            textAlign: 'center',
            textShadow: `${profundidade}, 0 18px 36px rgba(0,0,0,0.45)`,
            transform: `rotateX(${interpolate(entra, [0, 1], [80, 0])}deg) scale(${interpolate(entra, [0, 1], [0.8, 1])})`,
            opacity: Math.min(1, entra * 1.5),
          }}
        >
          {texto}
        </div>
      </div>
      {subtexto ? (
        <div
          style={{
            marginTop: 18,
            padding: '14px 32px',
            borderRadius: 999,
            background: cores.branco,
            color: cores.azulEscuro,
            fontWeight: 800,
            fontSize: 44,
            opacity: sub,
            transform: `translateY(${interpolate(sub, [0, 1], [20, 0])}px)`,
          }}
        >
          {subtexto}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

const Telefone: React.FC<{tamanho: number; cor: string}> = ({tamanho, cor}) => (
  <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill={cor}>
    <path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z" />
  </svg>
);

// Tela final: resumo das 3 etapas e botão para agendar.
export const Cta: React.FC<{titulo: string; subtitulo: string; resumo?: string[]}> = ({titulo, subtitulo, resumo = []}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const fundo = interpolate(frame, [0, 10], [0, 1], {extrapolateRight: 'clamp'});
  const botao = spring({frame: frame - 6 - resumo.length * 6, fps, config: {damping: 12, stiffness: 120}});
  const pulso = 1 + 0.04 * Math.max(0, Math.sin(((frame - 30) / fps) * Math.PI * 2)) * (frame > 30 ? 1 : 0);
  return (
    <AbsoluteFill
      style={{
        opacity: fundo,
        background: `radial-gradient(circle at 50% 30%, ${cores.azul} 0%, ${cores.azulEscuro} 90%)`,
        alignItems: 'center',
        // Sem resumo, o bloco fica centralizado.
        ...(resumo.length ? {paddingTop: 300} : {justifyContent: 'center', paddingBottom: 200}),
        fontFamily: fonte,
        color: cores.branco,
      }}
    >
      <div style={{display: resumo.length ? 'flex' : 'none', flexDirection: 'column', gap: 22, width: 820}}>
        {resumo.map((r, i) => {
          const e = spring({frame: frame - 4 - i * 6, fps, config: {damping: 200}, durationInFrames: 10});
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 22,
                fontWeight: 700,
                fontSize: 44,
                opacity: e,
                transform: `translateX(${interpolate(e, [0, 1], [-60, 0])}px)`,
              }}
            >
              <div
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: 999,
                  background: cores.branco,
                  color: cores.azul,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: 34,
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </div>
              {r}
            </div>
          );
        })}
      </div>
      <div
        style={{
          marginTop: resumo.length ? 90 : 0,
          fontWeight: 800,
          fontSize: 78,
          lineHeight: 1.1,
          textAlign: 'center',
          maxWidth: 900,
          opacity: botao,
        }}
      >
        {titulo}
      </div>
      <div
        style={{
          marginTop: 40,
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          padding: '26px 54px',
          borderRadius: 999,
          background: cores.branco,
          color: cores.azul,
          fontWeight: 800,
          fontSize: 54,
          boxShadow: '0 16px 50px rgba(0,0,0,0.3)',
          opacity: botao,
          transform: `scale(${interpolate(botao, [0, 1], [0.7, 1]) * pulso})`,
        }}
      >
        <Telefone tamanho={54} cor={cores.azul} />
        {subtitulo}
      </div>
      <div style={{marginTop: 50, opacity: botao}}>
        <Selo />
      </div>
    </AbsoluteFill>
  );
};

export const CapaTexto: React.FC<{titulo: string; subtitulo?: string}> = ({titulo, subtitulo}) => (
  // Abaixo do rosto e dentro da área que a grade 3:4 do perfil mostra.
  <AbsoluteFill
    style={{
      justifyContent: 'flex-end',
      alignItems: 'center',
      paddingBottom: 380,
      background: `linear-gradient(180deg, rgba(11,46,102,0) 40%, rgba(11,46,102,0.7) 85%)`,
      fontFamily: fonte,
      textAlign: 'center',
      gap: 28,
    }}
  >
    <div
      style={{
        background: cores.branco,
        color: cores.azulEscuro,
        fontWeight: 800,
        fontSize: 92,
        lineHeight: 1.08,
        padding: '34px 48px',
        borderRadius: 32,
        maxWidth: 900,
      }}
    >
      {titulo}
    </div>
    {subtitulo ? (
      <div
        style={{
          background: cores.azul,
          color: cores.branco,
          fontWeight: 700,
          fontSize: 46,
          padding: '16px 36px',
          borderRadius: 999,
        }}
      >
        {subtitulo}
      </div>
    ) : null}
    <div style={{marginTop: 10}}>
      <Selo />
    </div>
  </AbsoluteFill>
);
