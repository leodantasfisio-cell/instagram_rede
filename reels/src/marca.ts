import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

export const cores = {
  azul: '#1565D8',
  azulClaro: '#4FA3FF',
  azulEscuro: '#0B2E66',
  branco: '#FFFFFF',
  sombra: 'rgba(5, 20, 50, 0.55)',
};

export const fonte = 'Montserrat';

for (const peso of [500, 700, 800]) {
  loadFont({
    family: fonte,
    url: staticFile(`fontes/montserrat-latin-${peso}-normal.woff2`),
    weight: String(peso),
  });
}
