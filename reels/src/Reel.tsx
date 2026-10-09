import {
  AbsoluteFill,
  Audio,
  Easing,
  interpolate,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {BarraProgresso, CartaoEtapa, EscalaGraus} from './Graficos';
import {Legendas} from './Legendas';
import {Cta, Gancho} from './Telas';
import {duracaoFala, montarTrechos, palavrasNoReel} from './tempo';
import type {Apoio, Edicao} from './tipos';

// Volume com rampa curta nas pontas de cada corte, para não estalar.
const rampa = (f: number, total: number, n = 2) =>
  Math.min(1, (f + 1) / n, (total - f) / n);

// Aproximação lenta e contínua em cada trecho, com close nos momentos de ênfase.
const Trecho: React.FC<{
  fonte: string;
  inicioNoReel: number;
  inicioNaFonte: number;
  total: number;
  indice: number;
  enfase: number[];
}> = ({fonte, inicioNoReel, inicioNaFonte, total, indice, enfase}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = inicioNoReel + frame / fps;
  // Base alternada esconde o salto entre cortes do mesmo plano.
  const base = indice % 2 === 0 ? 1 : 1.06;
  const empurra = interpolate(frame, [0, total], [0, 0.04]);
  const close = enfase.reduce((z, em) => {
    const d = t - em;
    if (d < -0.2 || d > 2.2) return z;
    return Math.max(z, interpolate(d, [-0.2, 0.15, 1.6, 2.2], [0, 0.1, 0.1, 0], {easing: Easing.inOut(Easing.cubic)}));
  }, 0);
  return (
    <AbsoluteFill>
      <OffthreadVideo
        src={staticFile(fonte)}
        trimBefore={Math.round(inicioNaFonte * fps)}
        volume={(f) => rampa(f, total)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `scale(${base + empurra + close})`,
          transformOrigin: '50% 38%',
        }}
      />
    </AbsoluteFill>
  );
};

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
        return (
          <Sequence key={i} from={de} durationInFrames={total} layout="none">
            <Trecho
              fonte={edicao.fonte}
              inicioNoReel={t.inicioNoReel}
              inicioNaFonte={t.de}
              total={total}
              indice={i}
              enfase={edicao.enfase}
            />
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

      {edicao.etapas.map((e) => {
        const total = Math.round((e.ate - e.de) * fps);
        return (
          <Sequence key={e.numero} from={Math.round(e.de * fps)} durationInFrames={total}>
            <CartaoEtapa etapa={e} total={total} />
          </Sequence>
        );
      })}

      {edicao.escala ? (
        <Sequence
          from={Math.round(edicao.escala.de * fps)}
          durationInFrames={Math.round((edicao.escala.ate - edicao.escala.de) * fps)}
        >
          <EscalaGraus
            escala={edicao.escala}
            total={Math.round((edicao.escala.ate - edicao.escala.de) * fps)}
          />
        </Sequence>
      ) : null}

      <Sequence durationInFrames={fimFala}>
        <BarraProgresso total={fimFala} />
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
