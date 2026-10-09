import {AbsoluteFill, Composition, OffthreadVideo, Still, staticFile} from 'remotion';
import edicaoJson from '../data/edicao.json';
import './marca';
import {Reel} from './Reel';
import {CapaTexto} from './Telas';
import {duracaoTotal, montarTrechos} from './tempo';
import type {Edicao} from './tipos';

const edicao = edicaoJson as Edicao;

// A capa usa um frame do Reel editado (capa.frame, em segundos do Reel).
const Capa: React.FC<{edicao: Edicao}> = ({edicao}) => {
  const trechos = montarTrechos(edicao.cortes, edicao.velocidade);
  const t =
    trechos.find((c) => edicao.capa.frame >= c.inicioNoReel && edicao.capa.frame < c.inicioNoReel + c.duracaoNoReel) ??
    trechos[0];
  const origem = t.de + (edicao.capa.frame - t.inicioNoReel) * edicao.velocidade;
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <OffthreadVideo
        src={staticFile(edicao.fonte)}
        trimBefore={Math.max(0, Math.round(origem * edicao.fps))}
        muted
        style={{width: '100%', height: '100%', objectFit: 'cover'}}
      />
      <CapaTexto titulo={edicao.capa.titulo} subtitulo={edicao.capa.subtitulo} />
    </AbsoluteFill>
  );
};

export const Root: React.FC = () => (
  <>
    <Composition
      id="Reel"
      component={Reel}
      width={1080}
      height={1920}
      fps={edicao.fps}
      durationInFrames={Math.round(duracaoTotal(edicao) * edicao.fps)}
      defaultProps={{edicao}}
    />
    <Still id="Capa" component={Capa} width={1080} height={1920} defaultProps={{edicao}} />
  </>
);
