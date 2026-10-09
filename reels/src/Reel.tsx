import {
  AbsoluteFill,
  Audio,
  interpolate,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {Legendas} from './Legendas';
import {Cta, Gancho} from './Telas';
import {duracaoFala, montarTrechos, palavrasNoReel} from './tempo';
import type {Apoio, Edicao} from './tipos';

// Volume com rampa curta nas pontas de cada corte, para não estalar.
const rampa = (f: number, total: number, n = 2) =>
  Math.min(1, (f + 1) / n, (total - f) / n);

const ApoioVisual: React.FC<{apoio: Apoio}> = ({apoio}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const total = Math.round(apoio.duracao * fps);
  const opacidade = interpolate(frame, [0, 6, total - 6, total], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const zoom = interpolate(frame, [0, total], [1.0, 1.06]);
  return (
    <AbsoluteFill style={{opacity: opacidade}}>
      <OffthreadVideo
        src={staticFile(apoio.arquivo)}
        trimBefore={Math.round((apoio.inicioNoArquivo ?? 0) * fps)}
        muted
        style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${zoom})`}}
      />
    </AbsoluteFill>
  );
};

export const Reel: React.FC<{edicao: Edicao}> = ({edicao}) => {
  const {fps} = useVideoConfig();
  const trechos = montarTrechos(edicao.cortes);
  const palavras = palavrasNoReel(edicao.transcricao, trechos);
  const fimFala = Math.round(duracaoFala(edicao.cortes) * fps);

  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      {trechos.map((t, i) => {
        const de = Math.round(t.inicioNoReel * fps);
        const total = Math.round((t.ate - t.de) * fps);
        // Zoom alternado esconde o salto entre cortes do mesmo plano.
        const zoom = i % 2 === 0 ? 1 : 1.07;
        return (
          <Sequence key={i} from={de} durationInFrames={total} layout="none">
            <AbsoluteFill>
              <OffthreadVideo
                src={staticFile(edicao.fonte)}
                trimBefore={Math.round(t.de * fps)}
                volume={(f) => rampa(f, total)}
                style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${zoom})`}}
              />
            </AbsoluteFill>
          </Sequence>
        );
      })}

      {edicao.apoio.map((a, i) => (
        <Sequence key={i} from={Math.round(a.em * fps)} durationInFrames={Math.round(a.duracao * fps)}>
          <ApoioVisual apoio={a} />
        </Sequence>
      ))}

      <Sequence durationInFrames={fimFala}>
        <Legendas palavras={palavras} palavrasChave={edicao.palavrasChave} />
      </Sequence>

      <Sequence durationInFrames={Math.round(edicao.gancho.duracao * fps)}>
        <Gancho texto={edicao.gancho.texto} duracao={edicao.gancho.duracao} />
      </Sequence>

      <Sequence from={fimFala}>
        <Cta titulo={edicao.cta.titulo} subtitulo={edicao.cta.subtitulo} />
      </Sequence>

      {edicao.musica ? (
        <Audio
          src={staticFile(edicao.musica.arquivo)}
          loop
          volume={(f) =>
            edicao.musica!.volume *
            interpolate(f, [0, fps, fimFala, fimFala + fps], [0, 1, 1, 2.5], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            })
          }
        />
      ) : null}
    </AbsoluteFill>
  );
};
