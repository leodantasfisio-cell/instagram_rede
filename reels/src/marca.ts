import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

// Paleta da marca ativa. Os nomes vêm da Rede Escoliose (azul), mas valem
// como papéis: `azul` = cor principal, `azulClaro` = destaque, `azulEscuro` = fundo escuro.
export type Paleta = {
  azul: string;
  azulClaro: string;
  azulEscuro: string;
  branco: string;
  sombra: string;
};

export type Marca = {handle: string; cores: Paleta};

export const marcas: Record<string, Marca> = {
  redeEscoliose: {
    handle: '@rede_escoliose_rn',
    cores: {
      azul: '#1565D8',
      azulClaro: '#4FA3FF',
      azulEscuro: '#0B2E66',
      branco: '#FFFFFF',
      sombra: 'rgba(5, 20, 50, 0.55)',
    },
  },
  centroAmputados: {
    handle: '@centroamputadosrn',
    cores: {
      azul: '#00843D',
      azulClaro: '#32B64A',
      azulEscuro: '#006B3C',
      branco: '#FFFFFF',
      sombra: 'rgba(20, 20, 20, 0.6)',
    },
  },
};

export const cores: Paleta = {...marcas.redeEscoliose.cores};
export const marcaAtiva: {handle: string} = {handle: marcas.redeEscoliose.handle};

// Cada composição chama no início do render; cada aba do render tem a sua cópia.
export const aplicarMarca = (nome: keyof typeof marcas) => {
  Object.assign(cores, marcas[nome].cores);
  marcaAtiva.handle = marcas[nome].handle;
};

export const fonte = 'Montserrat';

for (const peso of [500, 700, 800]) {
  loadFont({
    family: fonte,
    url: staticFile(`fontes/montserrat-latin-${peso}-normal.woff2`),
    weight: String(peso),
  });
}
