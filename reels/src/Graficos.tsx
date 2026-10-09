import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {cores, fonte} from './marca';
import type {Etapa} from './tipos';

const sair = (frame: number, total: number) =>
  interpolate(frame, [total - 8, total], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

// Cartão "1 · Conversa..." no topo, enquanto a etapa é explicada.
export const CartaoEtapa: React.FC<{etapa: Etapa; total: number}> = ({etapa, total}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const entra = spring({frame, fps, config: {damping: 18, stiffness: 120}});
  const numero = spring({frame: frame - 5, fps, config: {damping: 12, stiffness: 160}});
  return (
    <AbsoluteFill style={{alignItems: 'center', paddingTop: 230}}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 26,
          maxWidth: 940,
          padding: '20px 36px 20px 20px',
          borderRadius: 30,
          background: 'rgba(255,255,255,0.96)',
          boxShadow: '0 14px 40px rgba(5,20,50,0.3)',
          fontFamily: fonte,
          opacity: Math.min(entra, sair(frame, total)),
          transform: `translateX(${interpolate(entra, [0, 1], [-140, 0])}px)`,
        }}
      >
        <div
          style={{
            flexShrink: 0,
            width: 104,
            height: 104,
            borderRadius: 24,
            background: cores.azul,
            color: cores.branco,
            fontWeight: 800,
            fontSize: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: `scale(${numero})`,
          }}
        >
          {etapa.numero}
        </div>
        <div style={{color: cores.azulEscuro, fontWeight: 800, fontSize: 44, lineHeight: 1.15}}>
          {etapa.titulo}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const BarraProgresso: React.FC<{total: number}> = ({total}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', top: 0, left: 0, right: 0, height: 10, background: 'rgba(255,255,255,0.35)'}}>
        <div style={{height: '100%', width: `${Math.min(1, frame / total) * 100}%`, background: cores.azul}} />
      </div>
    </AbsoluteFill>
  );
};
