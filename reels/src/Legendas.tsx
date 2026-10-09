import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {cores, fonte} from './marca';
import {agruparLegendas, divisao, ehPalavraChave} from './tempo';
import type {Palavra, Tela} from './tipos';

export const Legendas: React.FC<{palavras: Palavra[]; palavrasChave: string[]; telas: Tela[]}> = ({
  palavras,
  palavrasChave,
  telas,
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
  // Tela cheia: acima da interface do Reels. Tela dividida: na linha do meio.
  const baixo = interpolate(divisao(telas, t), [0, 1], [560, 880]);

  return (
    <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: baixo}}>
      <div
        style={{
          maxWidth: 900,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          columnGap: 30,
          rowGap: 6,
          fontFamily: fonte,
          fontWeight: 800,
          fontSize: 66,
          lineHeight: 1.18,
          color: cores.branco,
          // Contorno escuro para ler sobre qualquer fundo.
          WebkitTextStroke: '8px rgba(5, 20, 50, 0.9)',
          paintOrder: 'stroke fill',
          textShadow: `0 6px 20px ${cores.sombra}`,
          transform: `translateY(${interpolate(entrada, [0, 1], [14, 0])}px)`,
          opacity: entrada,
        }}
      >
        {grupo.map((p, i) => {
          const falando = t >= p.inicio && t < p.fim;
          // Karaokê: palavras ainda não ditas ficam mais apagadas.
          const dita = t >= p.inicio;
          const chave = ehPalavraChave(p.texto, palavrasChave);
          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                color: cores.branco,
                opacity: dita ? 1 : 0.5,
                // Palavra-chave: faixa azul da marca atrás do texto.
                ...(chave && dita
                  ? {background: cores.azul, borderRadius: 14, padding: '0 14px', WebkitTextStroke: '0px', textShadow: 'none'}
                  : {}),
                transform: `scale(${falando ? 1.08 : 1})`,
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
