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
import {BarraProgresso, CartaoEtapa} from './Graficos';
import {Legendas} from './Legendas';
import {PainelSuperior} from './Paineis';
import {Cta, Gancho} from './Telas';
import {divisao, duracaoFala, montarTrechos, type Trecho as TrechoTempo} from './tempo';
import type {Apoio, Edicao, Etapa} from './tipos';

// Na tela dividida a fala desce para a metade de baixo.
const DESCIDA = 470;

// Volume com rampa curta nas pontas de cada corte, para não estalar.
const rampa = (f: number, total: number, n = 2) => Math.min(1, (f + 1) / n, (total - f) / n);

// Aproximação lenta em cada trecho, close na ênfase e "soco" de zoom nas viradas de assunto.
const Trecho: React.FC<{trecho: TrechoTempo; indice: number; edicao: Edicao; total: number}> = ({
  trecho,
  indice,
  edicao,
  total,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = trecho.inicioNoReel + frame / fps;
  const dividida = divisao(edicao.telas, t);
  const base = indice % 2 === 0 ? 1 : 1.06;
  const empurra = interpolate(frame, [0, total], [0, 0.04]);
  const close = edicao.enfase.reduce((z, em) => {
    const d = t - em;
    if (d < -0.2 || d > 2.2) return z;
    return Math.max(z, interpolate(d, [-0.2, 0.15, 1.6, 2.2], [0, 0.1, 0.1, 0], {easing: Easing.inOut(Easing.cubic)}));
  }, 0);
  const soco = edicao.transicoes.reduce((z, em) => {
    const d = t - em;
    if (d < 0 || d > 0.4) return z;
    return Math.max(z, interpolate(d, [0, 0.4], [0.14, 0], {easing: Easing.out(Easing.cubic)}));
  }, 0);
  const zoom = interpolate(dividida, [0, 1], [base + empurra + close, 1.02 + empurra]) + soco;
  return (
    <AbsoluteFill>
      <OffthreadVideo
        src={staticFile(edicao.fonte)}
        trimBefore={Math.round(trecho.de * fps)}
        playbackRate={edicao.velocidade}
        volume={(f) => rampa(f, total)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `translateY(${dividida * DESCIDA}px) scale(${zoom})`,
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
  const opacidade = interpolate(frame, [0, 5, total - 5, total], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const zoom = interpolate(frame, [0, total], [1.04, 1.12]);
  const metade = apoio.area === 'baixo';
  return (
    <AbsoluteFill style={metade ? {top: 960, height: 960, overflow: 'hidden'} : {}}>
      <AbsoluteFill style={{opacity: opacidade}}>
        <OffthreadVideo
          src={staticFile(apoio.arquivo)}
          muted
          style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${zoom})`}}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// Clarão branco curto nas viradas de assunto.
const Clarao: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#fff',
        opacity: interpolate(frame, [0, 2, 7], [0, 0.75, 0], {extrapolateRight: 'clamp'}),
      }}
    />
  );
};

const Painel: React.FC<{edicao: Edicao; indice: number; inicio: number}> = ({edicao, indice, inicio}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const tela = edicao.telas[indice];
  const abertura = divisao([tela], inicio + frame / fps);
  return <PainelSuperior tela={tela} escala={edicao.escala} abertura={abertura} />;
};

// O cartão da etapa some enquanto a tela está dividida (o painel já mostra a etapa).
const EtapaVisivel: React.FC<{etapa: Etapa; edicao: Edicao; total: number}> = ({etapa, edicao, total}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const dividida = divisao(edicao.telas, etapa.de + frame / fps);
  return (
    <AbsoluteFill style={{opacity: 1 - dividida}}>
      <CartaoEtapa etapa={etapa} total={total} />
    </AbsoluteFill>
  );
};

const Som: React.FC<{arquivo: string; em: number; volume?: number}> = ({arquivo, em, volume = 1}) => {
  const {fps} = useVideoConfig();
  return (
    <Sequence from={Math.max(0, Math.round(em * fps))} durationInFrames={Math.round(fps * 0.8)} layout="none">
      <Audio src={staticFile(arquivo)} volume={volume} />
    </Sequence>
  );
};

export const Reel: React.FC<{edicao: Edicao}> = ({edicao}) => {
  const {fps} = useVideoConfig();
  const trechos = montarTrechos(edicao.cortes, edicao.velocidade);
  const fimFala = Math.round(duracaoFala(edicao) * fps);
  const f = (s: number) => Math.round(s * fps);

  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      {trechos.map((t, i) => {
        const total = Math.round(t.duracaoNoReel * fps);
        return (
          <Sequence key={i} from={f(t.inicioNoReel)} durationInFrames={total} layout="none">
            <Trecho trecho={t} indice={i} edicao={edicao} total={total} />
          </Sequence>
        );
      })}

      {edicao.telas.map((tela, i) => (
        <Sequence key={i} from={f(tela.de - 0.35)} durationInFrames={f(tela.ate - tela.de + 0.7)}>
          <Painel edicao={edicao} indice={i} inicio={tela.de - 0.35} />
        </Sequence>
      ))}

      {edicao.apoio.map((a, i) => (
        <Sequence key={i} from={f(a.em)} durationInFrames={f(a.duracao)}>
          <ApoioVisual apoio={a} />
        </Sequence>
      ))}

      {edicao.etapas.map((e) => (
        <Sequence key={e.numero} from={f(e.de)} durationInFrames={f(e.ate - e.de)}>
          <EtapaVisivel etapa={e} edicao={edicao} total={f(e.ate - e.de)} />
        </Sequence>
      ))}

      {edicao.mostrarLegendas !== false ? (
        <Sequence durationInFrames={fimFala}>
            <Legendas palavras={edicao.legendas} palavrasChave={edicao.palavrasChave} telas={edicao.telas} />
        </Sequence>
      ) : null}

      <Sequence durationInFrames={fimFala}>
        <BarraProgresso total={fimFala} />
      </Sequence>

      {edicao.gancho ? (
        <Sequence durationInFrames={f(edicao.gancho.duracao)}>
          <Gancho texto={edicao.gancho.texto} subtexto={edicao.gancho.subtexto} duracao={edicao.gancho.duracao} />
        </Sequence>
      ) : null}

      {edicao.transicoes.map((em, i) => (
        <Sequence key={i} from={f(em)} durationInFrames={8}>
          <Clarao />
        </Sequence>
      ))}

      <Sequence from={fimFala}>
        <Cta titulo={edicao.cta.titulo} subtitulo={edicao.cta.subtitulo} resumo={edicao.cta.resumo} />
      </Sequence>

      {edicao.efeitos ? (
        <>
          {edicao.transicoes.map((em, i) => (
            <Som key={`t${i}`} arquivo="sfx/whoosh.wav" em={em - 0.2} volume={0.45} />
          ))}
          {edicao.telas.map((tela, i) => (
            <Som key={`s${i}`} arquivo="sfx/whoosh.wav" em={tela.de - 0.35} volume={0.3} />
          ))}
          {edicao.etapas.map((e) => (
            <Som key={`e${e.numero}`} arquivo="sfx/pop.wav" em={e.de + 0.1} volume={0.5} />
          ))}
          {(edicao.escala?.faixas ?? []).map((fx, i) => (
            <Som key={`f${i}`} arquivo="sfx/pop.wav" em={fx.em} volume={0.6} />
          ))}
          {edicao.gancho ? <Som arquivo="sfx/brilho.wav" em={0.05} volume={0.5} /> : null}
          <Som arquivo="sfx/brilho.wav" em={fimFala / fps + 0.5} volume={0.5} />
        </>
      ) : null}

      {edicao.musica ? (
        <Audio
          src={staticFile(edicao.musica.arquivo)}
          loop
          volume={(fr) =>
            edicao.musica!.volume *
            interpolate(fr, [0, fps, fimFala, fimFala + fps], [0, 1, 1, 2.5], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            })
          }
        />
      ) : null}
    </AbsoluteFill>
  );
};
