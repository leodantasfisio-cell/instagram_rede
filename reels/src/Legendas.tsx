import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {cores, fonte} from './marca';
import {agruparLegendas, ehPalavraChave} from './tempo';
import type {Palavra} from './tipos';

export const Legendas: React.FC<{palavras: Palavra[]; palavrasChave: string[]}> = ({
  palavras,
  palavrasChave,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;

  const grupos = agruparLegendas(palavras);
  // Cada bloco fica na tela até o próximo começar, no máximo 0,4 s após a última palavra.
  const grupo = grupos.find((g, i) => {
    const fim = Math.min(grupos[i + 1]?.[0].inicio ?? Infinity, g[g.length - 1].fim + 0.4);
    return t >= g[0].inicio && t < fim;
  });
  if (!grupo) return null;

  const entrada = spring({frame: frame - Math.round(grupo[0].inicio * fps), fps, config: {damping: 200}, durationInFrames: 6});

  return (
    // Acima da área ocupada pela interface do Reels (legenda do post, botões).
    <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 560}}>
      <div
        style={{
          maxWidth: 880,
          textAlign: 'center',
          fontFamily: fonte,
          fontWeight: 800,
          fontSize: 66,
          lineHeight: 1.18,
          color: cores.branco,
          textShadow: `0 4px 18px ${cores.sombra}, 0 0 3px rgba(0,0,0,0.6)`,
          transform: `translateY(${interpolate(entrada, [0, 1], [14, 0])}px)`,
          opacity: entrada,
        }}
      >
        {grupo.map((p, i) => {
          const falando = t >= p.inicio && t < p.fim;
          const chave = ehPalavraChave(p.texto, palavrasChave);
          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                margin: '0 9px',
                color: chave ? cores.azulClaro : cores.branco,
                transform: `scale(${falando ? 1.06 : 1})`,
              }}
            >
              {p.texto}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
