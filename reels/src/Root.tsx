import {AbsoluteFill, Composition, OffthreadVideo, Still, staticFile} from 'remotion';
import edicaoJson from '../data/edicao.json';
import ortese20cmJson from '../projetos/ortese20cm/edicao.json';
import amputeiJson from '../projetos/amputei/edicao.json';
import {CapaMontagem, Montagem, type EdicaoMontagem} from './Montagem';
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
    <Composition
      id="Ortese20cm"
      component={Montagem}
      width={1080}
      height={1920}
      fps={30}
      durationInFrames={Math.round(((ortese20cmJson as EdicaoMontagem).duracaoFala + (ortese20cmJson as EdicaoMontagem).cta.duracao) * 30)}
      defaultProps={{edicao: ortese20cmJson as EdicaoMontagem}}
    />
    <Composition
      id="Amputei"
      component={Montagem}
      width={1080}
      height={1920}
      fps={30}
      durationInFrames={Math.round(((amputeiJson as EdicaoMontagem).duracaoFala + (amputeiJson as EdicaoMontagem).cta.duracao) * 30)}
      defaultProps={{edicao: amputeiJson as unknown as EdicaoMontagem}}
    />
    <Still
      id="CapaOrtese20cm"
      component={CapaMontagem}
      width={1080}
      height={1920}
      defaultProps={{
        marca: 'centroAmputados' as const,
        arquivo: 'media/ortese20cm/menino.mp4',
        segundo: 9.5,
        valor: '20 cm',
        sub: 'de diferença entre as pernas',
        etiqueta: 'Órtese sob medida',
      }}
    />
    <Still
      id="CapaAmputei"
      component={CapaMontagem}
      width={1080}
      height={1920}
      defaultProps={{
        marca: 'centroAmputados' as const,
        arquivo: 'media/amputei/rua1.mp4',
        segundo: 3,
        valor: 'Amputou.',
        sub: 'E agora? O caminho em 7 etapas',
        etiqueta: 'Para quem acabou de amputar',
        tamanho: 190,
      }}
    />
    <Still id="Capa" component={Capa} width={1080} height={1920} defaultProps={{edicao}} />
  </>
);
