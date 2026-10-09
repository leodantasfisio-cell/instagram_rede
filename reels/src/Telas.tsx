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

// Texto do gancho nos primeiros segundos, no topo e longe das legendas.
export const Gancho: React.FC<{texto: string; duracao: number}> = ({texto, duracao}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const entra = spring({frame, fps, config: {damping: 200}, durationInFrames: 8});
  const sai = interpolate(frame, [duracao * fps - 8, duracao * fps], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill style={{alignItems: 'center', paddingTop: 250}}>
      <div
        style={{
          maxWidth: 900,
          padding: '26px 40px',
          borderRadius: 28,
          background: cores.branco,
          color: cores.azulEscuro,
          fontFamily: fonte,
          fontWeight: 800,
          fontSize: 62,
          lineHeight: 1.15,
          textAlign: 'center',
          boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
          opacity: Math.min(entra, sai),
          transform: `scale(${interpolate(entra, [0, 1], [0.92, 1])})`,
        }}
      >
        {texto}
      </div>
    </AbsoluteFill>
  );
};

export const Cta: React.FC<{titulo: string; subtitulo: string}> = ({titulo, subtitulo}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const fundo = interpolate(frame, [0, 10], [0, 1], {extrapolateRight: 'clamp'});
  const texto = spring({frame: frame - 6, fps, config: {damping: 200}, durationInFrames: 12});
  return (
    <AbsoluteFill
      style={{
        opacity: fundo,
        background: `linear-gradient(160deg, ${cores.azul} 0%, ${cores.azulEscuro} 100%)`,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 40,
        padding: 90,
        fontFamily: fonte,
        color: cores.branco,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontWeight: 800,
          fontSize: 84,
          lineHeight: 1.12,
          opacity: texto,
          transform: `translateY(${interpolate(texto, [0, 1], [30, 0])}px)`,
        }}
      >
        {titulo}
      </div>
      <div
        style={{
          fontWeight: 700,
          fontSize: 48,
          padding: '22px 44px',
          borderRadius: 999,
          background: cores.branco,
          color: cores.azul,
          opacity: texto,
        }}
      >
        {subtitulo}
      </div>
      <div style={{opacity: texto, marginTop: 30}}>
        <Selo />
      </div>
    </AbsoluteFill>
  );
};

export const CapaTexto: React.FC<{titulo: string; subtitulo?: string}> = ({titulo, subtitulo}) => (
  // Fica no centro para não ser cortado na grade 3:4 do perfil.
  <AbsoluteFill
    style={{
      justifyContent: 'center',
      alignItems: 'center',
      background: `linear-gradient(180deg, rgba(11,46,102,0.15) 0%, rgba(11,46,102,0.55) 45%, rgba(11,46,102,0.15) 100%)`,
      fontFamily: fonte,
      textAlign: 'center',
      gap: 28,
      padding: 80,
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
