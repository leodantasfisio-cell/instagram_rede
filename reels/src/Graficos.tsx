import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {cores, fonte} from './marca';
import type {Escala, Etapa} from './tipos';

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

// Faixas de graus das diretrizes, aparecendo conforme cada uma é citada.
export const EscalaGraus: React.FC<{escala: Escala; total: number}> = ({escala, total}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const entra = spring({frame, fps, config: {damping: 200}, durationInFrames: 12});
  const tons = [cores.azulClaro, cores.azul, cores.azulEscuro];
  return (
    <AbsoluteFill style={{alignItems: 'center', paddingTop: 170}}>
      <div
        style={{
          width: 940,
          padding: '26px 30px 30px',
          borderRadius: 32,
          background: 'rgba(255,255,255,0.96)',
          boxShadow: '0 14px 40px rgba(5,20,50,0.3)',
          fontFamily: fonte,
          opacity: Math.min(entra, sair(frame, total)),
          transform: `translateY(${interpolate(entra, [0, 1], [-40, 0])}px)`,
        }}
      >
        <div
          style={{
            color: cores.azul,
            fontWeight: 800,
            fontSize: 30,
            letterSpacing: 3,
            textTransform: 'uppercase',
            marginBottom: 18,
          }}
        >
          {escala.titulo}
        </div>
        {escala.faixas.map((f, i) => {
          const local = frame - Math.round((f.em - escala.de) * fps);
          const barra = spring({frame: local, fps, config: {damping: 200}, durationInFrames: 14});
          const texto = spring({frame: local - 6, fps, config: {damping: 200}, durationInFrames: 10});
          // Faixa já citada fica mais clara quando a próxima aparece.
          const proxima = escala.faixas[i + 1];
          const ativa = !proxima || frame < Math.round((proxima.em - escala.de) * fps);
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 22,
                marginTop: i ? 14 : 0,
                opacity: local < 0 ? 0.18 : ativa ? 1 : 0.55,
              }}
            >
              <div
                style={{
                  flexShrink: 0,
                  width: 300,
                  height: 76,
                  borderRadius: 18,
                  background: '#E6EEF9',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: `${barra * 100}%`,
                    background: tons[i] ?? cores.azul,
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: barra > 0.5 ? cores.branco : cores.azulEscuro,
                    fontWeight: 800,
                    fontSize: 36,
                  }}
                >
                  {f.graus}
                </div>
              </div>
              <div
                style={{
                  color: cores.azulEscuro,
                  fontWeight: 700,
                  fontSize: 40,
                  lineHeight: 1.1,
                  opacity: local < 0 ? 0 : texto,
                  transform: `translateX(${interpolate(texto, [0, 1], [24, 0])}px)`,
                }}
              >
                {f.texto}
              </div>
            </div>
          );
        })}
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
